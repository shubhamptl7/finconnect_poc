import profileService from '../services/profileService.js';
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
