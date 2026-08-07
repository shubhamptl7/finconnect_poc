import * as PaymentController from '../../controllers/admin/paymentController.js';
import { authenticate } from '../../middlewares/auth.js';

export default async function adminPaymentRoutes(fastify, options) {
  fastify.get('/', { preHandler: authenticate }, PaymentController.getAllPayments);
}
