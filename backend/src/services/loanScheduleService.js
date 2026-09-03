import logger from '../config/logger.js';

const loanScheduleService = {
  async generateProjectionSchedule(principalCents, tenureMonths, rateBps) {
    logger.info(`[loanScheduleService] generateProjectionSchedule`, { principalCents, tenureMonths, rateBps });
    return [];
  },
};

export default loanScheduleService;
