import * as WebhookController from '../controllers/webhookController.js';
import * as KycController from '../controllers/kycController.js';

export default async function webhookRoutes(fastify, _opts) {
  // 1. Plaid Webhook Receiver (POST /api/v1/webhooks/plaid)
  fastify.post('/plaid', { config: { rawBody: true } }, WebhookController.handlePlaidWebhook);

  // 2. Persona KYC Webhook Receiver (POST /api/v1/webhooks/persona)
  fastify.post('/persona', { config: { rawBody: true } }, KycController.handleWebhook);

  // 3. Column Lending & Wire Webhook Receiver (POST /api/v1/webhooks/column)
  fastify.post('/column', { config: { rawBody: true } }, WebhookController.handleColumnWebhook);
}
