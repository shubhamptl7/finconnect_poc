import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';
import columnLoanProvider from '../providers/column/columnLoanProvider.js';
import logger from '../config/logger.js';

/**
 * Loan Core Service (Skeleton)
 * Responsible for active loan query operations and read-model synchronization.
 */
const loanService = {
  async getLoans(userId) {
    logger.info(`[loanService] getLoans for user ${userId}`);
    const loans = await db.Loan.findAll({
      where: { user_id: userId },
      include: [{ model: db.LoanApplication, as: 'application' }],
      order: [['created_at', 'DESC']],
    });
    return loans;
  },

  async getLoanById(userId, loanId) {
    logger.info(`[loanService] getLoanById ${loanId} for user ${userId}`);
    const loan = await db.Loan.findOne({
      where: { id: loanId, user_id: userId },
      include: [
        { model: db.LoanApplication, as: 'application' },
        { model: db.LoanPayment, as: 'payments' },
        { model: db.LoanSchedule, as: 'schedule' },
      ],
    });

    if (!loan) {
      throw new AppError('Loan not found', STATUS_CODES.NOT_FOUND);
    }

    return loan;
  },
};

export default loanService;
