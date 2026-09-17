import { adminLoanService } from '../../services/admin/index.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';

export const getPendingLoanReviews = async (request, reply) => {
  try {
    const reviews = await adminLoanService.getPendingReviews();
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Pending loan underwriting reviews retrieved',
      data: reviews,
    });
  } catch (error) {
    logger.error(`getPendingLoanReviews error: ${error.message}`);
    throw error;
  }
};

export const approveLoanApplication = async (request, reply) => {
  try {
    const { id } = request.params;
    const { adminNotes, customInterestRateBps, customApprovedAmountCents, customTenureMonths } = request.body || {};
    const result = await adminLoanService.approveApplication(request.user.id, id, {
      adminNotes,
      customInterestRateBps,
      customApprovedAmountCents,
      customTenureMonths,
    });
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Loan application approved and offer generated successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`approveLoanApplication error: ${error.message}`);
    throw error;
  }
};

export const rejectLoanApplication = async (request, reply) => {
  try {
    const { id } = request.params;
    const { rejectionReason, adminNotes } = request.body || {};
    const result = await adminLoanService.rejectApplication(request.user.id, id, rejectionReason, adminNotes);
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Loan application rejected successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`rejectLoanApplication error: ${error.message}`);
    throw error;
  }
};
