import columnClient from './columnClient.js';
import logger from '../../config/logger.js';

/**
 * Column Bank Provider Adapter (Skeleton)
 * Responsible for handling Column bank accounts (/bank-accounts) under Entities.
 */
const columnBankProvider = {
  async createBankAccount(entityId, accountData) {
    logger.info('[ColumnBankProvider] Stub createBankAccount', { entityId, accountData });
    return { id: 'acct_stub_123', account_number: '123456789', routing_number: '110000000' };
  },

  async getBankAccount(bankAccountId) {
    logger.info('[ColumnBankProvider] Stub getBankAccount', bankAccountId);
    return { id: bankAccountId, status: 'ACTIVE' };
  },
};

export default columnBankProvider;
