import * as BankController from '../controllers/bankController.js';
import { connectBankSchema } from '../validations/bankValidation.js';
import { authenticate } from '../middlewares/auth.js';

export default async function bankRoutes(fastify, _opts) {
  // 1. Generate Link Token for frontend UI
  fastify.post('/link/token', { preHandler: [authenticate] }, BankController.createLinkToken);

  // 2. Exchange Public Token (save the bank connection)
  fastify.post(
    '/connect',
    { preHandler: [authenticate], ...connectBankSchema },
    BankController.connectBank
  );

  // 3. Get User's Connected Banks (for Dashboard)
  fastify.get('/connections', { preHandler: [authenticate] }, BankController.getConnections);

  // 4. Get User's Actual Bank Accounts (for Dashboard)
  fastify.get('/accounts', { preHandler: [authenticate] }, BankController.getAccounts);

  // Sync Transactions (incremental – uses Plaid cursor)
  fastify.post('/sync', { preHandler: authenticate }, BankController.syncTransactions);

  // Full Resync – wipes transactions, resets cursor, re-fetches all history
  // Called after a keypair rotation to re-encrypt everything under the new public key
  // Rate-limited to 3 per hour to prevent Plaid API quota abuse
  fastify.post('/sync/full', {
    preHandler: authenticate,
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
  }, BankController.fullSyncTransactions);

  // Get Transactions
  fastify.get('/transactions', { preHandler: authenticate }, BankController.getTransactions);

  // Disconnect / Revoke Bank Connection
  fastify.delete('/connections/:id', { preHandler: authenticate }, BankController.disconnectBank);
}
