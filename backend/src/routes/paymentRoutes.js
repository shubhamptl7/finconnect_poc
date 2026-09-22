import * as PaymentController from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/auth.js';
import { initiatePaymentSchema, cancelPaymentSchema } from '../validations/paymentValidation.js';

export default async function paymentRoutes(fastify, _options) {
  fastify.post('/create', { preHandler: authenticate, ...initiatePaymentSchema }, PaymentController.initiatePayment);
  fastify.post('/:id/cancel', { preHandler: authenticate, ...cancelPaymentSchema }, PaymentController.cancelPayment);
  fastify.get('/', { preHandler: authenticate }, PaymentController.getPayments);
}
