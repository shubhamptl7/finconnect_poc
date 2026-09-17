import logger from '../../config/logger.js';
import config from '../../config/env.js';
import db from '../../models/index.js';

import plaidClient from './plaidClient.js';

/**
 * Plaid Bank Provider Implementation
 *
 * WHY THIS EXISTS:
 * This file implements the "Provider Pattern". Our core business logic should NEVER
 * import 'plaid' directly. If we decide to use an alternate Open Banking API later instead
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
  async createLinkToken(userId, clientName = 'FinConnect') {
    try {
      // 1. Fetch user from DB to check for existing stored plaid_user_id
      let plaidUserId = null;
      let userRecord = null;
      try {
        userRecord = await db.User.findByPk(userId);
        if (userRecord && userRecord.plaid_user_id) {
          plaidUserId = userRecord.plaid_user_id;
        }
      } catch (dbErr) {
        logger.warn(`Failed to fetch user from DB for Plaid user_id: ${dbErr.message}`);
      }

      // 2. If no plaid_user_id stored in DB yet, generate via Plaid User API and persist to DB
      if (!plaidUserId) {
        try {
          const userRes = await plaidClient.userCreate({ client_user_id: String(userId) });
          plaidUserId = userRes.data.user_id;
          if (userRecord && plaidUserId) {
            userRecord.plaid_user_id = plaidUserId;
            await userRecord.save();
            logger.info(`Persisted new Plaid user_id (${plaidUserId}) for user ${userId}`);
          }
        } catch (userErr) {
          logger.warn(`Plaid userCreate warning: ${userErr.message}`);
        }
      }

      const request = {
        client_id: config.plaid_client_id,
        secret: config.plaid_client_secret,
        client_name: clientName,
        products: ['auth', 'transactions', 'assets', 'income_verification'], // Primary Open Banking, Transaction Sync, Asset Reports & Income Verification
        optional_products: ['identity', 'liabilities', 'investments', 'signal', 'statements'], // Verified lending underwriting products
        additional_consented_products: ['investments_auth'], // Pre-collect consent for future investment auth calls
        country_codes: ['GB', 'FR', 'DE', 'IE', 'NL'],
        language: 'en',
        webhook: `${config.webhook_url}/api/v1/webhooks/plaid`, // Used for Transaction syncing webhooks
        income_verification: {
          income_source_types: ['bank'],
          bank_income: {
            days_requested: 365,
          },
        },
        transactions: {
          days_requested: 730, // Request up to 2 years (730 days) of historical transaction data
        },
        statements: {
          start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year range
          end_date: new Date().toISOString().split('T')[0],
        },
      };

      if (plaidUserId) {
        request.user_id = plaidUserId;
      } else {
        request.user = { client_user_id: String(userId) };
      }

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      if (error.response?.data) {
        logger.error(`Plaid createLinkToken detailed error: ${JSON.stringify(error.response.data)}`);
      }
      logger.error(`Plaid createLinkToken failed: ${error.message}`);
      throw new Error('Failed to generate bank connection token');
    }
  }

  async removeConnection(accessToken) {
    try {
      if (accessToken) {
        await plaidClient.itemRemove({ access_token: accessToken });
      }
      return true;
    } catch (error) {
      logger.warn(`Plaid itemRemove warning: ${error.message}`);
      return false;
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
        currency: acc.balances.iso_currency_code || 'GBP',
        currentBalance: Number((acc.balances.current || 0).toFixed(2)),
        availableBalance: Number((acc.balances.available || acc.balances.current || 0).toFixed(2)),
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
   * For P2P matching ("does this IBAN belong to a FinConnect user?") and for sending
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

      // ACH numbers (US domestic format)
      if (numbers?.ach && Array.isArray(numbers.ach)) {
        for (const item of numbers.ach) {
          authMap[item.account_id] = {
            ...(authMap[item.account_id] || {}),
            accountNumber: item.account || null,
            routingNumber: item.routing || null,
            wireRouting: item.wire_routing || null,
          };
        }
      }

      // IBAN / International numbers (European / UK international format)
      const ibanList = numbers?.international || numbers?.iban;
      if (ibanList && Array.isArray(ibanList)) {
        for (const item of ibanList) {
          authMap[item.account_id] = {
            ...(authMap[item.account_id] || {}),
            iban: item.iban || null,
            bic: item.bic || null,
          };
        }
      }

      // BACS numbers (UK domestic: sort code + account number)
      if (numbers?.bacs && Array.isArray(numbers.bacs)) {
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
        reference: String(reference || 'Transfer').replace(/[^a-zA-Z0-9]/g, '').substring(0, 18) || 'Transfer',
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
        client_id: config.plaid_client_id,
        secret: config.plaid_client_secret,
        user: { client_user_id: String(userId) },
        client_name: 'FinConnect',
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
   * Generates a specific Link Token for a previously created VRP Consent.
   * The frontend uses this token to open the Plaid Link UI for AutoPay setup.
   */
  async createVrpConsentToken(userId, consentId, institutionId = null) {
    try {
      const request = {
        client_id: config.plaid_client_id,
        secret: config.plaid_client_secret,
        user: { client_user_id: String(userId) },
        client_name: 'FinConnect',
        products: ['payment_initiation'],
        country_codes: ['GB'],
        language: 'en',
        webhook: `${config.webhook_url}/api/v1/webhooks/plaid`,
        payment_initiation: {
          consent_id: consentId,
        },
      };

      if (institutionId) {
        request.institution_id = institutionId;
      }

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      logger.error(`Plaid createVrpConsentToken failed: ${error.message}`);
      throw new Error('Failed to generate VRP consent authorization token');
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
