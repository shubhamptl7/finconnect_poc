import loanApplicationService from '../../services/loanApplicationService.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const createApplication = async (request, reply) => {
  try {
    const application = await loanApplicationService.createApplication(request.user.id, request.body);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.CREATED,
      message: 'Loan application created successfully',
      data: application,
    });
  } catch (error) {
    logger.error(`createApplication error: ${error.message}`);
    throw error;
  }
};

export const getApplications = async (request, reply) => {
  try {
    const applications = await loanApplicationService.getApplications(request.user.id);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Loan applications retrieved successfully',
      data: applications,
    });
  } catch (error) {
    logger.error(`getApplications error: ${error.message}`);
    throw error;
  }
};
