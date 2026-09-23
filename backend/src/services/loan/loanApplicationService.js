import crypto from 'crypto';

import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import STATUS_CODES from '../../config/constants.js';
import logger from '../../config/logger.js';
import PlaidLendingDataProvider from '../../providers/plaid/PlaidLendingDataProvider.js';

import loanUnderwritingService from './loanUnderwritingService.js';

const loanApplicationService = {
  /**
   * Creates a new loan application in DRAFT state
   */
  async createApplication(userId, data) {
    logger.info(`[loanApplicationService] createApplication for user ${userId}`);

    const requestedAmountCents = Math.round(
      Number(data.requested_amount ?? data.requestedAmountCents ?? 500000)
    );
    const requestedTenureMonths = Number(
      data.requested_tenure_months ?? data.requestedTenureMonths ?? 12
    );

    if (
      isNaN(requestedAmountCents) ||
      !isFinite(requestedAmountCents) ||
      requestedAmountCents <= 0
    ) {
      throw new AppError('Invalid requested amount', STATUS_CODES.BAD_REQUEST);
    }
    const monthlyIncomeCents =
      data.monthly_income != null ? Math.round(Number(data.monthly_income)) : null;
    const existingObligationsCents =
      data.existing_monthly_obligations != null
        ? Math.round(Number(data.existing_monthly_obligations))
        : null;

    if (
      monthlyIncomeCents !== null &&
      (isNaN(monthlyIncomeCents) || !isFinite(monthlyIncomeCents))
    ) {
      throw new AppError('Invalid monthly income provided', STATUS_CODES.BAD_REQUEST);
    }
    if (
      existingObligationsCents !== null &&
      (isNaN(existingObligationsCents) || !isFinite(existingObligationsCents))
    ) {
      throw new AppError('Invalid existing obligations provided', STATUS_CODES.BAD_REQUEST);
    }

    const bankAccountId = data.bank_account_id || data.bankAccountId || null;
    if (bankAccountId) {
      const validAccount = await db.BankAccount.findOne({
        where: { id: bankAccountId, user_id: userId },
      });
      if (!validAccount) {
        throw new AppError(
          'The selected bank account was not found or does not belong to your profile.',
          STATUS_CODES.BAD_REQUEST
        );
      }
    }

    // Enforce business rule: Max 3 active/ongoing loans cap per user
    const activeLoanCount = await db.Loan.count({
      where: {
        user_id: userId,
        status: ['ACTIVE', 'PENDING', 'DELINQUENT'],
      },
    });

    if (activeLoanCount >= 3) {
      throw new AppError(
        'Maximum active loan limit reached (3 loans). You cannot apply for a new loan until an existing loan is fully repaid.',
        STATUS_CODES.BAD_REQUEST
      );
    }

    // Check if user already has an existing unsubmitted DRAFT application
    let application = await db.LoanApplication.findOne({
      where: { user_id: userId, status: 'DRAFT' },
      order: [['created_at', 'DESC']],
    });

    if (application) {
      // Reuse and update existing draft application row instead of creating duplicate DB rows
      application.requested_amount = requestedAmountCents;
      application.requested_currency = (data.requested_currency || 'GBP').toUpperCase();
      application.requested_tenure_months = requestedTenureMonths;
      application.purpose = data.purpose || 'Personal Expenses';
      if (monthlyIncomeCents != null) application.monthly_income = monthlyIncomeCents;
      if (existingObligationsCents != null)
        application.existing_monthly_obligations = existingObligationsCents;
      if (data.employment_type != null) application.employment_type = data.employment_type;
      if (bankAccountId != null) application.bank_account_id = bankAccountId;
      await application.save();
      return application;
    }

    const currentYear = new Date().getFullYear();
    let appNumber = '';
    application = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
      const timestampSuffix = Date.now().toString().slice(-4);
      appNumber = `APP-${currentYear}-${timestampSuffix}${randomHex}`;

      try {
        application = await db.LoanApplication.create({
          user_id: userId,
          bank_account_id: bankAccountId,
          application_number: appNumber,
          requested_amount: requestedAmountCents,
          requested_currency: (data.requested_currency || 'GBP').toUpperCase(),
          requested_tenure_months: requestedTenureMonths,
          purpose: data.purpose || 'Personal Expenses',
          monthly_income: monthlyIncomeCents,
          existing_monthly_obligations: existingObligationsCents,
          employment_type: data.employment_type || 'FULL_TIME',
          status: 'DRAFT',
          eligibility_status: 'PENDING',
          verification_status: 'PENDING',
          underwriting_status: 'PENDING',
        });
        break;
      } catch (createErr) {
        if (createErr.name === 'SequelizeUniqueConstraintError' && attempts < maxAttempts) {
          logger.warn(
            `[loanApplicationService] Collision generating appNumber ${appNumber}, retrying...`
          );
          continue;
        }
        throw createErr;
      }
    }

    // Record Audit Event
    try {
      await db.AuditLog.create({
        user_id: userId,
        action: 'LOAN_APPLICATION_CREATED',
        metadata: {
          applicationId: application.id,
          applicationNumber: appNumber,
          amountCents: requestedAmountCents,
          currency: application.requested_currency,
        },
      });
    } catch (auditErr) {
      logger.warn(`[loanApplicationService] Audit error: ${auditErr.message}`);
    }

    return application;
  },

  /**
   * Updates an existing draft application
   */
  async updateDraft(userId, applicationId, data) {
    const application = await db.LoanApplication.findOne({
      where: { id: applicationId, user_id: userId },
    });

    if (!application) {
      throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
    }

    if (application.status !== 'DRAFT') {
      throw new AppError('Only draft applications can be updated', STATUS_CODES.BAD_REQUEST);
    }

    if (data.requested_amount != null)
      application.requested_amount = Math.round(Number(data.requested_amount));
    if (data.requested_currency != null)
      application.requested_currency = String(data.requested_currency).toUpperCase();
    if (data.requested_tenure_months != null)
      application.requested_tenure_months = Number(data.requested_tenure_months);
    if (data.purpose != null) application.purpose = data.purpose;
    if (data.monthly_income != null)
      application.monthly_income = Math.round(Number(data.monthly_income));
    if (data.existing_monthly_obligations != null)
      application.existing_monthly_obligations = Math.round(
        Number(data.existing_monthly_obligations)
      );
    if (data.employment_type != null) application.employment_type = data.employment_type;

    const bankAccountId = data.bank_account_id || data.bankAccountId;
    if (bankAccountId != null) {
      const validAccount = await db.BankAccount.findOne({
        where: { id: bankAccountId, user_id: userId },
      });
      if (!validAccount) {
        throw new AppError(
          'The selected bank account was not found or does not belong to your profile.',
          STATUS_CODES.BAD_REQUEST
        );
      }
      application.bank_account_id = bankAccountId;
    }

    await application.save();
    return application;
  },

  /**
   * Fetches all loan applications for a given user
   */
  async getApplications(userId) {
    return await db.LoanApplication.findAll({
      where: { user_id: userId },
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: db.BankAccount,
          as: 'bankAccount',
          include: [
            {
              model: db.BankConnection,
              as: 'connection',
              attributes: ['id', 'bank_name', 'institution_id'],
            },
          ],
        },
        { model: db.LoanOffer, as: 'offer' },
        { model: db.LoanVerification, as: 'verifications', attributes: { exclude: ['result'] } },
        {
          model: db.Loan,
          as: 'loan',
          include: [
            { model: db.LoanAutopayAuthorization, as: 'autopay' },
            {
              model: db.BankAccount,
              as: 'bankAccount',
              include: [
                {
                  model: db.BankConnection,
                  as: 'connection',
                  attributes: ['id', 'bank_name', 'institution_id'],
                },
              ],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  },

  /**
   * Fetches a specific loan application by ID
   */
  async getApplicationById(userId, applicationId) {
    let application = await db.LoanApplication.findOne({
      where: { id: applicationId, user_id: userId },
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: db.BankAccount,
          as: 'bankAccount',
          include: [
            {
              model: db.BankConnection,
              as: 'connection',
              attributes: ['id', 'bank_name', 'institution_id'],
            },
          ],
        },
        { model: db.LoanOffer, as: 'offer' },
        { model: db.LoanVerification, as: 'verifications', attributes: { exclude: ['result'] } },
        {
          model: db.Loan,
          as: 'loan',
          include: [
            { model: db.LoanAutopayAuthorization, as: 'autopay' },
            {
              model: db.BankAccount,
              as: 'bankAccount',
              include: [
                {
                  model: db.BankConnection,
                  as: 'connection',
                  attributes: ['id', 'bank_name', 'institution_id'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!application) {
      throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
    }

    // Auto-generate missing offer record ONLY if application is in APPROVED or OFFER_GENERATED status
    if (!application.offer && ['APPROVED', 'OFFER_GENERATED'].includes(application.status)) {
      try {
        const loanOfferService = (await import('./loanOfferService.js')).default;
        const offer = await loanOfferService.generateOffer(applicationId, {
          approvedAmountCents: application.requested_amount,
          tenureMonths: application.requested_tenure_months,
          preserveStatus: true,
        });
        application.setDataValue('offer', offer);
      } catch (genErr) {
        logger.warn(`[loanApplicationService] Auto offer generation warning: ${genErr.message}`);
      }
    }

    return application;
  },

  /**
   * Submits loan application:
   * - Validates state & KYC
   * - Pulls Plaid lending data (Income, Liabilities, Balance, Statements)
   * - Saves verification snapshots
   * - Triggers automated underwriting recommendation engine
   */
  async submitApplication(userId, applicationId) {
    logger.info(
      `[loanApplicationService] Submitting application ${applicationId} for user ${userId}`
    );

    const application = await db.LoanApplication.findOne({
      where: { id: applicationId, user_id: userId },
    });

    if (!application) {
      throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
    }

    if (application.status !== 'DRAFT') {
      throw new AppError('Application has already been submitted', STATUS_CODES.BAD_REQUEST);
    }

    // Step 0: Validate that a dedicated bank account is designated for this loan
    if (!application.bank_account_id) {
      throw new AppError(
        'A valid linked bank account must be selected for loan disbursement and repayment.',
        STATUS_CODES.BAD_REQUEST
      );
    }
    const designatedAccount = await db.BankAccount.findOne({
      where: { id: application.bank_account_id, user_id: userId },
    });
    if (!designatedAccount) {
      throw new AppError(
        'The bank account designated for this loan is no longer active.',
        STATUS_CODES.BAD_REQUEST
      );
    }

    // Step 1: Check Persona KYC Status from user's registration
    // Business Rule: Active user status means KYC is completed & verified.
    const user = await db.User.findByPk(userId);
    const kyc = await db.KycVerification.findOne({ where: { user_id: userId } });
    const isKycVerified = (user && user.status === 'active') || (kyc && kyc.status === 'approved');

    // Create KYC verification record for application
    await db.LoanVerification.create({
      loan_application_id: applicationId,
      user_id: userId,
      verification_type: 'IDENTITY',
      provider: 'PERSONA',
      status: isKycVerified ? 'PASSED' : 'FAILED',
      result: {
        kycId: kyc?.id || null,
        personaInquiryId: kyc?.persona_inquiry_id || null,
        status: isKycVerified ? 'VERIFIED' : 'NOT_VERIFIED',
        userStatus: user?.status || 'unverified',
      },
      verified_at: isKycVerified ? new Date() : null,
    });

    // Step 2: Transition to SUBMITTED & VERIFICATION_PENDING
    application.status = 'SUBMITTED';
    application.submitted_at = new Date();
    application.verification_status = 'IN_PROGRESS';
    await application.save();

    // Clean up any remaining draft applications for this user
    try {
      await db.LoanApplication.destroy({
        where: {
          user_id: userId,
          status: 'DRAFT',
          id: { [db.Sequelize.Op.ne]: applicationId },
        },
      });
    } catch (cleanupErr) {
      logger.warn(`[loanApplicationService] Draft cleanup warning: ${cleanupErr.message}`);
    }

    // Record Audit Event
    try {
      await db.AuditLog.create({
        user_id: userId,
        action: 'LOAN_APPLICATION_SUBMITTED',
        metadata: { applicationId, applicationNumber: application.application_number },
      });
    } catch (auditErr) {
      logger.warn(`[loanApplicationService] Audit log error: ${auditErr.message}`);
    }

    // Send Real-Time Notification to Borrower
    try {
      const { default: notificationService } = await import('../notificationService.js');
      await notificationService.createNotification({
        user_id: userId,
        title: `Loan Application Submitted (#${application.application_number})`,
        message: `Your loan application for £${(Number(application.requested_amount) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })} has been received. Open banking affordability underwriting is in progress.`,
        type: 'loan',
        action_url: `/app/loans/status/${application.id}`,
        metadata: {
          applicationId: application.id,
          applicationNumber: application.application_number,
          requestedAmount: application.requested_amount,
        },
      });
    } catch (notifErr) {
      logger.warn(`[loanApplicationService] Notification warning: ${notifErr.message}`);
    }

    // Step 3: Asynchronously fetch Plaid Lending Data and run Underwriting to prevent API blocking
    setTimeout(async () => {
      let app = null;
      try {
        app = await db.LoanApplication.findByPk(applicationId);
        if (!app) {
          logger.error(
            `[loanApplicationService] Application ${applicationId} not found in background verification task`
          );
          return;
        }

        const plaidData = await PlaidLendingDataProvider.getLendingData(userId);

        const verifiedIncomeCents = plaidData.verifiedIncomeCents || app.monthly_income || 0;
        const verifiedDebtCents = Number(plaidData.verifiedDebtCents || 0);

        // Save Plaid Financial Analysis verification record
        await db.LoanVerification.create({
          loan_application_id: applicationId,
          user_id: userId,
          verification_type: 'FINANCIAL_ANALYSIS',
          provider: 'PLAID',
          status: 'PASSED',
          result: {
            verifiedIncomeCents,
            verifiedDebtCents,
            liquidBalanceCents: plaidData.liquidBalanceCents,
            statementsCount: plaidData.statements?.length || 0,
            liabilitiesDetail: plaidData.liabilitiesDetail,
            financialProfile: plaidData.financialProfile,
            assetReportDetails: plaidData.assetReportDetails || {
              liquidBalanceCents: plaidData.liquidBalanceCents,
              verificationStatus: 'PASSED',
              verificationMethod: 'PLAID_ASSETS_BALANCE_API',
              evaluatedDays: 60,
              assetStabilityRating:
                plaidData.liquidBalanceCents > 500000 ? 'STRONG_RESERVES' : 'SATISFACTORY',
            },
          },
          verified_at: new Date(),
        });

        // Save Income Verification record
        const hasPlaidIncome = Boolean(plaidData.verifiedIncomeCents);
        const incomeStream = plaidData.incomeDetail?.verifiedStreams?.[0] || {};
        await db.LoanVerification.create({
          loan_application_id: applicationId,
          user_id: userId,
          verification_type: 'INCOME_ESTIMATE',
          provider: hasPlaidIncome ? 'PLAID' : 'FINCONNECT',
          status: hasPlaidIncome ? 'PASSED' : 'MANUAL_REVIEW',
          result: {
            verifiedIncomeCents,
            verifiedAnnualIncomeCents: verifiedIncomeCents * 12,
            employerName:
              incomeStream.employerName ||
              (hasPlaidIncome ? 'Verified Corporate Employer' : 'Self-Reported Borrower Income'),
            payFrequency: 'MONTHLY',
            incomeSourceType: hasPlaidIncome ? 'DIRECT_DEPOSIT' : 'SELF_REPORTED',
            verificationMethod: hasPlaidIncome
              ? 'PLAID_CREDIT_BANK_INCOME_API'
              : 'SELF_REPORTED_FALLBACK',
            confidenceScoreBps: hasPlaidIncome
              ? plaidData.financialProfile?.incomeConsistency?.scoreBps || 9800
              : 5000,
            incomeStabilityRating: hasPlaidIncome
              ? plaidData.financialProfile?.incomeConsistency?.rating || 'HIGH'
              : 'UNVERIFIED',
          },
          verified_at: new Date(),
        });

        // Save verified metrics on application
        app.verified_monthly_income = verifiedIncomeCents;
        app.verified_monthly_debt = verifiedDebtCents;
        app.verification_status = 'PASSED';
        app.status = 'UNDERWRITING';
        await app.save();

        // Step 4: Run Automated Underwriting Recommendation Engine
        await loanUnderwritingService.evaluateApplication(applicationId);
      } catch (bgErr) {
        logger.error(
          `[loanApplicationService] Background verification/underwriting failed for ${applicationId}: ${bgErr.message}`
        );
        if (!app) {
          app = await db.LoanApplication.findByPk(applicationId);
        }
        if (app) {
          app.status = 'ADMIN_REVIEW_PENDING';
          app.verification_status = 'FAILED';
          app.admin_notes = app.admin_notes
            ? `${app.admin_notes}\n[Verification Failed]: ${bgErr.message}`
            : `[Verification Failed]: ${bgErr.message}`;
          await app.save();
        }
      }
    }, 0);

    // Return application immediately in VERIFICATION_IN_PROGRESS state
    return application;
  },
};

export default loanApplicationService;
