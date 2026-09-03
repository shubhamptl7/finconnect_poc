import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';

const loanApplicationService = {
  async createApplication(userId, applicationData) {
    logger.info(`[loanApplicationService] createApplication for user ${userId}`);
    const appNumber = `LN-${Date.now()}`;
    const application = await db.LoanApplication.create({
      user_id: userId,
      application_number: appNumber,
      requested_amount: applicationData.requested_amount,
      requested_currency: applicationData.requested_currency || 'USD',
      requested_tenure_months: applicationData.requested_tenure_months,
      purpose: applicationData.purpose,
      status: 'DRAFT',
    });
    return application;
  },

  async getApplications(userId) {
    return await db.LoanApplication.findAll({ where: { user_id: userId } });
  },

  async getApplicationById(userId, applicationId) {
    const application = await db.LoanApplication.findOne({
      where: { id: applicationId, user_id: userId },
    });
    if (!application) {
      throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
    }
    return application;
  },
};

export default loanApplicationService;
