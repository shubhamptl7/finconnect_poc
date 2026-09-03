import logger from '../config/logger.js';

const loanPaymentService = {
  async processPayment(loanId, amountCents) {
    logger.info(`[loanPaymentService] processPayment for ${loanId}`, amountCents);
    return { status: 'PENDING' };
  },
};

export default loanPaymentService;
