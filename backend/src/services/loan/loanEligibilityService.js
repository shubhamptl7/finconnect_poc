import logger from '../../config/logger.js';
import db from '../../models/index.js';

// Currency-specific loan bounds & default rates
const CURRENCY_CONFIG = {
  GBP: {
    minAmountCents: 100000,      // £1,000
    maxAmountCents: 2500000,     // £25,000
    defaultRateBps: 850,         // 8.50% APR
    minTenureMonths: 6,
    maxTenureMonths: 60,
  },
  USD: {
    minAmountCents: 100000,      // $1,000
    maxAmountCents: 2500000,     // $25,000
    defaultRateBps: 1000,        // 10.00% APR
    minTenureMonths: 6,
    maxTenureMonths: 60,
  },
};

const loanEligibilityService = {
  /**
   * Evaluates loan eligibility and calculates decimal-safe amortization metrics
   */
  async checkEligibility(userId, data) {
    logger.info(`[loanEligibilityService] Evaluating eligibility for user ${userId}`, data);

    const currency = (data.currency || 'GBP').toUpperCase();
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.GBP;

    const requestedAmountCents = Math.round(Number(data.requestedAmountCents ?? data.amountCents ?? 500000));
    const tenureMonths = Math.max(6, Math.min(60, Number(data.tenureMonths ?? 12)));
    const monthlyIncomeCents = Math.round(Number(data.monthlyIncomeCents ?? 500000));

    // Fetch user's existing active loans from DB to automatically factor active EMIs into DTI
    let activeLoanEmisCents = 0;
    if (userId) {
      try {
        const activeLoans = await db.Loan.findAll({
          where: { user_id: userId, status: 'ACTIVE' },
          include: [
            {
              model: db.LoanSchedule,
              as: 'schedules',
              where: { status: 'PENDING' },
              required: false,
            },
          ],
        });
        for (const loanItem of activeLoans) {
          if (loanItem.schedules && loanItem.schedules.length > 0) {
            const sorted = [...loanItem.schedules].sort((a, b) => Number(a.installment_number) - Number(b.installment_number));
            activeLoanEmisCents += Number(sorted[0]?.scheduled_amount || 0);
          }
        }
      } catch (err) {
        logger.warn(`[loanEligibilityService] Error querying active loan obligations: ${err.message}`);
      }
    }

    const declaredObligationsCents = Math.round(Number(data.existingMonthlyObligationsCents ?? data.existingObligationsCents ?? 0));
    const existingObligationsCents = declaredObligationsCents + activeLoanEmisCents;

    if ([requestedAmountCents, tenureMonths, monthlyIncomeCents, existingObligationsCents].some(val => isNaN(val) || !isFinite(val))) {
      throw new Error('Invalid numeric input provided to eligibility engine');
    }

    const rateBps = data.interestRateBps ? Number(data.interestRateBps) : config.defaultRateBps;
    const annualRate = rateBps / 10000;
    const monthlyRate = annualRate / 12;

    // Amortization EMI formula: E = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    let estimatedEmiCents;
    if (monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, tenureMonths);
      estimatedEmiCents = Math.round(requestedAmountCents * (monthlyRate * factor) / (factor - 1));
    } else {
      estimatedEmiCents = Math.round(requestedAmountCents / tenureMonths);
    }

    // Exact reducing-balance amortization interest summation matching loanScheduleService
    let remaining = requestedAmountCents;
    let exactTotalInterestCents = 0;
    for (let i = 1; i <= tenureMonths; i++) {
      const interestMonth = Math.round(remaining * monthlyRate);
      let principalMonth = estimatedEmiCents - interestMonth;
      if (i === tenureMonths) {
        principalMonth = remaining;
      }
      remaining -= principalMonth;
      exactTotalInterestCents += interestMonth;
    }

    const totalInterestCents = exactTotalInterestCents;
    const totalRepaymentCents = requestedAmountCents + totalInterestCents;

    // Calculate DTI Ratio: DTI = (Existing Debt + Proposed EMI) / Monthly Income
    const totalMonthlyDebtCents = existingObligationsCents + estimatedEmiCents;
    const dtiRatio = monthlyIncomeCents > 0 ? (totalMonthlyDebtCents / monthlyIncomeCents) : 1;
    const dtiBps = Math.round(dtiRatio * 10000);

    // Calculate Maximum Allowable EMI (45% DTI cap)
    const maxAllowableEmiCents = Math.max(0, Math.round(monthlyIncomeCents * 0.45 - existingObligationsCents));

    // Calculate Maximum Eligible Loan Principal from Max Allowable EMI
    let maxEligibleAmountCents;
    if (monthlyRate > 0 && maxAllowableEmiCents > 0) {
      const factor = Math.pow(1 + monthlyRate, tenureMonths);
      maxEligibleAmountCents = Math.round(maxAllowableEmiCents * (factor - 1) / (monthlyRate * factor));
    } else {
      maxEligibleAmountCents = maxAllowableEmiCents * tenureMonths;
    }

    // Bound max eligible amount between product min & max
    maxEligibleAmountCents = Math.min(config.maxAmountCents, Math.max(0, maxEligibleAmountCents));

    // Eligibility decision rules:
    // 1. Requested amount <= max eligible amount
    // 2. DTI <= 45% (4500 bps)
    // 3. Requested amount >= min currency bound
    // 4. Requested amount <= max currency bound
    // 5. Active loan count < 3 (Max cap rule)
    const activeLoanCount = userId ? await db.Loan.count({
      where: { user_id: userId, status: ['ACTIVE', 'PENDING', 'DELINQUENT'] }
    }) : 0;

    const isWithinActiveLoanCap = activeLoanCount < 3;
    const isWithinDtiCap = dtiBps <= 4500;
    const isWithinBounds = requestedAmountCents >= config.minAmountCents && requestedAmountCents <= config.maxAmountCents;
    const isAmountEligible = requestedAmountCents <= maxEligibleAmountCents;

    const eligible = isWithinActiveLoanCap && isWithinDtiCap && isWithinBounds && isAmountEligible;

    let ineligibilityReason = null;
    if (!eligible) {
      if (!isWithinActiveLoanCap) {
        ineligibilityReason = `Maximum active loan limit reached (${activeLoanCount} of 3 loans active). Please complete repayment of existing loans before applying for a new loan.`;
      } else if (!isWithinDtiCap) {
        ineligibilityReason = `Debt-to-Income ratio (${(dtiBps / 100).toFixed(1)}%) exceeds maximum allowable threshold of 45.0%.`;
      } else if (requestedAmountCents < config.minAmountCents) {
        ineligibilityReason = `Requested amount is below minimum limit for ${currency}.`;
      } else if (requestedAmountCents > config.maxAmountCents) {
        ineligibilityReason = `Requested amount exceeds maximum limit of ${config.maxAmountCents / 100} ${currency}.`;
      } else if (!isAmountEligible) {
        ineligibilityReason = `Requested amount exceeds maximum calculated capacity of ${maxEligibleAmountCents / 100} ${currency}.`;
      }
    }

    // Emit Audit Event
    try {
      await db.AuditLog.create({
        user_id: userId || null,
        action: 'LOAN_ELIGIBILITY_CHECKED',
        metadata: {
          currency,
          requestedAmountCents,
          maxAmountCents: maxEligibleAmountCents,
          dtiBps,
          eligible,
          reason: ineligibilityReason,
        },
      });
    } catch (auditErr) {
      logger.warn(`[loanEligibilityService] Failed to record audit log: ${auditErr.message}`);
    }

    return {
      eligible,
      currency,
      requestedAmountCents,
      maxAmountCents: maxEligibleAmountCents,
      estimatedEmiCents,
      totalInterestCents,
      totalRepaymentCents,
      interestRateBps: rateBps,
      tenureMonths,
      dtiBps,
      reason: ineligibilityReason,
    };
  },
};

export default loanEligibilityService;
