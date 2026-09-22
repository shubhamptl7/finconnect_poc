import * as AdminLoanController from '../../controllers/admin/adminLoanController.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';
import { approveLoanApplicationSchema, rejectLoanApplicationSchema } from '../../validations/adminLoanValidation.js';

export default async function adminLoanRoutes(fastify, _opts) {
  fastify.get('/reviews', { preHandler: [authenticate, requireRole('admin')] }, AdminLoanController.getPendingLoanReviews);
  fastify.post('/:id/approve', { preHandler: [authenticate, requireRole('admin')], ...approveLoanApplicationSchema }, AdminLoanController.approveLoanApplication);
  fastify.post('/:id/reject', { preHandler: [authenticate, requireRole('admin')], ...rejectLoanApplicationSchema }, AdminLoanController.rejectLoanApplication);
}
