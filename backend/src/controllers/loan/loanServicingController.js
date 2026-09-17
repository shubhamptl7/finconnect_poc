import db from '../../models/index.js';
import { loanScheduleService } from '../../services/loan/loanScheduleService.js';
import { loanAutopayService } from '../../services/loan/loanAutopayService.js';
import { loanPaymentService } from '../../services/loan/loanPaymentService.js';
import { loanReconciliationService } from '../../services/loan/loanReconciliationService.js';
import STATUS_CODES from '../../config/constants.js';
import { successResponse } from '../../utils/response.js';
import logger from '../../config/logger.js';
import AppError from '../../utils/appError.js';

export const getSchedule = async (request, reply) => {
  try {
    const start = performance.now();
    const { id } = request.params; // loan_id
    const schedule = await loanScheduleService.getSchedule(id);
    const end = performance.now();
    logger.info(`[TIMING] getSchedule took ${end - start}ms`);
    
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: schedule,
    });
  } catch (error) {
    logger.error(`getSchedule error: ${error.message}`);
    throw error;
  }
};

export const getUpcomingEmi = async (request, reply) => {
  try {
    const { id } = request.params;
    const upcoming = await loanScheduleService.getUpcomingEmi(id);
    
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: upcoming,
    });
  } catch (error) {
    logger.error(`getUpcomingEmi error: ${error.message}`);
    throw error;
  }
};

export const setupAutopay = async (request, reply) => {
  try {
    const { id } = request.params;
    const { maxMonthlyAmountMinor } = request.body;
    const userId = request.user.id;

    if (!maxMonthlyAmountMinor) {
      throw new AppError('maxMonthlyAmountMinor is required', STATUS_CODES.BAD_REQUEST);
    }

    const result = await loanAutopayService.setupAutopayConsent(userId, id, maxMonthlyAmountMinor);
    
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'VRP Consent generated successfully',
      data: result, // contains consent_id
    });
  } catch (error) {
    logger.error(`setupAutopay error: ${error.message}`);
    throw error;
  }
};

export const activateAutopay = async (request, reply) => {
  try {
    const { consentId } = request.body;
    const userId = request.user.id;

    if (!consentId) {
      throw new AppError('consentId is required', STATUS_CODES.BAD_REQUEST);
    }

    const auth = await loanAutopayService.activateAutopayConsent(userId, consentId);
    
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'AutoPay activated successfully',
      data: auth,
    });
  } catch (error) {
    logger.error(`activateAutopay error: ${error.message}`);
    throw error;
  }
};

export const revokeAutopay = async (request, reply) => {
  try {
    const { id } = request.params; // loan_id
    const userId = request.user.id;

    const result = await loanAutopayService.revokeAutopay(userId, id);
    
    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: result.message,
    });
  } catch (error) {
    logger.error(`revokeAutopay error: ${error.message}`);
    throw error;
  }
};

export const initiateManualPayment = async (request, reply) => {
  try {
    const { id } = request.params; // loan_id
    const { amountMinor, paymentType } = request.body;
    const userId = request.user.id;

    if (!amountMinor) {
      throw new AppError('amountMinor is required', STATUS_CODES.BAD_REQUEST);
    }

    const result = await loanPaymentService.initiateManualPayment(userId, id, amountMinor, paymentType);
    
    // Auto-Simulator for Sandbox: Automatically reconcile the payment after 3 seconds if still PENDING
    setTimeout(async () => {
      try {
        const currentPayment = await db.LoanPayment.findOne({ where: { plaid_transfer_id: result.plaid_payment_id } });
        if (currentPayment && currentPayment.status === 'PENDING') {
          logger.info(`[Sandbox Auto-Simulator] Triggering processSettledPayment for ${result.plaid_payment_id}`);
          await loanReconciliationService.processSettledPayment(result.plaid_payment_id);
        } else {
          logger.info(`[Sandbox Auto-Simulator] Payment ${result.plaid_payment_id} status is '${currentPayment?.status}'. Skipping auto-settlement.`);
        }
      } catch (e) {
        logger.error(`[Sandbox Auto-Simulator] Failed to auto-settle payment: ${e.message}`);
      }
    }, 3000);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Manual payment intent created and auto-settlement scheduled',
      data: result, // contains plaid_payment_id
    });
  } catch (error) {
    logger.error(`initiateManualPayment error: ${error.message}`);
    throw error;
  }
};
