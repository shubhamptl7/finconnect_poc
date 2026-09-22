import { createHash } from 'crypto';

import logger from '../../config/logger.js';
import db from '../../models/index.js';

import { loanReconciliationService } from './loanReconciliationService.js';

export const loanWebhookService = {
  /**
   * Processes an incoming webhook from Plaid Payment Initiation.
   * Ensures idempotency to prevent duplicate reconciliations.
   *
   * @param {Object} payload - The raw JSON body of the webhook
   */
  async processPlaidWebhook(payload) {
    logger.info(`[LoanWebhookService] Received Plaid webhook: ${payload.webhook_type} - ${payload.webhook_code}`);

    // Generate a hash of the payload to track exactly what we received
    const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    
    // Most Plaid webhooks include a payment_id or consent_id
    const externalId = payload.payment_id || payload.consent_id || payload.new_webhook_url || 'unknown';

    // 1. Idempotency Check
    const [webhookEvent, created] = await db.LoanWebhookEvent.findOrCreate({
      where: {
        provider: 'PLAID',
        external_event_id: `${payload.webhook_code}_${externalId}`,
      },
      defaults: {
        event_type: payload.webhook_code,
        payload_hash: payloadHash,
        processing_status: 'RECEIVED',
        received_at: new Date(),
      }
    });

    if (!created && webhookEvent.processing_status === 'PROCESSED') {
      logger.info(`[LoanWebhookService] Idempotent hit. Webhook ${webhookEvent.external_event_id} already processed.`);
      return { status: 'ignored', reason: 'already_processed' };
    }

    try {
      webhookEvent.processing_status = 'PROCESSING';
      await webhookEvent.save();

      // 2. Route the webhook based on code
      if (payload.webhook_type === 'PAYMENT_INITIATION') {
        switch (payload.webhook_code) {
          case 'PAYMENT_STATUS_UPDATE':
            await this._handlePaymentStatusUpdate(payload.payment_id, payload.new_payment_status, payload.error);
            break;
            
          case 'CONSENT_STATUS_UPDATE':
            // E.g., user revoked it or it expired
            await this._handleConsentStatusUpdate(payload.consent_id, payload.new_consent_status);
            break;
            
          default:
            logger.info(`[LoanWebhookService] Unhandled Plaid Webhook Code: ${payload.webhook_code}`);
        }
      }

      webhookEvent.processing_status = 'PROCESSED';
      webhookEvent.processed_at = new Date();
      await webhookEvent.save();

      return { status: 'success' };
    } catch (error) {
      logger.error(`[LoanWebhookService] Failed to process webhook ${webhookEvent.external_event_id}`, error);
      webhookEvent.processing_status = 'FAILED';
      webhookEvent.error_message = error.message;
      await webhookEvent.save();
      throw error;
    }
  },

  async _handlePaymentStatusUpdate(paymentId, newStatus, errorObj) {
    if (newStatus === 'PAYMENT_STATUS_COMPLETED' || newStatus === 'PAYMENT_STATUS_EXECUTED') {
      // Payment landed! Trigger the simulated Treasury Bridge to move it to Column.
      await loanReconciliationService.processSettledPayment(paymentId);
    } 
    else if (newStatus === 'PAYMENT_STATUS_REJECTED' || newStatus === 'PAYMENT_STATUS_FAILED') {
      // Payment failed (e.g. NSF)
      const errorCode = errorObj ? errorObj.error_code : 'UNKNOWN_FAILURE';
      await loanReconciliationService.processFailedPayment(paymentId, errorCode);
    }
  },

  async _handleConsentStatusUpdate(consentId, newStatus) {
    if (newStatus === 'REVOKED' || newStatus === 'EXPIRED') {
      logger.warn(`[LoanWebhookService] Plaid VRP Consent ${consentId} was ${newStatus}. Canceling AutoPay.`);
      
      const auth = await db.LoanAutopayAuthorization.findOne({
        where: { plaid_authorization_id: consentId, status: 'ACTIVE' }
      });

      if (auth) {
        auth.status = 'CANCELLED';
        auth.cancelled_at = new Date();
        await auth.save();
        
        // Notify the user their AutoPay was disabled
        logger.info(`[Notification Simulation] Sent SMS to user ${auth.user_id}: "Your AutoPay was disabled because your bank consent was revoked."`);
      }
    }
  }
};
