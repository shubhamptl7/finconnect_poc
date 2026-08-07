import * as AuditController from '../../controllers/admin/auditController.js';
import { authenticate } from '../../middlewares/auth.js';

export default async function adminAuditRoutes(fastify, options) {
  fastify.get('/', { preHandler: authenticate }, AuditController.getAllLogs);
}
