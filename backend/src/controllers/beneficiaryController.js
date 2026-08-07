import beneficiaryService from '../services/beneficiaryService.js';
import STATUS_CODES from '../config/constants.js';
import { successResponse } from '../utils/response.js';
import logger from '../config/logger.js';

export const index = async (request, reply) => {
  try {
    const beneficiaries = await beneficiaryService.getAll(request.user.id);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Beneficiaries fetched successfully',
      data: beneficiaries,
    });
  } catch (error) {
    logger.error(`listBeneficiaries error: ${error.message}`);
    throw error;
  }
};

export const create = async (request, reply) => {
  try {
    const beneficiary = await beneficiaryService.create(request.user.id, request.body);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.CREATED,
      message: 'Beneficiary created successfully',
      data: beneficiary,
    });
  } catch (error) {
    logger.error(`createBeneficiary error: ${error.message}`);
    throw error;
  }
};

export const update = async (request, reply) => {
  try {
    const beneficiary = await beneficiaryService.update(
      request.user.id,
      request.params.id,
      request.body
    );
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Beneficiary updated successfully',
      data: beneficiary,
    });
  } catch (error) {
    logger.error(`updateBeneficiary error: ${error.message}`);
    throw error;
  }
};

export const remove = async (request, reply) => {
  try {
    await beneficiaryService.delete(request.user.id, request.params.id);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Beneficiary removed successfully',
    });
  } catch (error) {
    logger.error(`deleteBeneficiary error: ${error.message}`);
    throw error;
  }
};
