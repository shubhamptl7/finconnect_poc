import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';
import db from '../models/index.js';

/**
 * Fintech-grade authentication middleware.
 * - Extracts and verifies JWT (from Authorization header or cookies)
 * - Fetches fresh user from database (invalidates tokens of deleted users)
 * - Enforces account status checks (blocks suspended or unverified accounts)
 * - Attaches fresh DB user object to request
 */
export const authenticate = async (request, _reply) => {
  try {
    // 1. Verify token presence and signature using @fastify/jwt
    // This automatically looks in headers (Authorization: Bearer <token>) and cookies (token)
    try {
      await request.jwtVerify();
    } catch (_err) {
      throw new AppError('Invalid, missing, or expired token', STATUS_CODES.UNAUTHORIZED);
    }

    // request.user is populated by jwtVerify with the token payload
    const decodedToken = request.user;
    if (!decodedToken || !decodedToken.id) {
      throw new AppError('Invalid token payload structure', STATUS_CODES.UNAUTHORIZED);
    }

    // 2. Fetch fresh user from database (Fintech-grade security check)
    // This ensures if an account is hard/soft deleted from DB, active tokens are immediately useless.
    const user = await db.User.findByPk(decodedToken.id);

    if (!user) {
      throw new AppError(
        'The user belonging to this token no longer exists.',
        STATUS_CODES.UNAUTHORIZED
      );
    }

    // 3. Enforce Account Status checks
    if (user.status === 'suspended') {
      throw new AppError(
        'Your account has been suspended due to security reasons. Please contact support.',
        STATUS_CODES.FORBIDDEN
      );
    }

    if (!user.is_email_verified) {
      throw new AppError(
        'Please verify your email address to access this resource.',
        STATUS_CODES.FORBIDDEN,
        { code: 'EMAIL_UNVERIFIED', userId: user.id }
      );
    }

    if (user.status === 'unverified') {
      // Include 'USER_UNVERIFIED' code and userId so frontend can redirect to KYC if needed
      throw new AppError(
        'Please complete KYC verification to access this protected resource.',
        STATUS_CODES.FORBIDDEN,
        { code: 'USER_UNVERIFIED', userId: user.id }
      );
    }

    // 4. Attach fresh user object to request
    // Downstream routes get the fresh DB instance (request.user), NOT stale JWT string claims.
    request.user = user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error; // Forward AppError to the global errorHandler
    }
    // Mask unexpected errors
    request.log.error(`Auth Middleware System Error: ${error.message}`);
    throw new AppError('Authentication failed due to an internal error', STATUS_CODES.UNAUTHORIZED);
  }
};

/**
 * Role-based authorization middleware factory
 * Example usage in Fastify routes:
 * preHandler: [authenticate, requireRole('admin')]
 *
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'superadmin')
 */
export const requireRole = (...roles) => {
  return async (request, _reply) => {
    if (!request.user) {
      throw new AppError('Authentication required before authorization', STATUS_CODES.UNAUTHORIZED);
    }

    if (!roles.includes(request.user.role)) {
      throw new AppError(
        'You do not have permission to perform this action',
        STATUS_CODES.FORBIDDEN
      );
    }
  };
};
