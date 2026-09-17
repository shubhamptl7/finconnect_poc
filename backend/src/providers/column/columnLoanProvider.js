import logger from '../../config/logger.js';
import columnClient from './columnClient.js';

/**
 * Column Loan Provider Adapter
 * Responsible for interfacing with Column's Lending API (/loans, /loans/disbursements, /loans/:id/summary)
 * Converts between FinConnect internal representations and Column API format.
 */
const columnLoanProvider = {
  /**
   * Creates a Loan object in Column under a Loan Program.
   * INT-22: POST /loans
   *
   * @param {Object} loanData Loan parameters (entity_id, amount, loan_program_id, APR, term)
   * @param {string|null} idempotencyKey Unique key for idempotent creation
   * @returns {Promise<Object>} Column Loan object ({ id, status, amount, ... })
   */
  async createLoan(loanData, idempotencyKey = null) {
    logger.info('[ColumnLoanProvider] createLoan', { loanData, idempotencyKey });

    const termMonths = Number(loanData.term_months || loanData.tenure_months || 12);
    const maturityDateObj = new Date();
    maturityDateObj.setMonth(maturityDateObj.getMonth() + termMonths);
    const maturityDateStr = maturityDateObj.toISOString().split('T')[0];

    const payload = {
      entity_id: loanData.borrower_entity_id || loanData.borrower_id || loanData.entity_id,
      max_principal_balance: loanData.amount || loanData.principal_amount || loanData.max_principal_balance || 500000,
      currency: loanData.currency || loanData.currency_code || 'USD',
      description: loanData.description || 'FinConnect Personal Loan',
      maturity_date: loanData.maturity_date || maturityDateStr,
    };

    const programId = loanData.loan_program_id || process.env.COLUMN_LOAN_PROGRAM_ID;
    if (programId) {
      payload.loan_program_id = programId;
    }

    return await columnClient.post('/loans', payload, idempotencyKey);
  },

  /**
   * Retrieves a Column Loan object by ID.
   * INT-22: GET /loans/:id
   *
   * @param {string} columnLoanId Column Loan ID (loan_xxx)
   * @returns {Promise<Object>} Column Loan object
   */
  async getLoan(columnLoanId) {
    logger.info('[ColumnLoanProvider] getLoan:', columnLoanId);

    return await columnClient.get(`/loans/${columnLoanId}`);
  },

  /**
   * Retrieves daily summary metrics for a Column Loan.
   * INT-22 Sub-step: GET /loans/:id/summary
   *
   * @param {string} columnLoanId Column Loan ID (loan_xxx)
   * @returns {Promise<Object>} Column Loan Summary object
   */
  async getLoanSummary(columnLoanId) {
    logger.info('[ColumnLoanProvider] getLoanSummary:', columnLoanId);

    return await columnClient.get(`/loans/${columnLoanId}/summary`);
  },

  /**
   * Disburses funds from a Column Loan object to a Column Deposit Account.
   * INT-22 Sub-step: POST /loans/disbursements
   *
   * @param {Object} disbursementData Parameters (loan_id, amount, bank_account_id)
   * @param {string|null} idempotencyKey Unique key for idempotent creation
   * @returns {Promise<Object>} Column Disbursement object ({ id: 'disb_xxx', status: 'COMPLETED', ... })
   */
  async createDisbursement(disbursementData, idempotencyKey = null) {
    logger.info('[ColumnLoanProvider] createDisbursement:', { disbursementData, idempotencyKey });

    const payload = {
      loan_id: disbursementData.loan_id || disbursementData.loanId,
      amount: disbursementData.amount || disbursementData.amountCents,
      bank_account_id: disbursementData.bank_account_id || disbursementData.bankAccountId,
      currency: disbursementData.currency || disbursementData.currency_code || 'USD',
    };

    return await columnClient.post('/loans/disbursements', payload, idempotencyKey);
  },

  /**
   * Creates a payment against a Column Loan.
   * Funds are moved from the specified Column bank account to the loan.
   *
   * @param {string} columnLoanId - The ID of the Column Loan
   * @param {Object} paymentData - { amount, bank_account_id, principal_amount, is_offline }
   * @param {string|null} idempotencyKey - Optional idempotency key
   * @returns {Promise<Object>} Column Payment object
   */
  async createPayment(columnLoanId, paymentData, idempotencyKey = null) {
    logger.info('[ColumnLoanProvider] createPayment:', { columnLoanId, paymentData, idempotencyKey });

    const payload = {
      bank_account_id: paymentData.bank_account_id,
      amount: paymentData.amount, // in minor units
    };

    if (paymentData.principal_amount !== undefined) {
      payload.principal_amount = paymentData.principal_amount;
    }
    
    if (paymentData.is_offline !== undefined) {
      payload.is_offline = paymentData.is_offline;
    }

    // Column's Loan Payment endpoint: POST /loans/:id/payments
    return await columnClient.post(`/loans/${columnLoanId}/payments`, payload, idempotencyKey);
  },

  /**
   * Retrieves a Column Loan Payment by ID.
   *
   * @param {string} columnLoanId
   * @param {string} paymentId
   * @returns {Promise<Object>}
   */
  async getPayment(columnLoanId, paymentId) {
    logger.info('[ColumnLoanProvider] getPayment:', { columnLoanId, paymentId });
    return await columnClient.get(`/loans/${columnLoanId}/payments/${paymentId}`);
  }
};

export default columnLoanProvider;
