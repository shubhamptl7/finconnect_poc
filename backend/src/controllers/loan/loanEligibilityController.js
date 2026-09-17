import { loanEligibilityService } from '../../services/loan/index.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const checkEligibility = async (request, reply) => {
  try {
    const result = await loanEligibilityService.checkEligibility(request.user.id, request.body);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Eligibility checked successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`checkEligibility error: ${error.message}`);
    throw error;
  }
};
