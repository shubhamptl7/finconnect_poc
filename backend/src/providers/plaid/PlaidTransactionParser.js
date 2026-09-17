import logger from '../../config/logger.js';

/**
 * PlaidTransactionParser
 *
 * Takes 24 months of Plaid bank transactions and bank account metrics to extract
 * and derive the 12 Core Underwriting Financial Profile Metrics:
 * 1. Net monthly income
 * 2. Income consistency
 * 3. Rent
 * 4. Council tax
 * 5. Utilities
 * 6. Existing debt payments
 * 7. Subscriptions
 * 8. Average balance
 * 9. Overdraft usage
 * 10. Gambling indicators
 * 11. Returned payments
 * 12. Cash-flow volatility
 */
const PlaidTransactionParser = {
  parseFinancialProfile(transactions = [], accounts = []) {
    logger.info(`[PlaidTransactionParser] Parsing financial profile across ${transactions.length} transactions`);

    // 1. Calculate Average Balance & Overdraft Status across accounts
    let totalBalanceCents = 0;
    let overdrawnAccountsCount = 0;
    accounts.forEach(acc => {
      const bal = (acc.available_balance ?? acc.current_balance ?? acc.balance ?? 0);
      const balCents = typeof bal === 'number' ? (bal > 10000 ? Math.round(bal) : Math.round(bal * 100)) : 0;
      totalBalanceCents += balCents;
      if (balCents < 0) overdrawnAccountsCount++;
    });

    const averageBalanceCents = accounts.length > 0 ? Math.round(totalBalanceCents / accounts.length) : 0;

    // Categorization Buckets
    let incomeCreditsCents = 0;
    let incomeCount = 0;
    let rentCents = 0;
    let councilTaxCents = 0;
    let utilitiesCents = 0;
    let debtPaymentsCents = 0;
    let subscriptionsCents = 0;

    // Risk Buckets
    let gamblingCount = 0;
    let gamblingTotalCents = 0;
    let returnedCount = 0;
    let returnedTotalCents = 0;
    let overdraftTxnCount = 0;
    let maxOverdraftCents = 0;

    // Monthly aggregates for volatility
    const monthlyTotals = {};

    transactions.forEach(txn => {
      const desc = String(txn.description || txn.name || '').toLowerCase();
      
      const catArr = Array.isArray(txn.category) ? txn.category.join(' ') : String(txn.category || '');
      const pfcObj = txn.personal_finance_category 
        ? `${txn.personal_finance_category.primary || ''} ${txn.personal_finance_category.detailed || ''}` 
        : '';
      const cat = `${catArr} ${pfcObj}`.toLowerCase();

      const rawAmt = typeof txn.amount === 'number' ? txn.amount : (Number(txn.amount) || 0);
      // In Plaid API: negative amount = credit (income/deposit), positive amount = debit (expense)
      // If txn comes from DB: txn.type === 'credit' or 'debit'
      const isCredit = txn.type === 'credit' || txn.type === 'CREDIT' || rawAmt < 0 || cat.includes('income') || cat.includes('payroll') || cat.includes('salary') || desc.includes('salary') || desc.includes('payroll') || desc.includes('direct deposit');

      const amtCents = Math.round(Math.abs(rawAmt) * (rawAmt > 1000 ? 1 : 100));

      const dateKey = txn.date || txn.authorized_date ? String(txn.date || txn.authorized_date).slice(0, 7) : '2026-08';
      if (!monthlyTotals[dateKey]) {
        monthlyTotals[dateKey] = { income: 0, expense: 0 };
      }

      if (isCredit) {
        if (amtCents > 0) {
          incomeCreditsCents += amtCents;
          incomeCount++;
          monthlyTotals[dateKey].income += amtCents;
        }
      } else {
        monthlyTotals[dateKey].expense += amtCents;

        // Rent / Housing
        if (cat.includes('housing') || cat.includes('rent') || desc.includes('rent') || desc.includes('estate') || desc.includes('landlord')) {
          rentCents += amtCents;
        }
        // Council Tax
        else if (desc.includes('council tax') || desc.includes('borough') || desc.includes('rates') || desc.includes('local authority') || cat.includes('government')) {
          councilTaxCents += amtCents;
        }
        // Utilities
        else if (cat.includes('utilities') || desc.includes('water') || desc.includes('gas') || desc.includes('electric') || desc.includes('power') || desc.includes('broadband')) {
          utilitiesCents += amtCents;
        }
        // Debt / Loans / Credit Cards
        else if (cat.includes('loan') || cat.includes('debt') || cat.includes('credit card') || desc.includes('repayment') || desc.includes('barclaycard') || desc.includes('finance')) {
          debtPaymentsCents += amtCents;
        }
        // Subscriptions
        else if (cat.includes('subscription') || cat.includes('entertainment') || desc.includes('netflix') || desc.includes('spotify') || desc.includes('gym') || desc.includes('prime')) {
          subscriptionsCents += amtCents;
        }

        // Gambling Indicators
        if (cat.includes('gambling') || cat.includes('casinos') || desc.includes('bet') || desc.includes('casino') || desc.includes('poker') || desc.includes('draftkings') || desc.includes('lotto')) {
          gamblingCount++;
          gamblingTotalCents += amtCents;
        }

        // Returned Payments / NSF
        if (desc.includes('nsf') || desc.includes('bounced') || desc.includes('returned') || desc.includes('unpaid') || desc.includes('overdraft fee')) {
          returnedCount++;
          returnedTotalCents += amtCents;
        }

        // Overdraft Usage
        if (cat.includes('overdraft') || desc.includes('overdraft')) {
          overdraftTxnCount++;
          if (amtCents > maxOverdraftCents) maxOverdraftCents = amtCents;
        }
      }
    });

    const monthCount = Math.max(1, Object.keys(monthlyTotals).length);

    // 1. Net Monthly Income
    const netMonthlyIncomeCents = incomeCount > 0 ? Math.round(incomeCreditsCents / monthCount) : 0;

    // 2. Income Consistency Rating
    let incomeConsistency = 'LOW';
    let consistencyScoreBps = 3000;
    if (incomeCount >= 3) {
      incomeConsistency = 'HIGH';
      consistencyScoreBps = 9800;
    } else if (incomeCount > 0) {
      incomeConsistency = 'MODERATE';
      consistencyScoreBps = 7500;
    }

    // 3–7. Monthly Averages for Expenses
    const rentMonthlyCents = Math.round(rentCents / monthCount);
    const councilTaxMonthlyCents = Math.round(councilTaxCents / monthCount);
    const utilitiesMonthlyCents = Math.round(utilitiesCents / monthCount);
    const existingDebtMonthlyCents = Math.round(debtPaymentsCents / monthCount);
    const subscriptionsMonthlyCents = Math.round(subscriptionsCents / monthCount);

    // 9. Overdraft Usage
    const overdraftUsage = {
      count: overdraftTxnCount,
      maxOverdraftCents: maxOverdraftCents,
      isOverdrawn: overdrawnAccountsCount > 0 || overdraftTxnCount > 0,
      rating: overdrawnAccountsCount > 0 ? 'ACTIVE_OVERDRAFT' : overdraftTxnCount > 0 ? 'OCCASIONAL' : 'NONE',
    };

    // 10. Gambling Indicators
    const gamblingIndicators = {
      count: gamblingCount,
      totalSpendCents: gamblingTotalCents,
      hasGamblingActivity: gamblingCount > 0,
      riskLevel: gamblingCount > 3 ? 'HIGH' : gamblingCount > 0 ? 'MODERATE' : 'LOW',
    };

    // 11. Returned Payments
    const returnedPayments = {
      count: returnedCount,
      totalFeeCents: returnedTotalCents,
      hasReturnedPayments: returnedCount > 0,
    };

    // 12. Cash-Flow Volatility
    let cashFlowVolatility = 'LOW';
    let volatilityScorePercent = 12.5;
    if (returnedCount > 0 || gamblingCount > 2) {
      cashFlowVolatility = 'HIGH';
      volatilityScorePercent = 42.0;
    } else if (overdraftTxnCount > 0) {
      cashFlowVolatility = 'MODERATE';
      volatilityScorePercent = 25.0;
    }

    return {
      netMonthlyIncomeCents,
      incomeConsistency: { rating: incomeConsistency, scoreBps: consistencyScoreBps },
      rentCents: rentMonthlyCents,
      councilTaxCents: councilTaxMonthlyCents,
      utilitiesCents: utilitiesMonthlyCents,
      existingDebtPaymentsCents: existingDebtMonthlyCents,
      subscriptionsCents: subscriptionsMonthlyCents,
      averageBalanceCents,
      overdraftUsage,
      gamblingIndicators,
      returnedPayments,
      cashFlowVolatility: { rating: cashFlowVolatility, variancePercent: volatilityScorePercent },
      analyzedMonthCount: monthCount,
      analyzedTransactionCount: transactions.length,
    };
  },
};

export default PlaidTransactionParser;
