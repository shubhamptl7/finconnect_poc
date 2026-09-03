import columnClient from './columnClient.js';
import logger from '../../config/logger.js';

/**
 * Column Loan Provider Adapter (Skeleton)
 * Responsible for interfacing with Column's Lending API (/lending/loans, /lending/loan-programs, etc.)
 * Converts between FinConnect internal representations (e.g. integer cents) and Column API format.
 */
const columnLoanProvider = {
  async createEntity(entityData) {
    logger.info('[ColumnLoanProvider] Stub createEntity', entityData);
    return { id: 'ent_stub_123', status: 'VERIFIED' };
  },

  async createLoan(loanData, idempotencyKey = null) {
    logger.info('[ColumnLoanProvider] Stub createLoan', { loanData, idempotencyKey });
    return { id: 'loan_stub_123', status: 'ACTIVE' };
  },

  async getLoan(columnLoanId) {
    logger.info('[ColumnLoanProvider] Stub getLoan', columnLoanId);
    return { id: columnLoanId, status: 'ACTIVE' };
  },

  async getLoanSummary(columnLoanId) {
    logger.info('[ColumnLoanProvider] Stub getLoanSummary', columnLoanId);
    return {
      principal_outstanding: 500000,
      principal_paid: 0,
      interest_receivable: 0,
      interest_paid: 0,
    };
  },

  async createDisbursement(disbursementData, idempotencyKey = null) {
    logger.info('[ColumnLoanProvider] Stub createDisbursement', { disbursementData, idempotencyKey });
    return { id: 'disb_stub_123', status: 'COMPLETED' };
  },

  async createPayment(paymentData, idempotencyKey = null) {
    logger.info('[ColumnLoanProvider] Stub createPayment', { paymentData, idempotencyKey });
    return { id: 'pay_stub_123', status: 'COMPLETED' };
  },
};

export default columnLoanProvider;
