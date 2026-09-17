import plaidClient from './plaidClient.js';
import AppError from '../../utils/appError.js';
import logger from '../../config/logger.js';
import config from '../../config/env.js';

/**
 * PLAID PAYMENT INITIATION (VRP) PROVIDER
 *
 * Handles cross-border UK Open Banking payments and VRP (Variable Recurring Payments).
 *
 * IMPORTANT NOTE ON AMOUNTS:
 * Plaid's API expects monetary values as floats/decimals (e.g., 50.00).
 * FinConnect's database strictly uses integer minor units (pence/cents, e.g., 5000).
 * This provider translates FinConnect pence -> Plaid floats.
 */
class PlaidPaymentProvider {
  /**
   * Helper to convert Pence (BigInt/Int) to Decimal String (e.g. 5000 -> "50.00")
   */
  _toPlaidAmount(amountMinor) {
    return (Number(amountMinor) / 100).toFixed(2);
  }

  /**
   * Creates a one-time Payment Initiation (Pay by Bank).
   *
   * @param {Object} params
   * @param {number|bigint} params.amountMinor - The amount in pence
   * @param {string} params.currency - 'GBP'
   * @param {string} params.reference - Bank statement reference (max 18 chars)
   * @param {string} params.recipientId - FinConnect's UK Recipient ID registered in Plaid
   * @param {string} params.idempotencyKey - Optional idempotency key
   * @returns {Promise<string>} payment_id
   */
  async createPayment({ amountMinor, currency = 'GBP', reference, recipientId, idempotencyKey }) {
    try {
      logger.info(`[PlaidPaymentProvider] Creating one-time payment for ${amountMinor} ${currency}`);

      const request = {
        recipient_id: recipientId,
        reference: reference.substring(0, 18), // Max 18 chars for Faster Payments
        amount: {
          currency: currency,
          value: Number(this._toPlaidAmount(amountMinor)),
        },
      };

      const options = idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined;

      const response = await plaidClient.paymentInitiationPaymentCreate(request, options);

      return response.data.payment_id;
    } catch (error) {
      logger.error('[PlaidPaymentProvider] createPayment error:', error?.response?.data || error);
      throw new AppError(`Failed to create Plaid Payment: ${error.message}`, 502);
    }
  }

  /**
   * Creates a VRP Consent (Mandate) for AutoPay.
   *
   * @param {Object} params
   * @param {number|bigint} params.monthlyAmountMinor - The max EMI amount in pence
   * @param {string} params.currency - 'GBP'
   * @param {string} params.reference - Bank statement reference
   * @param {string} params.recipientId - FinConnect's UK Recipient ID
   * @param {Date} params.validDatetimeTo - Expiration date of the consent
   * @returns {Promise<string>} consent_id
   */
  async createVrpConsent({ monthlyAmountMinor, currency = 'GBP', reference, recipientId, validDatetimeTo }) {
    try {
      logger.info(`[PlaidPaymentProvider] Creating VRP Consent for ${monthlyAmountMinor} ${currency}/month`);

      const plaidAmountFloat = Number(this._toPlaidAmount(monthlyAmountMinor));

      const request = {
        recipient_id: recipientId,
        reference: reference.substring(0, 18),
        scopes: ['ME_TO_ME'], // Common for sweeping to own account or loan repayment
        constraints: {
          valid_date_time: {
            to: validDatetimeTo.toISOString()
          },
          max_payment_amount: {
            currency: currency,
            value: plaidAmountFloat,
          },
          periodic_amounts: [
            {
              amount: {
                currency: currency,
                value: plaidAmountFloat,
              },
              interval: 'MONTH',
              alignment: 'CONSENT',
            },
          ],
        },
      };

      const response = await plaidClient.paymentInitiationConsentCreate(request);

      return response.data.consent_id;
    } catch (error) {
      logger.error('[PlaidPaymentProvider] createVrpConsent error:', error?.response?.data || error);
      throw new AppError(`Failed to create Plaid VRP Consent: ${error.message}`, 502);
    }
  }

  /**
   * Revokes an active VRP Consent.
   *
   * @param {string} consentId
   * @returns {Promise<boolean>}
   */
  async revokeVrpConsent(consentId) {
    try {
      logger.info(`[PlaidPaymentProvider] Revoking VRP Consent: ${consentId}`);
      await plaidClient.paymentInitiationConsentRevoke({ consent_id: consentId });
      return true;
    } catch (error) {
      logger.error('[PlaidPaymentProvider] revokeVrpConsent error:', error?.response?.data || error);
      throw new AppError(`Failed to revoke Plaid VRP Consent: ${error.message}`, 502);
    }
  }

  /**
   * Executes a payment against an active VRP Consent (AutoPay Sweep).
   *
   * @param {Object} params
   * @param {string} params.consentId
   * @param {number|bigint} params.amountMinor
   * @param {string} params.currency
   * @param {string} params.reference
   * @param {string} params.idempotencyKey
   * @returns {Promise<string>} payment_id
   */
  async executeVrpPayment({ consentId, amountMinor, currency = 'GBP', reference, idempotencyKey }) {
    try {
      logger.info(`[PlaidPaymentProvider] Executing VRP sweep: ${amountMinor} ${currency} against consent ${consentId}`);

      const request = {
        consent_id: consentId,
        amount: {
          currency: currency,
          value: Number(this._toPlaidAmount(amountMinor)),
        },
        reference: reference.substring(0, 18),
        idempotency_key: idempotencyKey,
      };

      const response = await plaidClient.paymentInitiationConsentPaymentExecute(request);

      return response.data.payment_id;
    } catch (error) {
      logger.error('[PlaidPaymentProvider] executeVrpPayment error:', error?.response?.data || error);
      
      // Specifically catch NSF or Revoked errors to handle gracefully in the worker
      const errorCode = error?.response?.data?.error_code;
      if (errorCode === 'INSUFFICIENT_FUNDS') {
        throw new AppError('Insufficient Funds in UK Account', 400, 'INSUFFICIENT_FUNDS');
      }
      if (errorCode === 'CONSENT_REVOKED' || errorCode === 'CONSENT_EXPIRED') {
        throw new AppError('VRP Consent is no longer valid', 400, 'CONSENT_INVALID');
      }

      throw new AppError(`Failed to execute VRP Sweep: ${error.message}`, 502);
    }
  }

  /**
   * Gets the status of a specific payment.
   * Useful for reconciliation / webhooks.
   *
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await plaidClient.paymentInitiationPaymentGet({ payment_id: paymentId });
      return response.data;
    } catch (error) {
      logger.error('[PlaidPaymentProvider] getPaymentStatus error:', error?.response?.data || error);
      throw new AppError(`Failed to fetch payment status: ${error.message}`, 502);
    }
  }
}

export const plaidPaymentProvider = new PlaidPaymentProvider();
