import loanPaymentService from '../../services/loanPaymentService.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const processPayment = async (request, reply) => {
  try {
    const { id } = request.params;
    const { amount } = request.body;
    const payment = await loanPaymentService.processPayment(id, amount);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.ACCEPTED,
      message: 'Payment request submitted',
      data: payment,
    });
  } catch (error) {
    logger.error(`processPayment error: ${error.message}`);
    throw error;
  }
};
