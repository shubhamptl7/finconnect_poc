import authRoutes from './authRoutes.js';
import kycRoutes from './kycRoutes.js';
import bankRoutes from './bankRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import beneficiaryRoutes from './beneficiaryRoutes.js';
import adminRoutes from './admin/index.js';
import profileRoutes from './profileRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import loanRoutes from './loanRoutes.js';

export default async function routes(fastify, _opts) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(kycRoutes, { prefix: '/kyc' });
  fastify.register(bankRoutes, { prefix: '/bank' });
  fastify.register(webhookRoutes, { prefix: '/webhooks' });
  fastify.register(paymentRoutes, { prefix: '/payments' });
  fastify.register(beneficiaryRoutes, { prefix: '/beneficiaries' });
  fastify.register(adminRoutes, { prefix: '/admin' });
  fastify.register(profileRoutes, { prefix: '/profile' });
  fastify.register(notificationRoutes, { prefix: '/notifications' });
  fastify.register(loanRoutes, { prefix: '/loans' });
}
