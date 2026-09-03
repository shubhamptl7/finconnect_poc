import * as WebhookController from '../controllers/webhookController.js';
import * as KycController from '../controllers/kycController.js';

export default async function webhookRoutes(fastify, _opts) {
  // 1. Plaid Webhook Receiver (POST /api/v1/webhooks/plaid)
  fastify.post('/plaid', { config: { rawBody: true } }, WebhookController.handlePlaidWebhook);

  // 2. Persona KYC Webhook Receiver (POST /api/v1/webhooks/persona)
  fastify.post('/persona', { config: { rawBody: true } }, KycController.handleWebhook);

  // 3. Column Lending & ACH Webhook Receiver (POST /api/v1/webhooks/column)
  fastify.post('/column', { config: { rawBody: true } }, async (request, reply) => {
    // Column Webhook Handler Stub (Ready for Column Sandbox integration)
    request.log.info('Received Column webhook event:', request.body);
    return reply.code(200).send({ received: true });
  });
}
