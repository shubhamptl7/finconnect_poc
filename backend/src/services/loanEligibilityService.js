import logger from '../config/logger.js';

const loanEligibilityService = {
  async checkEligibility(userId, data) {
    logger.info(`[loanEligibilityService] checkEligibility for user ${userId}`, data);
    return {
      eligible: true,
      maxAmountCents: 750000,
      estimatedEmiCents: 44024,
    };
  },
};

export default loanEligibilityService;
