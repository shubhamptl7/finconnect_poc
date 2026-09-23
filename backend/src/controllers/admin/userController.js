import { userService } from '../../services/admin/index.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const getAllUsers = async (request, reply) => {
  try {
    const result = await userService.getUsers(request.query || {});
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: result.users,
      meta: {
        page: result.page,
        limit: result.limit,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
        stats: result.stats,
      },
    });
  } catch (error) {
    logger.error(`getAllUsers error: ${error.message}`);
    throw error;
  }
};

export const getUserDetails = async (request, reply) => {
  try {
    const { id } = request.params;
    const user = await userService.getUserDetails(id);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: user,
    });
  } catch (error) {
    logger.error(`getUserDetails error: ${error.message}`);
    throw error;
  }
};

export const updateUserStatus = async (request, reply) => {
  try {
    const { id } = request.params;
    const { status } = request.body || {};
    const updated = await userService.updateUserStatus(request.user.id, id, status);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: `User status successfully updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    logger.error(`updateUserStatus error: ${error.message}`);
    throw error;
  }
};
