import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import logger from '../../config/logger.js';
import { plaidPaymentProvider } from '../../providers/plaid/plaidPaymentProvider.js';
import plaidBankProvider from '../../providers/plaid/plaidBankProvider.js';

export const loanAutopayService = {
  /**
   * Generates a Plaid VRP Consent for the user to authorize via Plaid Link.
   *
   * @param {string} userId 
   * @param {string} loanId 
   * @param {number} maxMonthlyAmountMinor - Max amount to authorize per month (e.g. 1.2x of EMI)
   * @returns {Promise<Object>} The consent_id for Plaid Link
   */
  async setupAutopayConsent(userId, loanId, maxMonthlyAmountMinor) {
    logger.info(`[LoanAutopayService] Setting up VRP consent for user ${userId}, loan ${loanId}`);

    const loan = await db.Loan.findOne({
      where: { id: loanId, user_id: userId },
      include: [{ model: db.LoanApplication, as: 'application' }],
    });
    if (!loan || loan.status !== 'ACTIVE') {
      throw new AppError('Active loan not found', 404);
    }

    const designatedBankAccountId = loan.bank_account_id || loan.application?.bank_account_id;
    if (!designatedBankAccountId) {
      throw new AppError('No dedicated bank account found for this loan', 400);
    }

    const bankAccount = await db.BankAccount.findOne({
      where: { id: designatedBankAccountId, user_id: userId },
      include: [{ model: db.BankConnection, as: 'connection' }],
    });

    if (!bankAccount) {
      throw new AppError('The designated bank account for this loan is no longer active', 404);
    }

    // Check if an active one already exists
    const existing = await db.LoanAutopayAuthorization.findOne({
      where: { loan_id: loanId, status: 'ACTIVE' },
    });
    if (existing) {
      throw new AppError('AutoPay is already active for this loan', 400);
    }

    const recipientId = process.env.PLAID_UK_RECIPIENT_ID || 'recipient-id-sandbox-cdedd68a-5d49-4210-96a1-13413bdd08fa';
    
    // Set consent to be valid until the maturity date of the loan + 30 days buffer
    const validDatetimeTo = new Date(loan.maturity_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    validDatetimeTo.setDate(validDatetimeTo.getDate() + 30);

    const safeMonthlyLimit = Number(maxMonthlyAmountMinor) + 500; // Add £5.00 safety buffer for final EMI rounding (e.g. 21132 + 500 = 21632 pence)

    const consentId = await plaidPaymentProvider.createVrpConsent({
      monthlyAmountMinor: safeMonthlyLimit,
      currency: 'GBP',
      reference: `AutoPay${loan.id.substring(0, 8)}`,
      recipientId,
      validDatetimeTo,
    });

    await db.LoanAutopayAuthorization.create({
      loan_id: loan.id,
      user_id: userId,
      plaid_authorization_id: consentId, // Storing VRP consent_id here
      plaid_account_id: bankAccount.external_account_id || null,
      amount: safeMonthlyLimit,
      currency: 'GBP',
      frequency: 'MONTHLY',
      status: 'AUTHORIZATION_PENDING',
    });

    // Use designated bank's institution to skip institution selection in Plaid Link
    const institutionId = bankAccount.connection?.institution_id || null;

    const linkToken = await plaidBankProvider.createVrpConsentToken(userId, consentId, institutionId);

    return {
      consent_id: consentId,
      link_token: linkToken,
    };
  },

  /**
   * Activates the AutoPay authorization after the user successfully completes Plaid Link.
   *
   * @param {string} userId 
   * @param {string} consentId 
   */
  async activateAutopayConsent(userId, consentId) {
    logger.info(`[LoanAutopayService] Activating consent ${consentId} for user ${userId}`);

    const auth = await db.LoanAutopayAuthorization.findOne({
      where: { user_id: userId, plaid_authorization_id: consentId, status: 'AUTHORIZATION_PENDING' },
    });

    if (!auth) {
      throw new AppError('Pending AutoPay authorization not found', 404);
    }

    auth.status = 'ACTIVE';
    auth.authorized_at = new Date();
    await auth.save();

    return auth;
  },

  /**
   * Cancels the active AutoPay authorization.
   *
   * @param {string} userId 
   * @param {string} loanId 
   */
  async revokeAutopay(userId, loanId) {
    logger.info(`[LoanAutopayService] Revoking AutoPay for user ${userId}, loan ${loanId}`);

    const auth = await db.LoanAutopayAuthorization.findOne({
      where: { loan_id: loanId, user_id: userId, status: 'ACTIVE' },
    });

    if (!auth) {
      throw new AppError('Active AutoPay not found', 404);
    }

    // Attempt to revoke with Plaid
    if (auth.plaid_authorization_id) {
      try {
        await plaidPaymentProvider.revokeVrpConsent(auth.plaid_authorization_id);
      } catch (err) {
        logger.warn(`Failed to revoke consent in Plaid: ${err.message}. Proceeding to cancel locally.`);
      }
    }

    auth.status = 'CANCELLED';
    auth.cancelled_at = new Date();
    await auth.save();

    return { success: true, message: 'AutoPay cancelled successfully' };
  },

  /**
   * Internal function called by the daily cron job to execute a scheduled sweep.
   *
   * @param {Object} auth - LoanAutopayAuthorization instance
   * @param {number} amountMinor - The exact EMI amount to sweep
   * @param {string} idempotencyKey - UUID for safety
   */
  async executeAutopaySweep(auth, amountMinor, idempotencyKey) {
    logger.info(`[LoanAutopayService] Executing VRP Sweep for Auth ${auth.id}, Amount: ${amountMinor}`);

    // If amount is greater than the max consented amount, fail safely
    if (amountMinor > auth.amount) {
      throw new AppError(`Sweep amount ${amountMinor} exceeds consented limit ${auth.amount}`, 400);
    }

    // Execute with Plaid
    const paymentId = await plaidPaymentProvider.executeVrpPayment({
      consentId: auth.plaid_authorization_id,
      amountMinor,
      currency: auth.currency,
      reference: `EMI${auth.loan_id.substring(0, 8)}`,
      idempotencyKey,
    });

    // Log the Pending payment
    const loanPayment = await db.LoanPayment.create({
      loan_id: auth.loan_id,
      user_id: auth.user_id,
      plaid_transfer_id: paymentId,
      amount: amountMinor,
      currency: auth.currency,
      status: 'PENDING',
      payment_type: 'EMI',
      payment_date: new Date(),
    });

    return loanPayment;
  }
};
