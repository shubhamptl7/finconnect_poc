import loanCalculatorService from '../../services/loanCalculatorService.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const calculateEmi = async (request, reply) => {
  try {
    const { principal, rate, tenure } = request.query;
    const emi = loanCalculatorService.calculateEmi(Number(principal), Number(rate), Number(tenure));
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'EMI calculated',
      data: { emi },
    });
  } catch (error) {
    logger.error(`calculateEmi error: ${error.message}`);
    throw error;
  }
};
