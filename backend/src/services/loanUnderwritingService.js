import logger from '../config/logger.js';

const loanUnderwritingService = {
  async evaluateApplication(applicationId) {
    logger.info(`[loanUnderwritingService] evaluateApplication ${applicationId}`);
    return { status: 'APPROVED', DTI: 0.25 };
  },
};

export default loanUnderwritingService;
