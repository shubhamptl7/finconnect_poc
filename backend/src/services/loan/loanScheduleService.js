import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import logger from '../../config/logger.js';

export const loanScheduleService = {
  /**
   * Generates a standard amortization schedule and saves it to the database.
   * This operates entirely in integer minor units (e.g. pence).
   *
   * @param {string} loanId 
   * @param {number} principalMinor - Total principal in minor units (e.g., 500000 for £5k)
   * @param {number} termMonths - e.g., 12
   * @param {number} aprBps - Annual Percentage Rate in basis points (e.g., 500 = 5.00%)
   * @param {Date} startDate - When the first payment is due
   */
  async generateAmortizationSchedule(loanId, principalMinor, termMonths, aprBps, startDateInput = new Date()) {
    logger.info(`[LoanScheduleService] Generating schedule for loan ${loanId} - Principal: ${principalMinor}`);

    const principalNum = Number(principalMinor);
    const termNum = Number(termMonths);
    const aprNum = Number(aprBps);
    const startDate = (startDateInput && !isNaN(new Date(startDateInput).getTime())) ? new Date(startDateInput) : new Date();

    const monthlyRate = (aprNum / 10000) / 12; // e.g. 0.05 / 12
    let emiMinor = 0;

    if (monthlyRate === 0) {
      emiMinor = Math.round(principalNum / termNum);
    } else {
      // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
      const mathPow = Math.pow(1 + monthlyRate, termNum);
      emiMinor = Math.round((principalNum * monthlyRate * mathPow) / (mathPow - 1));
    }

    let remainingPrincipal = principalNum;
    const schedules = [];
    
    // First payment is due 1 month from today
    let currentDueDate = new Date(startDate);

    for (let i = 1; i <= termNum; i++) {
      let nextMonthDate = new Date(startDate);
      nextMonthDate.setMonth(startDate.getMonth() + i);
      
      // Handle end-of-month overflow (e.g., Jan 31 -> Mar 3 -> Feb 28)
      if (nextMonthDate.getMonth() !== ((startDate.getMonth() + i) % 12)) {
        nextMonthDate.setDate(0); 
      }
      currentDueDate = nextMonthDate;

      // Interest for this month: remaining principal * monthly rate
      const interestThisMonth = Math.round(remainingPrincipal * monthlyRate);
      
      let principalThisMonth = emiMinor - interestThisMonth;
      let scheduledAmountThisMonth = emiMinor;

      // Adjust the final month for rounding differences
      if (i === termMonths) {
        principalThisMonth = remainingPrincipal;
        scheduledAmountThisMonth = principalThisMonth + interestThisMonth;
      }

      remainingPrincipal -= principalThisMonth;

      schedules.push({
        loan_id: loanId,
        installment_number: i,
        due_date: currentDueDate.toISOString().split('T')[0],
        scheduled_amount: scheduledAmountThisMonth,
        scheduled_principal: principalThisMonth,
        scheduled_interest: interestThisMonth,
        paid_amount: 0,
        paid_principal: 0,
        paid_interest: 0,
        status: 'PENDING',
      });
    }

    await db.LoanSchedule.bulkCreate(schedules);
    logger.info(`[LoanScheduleService] Saved ${termMonths} installments for loan ${loanId}`);
    return schedules;
  },

  /**
   * Gets the upcoming (next due) EMI for a loan.
   *
   * @param {string} loanId 
   * @returns {Promise<Object|null>} The next pending schedule
   */
  async getUpcomingEmi(loanId) {
    const nextEmi = await db.LoanSchedule.findOne({
      where: {
        loan_id: loanId,
        status: 'PENDING',
      },
      order: [['installment_number', 'ASC']],
    });

    return nextEmi;
  },
  
  /**
   * Retrieves the full schedule for a loan.
   */
  async getSchedule(loanId) {
    return await db.LoanSchedule.findAll({
      where: { loan_id: loanId },
      order: [['installment_number', 'ASC']],
    });
  }
};
