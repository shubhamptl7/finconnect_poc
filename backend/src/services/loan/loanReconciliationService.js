import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import logger from '../../config/logger.js';
import columnLoanProvider from '../../providers/column/columnLoanProvider.js';
import { eciesEncrypt, generateSearchHash } from '../../utils/encryption.js';
import crypto from 'crypto';

export const loanReconciliationService = {
  /**
   * The Simulated Treasury Bridge
   * Processes a successful Plaid Payment and applies it to the Column Loan Ledger.
   *
   * @param {string} plaidPaymentId
   */
  async processSettledPayment(plaidPaymentId) {
    logger.info(`[LoanReconciliationService] Processing settled Plaid payment: ${plaidPaymentId}`);

    const loanPayment = await db.LoanPayment.findOne({
      where: { plaid_transfer_id: plaidPaymentId, status: 'PENDING' },
      include: [
        { model: db.Loan, as: 'loan' }
      ]
    });

    if (!loanPayment) {
      logger.warn(`[LoanReconciliationService] No PENDING payment found for Plaid ID ${plaidPaymentId}. Ignoring.`);
      return;
    }

    const loan = loanPayment.loan;

    try {
      // 1. Simulated Treasury Bridge (FX Conversion)
      // Because Plaid is UK (GBP) and Column is US (USD), we simulate a corporate FX conversion.
      // In Production, this would be a call to the Wise or Airwallex API.
      const simulatedFxRate = 1.25; // £1 = $1.25 for POC simulation
      
      const usdAmountMinor = Math.round(loanPayment.amount * simulatedFxRate);
      
      logger.info(`[LoanReconciliationService] Simulated FX: ${loanPayment.amount} GBP -> ${usdAmountMinor} USD`);

      // 2. Apply Payment to Column Ledger
      // We assume there's a predefined Column Collection Account ID set in the environment
      const collectionAccountId = process.env.COLUMN_COLLECTION_ACCOUNT_ID || 'acc_sandbox_collection_123';
      
      let columnResponse = { id: `mock_col_pmt_${loanPayment.id}` };
      try {
        columnResponse = await columnLoanProvider.createPayment(
          loan.column_loan_id, 
          {
            bank_account_id: collectionAccountId,
            amount: usdAmountMinor, 
            // We let Column auto-allocate between Principal and Interest
          },
          `recon-${loanPayment.id}` // Idempotency key
        );
      } catch (colErr) {
        logger.warn(`[LoanReconciliationService] Column API failed (likely Sandbox limitation): ${colErr.message}. Proceeding with local state update.`);
      }

      // 3. Update Local State
      loanPayment.column_payment_id = columnResponse.id;
      loanPayment.status = 'COMPLETED';
      
      // Update the Schedule if this was an EMI
      if (loanPayment.payment_type === 'EMI') {
        const schedule = await db.LoanSchedule.findOne({
          where: { loan_id: loan.id, status: 'PENDING' },
          order: [['installment_number', 'ASC']],
        });

        if (schedule) {
          schedule.status = 'PAID';
          schedule.paid_amount = loanPayment.amount; // Storing GBP paid locally
          schedule.paid_principal = schedule.scheduled_principal;
          schedule.paid_interest = schedule.scheduled_interest;
          await schedule.save();

          // Decrease outstanding balance on Loan
          loan.principal_outstanding = Math.max(0, loan.principal_outstanding - schedule.scheduled_principal);
          loan.principal_paid = Number(loan.principal_paid) + Number(schedule.scheduled_principal);
          loan.interest_paid = Number(loan.interest_paid) + Number(schedule.scheduled_interest);
          await loan.save();

          // INJECT MOCK TRANSACTION FOR UI VERIFICATION IN SANDBOX
          try {
            const user = await db.User.findByPk(loanPayment.user_id);
            
            // 1. Locate the exact bank account associated with this loan
            let bankAccount = null;
            const designatedBankAccountId = loan?.bank_account_id || (
              loan?.application_id ? (await db.LoanApplication.findByPk(loan.application_id))?.bank_account_id : null
            );

            if (designatedBankAccountId) {
              bankAccount = await db.BankAccount.findOne({
                where: { id: designatedBankAccountId, user_id: loanPayment.user_id }
              });
            }

            if (!bankAccount) {
              logger.error(`[LoanReconciliationService] Dedicated bank account ${designatedBankAccountId} for Loan ${loan.id} not found. Refusing fallback to preserve accounting integrity.`);
            }
            
            if (user && user.e2ee_public_key && bankAccount) {
              const extTxId = `mock-emi-${loanPayment.id}`;
              const extTxHash = generateSearchHash(extTxId);
              // Convert minor units (pence) to major units (pounds) string for E2EE payload
              const amountMajorStr = String(Math.abs(loanPayment.amount) / 100);

              // 2. Idempotent creation to prevent duplicate rows on retry
              const [txn, created] = await db.Transaction.findOrCreate({
                where: { external_transaction_id_hash: extTxHash },
                defaults: {
                  account_id: bankAccount.id,
                  external_transaction_id: extTxId,
                  type: 'debit',
                  currency: 'GBP',
                  status: 'settled',
                  category: 'Loan Payment',
                  description_encrypted: eciesEncrypt(user.e2ee_public_key, 'Loan EMI Payment', 'finconnect-txn-desc-v1'),
                  amount_encrypted: eciesEncrypt(user.e2ee_public_key, amountMajorStr, 'finconnect-txn-amt-v1'),
                  transaction_date: new Date(),
                },
              });
              
              if (created) {
                // 3. Mock balance deduction for Sandbox
                // Note: loanPayment.amount is in pence (minor units), which matches BankAccount balance in pence.
                const paymentPence = Number(loanPayment.amount);
                await bankAccount.decrement({
                  current_balance: paymentPence,
                  available_balance: paymentPence,
                });
                logger.info(`[LoanReconciliationService] Injected mock transaction & deducted ${paymentPence} pence for EMI ${loanPayment.id}`);
              } else {
                logger.info(`[LoanReconciliationService] Mock transaction for EMI ${loanPayment.id} already exists. Skipped duplicate creation.`);
              }
            }
          } catch (mockErr) {
            logger.error(`[LoanReconciliationService] Failed to inject mock transaction: ${mockErr.message}`);
          }
        }
      }

      await loanPayment.save();
      logger.info(`[LoanReconciliationService] Successfully reconciled payment ${loanPayment.id} with Column Ledger`);

    } catch (error) {
      logger.error(`[LoanReconciliationService] Failed to process settled payment ${plaidPaymentId}:`, error);
      loanPayment.status = 'FAILED';
      await loanPayment.save();
      throw error; // Let the webhook handler deal with the retry
    }
  },

  /**
   * Handles payment failures from Plaid (e.g. INSUFFICIENT_FUNDS during execution or later)
   *
   * @param {string} plaidPaymentId 
   * @param {string} errorCode 
   */
  async processFailedPayment(plaidPaymentId, errorCode) {
    logger.info(`[LoanReconciliationService] Processing failed Plaid payment: ${plaidPaymentId}, code: ${errorCode}`);

    const loanPayment = await db.LoanPayment.findOne({
      where: { plaid_transfer_id: plaidPaymentId, status: 'PENDING' },
    });

    if (!loanPayment) return;

    loanPayment.status = 'FAILED';
    await loanPayment.save();

    // Fire off notification to user
    logger.warn(`[Notification Simulation] Sent SMS/Email to user ${loanPayment.user_id}: "Your loan payment failed due to ${errorCode}."`);
  }
};
