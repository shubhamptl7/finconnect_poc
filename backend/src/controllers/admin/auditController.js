import adminAuditService from '../../services/admin/auditService.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const getAllLogs = async (request, reply) => {
  try {
    const logs = await adminAuditService.getAllLogs();
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: logs,
    });
  } catch (error) {
    logger.error(`admin getAllLogs error: ${error.message}`);
    throw error;
  }
};
