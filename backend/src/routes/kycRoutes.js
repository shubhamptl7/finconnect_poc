import * as KycController from '../controllers/kycController.js';

export default async function kycRoutes(fastify, _opts) {
  fastify.get('/config', KycController.getKycConfig);

  // We use fastify-raw-body to capture the raw payload before it's parsed,
  // which is strictly required to verify the Persona HMAC signature.
  fastify.post(
    '/webhook',
    {
      config: {
        rawBody: true,
      },
    },
    KycController.handleWebhook
  );
}
