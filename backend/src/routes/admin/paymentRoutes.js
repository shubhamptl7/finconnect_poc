import * as PaymentController from '../../controllers/admin/paymentController.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';

export default async function adminPaymentRoutes(fastify, _options) {
  fastify.get('/', { preHandler: [authenticate, requireRole('admin')] }, PaymentController.getAllPayments);
}
