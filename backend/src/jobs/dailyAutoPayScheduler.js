import { Op } from 'sequelize';

import logger from '../config/logger.js';
import db from '../models/index.js';
import { loanAutopayService } from '../services/loan/loanAutopayService.js';

/**
 * DAILY AUTOPAY SCHEDULER
 * 
 * This module is intended to be called by a cron library (like node-cron)
 * once per day (e.g., at 01:00 AM server time).
 */
export const dailyAutoPayScheduler = {
  
  async runDailySweeps() {
    logger.info('[DailyAutoPayScheduler] Starting daily AutoPay sweeps...');
    
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Find all PENDING LoanSchedules due today or earlier (overdue)
      const dueSchedules = await db.LoanSchedule.findAll({
        where: {
          due_date: {
            [Op.lte]: today,
          },
          status: 'PENDING'
        },
        include: [
          {
            model: db.Loan,
            as: 'loan',
            where: { status: 'ACTIVE' },
          }
        ]
      });

      if (dueSchedules.length === 0) {
        logger.info('[DailyAutoPayScheduler] No pending EMIs due for active loans today.');
        return { processed: 0, successful: 0, failed: 0 };
      }

      logger.info(`[DailyAutoPayScheduler] Found ${dueSchedules.length} pending EMIs due. Checking for active AutoPay mandates.`);

      let successful = 0;
      let failed = 0;

      // 2. Batch process them
      for (const schedule of dueSchedules) {
        try {
          // Check if this user has an ACTIVE AutoPay mandate for this loan
          const auth = await db.LoanAutopayAuthorization.findOne({
            where: {
              loan_id: schedule.loan_id,
              status: 'ACTIVE'
            }
          });

          if (!auth) {
            // User does not have AutoPay enabled. They must pay manually.
            continue;
          }

          // DEDUPLICATION: Prevent double-debiting if a payment is already in flight for this loan
          const existingPendingPayment = await db.LoanPayment.findOne({
            where: {
              loan_id: schedule.loan_id,
              status: 'PENDING'
            }
          });

          if (existingPendingPayment) {
            logger.info(`[DailyAutoPayScheduler] In-flight payment ${existingPendingPayment.id} already pending for loan ${schedule.loan_id}. Skipping sweep to prevent double-debit.`);
            continue;
          }

          logger.info(`[DailyAutoPayScheduler] Executing Sweep for Loan ${schedule.loan_id}, Amount: ${schedule.scheduled_amount}`);

          // Idempotency key ensures we don't accidentally sweep twice if the cron job restarts on the same day
          const idempotencyKey = `cron_sweep_${schedule.id}_${today}`;

          // Execute the sweep
          await loanAutopayService.executeAutopaySweep(auth, schedule.scheduled_amount, idempotencyKey);
          
          successful++;
        } catch (error) {
          logger.error(`[DailyAutoPayScheduler] Sweep failed for Loan ${schedule.loan_id}:`, error);
          failed++;
        }
      }

      logger.info(`[DailyAutoPayScheduler] Daily sweeps complete. Processed: ${successful}, Failed: ${failed}`);
      return { processed: successful + failed, successful, failed };

    } catch (error) {
      logger.error('[DailyAutoPayScheduler] FATAL ERROR running daily sweeps:', error);
      throw error;
    }
  }
};
