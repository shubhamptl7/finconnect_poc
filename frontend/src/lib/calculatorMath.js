/**
 * Financial Math Utility Engine
 * Pure client-side calculations based on global banking standard formulas:
 * 1. Reducing Balance EMI Amortization: E = [P * r * (1+r)^n] / [(1+r)^n - 1]
 * 2. FOIR (Fixed Obligation to Income Ratio) Eligibility: Max EMI = (Income * 50%) - Existing Expenses
 */

/**
 * Calculates standard reducing-balance EMI, total interest, and total repayment amount.
 * @param {number} principal - Loan principal amount (e.g. 10000)
 * @param {number} annualRatePercent - Annual interest rate percentage (e.g. 9.5)
 * @param {number} tenureMonths - Loan tenure in months (e.g. 24)
 * @returns {object} { emi, rawEmi, totalInterest, totalPayment, monthlyRate }
 */
export function calculateEmi(principal, annualRatePercent, tenureMonths) {
  const p = Number(principal) || 0;
  const rate = Number(annualRatePercent) || 0;
  const n = Number(tenureMonths) || 0;

  if (p <= 0 || rate <= 0 || n <= 0) {
    return {
      emi: 0,
      rawEmi: 0,
      totalInterest: 0,
      totalPayment: 0,
      monthlyRate: 0,
      principal: p,
      tenureMonths: n,
    };
  }

  const monthlyRate = rate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, n);
  const rawEmi = (p * monthlyRate * factor) / (factor - 1);
  const totalPayment = rawEmi * n;
  const totalInterest = totalPayment - p;

  return {
    emi: Math.round(rawEmi),
    rawEmi,
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    monthlyRate,
    principal: p,
    tenureMonths: n,
  };
}

/**
 * Generates exact month-by-month amortization schedule breakdown using reducing balance method.
 * @param {number} principal 
 * @param {number} annualRatePercent 
 * @param {number} tenureMonths 
 * @returns {Array<object>} Monthly breakdown array
 */
export function generateAmortizationSchedule(principal, annualRatePercent, tenureMonths) {
  const p = Number(principal) || 0;
  const rate = Number(annualRatePercent) || 0;
  const n = Number(tenureMonths) || 0;

  if (p <= 0 || rate <= 0 || n <= 0) return [];

  const { rawEmi, monthlyRate } = calculateEmi(p, rate, n);
  const schedule = [];
  let balance = p;

  for (let month = 1; month <= n; month++) {
    const interestPaid = balance * monthlyRate;
    let principalPaid = rawEmi - interestPaid;

    if (month === n) {
      principalPaid = balance;
    }

    const beginningBalance = balance;
    balance = Math.max(0, balance - principalPaid);

    schedule.push({
      month,
      beginningBalance: Math.round(beginningBalance),
      emi: Math.round(rawEmi),
      principalPaid: Math.round(principalPaid),
      interestPaid: Math.round(interestPaid),
      endingBalance: Math.round(balance),
    });
  }

  return schedule;
}

/**
 * Calculates max eligible loan principal & EMI based on standard 50% FOIR (Fixed Obligation to Income Ratio) cap.
 * @param {number} monthlyIncome 
 * @param {number} existingObligations 
 * @param {number} tenureMonths 
 * @param {number} annualRatePercent 
 * @returns {object} { maxEligibleAmount, maxAllowedEmi, status }
 */
export function calculateEligibility(monthlyIncome, existingObligations, tenureMonths, annualRatePercent = 9.5) {
  const income = Number(monthlyIncome) || 0;
  const obligations = Number(existingObligations) || 0;
  const n = Number(tenureMonths) || 24;
  const rate = Number(annualRatePercent) || 9.5;

  const foirCap = 0.50; // 50% global banking norm for personal loans
  const maxMonthlyEmiCapacity = Math.max(0, income * foirCap - obligations);

  const monthlyRate = rate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, n);
  const maxPrincipal =
    monthlyRate > 0
      ? (maxMonthlyEmiCapacity * (factor - 1)) / (monthlyRate * factor)
      : maxMonthlyEmiCapacity * n;

  const obligationRatio = income > 0 ? (obligations / income) * 100 : 0;

  let status = 'HIGH';
  if (obligationRatio > 50 || maxMonthlyEmiCapacity <= 0) {
    status = 'LOW';
  } else if (obligationRatio > 35) {
    status = 'MODERATE';
  }

  return {
    maxEligibleAmount: Math.max(0, Math.round(maxPrincipal)),
    maxAllowedEmi: Math.round(maxMonthlyEmiCapacity),
    status,
    income,
    obligations,
  };
}

/**
 * Currency-specific range configurations, defaults, and number formatting rules
 */
export const CURRENCY_CONFIGS = {
  GBP: {
    code: 'GBP',
    symbol: '£',
    locale: 'en-GB',
    principal: { min: 500, max: 50000, step: 100, default: 10000, mid: 25000 },
    income: { min: 500, max: 25000, step: 100, default: 4500, mid: 12500 },
    obligations: { min: 0, max: 10000, step: 50, default: 600, mid: 5000 },
  },
  OMR: {
    code: 'OMR',
    symbol: 'OMR ',
    locale: 'en-US',
    principal: { min: 500, max: 50000, step: 100, default: 10000, mid: 25000 },
    income: { min: 500, max: 25000, step: 100, default: 4500, mid: 12500 },
    obligations: { min: 0, max: 10000, step: 50, default: 600, mid: 5000 },
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    principal: { min: 1000, max: 100000, step: 500, default: 25000, mid: 50000 },
    income: { min: 1000, max: 50000, step: 250, default: 7500, mid: 25000 },
    obligations: { min: 0, max: 20000, step: 100, default: 1200, mid: 10000 },
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    principal: { min: 50000, max: 5000000, step: 10000, default: 500000, mid: 2500000 },
    income: { min: 20000, max: 500000, step: 5000, default: 80000, mid: 250000 },
    obligations: { min: 0, max: 200000, step: 1000, default: 15000, mid: 100000 },
  },
}

export function getCurrencyConfig(currency) {
  return CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.GBP
}

/**
 * Helper to get proper currency symbol based on selected currency code
 * @param {string} currency - 'OMR' | 'USD' | 'INR'
 * @returns {string} Currency symbol ('OMR', '$', '₹')
 */
export function getCurrencySymbol(currency) {
  return getCurrencyConfig(currency).symbol
}

/**
 * Formats monetary amounts with proper currency symbol prefix/spacing and locale formatting
 * @param {number} amount 
 * @param {string} currency - 'OMR' | 'USD' | 'INR'
 * @returns {string} Formatted string e.g. '$10,000', '₹5,00,000', 'OMR 10,000'
 */
export function formatAmount(amount, currency) {
  const config = getCurrencyConfig(currency)
  const num = Math.round(Number(amount) || 0)
  const numStr = num.toLocaleString(config.locale)
  if (currency === 'OMR') {
    return `OMR ${numStr}`
  }
  return `${config.symbol}${numStr}`
}

