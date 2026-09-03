import logger from '../../config/logger.js';
import config from '../../config/env.js';

import plaidClient from './plaidClient.js';

/**
 * Plaid Bank Provider Implementation
 *
 * WHY THIS EXISTS:
 * This file implements the "Provider Pattern". Our core business logic should NEVER
 * import 'plaid' directly. If we decide to use an Omani Open Banking API later instead
 * of Plaid, we just write a new provider file. The rest of the app doesn't change.
 *
 * TRADE-OFFS:
 * We have to write a small wrapper around Plaid's methods, which is slightly more code
 * than calling Plaid directly from our service, but it guarantees vendor lock-in protection.
 */
class PlaidBankProvider {
  /**
   * Creates a temporary token needed to open the Plaid Link UI on the frontend.
   */
  async createLinkToken(userId, clientName = 'PayOman POC') {
    try {
      const request = {
        user: {
          client_user_id: String(userId), // Plaid requires a string ID
        },
        client_name: clientName,
        products: ['auth', 'transactions'], // We need balances/account routing numbers + transaction sync
        // Focus on UK and Europe since Payment Initiation is supported there (USA does not support it)
        country_codes: ['GB', 'FR', 'DE', 'IE', 'NL'],
        language: 'en',
        webhook: `${config.webhook_url}/api/v1/webhooks/plaid`, // Used for Transaction syncing webhooks
      };

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      logger.error(`Plaid createLinkToken failed: ${error.message}`);
      throw new Error('Failed to generate bank connection token');
    }
  }

  /**
   * Exchanges the short-lived public token from the frontend for a permanent access token.
   */
  async exchangePublicToken(publicToken) {
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id, // Plaid's internal ID for this bank connection
      };
    } catch (error) {
      logger.error(`Plaid exchangePublicToken failed: ${error.message}`);
      throw new Error('Failed to securely connect to bank');
    }
  }

  /**
   * Fetches the actual bank accounts (checking, savings) and their balances.
   */
  async getAccountsAndBalances(accessToken) {
    try {
      const response = await plaidClient.accountsBalanceGet({
        access_token: accessToken,
      });

      return response.data.accounts.map((acc) => ({
        externalId: acc.account_id,
        name: acc.name,
        mask: acc.mask,
        currency: acc.balances.iso_currency_code || 'USD',
        currentBalance: Math.round((acc.balances.current || 0) * 1000),
        availableBalance: Math.round((acc.balances.available || acc.balances.current || 0) * 1000),
      }));
    } catch (error) {
      logger.error(`Plaid getAccountsAndBalances failed: ${error.message}`);
      throw new Error('Failed to retrieve account details from bank');
    }
  }

  /**
   * Calls Plaid's /auth/get to extract full IBANs or BACS account numbers.
   *
   * WHY THIS IS NEEDED:
   * The standard /accounts/balance/get only gives us the masked last-4 digits.
   * For P2P matching ("does this IBAN belong to a PayOman user?") and for sending
   * payments, we need the full account identifier. Plaid exposes this via /auth/get.
   *
   * The response contains `numbers.iban` (EU/UK international) or
   * `numbers.bacs` (UK domestic sort_code + account_number).
   *
   * Returns a map keyed by Plaid account_id for easy lookup.
   */
  async getAccountAuth(accessToken) {
    try {
      const response = await plaidClient.authGet({ access_token: accessToken });
      const numbers = response.data.numbers;

      // Build a map: { [plaid_account_id]: { iban, bacsAccount, sortCode } }
      const authMap = {};

      // IBAN numbers (European / UK international format)
      if (numbers.iban && Array.isArray(numbers.iban)) {
        for (const item of numbers.iban) {
          authMap[item.account_id] = {
            ...(authMap[item.account_id] || {}),
            iban: item.iban || null,
          };
        }
      }

      // BACS numbers (UK domestic: sort code + account number)
      if (numbers.bacs && Array.isArray(numbers.bacs)) {
        for (const item of numbers.bacs) {
          authMap[item.account_id] = {
            ...(authMap[item.account_id] || {}),
            bacsAccount: item.account || null,
            sortCode: item.sort_code || null,
          };
        }
      }

      return authMap;
    } catch (error) {
      // Auth product may not be enabled or available — non-fatal, log and continue
      logger.warn(`Plaid getAccountAuth failed (non-fatal): ${error.message}`);
      return {};
    }
  }

  /**
   * Disconnects the bank by invalidating the token on Plaid's end.
   */
  async disconnectBank(accessToken) {
    try {
      await plaidClient.itemRemove({
        access_token: accessToken,
      });
      return true;
    } catch (error) {
      logger.error(`Plaid disconnectBank failed: ${error.message}`);
      // We might still want to delete it from our DB even if Plaid fails, so we don't throw here
      return false;
    }
  }

  /**
   * Syncs transactions using Plaid's /transactions/sync endpoint.
   * This handles pagination natively by accepting a cursor.
   */
  async syncTransactions(accessToken, cursor = null) {
    try {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: cursor,
        count: 200, // Maximum per page
      });
      return {
        added: response.data.added,
        modified: response.data.modified,
        removed: response.data.removed,
        nextCursor: response.data.next_cursor,
        hasMore: response.data.has_more,
      };
    } catch (error) {
      logger.error(`Plaid syncTransactions failed: ${error.message}`);
      throw new Error('Failed to sync transactions from bank');
    }
  }

  /**
   * Creates a Payment Intent (Open Banking Payment Initiation).
   * Note: In Plaid, we must first create a Recipient, then attach a Payment to that recipient.
   */
  async createPaymentIntent(amount, recipientData, recipientName, reference = 'Transfer') {
    try {
      // 1. Create Recipient
      // Plaid supports either IBAN or BACS object for UK
      // FIX: Prioritize BACS for domestic transfers because our auto-generated Sandbox IBANs fail Plaid's strict checksum validation.
      const recipientPayload = { name: recipientName };
      if (recipientData.bacsAccount && recipientData.sortCode) {
        recipientPayload.bacs = {
          account: recipientData.bacsAccount,
          sort_code: recipientData.sortCode,
        };
      } else if (recipientData.iban) {
        recipientPayload.iban = recipientData.iban;
      } else {
        throw new Error('Recipient must have either an IBAN or BACS details');
      }

      const recipientResponse =
        await plaidClient.paymentInitiationRecipientCreate(recipientPayload);
      const recipientId = recipientResponse.data.recipient_id;

      // 2. Create Payment using the new recipient
      const paymentResponse = await plaidClient.paymentInitiationPaymentCreate({
        recipient_id: recipientId,
        reference: reference,
        amount: {
          currency: 'GBP', // Sandbox payments default to GBP
          value: Number.parseFloat(amount),
        },
      });

      return paymentResponse.data.payment_id;
    } catch (error) {
      if (error.response && error.response.data) {
        logger.error(`Plaid API Detailed Error: ${JSON.stringify(error.response.data)}`);
      }
      logger.error(`Plaid createPaymentIntent failed: ${error.message}`);
      throw new Error('Failed to create payment intent with bank');
    }
  }

  /**
   * Generates a specific Link Token for a previously created Payment Intent.
   * The frontend uses this token to open the Payment Authorization UI.
   */
  async createPaymentToken(userId, paymentId, institutionId = null) {
    try {
      const request = {
        user: { client_user_id: String(userId) },
        client_name: 'PayOman POC',
        products: ['payment_initiation'],
        country_codes: ['GB'],
        language: 'en',
        webhook: `${config.webhook_url}/api/v1/webhooks/plaid`, // Crucial: To receive payment status updates!
        payment_initiation: {
          payment_id: paymentId,
        },
      };

      if (institutionId) {
        request.institution_id = institutionId;
      }

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      logger.error(`Plaid createPaymentToken failed: ${error.message}`);
      throw new Error('Failed to generate payment authorization token');
    }
  }

  /**
   * Cancels a previously created Payment Intent via Plaid's /payment_initiation/payment/reverse API.
   * Note: Plaid Sandbox doesn't always support cancellation — this is a best-effort call.
   */
  async cancelPayment(plaidPaymentId) {
    try {
      await plaidClient.paymentInitiationPaymentReverse({
        payment_id: plaidPaymentId,
        idempotency_key: `cancel_${plaidPaymentId}_${Date.now()}`,
        reference: 'Cancellation requested by user',
        amount: { currency: 'GBP', value: 0 }, // Plaid requires amount on reverse
      });
      return true;
    } catch (error) {
      // Log but don't throw — Plaid may not support cancellation for all payment states.
      // Our DB status is still updated to 'cancelled' regardless.
      logger.warn(`Plaid cancelPayment failed (non-fatal): ${error.message}`);
      return false;
    }
  }
}

export default new PlaidBankProvider();
