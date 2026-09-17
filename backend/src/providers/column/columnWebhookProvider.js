import logger from '../../config/logger.js';

/**
 * Column Webhook Provider Adapter (Skeleton)
 * Responsible for verifying and parsing event payloads received from Column Sandbox/Production webhooks.
 */
const columnWebhookProvider = {
  verifySignature(_headers, _rawBody, _webhookSecret) {
    logger.info('[ColumnWebhookProvider] Stub verifySignature');
    return true;
  },

  parseEvent(payload) {
    return {
      eventId: payload.id || 'evt_stub_123',
      eventType: payload.type || 'loan.updated',
      data: payload.data || {},
    };
  },
};

export default columnWebhookProvider;
