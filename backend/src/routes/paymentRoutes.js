import * as PaymentController from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/auth.js';

export default async function paymentRoutes(fastify, options) {
  fastify.post('/create', { preHandler: authenticate }, PaymentController.initiatePayment);
  fastify.post('/:id/cancel', { preHandler: authenticate }, PaymentController.cancelPayment);
  fastify.get('/', { preHandler: authenticate }, PaymentController.getPayments);
}
