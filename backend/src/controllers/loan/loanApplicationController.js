import { loanApplicationService, loanOfferService, loanOriginationService } from '../../services/loan/index.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const createApplication = async (request, reply) => {
  try {
    const application = await loanApplicationService.createApplication(request.user.id, request.body);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.CREATED,
      message: 'Loan application draft created successfully',
      data: application,
    });
  } catch (error) {
    logger.error(`createApplication error: ${error.message}`);
    throw error;
  }
};

export const updateDraft = async (request, reply) => {
  try {
    const { id } = request.params;
    const application = await loanApplicationService.updateDraft(request.user.id, id, request.body);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Loan application draft updated successfully',
      data: application,
    });
  } catch (error) {
    logger.error(`updateDraft error: ${error.message}`);
    throw error;
  }
};

export const getApplications = async (request, reply) => {
  try {
    const start = performance.now();
    const applications = await loanApplicationService.getApplications(request.user.id);
    const end = performance.now();
    logger.info(`[TIMING] getApplications took ${end - start}ms`);
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

export const getApplicationById = async (request, reply) => {
  try {
    const start = performance.now();
    const { id } = request.params;
    const application = await loanApplicationService.getApplicationById(request.user.id, id);
    const end = performance.now();
    logger.info(`[TIMING] getApplicationById took ${end - start}ms`);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Loan application retrieved successfully',
      data: application,
    });
  } catch (error) {
    if (error.statusCode === STATUS_CODES.NOT_FOUND || error.statusCode === 404) {
      logger.warn(`getApplicationById 404: ${error.message} (id: ${request.params.id})`);
    } else {
      logger.error(`getApplicationById error: ${error.message}`);
    }
    throw error;
  }
};

export const submitApplication = async (request, reply) => {
  try {
    const { id } = request.params;
    const application = await loanApplicationService.submitApplication(request.user.id, id);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Loan application submitted for underwriting review',
      data: application,
    });
  } catch (error) {
    logger.error(`submitApplication error: ${error.message}`);
    throw error;
  }
};

export const acceptOffer = async (request, reply) => {
  try {
    const { id, offerId } = request.params;
    const targetOfferId = offerId || request.body?.offerId;
    const result = await loanOriginationService.acceptOfferAndOriginate(request.user.id, id, targetOfferId);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Loan offer accepted and Column loan origination initiated successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`acceptOffer error: ${error.message}`);
    throw error;
  }
};
