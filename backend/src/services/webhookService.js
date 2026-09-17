import { Op } from 'sequelize';

import db from '../models/index.js';
import logger from '../config/logger.js';
import { generateSearchHash, eciesEncrypt } from '../utils/encryption.js';
import Money from '../utils/money.js';

const webhookService = {
  async processPlaidWebhook(payload) {
    logger.info(`Processing Plaid Webhook: ${payload.webhook_type} - ${payload.webhook_code}`);

    // 1. Handle Payment Status Updates
    if (payload.webhook_type === 'PAYMENT_INITIATION') {
      if (payload.webhook_code === 'PAYMENT_STATUS_UPDATE') {
        const paymentId = payload.payment_id;
        const newStatus = payload.new_payment_status; // e.g., PAYMENT_STATUS_EXECUTED

        // SECURITY FIX: Wrap the entire status check + settlement in a single transaction
        // with a row-level lock (SELECT FOR UPDATE). This prevents duplicate webhooks from
        // triggering double settlement (double debit + double P2P credit).
        await db.sequelize.transaction(async (lockTxn) => {
          const payment = await db.Payment.findOne({
            where: { provider_reference_hash: generateSearchHash(paymentId) },
            lock: true,         // SELECT FOR UPDATE — blocks concurrent transactions on payment row
            transaction: lockTxn,
          });

          if (!payment) {
            logger.warn(`Received webhook for unknown payment_id: ${paymentId}`);
            return;
          }

          let internalStatus;
          if (newStatus === 'PAYMENT_STATUS_EXECUTED' || newStatus === 'PAYMENT_STATUS_SETTLED') {
            internalStatus = 'settled';
          } else if (
            newStatus === 'PAYMENT_STATUS_FAILED' ||
            newStatus === 'PAYMENT_STATUS_REJECTED'
          ) {
            internalStatus = 'failed';
          } else if (newStatus === 'PAYMENT_STATUS_CANCELLED') {
            internalStatus = 'cancelled';
          } else {
            internalStatus = 'pending';
          }

          const oldStatus = payment.status;

          // IDEMPOTENCY: if already settled, skip silently — this is a retry/duplicate webhook
          if (internalStatus === 'settled' && oldStatus === 'settled') {
            logger.info(`[Webhook] Payment ${payment.id} already settled — skipping duplicate webhook`);
            return;
          }

          payment.status = internalStatus;
          await payment.save({ transaction: lockTxn });

          // Audit log for payment status update (within same transaction)
          await db.AuditLog.create({
            user_id: payment.user_id,
            action: 'payment_status_updated',
            metadata: {
              payment_id: payment.id,
              provider_reference: paymentId,
              old_status: oldStatus,
              new_status: internalStatus,
              raw_webhook_status: newStatus,
            },
          }, { transaction: lockTxn });

          logger.info(
            `Updated Payment ${payment.id} status from ${oldStatus} to ${internalStatus}`
          );

          // If the payment just successfully executed, settle it (debit sender, credit recipient P2P)
          // Done AFTER the lock is committed to avoid nested transaction issues
          if (internalStatus === 'settled' && oldStatus !== 'settled' && payment.account_id) {
            // Store for settlement after transaction commits
            this._pendingSettlement = payment;
          }
        });

        // Run settlement OUTSIDE the lock transaction (it manages its own transaction internally)
        if (this._pendingSettlement) {
          const paymentToSettle = this._pendingSettlement;
          this._pendingSettlement = null;
          try {
            await this._settlePayment(paymentToSettle);
          } catch (settleError) {
            logger.error(
              `[Webhook] Settlement processing failed for payment ${paymentToSettle.id}: ${settleError.message}`
            );
            // Revert payment status to settlement_failed so retries can re-attempt ledger updates
            await db.Payment.update(
              { status: 'settlement_failed' },
              { where: { id: paymentToSettle.id } }
            );
          }
        }
      }
    }

    // 2. Handle Transaction Updates
    if (payload.webhook_type === 'TRANSACTIONS') {
      if (
        payload.webhook_code === 'SYNC_UPDATES_AVAILABLE' ||
        payload.webhook_code === 'INITIAL_UPDATE'
      ) {
        const itemId = payload.item_id;

        await db.AuditLog.create({
          action: 'transactions_sync_available',
          user_id: null, // webhook from Plaid is not user-specific
          metadata: { item_id: itemId, webhook_code: payload.webhook_code },
        });

        logger.info(`Transactions ready to sync for Item ID: ${itemId}`);
      }
    }

    return true;
  },

  /**
   * Settles a payment by:
   * 1. Writing a debit transaction to the sender's ledger.
   * 2. Decrementing the sender's balance.
   * 3. (P2P Engine) Checking if the recipient's IBAN belongs to another FinConnect user.
   *    If so, incrementing their balance and injecting a credit transaction for them.
   *
   * WHY THIS WORKS:
   * The recipient_iban is stored on the Payment when it is created.
   * We query bank_accounts by iban to find the internal recipient.
   * This creates a seamless internal transfer without needing any external webhooks
   * from the recipient's side, because both accounts are in our database.
   */
  async _settlePayment(payment) {
    const t = await db.sequelize.transaction();
    try {
      // Re-fetch sender user to get fresh e2ee_public_key
      const senderUser = await db.User.findByPk(payment.user_id, { transaction: t });
      const senderPublicKey = senderUser?.e2ee_public_key;

      // Guard: if amount is null (already settled?), abort gracefully
      if (payment.amount === null || payment.amount === undefined) {
        logger.warn(`[Ledger] Payment ${payment.id} has no amount — skipping settlement (may already be settled).`);
        await t.rollback();
        return;
      }

      const description =
        payment.note ||
        `Transfer to ${payment.recipient_name || payment.beneficiary?.name || 'Beneficiary'}`;

      const amountPence = Number(payment.amount || 0);
      const money = Money.fromPence(amountPence);
      const amountMajorStr = money.toPounds().toFixed(2);

      const descriptionEnc = senderPublicKey ? eciesEncrypt(senderPublicKey, description, 'finconnect-txn-desc-v1') : null;
      const amountEnc = senderPublicKey ? eciesEncrypt(senderPublicKey, amountMajorStr, 'finconnect-txn-amt-v1') : null;

      // 1. Debit transaction for sender
      await db.Transaction.upsert(
        {
          external_transaction_id: `pmt_${payment.provider_reference || payment.id}`,
          account_id: payment.account_id,
          type: 'debit',
          currency: 'GBP',
          status: 'settled',
          category: 'Transfer',
          description_encrypted: descriptionEnc,
          amount_encrypted: amountEnc,
          transaction_date: new Date(),
        },
        { transaction: t }
      );

      // 2. Decrement sender balance in integer pence
      await db.BankAccount.decrement(['current_balance', 'available_balance'], {
        by: amountPence,
        where: { id: payment.account_id },
        transaction: t,
      });

      logger.info(`[Ledger] Sender debit written for Payment ${payment.id}`);

      // 3. P2P Engine
      // Look up by IBAN or BACS
      let recipientAccount = null;

      if (payment.recipient_iban) {
        const normalizedIban = payment.recipient_iban.replace(/\s/g, '').toUpperCase();
        recipientAccount = await db.BankAccount.findOne({
          where: {
            iban_hash: generateSearchHash(normalizedIban),
            user_id: { [Op.ne]: payment.user_id },
          },
          transaction: t,
        });
      } else if (payment.recipient_bacs_account && payment.recipient_sort_code) {
        const normalizedBacs = payment.recipient_bacs_account.replace(/\s|-/g, '');
        const normalizedSortCode = payment.recipient_sort_code.replace(/\s|-/g, '');
        recipientAccount = await db.BankAccount.findOne({
          where: {
            bacs_account_hash: generateSearchHash(normalizedBacs),
            sort_code_hash: generateSearchHash(normalizedSortCode),
            user_id: { [Op.ne]: payment.user_id },
          },
          transaction: t,
        });
      }

      if (recipientAccount) {
        logger.info(
          `[P2P] Recipient found! Account ${recipientAccount.id} belongs to User ${recipientAccount.user_id}`
        );

        // 3a. Credit the recipient's balance in integer pence
        await db.BankAccount.increment(['current_balance', 'available_balance'], {
          by: amountPence,
          where: { id: recipientAccount.id },
          transaction: t,
        });

        const recipientUser = await db.User.findByPk(recipientAccount.user_id, { transaction: t });
        const recipientPublicKey = recipientUser?.e2ee_public_key;

        const creditDescription = payment.note
          ? `Transfer from ${senderUser?.name || 'FinConnect User'} - ${payment.note}`
          : `Transfer from ${senderUser?.name || 'FinConnect User'}`;

        const creditDescEnc = recipientPublicKey ? eciesEncrypt(recipientPublicKey, creditDescription, 'finconnect-txn-desc-v1') : null;
        const creditAmountEnc = recipientPublicKey ? eciesEncrypt(recipientPublicKey, amountMajorStr, 'finconnect-txn-amt-v1') : null;

        // 3b. Inject a credit transaction into the recipient's feed
        await db.Transaction.upsert(
          {
            external_transaction_id: `p2p_credit_${payment.id}`,
            account_id: recipientAccount.id,
            type: 'credit',
            currency: 'GBP',
            status: 'settled',
            category: 'Transfer',
            description_encrypted: creditDescEnc,
            amount_encrypted: creditAmountEnc,
            transaction_date: new Date(),
          },
          { transaction: t }
        );

        // 3c. Mark the payment as internal
        await payment.update({ is_internal: true }, { transaction: t });

        // 3d. Notification for the recipient
        const { default: notificationService } = await import('./notificationService.js');
        await notificationService.createNotification(
          {
            user_id: recipientAccount.user_id,
            title: 'Money Received!',
            message: `You received ${money.toFormatted()} from ${senderUser?.name || 'a FinConnect user'}.`,
            type: 'transaction'
          },
          { transaction: t }
        ).catch(() => { }); // Non-fatal


        logger.info(
          `[P2P] Internal transfer complete: ${amountPence} pence credited to Account ${recipientAccount.id}`
        );
      } else {
        logger.info(`[P2P] No internal recipient found — external transfer only.`);
      }

      // 4. Encrypt payment fields to close the plaintext processing window
      const pmtAmountEnc = senderPublicKey ? eciesEncrypt(senderPublicKey, amountMajorStr, 'finconnect-pmt-amt-v1') : null;
      const pmtNoteEnc = senderPublicKey ? eciesEncrypt(senderPublicKey, payment.note || '', 'finconnect-pmt-note-v1') : null;
      const pmtRecipientNameEnc = senderPublicKey ? eciesEncrypt(senderPublicKey, payment.recipient_name || '', 'finconnect-pmt-rname-v1') : null;

      await payment.update({
        amount: null,
        note: null,
        recipient_name: null,
        amount_encrypted: pmtAmountEnc,
        note_encrypted: pmtNoteEnc,
        recipient_name_encrypted: pmtRecipientNameEnc
      }, { transaction: t });

      await t.commit();
      logger.info(`Payment ${payment.id} fully settled and encrypted.`);
    } catch (err) {
      await t.rollback();
      logger.error(`Failed to settle Payment ${payment.id}: ${err.message}`);
      throw err;
    }
  },
};

export default webhookService;
