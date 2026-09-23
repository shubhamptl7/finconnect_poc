import { paymentService } from '../../services/admin/index.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const getAllPayments = async (request, reply) => {
  try {
    const result = await paymentService.getPayments(request.query || {});
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: result.payments,
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
    logger.error(`admin getAllPayments error: ${error.message}`);
    throw error;
  }
};
