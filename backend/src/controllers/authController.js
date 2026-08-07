import authService from '../services/authService.js';
import STATUS_CODES from '../config/constants.js';
import { successResponse } from '../utils/response.js';
import logger from '../config/logger.js';

export const register = async (request, reply) => {
  try {
    const metadata = { ip: request.ip, userAgent: request.headers['user-agent'] };
    const user = await authService.register(request.body, metadata);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.CREATED,
      message: 'Registration successful. Check your email for a verification link.',
      data: user,
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
};

export const login = async (request, reply) => {
  try {
    const { email, password } = request.body;
    const metadata = { ip: request.ip, userAgent: request.headers['user-agent'] };
    const user = await authService.login(email, password, metadata);

    // Generate JWT payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Sign the token (request.server is the fastify instance)
    const token = await request.server.jwt.sign(payload, { expiresIn: '1d' });

    // Set HTTP-Only Cookie
    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day in seconds
    });

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Login successful',
      data: user,
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
};

export const logout = async (request, reply) => {
  reply.clearCookie('token', { path: '/' });
  return successResponse({
    reply,
    statusCode: STATUS_CODES.OK,
    message: 'Logged out successfully',
  });
};

export const verifyEmail = async (request, reply) => {
  try {
    const { token } = request.body;
    const metadata = { ip: request.ip, userAgent: request.headers['user-agent'] };
    await authService.verifyEmail(token, metadata);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error(`verifyEmail error: ${error.message}`);
    throw error;
  }
};

export const forgotPassword = async (request, reply) => {
  try {
    const { email } = request.body;
    logger.info(`Forgot password request received for: ${email}`);
    const metadata = { ip: request.ip, userAgent: request.headers['user-agent'] };
    await authService.forgotPassword(email, metadata);
    // Always return success even if email not found for security
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'If an account exists, a password reset link has been sent.',
    });
  } catch (error) {
    logger.error(`forgotPassword error: ${error.message}`);
    throw error;
  }
};

export const resetPassword = async (request, reply) => {
  try {
    const { token, newPassword, confirmPassword } = request.body;
    const metadata = { ip: request.ip, userAgent: request.headers['user-agent'] };
    await authService.resetPassword(token, newPassword, confirmPassword, metadata);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    logger.error(`resetPassword error: ${error.message}`);
    throw error;
  }
};
