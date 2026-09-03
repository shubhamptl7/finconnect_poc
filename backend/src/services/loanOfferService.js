import logger from '../config/logger.js';

const loanOfferService = {
  async generateOffer(applicationId) {
    logger.info(`[loanOfferService] generateOffer for ${applicationId}`);
    return { status: 'OFFERED' };
  },
};

export default loanOfferService;
