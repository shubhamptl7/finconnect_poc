import logger from '../config/logger.js';

const loanWebhookService = {
  async processColumnWebhook(eventPayload) {
    logger.info(`[loanWebhookService] processColumnWebhook`, eventPayload);
    return { success: true };
  },
};

export default loanWebhookService;
