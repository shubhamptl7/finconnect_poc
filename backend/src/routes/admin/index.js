import adminUserRoutes from './userRoutes.js';
import adminPaymentRoutes from './paymentRoutes.js';
import adminAuditRoutes from './auditRoutes.js';
import adminLoanRoutes from './loanRoutes.js';

export default async function adminRoutes(fastify, _opts) {
  fastify.register(adminUserRoutes, { prefix: '/users' });
  fastify.register(adminPaymentRoutes, { prefix: '/payments' });
  fastify.register(adminAuditRoutes, { prefix: '/audits' });
  fastify.register(adminLoanRoutes, { prefix: '/loans' });
}
