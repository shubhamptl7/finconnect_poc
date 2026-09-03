import * as UserController from '../../controllers/admin/userController.js';
import { authenticate, requireRole } from '../../middlewares/auth.js';

export default async function adminUserRoutes(fastify, options) {
  fastify.get('/', { preHandler: [authenticate, requireRole('admin')] }, UserController.getAllUsers);
}
