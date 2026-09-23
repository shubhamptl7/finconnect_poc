import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import STATUS_CODES from '../../config/constants.js';
import logger from '../../config/logger.js';
import { loanOfferService } from '../loan/index.js';

const adminLoanService = {
  /**
   * Fetches applications requiring Admin underwriting review
   */
  async getPendingReviews(query = {}) {
    logger.info('[adminLoanService] Fetching pending loan reviews', query);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { Op } = db.Sequelize;
    const where = {};

    // 1. Status Filter
    if (query.status && query.status !== 'all') {
      if (query.status === 'ADMIN_REVIEW_PENDING') {
        where.status = { [Op.in]: ['ADMIN_REVIEW_PENDING', 'UNDERWRITING'] };
      } else {
        where.status = query.status;
      }
    }

    // 2. System Recommendation Filter
    if (query.systemRecommendation && query.systemRecommendation !== 'all') {
      where.system_recommendation = query.systemRecommendation;
    }

    // 3. Multi-field search
    const search = query.search?.trim();
    if (search) {
      where[Op.or] = [
        { application_number: { [Op.iLike]: `%${search}%` } },
        { purpose: { [Op.iLike]: `%${search}%` } },
        { '$user.name$': { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await db.LoanApplication.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'name', 'email', 'status', 'created_at'] },
        { model: db.LoanOffer, as: 'offer' },
        { model: db.LoanVerification, as: 'verifications' },
      ],
      order: [['updated_at', sortOrder]],
      limit,
      offset,
      subQuery: false,
      distinct: true,
    });

    // Compute status stats for metrics overview bar
    const [totalApps, pendingCount, recApproveCount, recRejectCount, approvedCount] = await Promise.all([
      db.LoanApplication.count(),
      db.LoanApplication.count({ where: { status: { [Op.in]: ['ADMIN_REVIEW_PENDING', 'UNDERWRITING'] } } }),
      db.LoanApplication.count({ where: { system_recommendation: 'RECOMMENDED_APPROVE' } }),
      db.LoanApplication.count({ where: { system_recommendation: 'RECOMMENDED_REJECT' } }),
      db.LoanApplication.count({
        where: {
          status: {
            [Op.in]: ['APPROVED', 'OFFER_GENERATED', 'ACCEPTED', 'LOAN_CREATED', 'DISBURSED', 'CLOSED'],
          },
        },
      }),
    ]);

    return {
      reviews: rows,
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
      hasMore: offset + rows.length < count,
      stats: {
        total: totalApps,
        pending: pendingCount,
        recommendedApprove: recApproveCount,
        recommendedReject: recRejectCount,
        approved: approvedCount,
        filteredCount: count,
      },
    };
  },

  /**
   * Admin approves loan application and triggers LoanOffer generation
   */
  async approveApplication(adminUserId, applicationId, options = {}) {
    const adminNotes = typeof options === 'string' ? options : options.adminNotes || '';
    let customInterestRateBps =
      typeof options === 'object' ? options.customInterestRateBps : undefined;
    if (customInterestRateBps !== undefined && customInterestRateBps !== null) {
      customInterestRateBps = Number(customInterestRateBps);
      if (
        isNaN(customInterestRateBps) ||
        customInterestRateBps < 800 ||
        customInterestRateBps > 2400
      ) {
        throw new AppError(
          'Interest rate must be between 800 BPS (8.00%) and 2400 BPS (24.00%)',
          STATUS_CODES.BAD_REQUEST
        );
      }
    }
    const customApprovedAmountCents =
      typeof options === 'object' ? options.customApprovedAmountCents : undefined;
    const customTenureMonths = typeof options === 'object' ? options.customTenureMonths : undefined;

    logger.info(
      `[adminLoanService] Admin ${adminUserId} approving loan application ${applicationId}`,
      options
    );

    let application;
    let offer;

    await db.sequelize.transaction(async (t) => {
      // Acquire atomic lock on state transition
      const [updatedRows] = await db.LoanApplication.update(
        { status: 'APPROVED', underwriting_status: 'APPROVED', approved_by_admin_id: adminUserId },
        { where: { id: applicationId, status: 'ADMIN_REVIEW_PENDING' }, transaction: t }
      );

      application = await db.LoanApplication.findOne({
        where: { id: applicationId },
        include: [{ model: db.User, as: 'user' }],
        transaction: t,
      });

      if (!application) {
        throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
      }

      if (updatedRows === 0) {
        if (
          application.status === 'APPROVED' ||
          application.status === 'OFFER_GENERATED' ||
          application.status === 'ACCEPTED'
        ) {
          throw new AppError('Loan application is already approved', STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(
          `Cannot approve application in ${application.status} status`,
          STATUS_CODES.BAD_REQUEST
        );
      }

      // Admin binding decision details
      application.admin_notes =
        adminNotes || 'Approved by Administrator after underwriting review.';
      await application.save({ transaction: t });

      // Log Audit Event within transaction
      try {
        await db.AuditLog.create(
          {
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
          },
          { transaction: t }
        );
      } catch (auditErr) {
        logger.warn(`[adminLoanService] Audit error: ${auditErr.message}`);
      }

      // Automatically generate binding LoanOffer for the borrower with custom terms within the same transaction
      offer = await loanOfferService.generateOffer(applicationId, {
        interestRateBps: customInterestRateBps,
        approvedAmountCents: customApprovedAmountCents,
        tenureMonths: customTenureMonths,
        transaction: t,
      });
    });

    // Send Real-Time Notification & WebSocket push to Borrower
    try {
      const { default: notificationService } = await import('../notificationService.js');
      const { default: websocketService } = await import('../websocketService.js');

      const approvedPounds = (Number(offer.approved_amount) / 100).toLocaleString('en-GB', {
        minimumFractionDigits: 2,
      });
      const ratePct = (Number(offer.interest_rate_bps) / 100).toFixed(2);

      await notificationService.createNotification({
        user_id: application.user_id,
        title: 'Loan Offer Available',
        message: `Congratulations! Your loan application for £${approvedPounds} at ${ratePct}% APR has been approved. Review and sign your binding offer now.`,
        type: 'loan',
        action_url: `/app/loans/offer/${application.id}`,
        metadata: {
          applicationId: application.id,
          offerId: offer.id,
          approvedAmount: offer.approved_amount,
          interestRateBps: offer.interest_rate_bps,
        },
      });

      websocketService.sendToUser(application.user_id, {
        type: 'LOAN_APPLICATION_UPDATED',
        data: {
          applicationId: application.id,
          status: 'OFFER_GENERATED',
          offerId: offer.id,
        },
      });
    } catch (pushErr) {
      logger.warn(`[adminLoanService] Push/Notification error on approval: ${pushErr.message}`);
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
    logger.info(
      `[adminLoanService] Admin ${adminUserId} rejecting loan application ${applicationId}`
    );

    let application;
    let finalReason;

    await db.sequelize.transaction(async (t) => {
      // Acquire atomic lock on state transition
      const [updatedRows] = await db.LoanApplication.update(
        { status: 'REJECTED', underwriting_status: 'REJECTED' },
        { where: { id: applicationId, status: 'ADMIN_REVIEW_PENDING' }, transaction: t }
      );

      application = await db.LoanApplication.findOne({
        where: { id: applicationId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!application) {
        throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
      }

      if (updatedRows === 0) {
        if (application.status === 'REJECTED') {
          throw new AppError('Loan application is already rejected', STATUS_CODES.BAD_REQUEST);
        }
        throw new AppError(
          `Cannot reject application in ${application.status} status`,
          STATUS_CODES.BAD_REQUEST
        );
      }

      finalReason =
        rejectionReason ||
        application.system_recommendation_reason ||
        'Application did not meet criteria during Admin review.';

      application.system_recommendation_reason = finalReason;
      application.admin_notes = adminNotes || 'Rejected by Administrator.';
      await application.save({ transaction: t });

      // Log Audit Event within transaction
      try {
        await db.AuditLog.create(
          {
            user_id: adminUserId,
            action: 'LOAN_REJECTED_BY_ADMIN',
            metadata: {
              applicationId: application.id,
              applicationNumber: application.application_number,
              borrowerUserId: application.user_id,
              rejectionReason: finalReason,
            },
          },
          { transaction: t }
        );
      } catch (auditErr) {
        logger.warn(`[adminLoanService] Audit error: ${auditErr.message}`);
      }
    });

    // Send Real-Time Notification & WebSocket push to Borrower
    try {
      const { default: notificationService } = await import('../notificationService.js');
      const { default: websocketService } = await import('../websocketService.js');

      await notificationService.createNotification({
        user_id: application.user_id,
        title: 'Loan Application Update',
        message: `Your loan application (#${application.application_number}) could not be approved at this time: ${finalReason}`,
        type: 'loan',
        action_url: `/app/loans/status/${application.id}`,
        metadata: {
          applicationId: application.id,
          status: 'REJECTED',
          reason: finalReason,
        },
      });

      websocketService.sendToUser(application.user_id, {
        type: 'LOAN_APPLICATION_UPDATED',
        data: {
          applicationId: application.id,
          status: 'REJECTED',
          reason: finalReason,
        },
      });
    } catch (pushErr) {
      logger.warn(`[adminLoanService] Push/Notification error on rejection: ${pushErr.message}`);
    }

    return application;
  },
};

export default adminLoanService;
