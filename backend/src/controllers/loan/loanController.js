import loanService from '../../services/loanService.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const getLoans = async (request, reply) => {
  try {
    const loans = await loanService.getLoans(request.user.id);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Loans retrieved successfully',
      data: loans,
    });
  } catch (error) {
    logger.error(`getLoans error: ${error.message}`);
    throw error;
  }
};

export const getLoanById = async (request, reply) => {
  try {
    const { id } = request.params;
    const loan = await loanService.getLoanById(request.user.id, id);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Loan details retrieved successfully',
      data: loan,
    });
  } catch (error) {
    logger.error(`getLoanById error: ${error.message}`);
    throw error;
  }
};
