import { userService } from '../../services/admin/index.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const getAllUsers = async (request, reply) => {
  try {
    const users = await userService.getAllUsers();
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: users,
    });
  } catch (error) {
    logger.error(`getAllUsers error: ${error.message}`);
    throw error;
  }
};
