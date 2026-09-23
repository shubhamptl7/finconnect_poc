import * as UserController from '../../controllers/admin/userController.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';

export default async function adminUserRoutes(fastify, _options) {
  fastify.get('/', { preHandler: [authenticate, requireRole('admin')] }, UserController.getAllUsers);
  fastify.get('/:id', { preHandler: [authenticate, requireRole('admin')] }, UserController.getUserDetails);
  fastify.patch('/:id/status', { preHandler: [authenticate, requireRole('admin')] }, UserController.updateUserStatus);
}
