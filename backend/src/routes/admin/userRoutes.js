import * as UserController from '../../controllers/admin/userController.js';
import { authenticate } from '../../middlewares/auth.js';

export default async function adminUserRoutes(fastify, options) {
  // We use authenticate to ensure logged in. In production, we'd add an `isAdmin` middleware.
  fastify.get('/', { preHandler: authenticate }, UserController.getAllUsers);
}
