import { Op } from 'sequelize';

import db from '../models/index.js';
import logger from '../config/logger.js';
import { generateSearchHash } from '../utils/encryption.js';

class WebhookService {
  async processPlaidWebhook(payload) {
    logger.info(`Processing Plaid Webhook: ${payload.webhook_type} - ${payload.webhook_code}`);

    // 1. Handle Payment Status Updates
    if (payload.webhook_type === 'PAYMENT_INITIATION') {
      if (payload.webhook_code === 'PAYMENT_STATUS_UPDATE') {
        const paymentId = payload.payment_id;
        const newStatus = payload.new_payment_status; // e.g., PAYMENT_STATUS_EXECUTED

        const payment = await db.Payment.findOne({
          where: { provider_reference_hash: generateSearchHash(paymentId) },
          include: [
            { model: db.Beneficiary, as: 'beneficiary' },
            { model: db.User, as: 'user' }
          ],
        });

        if (payment) {
          let internalStatus = 'pending';
          if (newStatus === 'PAYMENT_STATUS_EXECUTED' || newStatus === 'PAYMENT_STATUS_SETTLED') {
            internalStatus = 'settled';
          } else if (
            newStatus === 'PAYMENT_STATUS_FAILED' ||
            newStatus === 'PAYMENT_STATUS_REJECTED'
          ) {
            internalStatus = 'failed';
          } else if (newStatus === 'PAYMENT_STATUS_CANCELLED') {
            internalStatus = 'cancelled';
          }

          const oldStatus = payment.status;
          payment.status = internalStatus;
          await payment.save();

          // If the payment just successfully executed, write to ledger and handle P2P
          if (internalStatus === 'settled' && oldStatus !== 'settled' && payment.account_id) {
            await this._settlePayment(payment);
          }

          // Audit log for payment status update
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
          });

          logger.info(
            `Updated Payment ${payment.id} status from ${oldStatus} to ${internalStatus}`
          );
        } else {
          logger.warn(`Received webhook for unknown payment_id: ${paymentId}`);
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
          metadata: { item_id: itemId, webhook_code: payload.webhook_code },
        });

        logger.info(`Transactions ready to sync for Item ID: ${itemId}`);
      }
    }

    return true;
  }

  /**
   * Settles a payment by:
   * 1. Writing a debit transaction to the sender's ledger.
   * 2. Decrementing the sender's balance.
   * 3. (P2P Engine) Checking if the recipient's IBAN belongs to another PayOman user.
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
      const description =
        payment.note ||
        `Transfer to ${payment.recipient_name || payment.beneficiary?.name || 'Beneficiary'}`;

      // 1. Debit transaction for sender
      await db.Transaction.upsert(
        {
          external_transaction_id: `pmt_${payment.provider_reference || payment.id}`,
          account_id: payment.account_id,
          type: 'debit',
          amount: payment.amount,
          currency: 'GBP',
          status: 'settled',
          category: 'Transfer',
          description,
          transaction_date: new Date(),
        },
        { transaction: t }
      );

      // 2. Decrement sender balance
      await db.BankAccount.decrement(['current_balance', 'available_balance'], {
        by: payment.amount,
        where: { id: payment.account_id },
        transaction: t,
      });

      logger.info(`[Ledger] Sender debit written for Payment ${payment.id}`);

      // 3. ── P2P Engine ──────────────────────────────────────────────
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

        // 3a. Credit the recipient's balance
        await db.BankAccount.increment(['current_balance', 'available_balance'], {
          by: payment.amount,
          where: { id: recipientAccount.id },
          transaction: t,
        });

        // 3b. Inject a credit transaction into the recipient's feed
        await db.Transaction.upsert(
          {
            external_transaction_id: `p2p_credit_${payment.id}`,
            account_id: recipientAccount.id,
            type: 'credit',
            amount: payment.amount,
            currency: 'GBP',
            status: 'settled',
            category: 'Transfer',
            description: payment.note 
              ? `Transfer from ${payment.user?.name || 'PayOman User'} - ${payment.note}`
              : `Transfer from ${payment.user?.name || 'PayOman User'}`,
            transaction_date: new Date(),
          },
          { transaction: t }
        );

        // 3c. Mark the payment as internal
        await payment.update({ is_internal: true }, { transaction: t });

        // 3d. Notification for the recipient (optional but nice UX)
        const { default: notificationService } = await import('./notificationService.js');
        await notificationService.createNotification(
          {
            user_id: recipientAccount.user_id,
            title: 'Money Received!',
            message: `You received ${(payment.amount / 1000).toFixed(3)} GBP from ${payment.user?.name || 'a PayOman user'}.`,
            type: 'transaction'
          },
          { transaction: t }
        ).catch(() => {}); // Non-fatal


        logger.info(
          `[P2P] Internal transfer complete: ${payment.amount} credited to Account ${recipientAccount.id}`
        );
      } else {
        logger.info(`[P2P] No internal recipient found — external transfer only.`);
      }

      await t.commit();
      logger.info(`Payment ${payment.id} fully settled.`);
    } catch (err) {
      await t.rollback();
      logger.error(`Failed to settle Payment ${payment.id}: ${err.message}`);
      throw err;
    }
  }
}

export default new WebhookService();
