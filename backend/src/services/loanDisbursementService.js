import logger from '../config/logger.js';

const loanDisbursementService = {
  async initiateDisbursement(loanId) {
    logger.info(`[loanDisbursementService] initiateDisbursement for ${loanId}`);
    return { status: 'PENDING' };
  },
};

export default loanDisbursementService;
