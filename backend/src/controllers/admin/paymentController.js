import { paymentService } from '../../services/admin/index.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const getAllPayments = async (request, reply) => {
  try {
    const payments = await paymentService.getAllPayments();
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: payments,
    });
  } catch (error) {
    logger.error(`admin getAllPayments error: ${error.message}`);
    throw error;
  }
};
