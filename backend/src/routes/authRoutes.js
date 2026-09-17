import * as AuthController from '../controllers/authController.js';
import { registerSchema } from '../validations/registerValidation.js';
import { loginSchema } from '../validations/loginValidation.js';
import { authenticate } from '../middlewares/auth.js';

export default async function authRoutes(fastify, _opts) {
  // Registration route with strict rate limiting (5 per hour)
  fastify.post('/register', {
    ...registerSchema,
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } }
  }, AuthController.register);

  // Login route with strict rate limiting (5 per 15 minutes)
  fastify.post('/login', {
    ...loginSchema,
    config: { rateLimit: { max: 15, timeWindow: '15 minutes' } }
  }, AuthController.login);

  // Logout route (requires authentication technically, but safe to expose)
  fastify.post('/logout', AuthController.logout);

  // Email verification route
  fastify.post('/verify-email', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string' } }
      }
    },
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
  }, AuthController.verifyEmail);

  // Forgot password route
  fastify.post('/forgot-password', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } }
      }
    },
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
  }, AuthController.forgotPassword);

  // Reset password route
  fastify.post('/reset-password', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'newPassword', 'confirmPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 8, maxLength: 16 },
          confirmPassword: { type: 'string' }
        }
      }
    },
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } }
  }, AuthController.resetPassword);

  // Protected route example to fetch current user profile
  fastify.get('/me', { preHandler: authenticate }, async (request, _reply) => {
    // request.user is populated by the authenticate decorator
    return { status: 'success', data: request.user };
  });
}
