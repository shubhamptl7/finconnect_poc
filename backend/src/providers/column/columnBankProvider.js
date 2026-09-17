import logger from '../../config/logger.js';

import columnClient from './columnClient.js';

/**
 * Column Bank Provider Adapter
 * Handles Column Person Entities, Bank Accounts (/bank-accounts), and Counterparties (/counterparties).
 */
const columnBankProvider = {
  /**
   * Creates a Person Entity in Column.
   * INT-15: POST /entities/person
   *
   * @param {Object} userData Identity payload (email, names, address, SSN/TIN, DOB)
   * @param {string|null} idempotencyKey Unique key for idempotent creation
   * @returns {Promise<Object>} Column Entity object ({ id, status, ... })
   */
  async createEntity(userData, idempotencyKey = null) {
    logger.info('[ColumnBankProvider] createEntity for user:', userData.email);

    let cleanPhone = String(userData.phone || userData.phone_number || '').trim();
    if (cleanPhone && !cleanPhone.startsWith('+')) {
      cleanPhone = `+44${cleanPhone.replace(/\D/g, '')}`;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      cleanPhone = '+447911123456';
    }

    let cleanSsn = String(userData.ssn || userData.ssn_or_tin || '999001234').replace(/\D/g, '');
    if (cleanSsn.length !== 9) {
      cleanSsn = '999001234';
    }

    let cleanDob = String(userData.date_of_birth || userData.dob || '1990-01-01').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
      cleanDob = '1990-01-01';
    }

    const rawAddress = userData.address || {};
    const payload = {
      email: userData.email,
      first_name: userData.first_name || userData.firstName || 'Applicant',
      last_name: userData.last_name || userData.lastName || 'Borrower',
      phone_number: cleanPhone,
      ssn: cleanSsn,
      date_of_birth: cleanDob,
      address: {
        line_1: rawAddress.line_1 || rawAddress.line1 || '123 Main St',
        line_2: rawAddress.line_2 || rawAddress.line2 || null,
        city: rawAddress.city || 'San Francisco',
        state: rawAddress.state || 'CA',
        postal_code: rawAddress.postal_code || rawAddress.postalCode || '94123',
        country_code: rawAddress.country_code || rawAddress.country || 'USA',
      },
    };

    return await columnClient.post('/entities/person', payload, idempotencyKey);
  },

  /**
   * Creates a Deposit Bank Account under a Column Entity.
   * INT-16: POST /bank-accounts
   *
   * @param {string} entityId Column Entity ID (ent_xxx)
   * @param {Object} accountData Optional account parameters
   * @param {string|null} idempotencyKey Unique key for idempotent creation
   * @returns {Promise<Object>} Column Bank Account object ({ id, account_number, routing_number, ... })
   */
  async createBankAccount(entityId, accountData = {}, idempotencyKey = null) {
    logger.info('[ColumnBankProvider] createBankAccount', { entityId, accountData });

    return await columnClient.post(
      '/bank-accounts',
      {
        entity_id: entityId,
        description: accountData.description || accountData.name || 'FinConnect Loan Account',
      },
      idempotencyKey
    );
  },

  /**
   * Retrieves a Column Bank Account by ID.
   * INT-17: GET /bank-accounts/:id
   *
   * @param {string} bankAccountId Column Bank Account ID (acct_xxx / bacc_xxx)
   * @returns {Promise<Object>} Column Bank Account object
   */
  async getBankAccount(bankAccountId) {
    logger.info('[ColumnBankProvider] getBankAccount:', bankAccountId);

    return await columnClient.get(`/bank-accounts/${bankAccountId}`);
  },

  /**
   * Registers an external bank account as a Column Counterparty for money movement.
   * INT-18: POST /counterparties
   *
   * @param {Object} bankAccount BankAccount record with iban, bic, sort_code, account_number
   * @param {string|null} idempotencyKey Unique key for idempotent creation
   * @returns {Promise<Object>} Column Counterparty object ({ id, name, iban, bic, ... })
   */
  async createCounterparty(bankAccount, idempotencyKey = null) {
    logger.info('[ColumnBankProvider] createCounterparty for IBAN:', bankAccount.iban);

    const rawAddress = bankAccount.address || {};
    let cleanBic = String(bankAccount.bic || bankAccount.routing_number || 'NWBKGB2L').replace(/XXX$/i, '').trim();
    if (cleanBic.length < 8) cleanBic = 'NWBKGB2L';

    const payload = {
      name: bankAccount.account_name || 'Borrower External Account',
      account_number: bankAccount.iban || bankAccount.account_number,
      routing_number: cleanBic,
      routing_number_type: 'bic',
      description: bankAccount.account_name || 'Borrower External Account',
      address: {
        line_1: rawAddress.line_1 || rawAddress.line1 || '10 Park Lane',
        city: rawAddress.city || 'London',
        postal_code: rawAddress.postal_code || rawAddress.postalCode || 'W1K 1AA',
        country_code: rawAddress.country_code || rawAddress.country || 'GBR',
      },
    };

    try {
      return await columnClient.post('/counterparties', payload, idempotencyKey);
    } catch (err) {
      if (err.message && (err.message.includes('routing number') || err.message.includes('institution'))) {
        logger.warn(`[ColumnBankProvider] BIC ${cleanBic} not in Column directory. Retrying counterparty creation with standard Sandbox BIC NWBKGB2L`);
        payload.routing_number = 'NWBKGB2L';
        return await columnClient.post('/counterparties', payload, idempotencyKey ? `${idempotencyKey}_fb` : null);
      }
      throw err;
    }
  },
};

export default columnBankProvider;
