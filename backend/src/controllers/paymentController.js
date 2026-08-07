import paymentService from '../services/paymentService.js';
import STATUS_CODES from '../config/constants.js';
import { successResponse } from '../utils/response.js';
import logger from '../config/logger.js';

export const initiatePayment = async (request, reply) => {
  try {
    const metadata = { ip: request.ip, userAgent: request.headers['user-agent'] };
    const result = await paymentService.initiatePayment(request.user.id, request.body, metadata);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.CREATED,
      message: 'Payment intent created',
      data: result,
    });
  } catch (error) {
    logger.error(`initiatePayment error: ${error.message}`);
    throw error;
  }
};

export const getPayments = async (request, reply) => {
  try {
    const payments = await paymentService.getPayments(request.user.id);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: payments,
    });
  } catch (error) {
    logger.error(`getPayments error: ${error.message}`);
    throw error;
  }
};

export const cancelPayment = async (request, reply) => {
  try {
    const result = await paymentService.cancelPayment(request.user.id, request.params.id);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Payment cancelled successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`cancelPayment error: ${error.message}`);
    throw error;
  }
};
