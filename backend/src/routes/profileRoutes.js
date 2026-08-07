import * as ProfileController from '../controllers/profileController.js';
import { authenticate } from '../middlewares/auth.js';
import { updateProfileSchema, changePasswordSchema } from '../validations/profileValidation.js';

export default async function profileRoutes(fastify, _opts) {
  fastify.patch('/', { preHandler: authenticate, ...updateProfileSchema }, ProfileController.updateProfile);
  fastify.patch('/password', { preHandler: authenticate, ...changePasswordSchema }, ProfileController.changePassword);
}
