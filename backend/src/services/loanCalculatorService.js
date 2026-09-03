import logger from '../config/logger.js';

const loanCalculatorService = {
  calculateEmi(principalCents, rateBps, tenureMonths) {
    logger.info(`[loanCalculatorService] calculateEmi`, { principalCents, rateBps, tenureMonths });
    return 0;
  },
};

export default loanCalculatorService;
