import AppError from '../utils/appError.js';
import { errorResponse } from '../utils/response.js';
import STATUS_CODES from '../config/constants.js';
import config from '../config/env.js';

const isDevelopment = config.env === 'development';

const normalizeError = (error) => {
  if (error.isOperational || error instanceof AppError) {
    return {
      statusCode: error.statusCode || STATUS_CODES.BAD_REQUEST,
      message: error.message,
      isOperational: true,
    };
  }

  if (error.statusCode && error.statusCode < 500) {
    let translatedMessage = error.message;

    // Translate specific Fastify native errors that users might see
    if (error.code === 'FST_INVALID_MULTIPART_CONTENT_TYPE') {
      translatedMessage = 'Something went wrong.';
    }

    return {
      statusCode: error.statusCode,
      message: translatedMessage,
      isOperational: true,
    };
  }

  // Unknown / programming errors — mask in production
  return {
    statusCode: STATUS_CODES.SERVER_ERROR,
    message: isDevelopment ? error.message : 'Something went wrong.',
    isOperational: false,
  };
};

const errorHandler = (error, request, reply) => {
  const normalizedError = normalizeError(error);

  if (normalizedError.statusCode >= 500) {
    request.log.error({
      message: normalizedError.message,
      statusCode: normalizedError.statusCode,
      method: request.method,
      url: request.url,
    });

    if (isDevelopment && error.stack) {
      request.log.error(error.stack);
    }
  } else {
    request.log.warn({
      message: normalizedError.message,
      statusCode: normalizedError.statusCode,
      method: request.method,
      url: request.url,
    });
  }

  return errorResponse({
    reply,
    statusCode: normalizedError.statusCode,
    message: normalizedError.message,
    errors: normalizedError.isOperational ? error.errors : null,
  });
};

export default errorHandler;
