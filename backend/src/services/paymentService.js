import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';
import bankProvider from '../providers/plaidBankProvider.js';
import logger from '../config/logger.js';
import { generateSearchHash } from '../utils/encryption.js';

class PaymentService {
  /**
   * Initiates an Open Banking Payment via Plaid.
   * This creates a Pending payment record in our DB, and returns a Link Token
   * so the frontend can securely authenticate and authorize the payment.
   */
  async initiatePayment(userId, payload, metadata = {}) {
    const { amount, iban, bacsAccount, sortCode, recipientName, note, accountId, beneficiaryId } =
      payload;

    if (!amount || !accountId) {
      throw new AppError(
        'Missing required payment fields: amount, accountId',
        STATUS_CODES.BAD_REQUEST
      );
    }

    // 1. Verify the from account belongs to user
    const account = await db.BankAccount.findOne({
      where: { id: accountId, user_id: userId },
      include: [{ model: db.BankConnection, as: 'connection' }],
    });
    if (!account) throw new AppError('Invalid source account', STATUS_CODES.NOT_FOUND);

    // 2. Resolve Identifier and name — from a saved beneficiary or from manual input
    let resolvedIban = iban;
    let resolvedBacs = bacsAccount;
    let resolvedSortCode = sortCode;
    let resolvedName = recipientName;
    let beneficiaryRecord = null;

    if (beneficiaryId) {
      beneficiaryRecord = await db.Beneficiary.findOne({
        where: { id: beneficiaryId, user_id: userId },
      });
      if (!beneficiaryRecord) throw new AppError('Beneficiary not found', STATUS_CODES.NOT_FOUND);
      resolvedIban = beneficiaryRecord.iban || iban;
      resolvedBacs = beneficiaryRecord.bacs_account || bacsAccount;
      resolvedSortCode = beneficiaryRecord.sort_code || sortCode;
      resolvedName = beneficiaryRecord.name;
    }

    if (!resolvedName) {
      throw new AppError('Recipient name is required', STATUS_CODES.BAD_REQUEST);
    }

    if (!resolvedIban && (!resolvedBacs || !resolvedSortCode)) {
      throw new AppError(
        'Recipient must have an IBAN or a UK Account (Sort Code & Account Number)',
        STATUS_CODES.BAD_REQUEST
      );
    }

    let normalizedIban = null;
    let normalizedBacs = null;
    let normalizedSortCode = null;

    if (resolvedIban) {
      normalizedIban = resolvedIban.replace(/\s/g, '').toUpperCase();
    }

    if (resolvedBacs && resolvedSortCode) {
      normalizedBacs = resolvedBacs.replace(/\s|-/g, '');
      normalizedSortCode = resolvedSortCode.replace(/\s|-/g, '');

      if (!/^\d{8}$/.test(normalizedBacs))
        throw new AppError('UK Account Number must be exactly 8 digits.', STATUS_CODES.BAD_REQUEST);
      if (!/^\d{6}$/.test(normalizedSortCode))
        throw new AppError('Sort Code must be exactly 6 digits.', STATUS_CODES.BAD_REQUEST);
    }

    let internalAccount = null;
    if (normalizedIban) {
      internalAccount = await db.BankAccount.findOne({ where: { iban_hash: generateSearchHash(normalizedIban) } });
    } else if (normalizedBacs && normalizedSortCode) {
      internalAccount = await db.BankAccount.findOne({
        where: {
          bacs_account_hash: generateSearchHash(normalizedBacs),
          sort_code_hash: generateSearchHash(normalizedSortCode),
        },
      });
    }

    if (internalAccount) {
      if (internalAccount.bacs_account && internalAccount.sort_code) {
        normalizedBacs = internalAccount.bacs_account;
        normalizedSortCode = internalAccount.sort_code;
      }
      if (internalAccount.iban) {
        normalizedIban = internalAccount.iban;
      }
    }

    const recipientData = {
      iban: normalizedIban,
      bacsAccount: normalizedBacs,
      sortCode: normalizedSortCode,
    };

    // 3. Wrap creation in a DB transaction
    const t = await db.sequelize.transaction();
    try {
      // 4. Create Plaid Payment Intent
      const paymentId = await bankProvider.createPaymentIntent(
        amount,
        recipientData,
        resolvedName,
        note || 'Transfer'
      );

      // 5. If no saved beneficiary was used, create one on-the-fly
      if (!beneficiaryRecord) {
        if (normalizedIban) {
          beneficiaryRecord = await db.Beneficiary.findOne({
            where: { user_id: userId, iban_hash: generateSearchHash(normalizedIban) },
          });
        } else {
          beneficiaryRecord = await db.Beneficiary.findOne({
            where: {
              user_id: userId,
              bacs_account_hash: generateSearchHash(normalizedBacs),
              sort_code_hash: generateSearchHash(normalizedSortCode)
            },
          });
        }

        if (!beneficiaryRecord) {


          beneficiaryRecord = await db.Beneficiary.create(
            {
              user_id: userId,
              name: resolvedName,
              iban: normalizedIban,
              bacs_account: normalizedBacs,
              sort_code: normalizedSortCode,
              bank_name: 'Unknown Bank',
              is_internal: !!internalAccount,
            },
            { transaction: t }
          );
        }
      }

      // 6. Create Payment Link Token (pre-selects the user's bank to skip bank-selection screen)
      const institutionId = account.connection ? account.connection.institution_id : null;
      const linkToken = await bankProvider.createPaymentToken(userId, paymentId, institutionId);

      // 7. Store the pending payment (amounts in baisas/cents)
      const payment = await db.Payment.create(
        {
          user_id: userId,
          beneficiary_id: beneficiaryRecord.id,
          account_id: account.id,
          amount: Math.round(Number.parseFloat(amount) * 1000),
          note: note || null,
          status: 'initiated',
          provider_reference: paymentId,
          recipient_iban: normalizedIban,
          recipient_bacs_account: normalizedBacs,
          recipient_sort_code: normalizedSortCode,
          recipient_name: resolvedName,
        },
        { transaction: t }
      );

      // 8. Audit log
      await db.AuditLog.create(
        {
          user_id: userId,
          action: 'payment_initiated',
          metadata: {
            ...metadata,
            payment_id: payment.id,
            amount,
            recipient: resolvedName,
            iban: normalizedIban,
            bacsAccount: normalizedBacs,
          },
        },
        { transaction: t }
      );

      await t.commit();

      return { paymentId: payment.id, linkToken };
    } catch (error) {
      await t.rollback();
      logger.error(`Payment initiation failed: ${error.message}`);
      throw new AppError('Failed to initiate payment', STATUS_CODES.SERVER_ERROR);
    }
  }

  /**
   * Retrieve payment history for user
   */
  async getPayments(userId) {
    return await db.Payment.findAll({
      where: { user_id: userId },
      include: [
        { model: db.Beneficiary, as: 'beneficiary' },
        {
          model: db.BankAccount,
          as: 'account',
          include: [{ model: db.BankConnection, as: 'connection' }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(userId, paymentId) {
    const payment = await db.Payment.findOne({ where: { id: paymentId, user_id: userId } });
    if (!payment) throw new AppError('Payment not found', STATUS_CODES.NOT_FOUND);

    if (payment.status === 'initiated' || payment.status === 'pending') {
      payment.status = 'cancelled';
      await payment.save();
      return { cancelled: true };
    }
    throw new AppError('Cannot cancel this payment', STATUS_CODES.BAD_REQUEST);
  }
}

export default new PaymentService();
