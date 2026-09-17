import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import STATUS_CODES from '../../config/constants.js';
import logger from '../../config/logger.js';
import { loanOfferService } from '../loan/index.js';

const adminLoanService = {
  /**
   * Fetches applications requiring Admin underwriting review
   */
  async getPendingReviews() {
    logger.info('[adminLoanService] Fetching pending loan reviews');
    return await db.LoanApplication.findAll({
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'name', 'email', 'status', 'created_at'] },
        { model: db.LoanOffer, as: 'offer' },
        { model: db.LoanVerification, as: 'verifications' },
      ],
      order: [['updated_at', 'DESC']],
    });
  },

  /**
   * Admin approves loan application and triggers LoanOffer generation
   */
  async approveApplication(adminUserId, applicationId, options = {}) {
    const adminNotes = typeof options === 'string' ? options : (options.adminNotes || '');
    const customInterestRateBps = typeof options === 'object' ? options.customInterestRateBps : undefined;
    const customApprovedAmountCents = typeof options === 'object' ? options.customApprovedAmountCents : undefined;
    const customTenureMonths = typeof options === 'object' ? options.customTenureMonths : undefined;

    logger.info(`[adminLoanService] Admin ${adminUserId} approving loan application ${applicationId}`, options);

    // Acquire atomic lock on state transition
    const [updatedRows] = await db.LoanApplication.update(
      { status: 'APPROVED', underwriting_status: 'APPROVED', approved_by_admin_id: adminUserId },
      { where: { id: applicationId, status: 'ADMIN_REVIEW_PENDING' } }
    );

    const application = await db.LoanApplication.findOne({
      where: { id: applicationId },
      include: [{ model: db.User, as: 'user' }],
    });

    if (!application) {
      throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
    }

    if (updatedRows === 0) {
      if (application.status === 'APPROVED' || application.status === 'OFFER_GENERATED' || application.status === 'ACCEPTED') {
        throw new AppError('Loan application is already approved', STATUS_CODES.BAD_REQUEST);
      }
      throw new AppError(`Cannot approve application in ${application.status} status`, STATUS_CODES.BAD_REQUEST);
    }

    // Admin binding decision details
    application.admin_notes = adminNotes || 'Approved by Administrator after underwriting review.';
    await application.save();

    // Log Audit Event
    try {
      await db.AuditLog.create({
        user_id: adminUserId,
        action: 'LOAN_APPROVED_BY_ADMIN',
        metadata: {
          applicationId: application.id,
          applicationNumber: application.application_number,
          borrowerUserId: application.user_id,
          adminNotes,
          customInterestRateBps,
          customApprovedAmountCents,
          customTenureMonths,
        },
      });
    } catch (auditErr) {
      logger.warn(`[adminLoanService] Audit error: ${auditErr.message}`);
    }

    // Automatically generate binding LoanOffer for the borrower with custom terms
    let offer;
    try {
      offer = await loanOfferService.generateOffer(applicationId, {
        interestRateBps: customInterestRateBps,
        approvedAmountCents: customApprovedAmountCents,
        tenureMonths: customTenureMonths,
      });
    } catch (offerErr) {
      // Manual saga rollback to prevent partial commit if offer generation fails
      await db.LoanApplication.update(
        { status: 'ADMIN_REVIEW_PENDING', underwriting_status: 'PENDING', approved_by_admin_id: null },
        { where: { id: applicationId } }
      );
      throw new AppError(`Failed to generate binding loan offer: ${offerErr.message}`, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }

    return {
      application,
      offer,
    };
  },

  /**
   * Admin rejects loan application with specified reason
   */
  async rejectApplication(adminUserId, applicationId, rejectionReason = '', adminNotes = '') {
    logger.info(`[adminLoanService] Admin ${adminUserId} rejecting loan application ${applicationId}`);

    // Acquire atomic lock on state transition
    const [updatedRows] = await db.LoanApplication.update(
      { status: 'REJECTED', underwriting_status: 'REJECTED' },
      { where: { id: applicationId, status: 'ADMIN_REVIEW_PENDING' } }
    );

    const application = await db.LoanApplication.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
    }

    if (updatedRows === 0) {
      if (application.status === 'REJECTED') {
        throw new AppError('Loan application is already rejected', STATUS_CODES.BAD_REQUEST);
      }
      throw new AppError(`Cannot reject application in ${application.status} status`, STATUS_CODES.BAD_REQUEST);
    }

    const finalReason = rejectionReason || application.system_recommendation_reason || 'Application did not meet criteria during Admin review.';

    application.system_recommendation_reason = finalReason;
    application.admin_notes = adminNotes || 'Rejected by Administrator.';
    await application.save();

    // Log Audit Event
    try {
      await db.AuditLog.create({
        user_id: adminUserId,
        action: 'LOAN_REJECTED_BY_ADMIN',
        metadata: {
          applicationId: application.id,
          applicationNumber: application.application_number,
          borrowerUserId: application.user_id,
          rejectionReason: finalReason,
        },
      });
    } catch (auditErr) {
      logger.warn(`[adminLoanService] Audit error: ${auditErr.message}`);
    }

    return application;
  },
};

export default adminLoanService;
