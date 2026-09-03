import * as AuditController from '../../controllers/admin/auditController.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';

export default async function adminAuditRoutes(fastify, options) {
  fastify.get('/', { preHandler: [authenticate, requireRole('admin')] }, AuditController.getAllLogs);
}
