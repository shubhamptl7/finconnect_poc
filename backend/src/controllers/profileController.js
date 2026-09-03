import profileService from '../services/profileService.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';
import { successResponse } from '../utils/response.js';
import logger from '../config/logger.js';

export const updateProfile = async (request, reply) => {
  try {
    const user = await profileService.updateProfile(request.user.id, request.body);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    logger.error(`updateProfile error: ${error.message}`);
    throw error;
  }
};

export const changePassword = async (request, reply) => {
  try {
    await profileService.changePassword(request.user.id, request.body);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error(`changePassword error: ${error.message}`);
    throw error;
  }
};

export const verifyPassword = async (request, reply) => {
  try {
    await profileService.verifyPassword(request.user.id, request.body.password);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Password verified successfully',
    });
  } catch (error) {
    logger.error(`verifyPassword error: ${error.message}`);
    throw error;
  }
};

export const updateE2eeKey = async (request, reply) => {
  try {
    await profileService.updateE2eeKey(request.user.id, request.body);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'E2EE key and backup updated successfully',
    });
  } catch (error) {
    logger.error(`updateE2eeKey error: ${error.message}`);
    throw error;
  }
};

export const consumeEmergencySlot = async (request, reply) => {
  try {
    const { slotId, slotIndex } = request.body || {};
    const targetId = slotId || (slotIndex === 1 ? 'emergency_1' : slotIndex === 2 ? 'emergency_2' : null);
    
    if (!targetId) {
      throw new AppError('Emergency slot ID or index is required', STATUS_CODES.BAD_REQUEST);
    }

    const result = await profileService.consumeEmergencySlot(request.user.id, targetId);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: result.alreadyConsumed 
        ? 'Emergency slot was already consumed'
        : 'Emergency slot consumed successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`consumeEmergencySlot error: ${error.message}`);
    throw error;
  }
};
