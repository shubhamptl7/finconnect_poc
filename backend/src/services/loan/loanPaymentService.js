import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import logger from '../../config/logger.js';
import { plaidPaymentProvider } from '../../providers/plaid/plaidPaymentProvider.js';
import plaidBankProvider from '../../providers/plaid/plaidBankProvider.js';

export const loanPaymentService = {
  /**
   * Initiates a manual one-time payment for an EMI using Plaid Payment Initiation.
   *
   * @param {string} userId - The ID of the user initiating the payment
   * @param {string} loanId - The ID of the loan being paid
   * @param {number} amountMinor - The amount the user wishes to pay in pence
   * @param {string} paymentType - e.g., 'EMI', 'PRINCIPAL_ONLY', 'PAYOFF'
   * @returns {Promise<Object>} An object containing the plaid_payment_id for the frontend to initialize Link
   */
  async initiateManualPayment(userId, loanId, amountMinor, paymentType = 'EMI') {
    logger.info(`[LoanPaymentService] Initiating manual payment for user ${userId} on loan ${loanId}`);

    // 1. Validate the Loan and its designated bank account
    const loan = await db.Loan.findOne({
      where: { id: loanId, user_id: userId },
      include: [{ model: db.LoanApplication, as: 'application' }],
    });
    if (!loan || loan.status !== 'ACTIVE') {
      throw new AppError('Active loan not found for this user', 404);
    }

    const designatedBankAccountId = loan.bank_account_id || loan.application?.bank_account_id;
    if (!designatedBankAccountId) {
      throw new AppError('No dedicated bank account associated with this loan', 400);
    }

    const bankAccount = await db.BankAccount.findOne({
      where: { id: designatedBankAccountId, user_id: userId },
      include: [{ model: db.BankConnection, as: 'connection' }],
    });

    if (!bankAccount) {
      throw new AppError('The designated bank account for this loan is no longer active', 404);
    }

    // 2. We need FinConnect's Plaid Recipient ID. For POC, we assume it's set in env.
    const recipientId = process.env.PLAID_UK_RECIPIENT_ID || 'recipient-id-sandbox-cdedd68a-5d49-4210-96a1-13413bdd08fa';

    // 3. Initiate the payment in Plaid (this prepares the payment intent)
    const plaidPaymentId = await plaidPaymentProvider.createPayment({
      amountMinor,
      currency: 'GBP',
      reference: `Loan${loan.id.substring(0, 8)}`,
      recipientId,
    });

    // 4. Record the Pending Payment in our database
    const loanPayment = await db.LoanPayment.create({
      loan_id: loan.id,
      user_id: userId,
      plaid_transfer_id: plaidPaymentId, // Using transfer_id column for payment_id
      amount: amountMinor,
      currency: 'GBP',
      status: 'PENDING',
      payment_type: paymentType,
      payment_date: new Date(),
    });

    logger.info(`[LoanPaymentService] Logged pending manual payment ${loanPayment.id} for Plaid ID ${plaidPaymentId}`);

    // Use designated bank's institution to skip institution selection
    const institutionId = bankAccount.connection?.institution_id || null;

    // Generate the Plaid Link Token
    const linkToken = await plaidBankProvider.createPaymentToken(userId, plaidPaymentId, institutionId);

    // Frontend will use linkToken to launch Plaid Link and let the user authorize the transfer
    return {
      local_payment_id: loanPayment.id,
      plaid_payment_id: plaidPaymentId,
      link_token: linkToken,
      amount: amountMinor,
    };
  }
};
