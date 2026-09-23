import { auditService } from '../../services/admin/index.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const getAllLogs = async (request, reply) => {
  try {
    const result = await auditService.getLogs(request.query || {});
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: result.logs,
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
    logger.error(`admin getAllLogs error: ${error.message}`);
    throw error;
  }
};
