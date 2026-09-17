import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import STATUS_CODES from '../../config/constants.js';
import logger from '../../config/logger.js';

import loanEligibilityService from './loanEligibilityService.js';

const loanOfferService = {
  /**
   * Generates a binding LoanOffer for an approved application
   */
  async generateOffer(applicationId, options = {}) {
    logger.info(`[loanOfferService] Generating offer for application ${applicationId}`, options);

    const application = await db.LoanApplication.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
    }

    const currency = (application.requested_currency || 'GBP').toUpperCase();
    const approvedAmountCents = options.approvedAmountCents ? Number(options.approvedAmountCents) : Number(application.requested_amount);
    const tenureMonths = options.tenureMonths ? Number(options.tenureMonths) : Number(application.requested_tenure_months);

    // Risk-based interest rate calculation within 8.00% (800 BPS) to 24.00% (2400 BPS) APR range
    let rateBps = options.interestRateBps ? Number(options.interestRateBps) : null;
    if (!rateBps) {
      const dtiBps = Number(application.verified_dti_bps || 2000);
      // Risk ratio: 0.0 to 1.0 based on DTI relative to 45.0% policy cap
      const riskRatio = Math.min(1.0, Math.max(0.0, dtiBps / 4500));
      const calculatedBps = Math.round(800 + riskRatio * 1600); // 800 BPS (8%) to 2400 BPS (24%)
      rateBps = Math.min(2400, Math.max(800, calculatedBps));
    }

    // Calculate exact decimal-safe financial figures
    const eligibility = await loanEligibilityService.checkEligibility(application.user_id, {
      requestedAmountCents: approvedAmountCents,
      tenureMonths,
      monthlyIncomeCents: Number(application.verified_monthly_income || application.monthly_income || 500000),
      existingObligationsCents: Number(application.verified_monthly_debt || 0),
      currency,
      interestRateBps: rateBps,
    });

    // Check if offer already exists for application
    let offer = await db.LoanOffer.findOne({
      where: { application_id: applicationId },
    });

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Expiration +14 days

    if (offer) {
      offer.approved_amount = approvedAmountCents;
      offer.interest_rate_bps = rateBps;
      offer.tenure_months = tenureMonths;
      offer.estimated_emi = eligibility.estimatedEmiCents;
      offer.total_interest = eligibility.totalInterestCents;
      offer.total_repayment = eligibility.totalRepaymentCents;
      offer.status = 'OFFERED';
      offer.expires_at = expiresAt;
      await offer.save();
    } else {
      offer = await db.LoanOffer.create({
        application_id: applicationId,
        user_id: application.user_id,
        approved_amount: approvedAmountCents,
        interest_rate_bps: rateBps,
        tenure_months: tenureMonths,
        estimated_emi: eligibility.estimatedEmiCents,
        total_interest: eligibility.totalInterestCents,
        total_repayment: eligibility.totalRepaymentCents,
        status: 'OFFERED',
        expires_at: expiresAt,
      });
    }

    application.status = 'OFFER_GENERATED';
    await application.save();

    // Log Audit Event
    try {
      await db.AuditLog.create({
        user_id: application.user_id,
        action: 'LOAN_OFFER_CREATED',
        metadata: {
          applicationId: application.id,
          offerId: offer.id,
          approvedAmountCents,
          estimatedEmiCents: eligibility.estimatedEmiCents,
          interestRateBps: rateBps,
        },
      });
    } catch (auditErr) {
      logger.warn(`[loanOfferService] Audit log error: ${auditErr.message}`);
    }

    return offer;
  },

  /**
   * Borrower accepts binding LoanOffer
   */
  async acceptOffer(userId, applicationId, offerId) {
    logger.info(`[loanOfferService] User ${userId} accepting offer ${offerId} for application ${applicationId}`);

    const application = await db.LoanApplication.findOne({
      where: { id: applicationId, user_id: userId },
    });

    if (!application) {
      throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
    }

    if (['REJECTED', 'WITHDRAWN', 'CANCELLED'].includes(application.status)) {
      throw new AppError(`Cannot accept offer for application in ${application.status} status`, STATUS_CODES.BAD_REQUEST);
    }

    const offer = await db.LoanOffer.findOne({
      where: { id: offerId, application_id: applicationId, user_id: userId },
    });

    if (!offer) {
      throw new AppError('Loan offer not found', STATUS_CODES.NOT_FOUND);
    }

    if (offer.status === 'ACCEPTED') {
      return { application, offer };
    }

    if (offer.status !== 'OFFERED') {
      throw new AppError(`Cannot accept offer in ${offer.status} status`, STATUS_CODES.BAD_REQUEST);
    }

    if (new Date() > new Date(offer.expires_at)) {
      offer.status = 'EXPIRED';
      await offer.save();
      throw new AppError('Loan offer has expired', STATUS_CODES.BAD_REQUEST);
    }

    offer.status = 'ACCEPTED';
    offer.accepted_at = new Date();
    await offer.save();

    application.status = 'ACCEPTED';
    await application.save();

    // Log Audit Event
    try {
      await db.AuditLog.create({
        user_id: userId,
        action: 'LOAN_OFFER_ACCEPTED',
        metadata: {
          applicationId,
          offerId,
          acceptedAt: offer.accepted_at,
        },
      });
    } catch (auditErr) {
      logger.warn(`[loanOfferService] Audit log error: ${auditErr.message}`);
    }

    return { application, offer };
  },
};

export default loanOfferService;
