import db from '../../models/index.js';
import logger from '../../config/logger.js';

import loanEligibilityService from './loanEligibilityService.js';

const MIN_INCOME_CENTS = {
  GBP: 150000, // £1,500
  USD: 150000, // $1,500
};

const loanUnderwritingService = {
  /**
   * Evaluates automated 5-rule underwriting policy and sets system recommendation
   */
  async evaluateApplication(applicationId) {
    logger.info(`[loanUnderwritingService] Evaluating application ${applicationId}`);

    const application = await db.LoanApplication.findOne({
      where: { id: applicationId },
      include: [{ model: db.LoanVerification, as: 'verifications' }],
    });

    if (!application) {
      throw new Error(`Loan application ${applicationId} not found`);
    }

    const currency = (application.requested_currency || 'GBP').toUpperCase();
    const minIncomeRequired = MIN_INCOME_CENTS[currency] || MIN_INCOME_CENTS.GBP;

    const requestedAmountCents = Number(application.requested_amount);
    const tenureMonths = Number(application.requested_tenure_months);
    const verifiedIncomeCents = Number(
      application.verified_monthly_income || application.monthly_income || 0
    );
    const verifiedDebtCents = Number(application.verified_monthly_debt || 0);

    // Run eligibility math to get accurate EMI
    const eligibility = await loanEligibilityService.checkEligibility(application.user_id, {
      requestedAmountCents,
      tenureMonths,
      monthlyIncomeCents: verifiedIncomeCents,
      existingObligationsCents: verifiedDebtCents,
      currency,
    });

    const proposedEmiCents = eligibility.estimatedEmiCents;
    const totalMonthlyDebtCents = verifiedDebtCents + proposedEmiCents;
    const dtiRatio = verifiedIncomeCents > 0 ? totalMonthlyDebtCents / verifiedIncomeCents : 9.99; // 999% DTI when income is 0
    const dtiBps = Math.round(dtiRatio * 10000);

    // Verify Rule 1: Identity & KYC
    // Business Rule: If user account status is 'active', KYC is completed & verified.
    const user = await db.User.findByPk(application.user_id);
    const kycVerif = (application.verifications || []).find(
      (v) => v.verification_type === 'IDENTITY'
    );
    const isKycPassed =
      (user && user.status === 'active') || (kycVerif && kycVerif.status === 'PASSED');

    // Verify Rule 2: Plaid Financial Data
    const plaidVerif = (application.verifications || []).find(
      (v) => v.verification_type === 'FINANCIAL_ANALYSIS'
    );
    const isPlaidPassed = plaidVerif && plaidVerif.status === 'PASSED';

    // Verify Rule 3: Minimum Income
    const isIncomeSufficient = verifiedIncomeCents >= minIncomeRequired;

    // Verify Rule 4: DTI <= 45% (4500 bps)
    const isDtiAcceptable = dtiBps <= 4500;

    // Verify Rule 5: Requested Amount <= Max Capacity
    const isAmountAcceptable = requestedAmountCents <= eligibility.maxAmountCents;

    const allRulesPassed =
      isKycPassed && isPlaidPassed && isIncomeSufficient && isDtiAcceptable && isAmountAcceptable;

    let recommendation = 'RECOMMENDED_APPROVE';
    let recommendationReason = 'All 5 automated underwriting checks passed successfully.';

    if (!allRulesPassed) {
      recommendation = 'RECOMMENDED_REJECT';
      const failures = [];
      if (!isKycPassed) failures.push('Identity/KYC verification not completed');
      if (!isPlaidPassed) failures.push('Plaid financial analysis data unavailable');
      if (!isIncomeSufficient)
        failures.push(
          `Verified income (${(verifiedIncomeCents / 100).toFixed(2)} ${currency}) is below minimum requirement`
        );
      if (!isDtiAcceptable)
        failures.push(`Verified DTI of ${(dtiBps / 100).toFixed(1)}% exceeds 45.0% threshold`);
      if (!isAmountAcceptable)
        failures.push(
          `Requested amount (${(requestedAmountCents / 100).toFixed(2)} ${currency}) exceeds capacity limit of ${(eligibility.maxAmountCents / 100).toFixed(2)} ${currency}`
        );

      recommendationReason = failures.join('; ');
    }

    // Save evaluation metrics to LoanApplication
    application.verified_dti_bps = dtiBps;
    application.system_recommendation = recommendation;
    application.system_recommendation_reason = recommendationReason;
    application.status = 'ADMIN_REVIEW_PENDING';
    application.underwriting_status = 'PENDING';
    await application.save();

    // Log Audit Event
    try {
      await db.AuditLog.create({
        user_id: application.user_id,
        action: 'LOAN_SYSTEM_RECOMMENDATION_GENERATED',
        metadata: {
          applicationId: application.id,
          recommendation,
          dtiBps,
          verifiedIncomeCents,
          verifiedDebtCents,
          reason: recommendationReason,
        },
      });
    } catch (auditErr) {
      logger.warn(`[loanUnderwritingService] Audit error: ${auditErr.message}`);
    }

    return {
      applicationId: application.id,
      system_recommendation: recommendation,
      system_recommendation_reason: recommendationReason,
      verified_dti_bps: dtiBps,
      status: application.status,
    };
  },
};

export default loanUnderwritingService;
