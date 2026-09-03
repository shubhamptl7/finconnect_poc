import logger from '../config/logger.js';

const loanReconciliationService = {
  async reconcileLoan(loanId) {
    logger.info(`[loanReconciliationService] reconcileLoan ${loanId}`);
    return { reconciled: true };
  },
};

export default loanReconciliationService;
