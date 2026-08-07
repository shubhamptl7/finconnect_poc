import * as WebhookController from '../controllers/webhookController.js';

export default async function webhookRoutes(fastify, _opts) {
  // Plaid Webhook Receiver
  // Note: This route is unauthenticated because Plaid calls it directly.
  fastify.post('/plaid', { config: { rawBody: true } }, WebhookController.handlePlaidWebhook);
}
