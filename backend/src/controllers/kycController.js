import kycService from '../services/kycService.js';
import { verifyPersonaSignature } from '../utils/persona.js';
import { successResponse } from '../utils/response.js';
import STATUS_CODES from '../config/constants.js';
import AppError from '../utils/appError.js';
import db from '../models/index.js';

export const handleWebhook = async (request, reply) => {
  try {
    const signatureHeader = request.headers['persona-signature'];
    const rawBody = request.rawBody; // Populated by fastify-raw-body plugin

    // 1. Verify HMAC Signature
    if (!verifyPersonaSignature(signatureHeader, rawBody)) {
      throw new AppError('Invalid Persona signature', STATUS_CODES.UNAUTHORIZED);
    }

    // 2. Process payload
    const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const result = await kycService.processWebhook(payload);

    if (!result.success && result.message.includes('not found')) {
      // Respond with 200 even if user not found, so Persona doesn't retry endlessly
      // But log the warning
      request.log.warn(`Webhook processed with warning: ${result.message}`);
    }

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Webhook processed',
    });
  } catch (error) {
    request.log.error(`Webhook processing error: ${error.message}`);
    throw error;
  }
};
