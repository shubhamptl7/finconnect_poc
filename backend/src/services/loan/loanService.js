import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import STATUS_CODES from '../../config/constants.js';
import logger from '../../config/logger.js';

const loanService = {
  /**
   * Fetches active loans for a given user
   */
  async getLoans(userId) {
    logger.info(`[loanService] Fetching loans for user ${userId}`);
    return await db.Loan.findAll({
      where: { user_id: userId },
      include: [
        { model: db.LoanApplication, as: 'application' },
        { model: db.LoanSchedule, as: 'schedules' },
        { model: db.LoanPayment, as: 'payments' },
        { model: db.LoanAutopayAuthorization, as: 'autopay' },
      ],
      order: [['created_at', 'DESC']],
    });
  },

  /**
   * Fetches specific loan details by ID
   */
  async getLoanById(userId, loanId) {
    logger.info(`[loanService] Fetching loan ${loanId} for user ${userId}`);
    const loan = await db.Loan.findOne({
      where: { id: loanId, user_id: userId },
      include: [
        { model: db.LoanApplication, as: 'application' },
        { model: db.LoanSchedule, as: 'schedules' },
        { model: db.LoanPayment, as: 'payments' },
      ],
    });

    if (!loan) {
      throw new AppError('Loan account not found', STATUS_CODES.NOT_FOUND);
    }

    return loan;
  },

  /**
   * Process loan payment request
   */
  async processPayment(loanId, amountCents) {
    logger.info(`[loanService] processPayment for loan ${loanId}`, { amountCents });
    return {
      loanId,
      amountCents,
      status: 'PROCESSING',
      processedAt: new Date(),
    };
  },
};

export default loanService;
