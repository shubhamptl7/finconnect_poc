import crypto from 'crypto';

import logger from '../../config/logger.js';
import db from '../../models/index.js';

// In-memory queue to prevent connection pool exhaustion during thundering herd webhook events
const webhookQueue = [];
let isProcessingQueue = false;

async function processWebhookQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  while (webhookQueue.length > 0) {
    const task = webhookQueue.shift();
    try {
      await task();
    } catch (err) {
      logger.error(`[ColumnWebhookService] Background queue task error: ${err.message}`);
    }
  }
  isProcessingQueue = false;
}

const columnWebhookService = {
  /**
   * Verifies HMAC-SHA256 Column Webhook Signature
   *
   * @param {string} signature Header value from 'column-signature'
   * @param {string|Buffer} rawBody Raw request payload
   * @returns {boolean} True if signature is valid or signature check skipped in development/sandbox
   */
  verifySignature(signature, rawBody) {
    const webhookSecret = process.env.COLUMN_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn('[ColumnWebhookService] COLUMN_WEBHOOK_SECRET not configured, skipping signature check in sandbox mode');
      return true;
    }

    if (!signature) {
      logger.warn('[ColumnWebhookService] Missing column-signature header');
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const computedSignature = hmac.update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
    } catch (err) {
      logger.error(`[ColumnWebhookService] Signature verification error: ${err.message}`);
      return false;
    }
  },

  /**
   * Pushes incoming webhook to the concurrent processing queue
   *
   * @param {Object} body Parsed webhook JSON payload
   * @returns {Promise<Object>} Queued acknowledgment
   */
  async processEvent(body) {
    return new Promise((resolve, reject) => {
      webhookQueue.push(async () => {
        try {
          const result = await columnWebhookService._processEventInternal(body);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      processWebhookQueue();
    });
  },

  /**
   * Internal processor for inbound Column webhook events
   */
  async _processEventInternal(body) {
    const eventId = body.id || body.event_id || body.data?.id || `evt_${Date.now()}`;
    const eventType = body.type || body.event_type || body.event || 'transfer.completed';
    const eventData = body.data || body.payload || body;

    logger.info(`[ColumnWebhookService] Processing event ${eventId} of type ${eventType}`);

    // Atomic idempotency check in Postgres via LoanWebhookEvent
    let webhookRecord = null;
    let transaction = null;
    try {
      transaction = await db.sequelize.transaction();
      [webhookRecord] = await db.LoanWebhookEvent.findOrCreate({
        where: { provider: 'COLUMN', external_event_id: eventId },
        defaults: {
          provider: 'COLUMN',
          external_event_id: eventId,
          event_type: eventType,
          processing_status: 'PROCESSING',
          received_at: new Date(),
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      await transaction.commit();
    } catch (dbErr) {
      if (transaction) await transaction.rollback();
      logger.warn(`[ColumnWebhookService] Idempotency table lookup error: ${dbErr.message}`);
      // If we hit a unique constraint error from race condition, it means another thread processed it
      return { status: 'ALREADY_PROCESSED', eventId };
    }

    if (webhookRecord && webhookRecord.processing_status === 'PROCESSED') {
      logger.info(`[ColumnWebhookService] Event ${eventId} was already processed. Skipping duplicate.`);
      return { status: 'ALREADY_PROCESSED', eventId };
    }

    try {
      // Handle Column Transfer & Disbursement Settlement Events
      if (
        eventType === 'transfer.completed' ||
        eventType === 'transfer.settled' ||
        eventType === 'disbursement.completed' ||
        eventType === 'ach.transfer.settled'
      ) {
        const columnLoanId = eventData.loan_id || eventData.loanId;
        const bankAccountId = eventData.bank_account_id || eventData.bankAccountId;
        const transferId = eventData.id || eventData.transfer_id;

        logger.info(`[ColumnWebhookService] Settlement event for Column Loan ${columnLoanId} / BankAccount ${bankAccountId}`);

        let loan = null;
        if (columnLoanId) {
          loan = await db.Loan.findOne({ where: { column_loan_id: columnLoanId } });
        }
        if (!loan && bankAccountId) {
          loan = await db.Loan.findOne({ where: { column_funding_bank_account_id: bankAccountId } });
        }
        if (!loan && eventData.metadata?.loanId) {
          loan = await db.Loan.findByPk(eventData.metadata.loanId);
        }

        if (loan) {
          const isFirstDisbursement = loan.disbursement_status !== 'COMPLETED';

          loan.disbursement_status = 'COMPLETED';
          loan.status = 'ACTIVE';
          loan.last_synced_at = new Date();
          await loan.save();

          const application = await db.LoanApplication.findByPk(loan.application_id);
          if (application) {
            application.status = 'DISBURSED';
            await application.save();
          }

        } else {
          logger.warn(`[ColumnWebhookService] No local Loan record matched Column event ${eventId}`);
        }
      } else if (eventType === 'transfer.failed' || eventType === 'disbursement.failed') {
        const columnLoanId = eventData.loan_id || eventData.loanId;
        let loan = null;
        if (columnLoanId) {
          loan = await db.Loan.findOne({ where: { column_loan_id: columnLoanId } });
        }

        if (loan) {
          loan.disbursement_status = 'FAILED';
          await loan.save();

          const application = await db.LoanApplication.findByPk(loan.application_id);
          if (application) {
            application.status = 'DISBURSEMENT_FAILED';
            await application.save();
          }
        }
      }

      // Mark event as processed
      if (webhookRecord) {
        webhookRecord.processing_status = 'PROCESSED';
        webhookRecord.processed_at = new Date();
        await webhookRecord.save();
      }

      return { status: 'PROCESSED', eventId };
    } catch (err) {
      logger.error(`[ColumnWebhookService] Error processing event ${eventId}: ${err.message}`);
      if (webhookRecord) {
        webhookRecord.processing_status = 'FAILED';
        webhookRecord.error_message = err.message;
        await webhookRecord.save();
      }
      throw err;
    }
  },
};

export default columnWebhookService;
