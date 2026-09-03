import { Op } from 'sequelize';

import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';
import bankProvider from '../providers/plaid/plaidBankProvider.js';
import notificationService from './notificationService.js';
import logger from '../config/logger.js';
import { generateSearchHash, eciesEncrypt } from '../utils/encryption.js';

/**
 * Bank Connection Service
 *
 * WHY THIS EXISTS:
 * This handles the BUSINESS LOGIC of bank connections. Notice how it calls `bankProvider`.
 * It doesn't know what Plaid is. It just knows it needs a "link token", and when it gets
 * a "public token", it needs to exchange it. It then securely saves everything to Postgres.
 */
const bankService = {
  /**
   * Step 1: Generates a short-lived token so the frontend can open the Bank Login UI.
   */
  async createLinkToken(userId) {
    // Just ask the provider for a token. (If we switch from Plaid to THEQA, this line stays exactly the same!)
    return await bankProvider.createLinkToken(userId);
  },

  /**
   * Step 2: The user logged in successfully on the frontend. We now take the temporary
   * token and exchange it for a permanent access token, and save it.
   */
  async connectBank(userId, publicToken, bankName, institutionId, metadata = {}) {
    // 1. Exchange the token via the provider
    const { accessToken, itemId } = await bankProvider.exchangePublicToken(publicToken);

    // 2. Wrap database saves in a transaction so if anything fails, it rolls back
    const t = await db.sequelize.transaction();

    try {
      // Check if user already connected this exact bank login (prevent duplicates)
      let connection = await db.BankConnection.findOne({
        where: { user_id: userId, item_id_hash: generateSearchHash(itemId) },
      });

      if (connection) {
        // Just update the access token in case it changed (e.g. they updated their password)
        connection.access_token = accessToken;
        connection.status = 'active';
        await connection.save({ transaction: t });
      } else {
        // Create a new connection
        connection = await db.BankConnection.create(
          {
            user_id: userId,
            provider_name: 'plaid', // Hardcoded for POC, would be dynamic later
            bank_name: bankName || 'Connected Bank',
            institution_id: institutionId,
            item_id: itemId,
            access_token: accessToken,
            status: 'active',
          },
          { transaction: t }
        );
      }

      // 3. Fetch accounts AND their full IBAN/BACS numbers from Plaid
      const accounts = await bankProvider.getAccountsAndBalances(accessToken);
      const authMap = await bankProvider.getAccountAuth(accessToken); // Non-fatal if fails

      // Find the highest mock BACS counter to assign unique ones for Sandbox
      const allAccounts = await db.BankAccount.findAll({
        transaction: t,
      });
      let nextBacsCounter = 1;
      for (const acc of allAccounts) {
        const bacs = acc.bacs_account;
        if (bacs && bacs.startsWith('8888')) {
          const num = parseInt(bacs.replace('8888', ''), 10);
          if (!isNaN(num) && num >= nextBacsCounter) {
            nextBacsCounter = num + 1;
          }
        }
      }

      // 4. Save each checking/savings account (with IBAN) to our database
      for (const acc of accounts) {
        const authData = authMap[acc.externalId] || {};

        let finalBacs = authData.bacsAccount || null;
        let finalIban = authData.iban || null;
        let finalSortCode = authData.sortCode || null;

        // --- SANDBOX OVERRIDE: Assign unique BACS ---
        // If Plaid gave us a default sandbox BACS, generate a unique one for P2P testing
        if (!finalBacs || finalBacs.startsWith('8000')) {
          finalBacs = `8888${String(nextBacsCounter).padStart(4, '0')}`;
          finalIban = `GB12PLAD040004${finalBacs}`;
          finalSortCode = '040004';
          nextBacsCounter++;
        }

        await db.BankAccount.upsert(
          {
            connection_id: connection.id,
            user_id: userId,
            external_account_id: acc.externalId,
            account_name: acc.name,
            account_number: acc.mask,
            iban: finalIban,
            bacs_account: finalBacs,
            sort_code: finalSortCode,
            currency: acc.currency,
            current_balance: acc.currentBalance,
            available_balance: acc.availableBalance,
            last_synced_at: new Date(),
          },
          { transaction: t, conflictFields: ['connection_id', 'external_account_id_hash'] }
        );
      }

      // 5. Audit log for security
      await db.AuditLog.create(
        {
          user_id: userId,
          action: 'bank_account_linked',
          metadata: { ...metadata, bank_name: bankName, account_count: accounts.length },
        },
        { transaction: t }
      );

      // 6. Notify the user
      await notificationService.createNotification(
        {
          user_id: userId,
          title: 'Bank Connected',
          message: `Successfully linked ${bankName || 'your bank'} (${accounts.length} account${accounts.length === 1 ? '' : 's'}).`,
          type: 'kyc',
        },
        { transaction: t }
      ).catch(() => {});

      await t.commit();
      return { success: true, accountsConnected: accounts.length };
    } catch (error) {
      await t.rollback();
      logger.error(`Bank Connection Failed: ${error.message}`);
      throw new AppError('Failed to save bank connection to database', STATUS_CODES.SERVER_ERROR);
    }
  },

  /**
   * Retrieve all active bank connections for the user's dashboard.
   */
  async getConnections(userId) {
    return await db.BankConnection.findAll({
      where: { user_id: userId, status: 'active' },
      attributes: ['id', 'bank_name', 'status', 'created_at'], // NEVER return the access_token to the frontend!
    });
  },

  /**
   * Retrieve all checking/savings accounts for the user's dashboard.
   */
  async getAccounts(userId) {
    return await db.BankAccount.findAll({
      where: { user_id: userId },
      include: [
        {
          model: db.BankConnection,
          as: 'connection',
          attributes: ['bank_name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  },

  /**
   * Syncs and saves transactions from Plaid into our local Postgres DB.
   * Uses the cursor stored in BankConnection to only fetch new data.
   */
  async syncTransactions(userId, connectionId = null) {
    let connections = [];
    if (connectionId) {
      const conn = await db.BankConnection.findOne({
        where: { id: connectionId, user_id: userId, status: 'active' },
      });
      if (!conn) throw new AppError('Bank connection not found', STATUS_CODES.NOT_FOUND);
      connections.push(conn);
    } else {
      connections = await db.BankConnection.findAll({
        where: { user_id: userId, status: 'active' },
      });
    }

    const user = await db.User.findByPk(userId);
    const publicKey = user ? user.e2ee_public_key : null;

    let totalProcessed = 0;

    for (const conn of connections) {
      let hasMore = true;
      let cursor = conn.sync_cursor;

      while (hasMore) {
        const syncData = await bankProvider.syncTransactions(conn.access_token, cursor);

        // Wrap DB operations in a transaction for atomicity
        const t = await db.sequelize.transaction();
        try {
          // 1. Process Added and Modified
          const toProcess = [...syncData.added, ...syncData.modified];
          for (const txn of toProcess) {
            const account = await db.BankAccount.findOne({
              where: { external_account_id_hash: generateSearchHash(txn.account_id) },
              transaction: t,
            });
            if (account) {
              await db.Transaction.upsert(
                {
                  external_transaction_id: txn.transaction_id,
                  account_id: account.id,
                  // Plaid amounts are positive for debit (money leaving), negative for credit (money entering)
                  type: txn.amount < 0 ? 'credit' : 'debit',
                  currency: txn.iso_currency_code || 'USD',
                  status: txn.pending ? 'pending' : 'settled',
                  category: txn.category ? txn.category[0] : 'Uncategorized',
                  description_encrypted: publicKey ? eciesEncrypt(publicKey, String(txn.name || 'Unknown'), 'finconnect-txn-desc-v1') : null,
                  amount_encrypted: publicKey ? eciesEncrypt(publicKey, String(Math.round(Math.abs(txn.amount || 0) * 1000)), 'finconnect-txn-amt-v1') : null,
                  transaction_date: txn.date || txn.authorized_date || new Date(),
                },
                { transaction: t, conflictFields: ['external_transaction_id_hash'] }
              );
              totalProcessed++;
            }
          }

          // 2. Process Removed
          for (const txn of syncData.removed) {
            await db.Transaction.destroy({
              where: { external_transaction_id_hash: generateSearchHash(txn.transaction_id) },
              transaction: t,
            });
          }

          // 3. Update sync cursor
          conn.sync_cursor = syncData.nextCursor;
          await conn.save({ transaction: t });

          // 4. Audit Log
          await db.AuditLog.create(
            {
              user_id: userId,
              action: 'transactions_synced',
              metadata: {
                connection_id: conn.id,
                added: syncData.added.length,
                modified: syncData.modified.length,
                removed: syncData.removed.length,
              },
            },
            { transaction: t }
          );

          await t.commit();
        } catch (err) {
          await t.rollback();
          logger.error(`Error saving transactions for connection ${conn.id}: ${err.message}`);
          throw err;
        }

        hasMore = syncData.hasMore;
        cursor = syncData.nextCursor;
      }
    }

    return { success: true, transactionsAdded: totalProcessed };
  },

  /**
   * Full re-sync: wipes all existing transactions for the user, resets all Plaid sync
   * cursors to null, then performs a fresh full sync from the beginning of history.
   * 
   * Called after a key rotation (resetE2eeKeypair) to re-encrypt all transactions
   * under the user's new public key.
   */
  async fullSyncTransactions(userId) {
    // 1. Get the user's latest public key
    const user = await db.User.findByPk(userId);
    const publicKey = user ? user.e2ee_public_key : null;

    // 2. Find all active connections
    const connections = await db.BankConnection.findAll({
      where: { user_id: userId, status: 'active' },
    });

    if (connections.length === 0) {
      return { success: true, transactionsAdded: 0, message: 'No active connections to sync' };
    }

    // SAFETY FIX: Verify Plaid is reachable BEFORE wiping existing data.
    // Pre-flight: attempt first sync page for each connection. If any fail, abort entirely
    // so we don't wipe data and then fail to restore it.
    const prefetchedPages = [];
    for (const conn of connections) {
      try {
        const firstPage = await bankProvider.syncTransactions(conn.access_token, null);
        prefetchedPages.push({ conn, firstPage });
      } catch (err) {
        logger.error(`[fullSync] Plaid pre-flight check failed for connection ${conn.id}: ${err.message}`);
        throw new Error(`Cannot perform full re-sync: Plaid is unavailable for connection ${conn.id}. Transaction history preserved.`);
      }
    }

    // 3. Plaid is verified reachable — now safely wipe and reset cursors
    const wipeT = await db.sequelize.transaction();
    try {
      const accounts = await db.BankAccount.findAll({
        where: { user_id: userId },
        attributes: ['id'],
        transaction: wipeT,
      });
      const accountIds = accounts.map((a) => a.id);

      if (accountIds.length > 0) {
        await db.Transaction.destroy({
          where: { account_id: accountIds },
          transaction: wipeT,
        });
      }

      for (const conn of connections) {
        conn.sync_cursor = null;
        await conn.save({ transaction: wipeT });
      }

      await wipeT.commit();
    } catch (err) {
      await wipeT.rollback();
      logger.error(`fullSyncTransactions wipe failed: ${err.message}`);
      throw err;
    }

    // 4. Re-sync from the pre-fetched first pages, then continue pagination
    let totalProcessed = 0;

    for (const { conn, firstPage } of prefetchedPages) {
      let pages = [firstPage];
      let cursor = firstPage.nextCursor;
      let hasMore = firstPage.hasMore;

      // Collect remaining pages
      while (hasMore) {
        const nextPage = await bankProvider.syncTransactions(conn.access_token, cursor);
        pages.push(nextPage);
        cursor = nextPage.nextCursor;
        hasMore = nextPage.hasMore;
      }

      // Write all pages into DB
      for (const syncData of pages) {
        const t = await db.sequelize.transaction();
        try {
          const toProcess = [...syncData.added, ...syncData.modified];
          for (const txn of toProcess) {
            const account = await db.BankAccount.findOne({
              where: { external_account_id_hash: generateSearchHash(txn.account_id) },
              transaction: t,
            });
            if (account) {
              await db.Transaction.upsert(
                {
                  external_transaction_id: txn.transaction_id,
                  account_id: account.id,
                  type: txn.amount < 0 ? 'credit' : 'debit',
                  currency: txn.iso_currency_code || 'USD',
                  status: txn.pending ? 'pending' : 'settled',
                  category: txn.category ? txn.category[0] : 'Uncategorized',
                  description_encrypted: publicKey
                    ? eciesEncrypt(publicKey, String(txn.name || 'Unknown'), 'finconnect-txn-desc-v1')
                    : null,
                  amount_encrypted: publicKey
                    ? eciesEncrypt(publicKey, String(Math.round(Math.abs(txn.amount || 0) * 1000)), 'finconnect-txn-amt-v1')
                    : null,
                  transaction_date: txn.date || txn.authorized_date || new Date(),
                },
                { transaction: t, conflictFields: ['external_transaction_id_hash'] }
              );
              totalProcessed++;
            }
          }

          conn.sync_cursor = syncData.nextCursor;
          await conn.save({ transaction: t });

          await db.AuditLog.create(
            {
              user_id: userId,
              action: 'transactions_full_resync',
              metadata: {
                connection_id: conn.id,
                processed: toProcess.length,
              },
            },
            { transaction: t }
          );

          await t.commit();
        } catch (err) {
          await t.rollback();
          logger.error(`fullSyncTransactions error for connection ${conn.id}: ${err.message}`);
          throw err;
        }
      }
    }

    return { success: true, transactionsAdded: totalProcessed };
  },

  /**
   * Retrieves user's transaction history from our local DB.
   */
  async getTransactions(userId) {
    const accounts = await db.BankAccount.findAll({
      where: { user_id: userId },
      attributes: ['id'],
    });
    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) return [];

    return await db.Transaction.findAll({
      where: { account_id: accountIds },
      include: [
        {
          model: db.BankAccount,
          as: 'account',
          include: [{ model: db.BankConnection, as: 'connection', attributes: ['bank_name'] }],
        },
      ],
      order: [['transaction_date', 'DESC']],
      limit: 200,
    });
  },
};

export default bankService;
