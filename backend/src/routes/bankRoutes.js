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

  // Sync Transactions
  fastify.post('/sync', { preHandler: authenticate }, BankController.syncTransactions);

  // Get Transactions
  fastify.get('/transactions', { preHandler: authenticate }, BankController.getTransactions);
}
