import STATUS_CODES from '../../config/constants.js';
import logger from '../../config/logger.js';
import db from '../../models/index.js';
import columnBankProvider from '../../providers/column/columnBankProvider.js';
import columnClient from '../../providers/column/columnClient.js';
import columnLoanProvider from '../../providers/column/columnLoanProvider.js';
import columnWireProvider from '../../providers/column/columnWireProvider.js';
import AppError from '../../utils/appError.js';
import { eciesEncrypt, generateSearchHash } from '../../utils/encryption.js';
import liveFxService from '../liveFxService.js';

import { loanScheduleService } from './loanScheduleService.js';

const loanOriginationService = {
  /**
   * Borrower accepts binding LoanOffer and triggers multi-step Column origination & disbursement flow.
   *
   * @param {string} userId Borrower user ID
   * @param {string} applicationId Loan application UUID
   * @param {string} offerId Loan offer UUID
   * @param {Object|string} [options] Options or consentId
   * @returns {Promise<Object>} { application, offer, loan, wireTransfer }
   */
  async acceptOfferAndOriginate(userId, applicationId, offerId, options = {}) {
    logger.info(
      `[loanOriginationService] User ${userId} accepting offer ${offerId} for app ${applicationId}`
    );

    const consentId =
      typeof options === 'string' ? options : options?.consentId || options?.consent_id || null;
    if (!consentId && process.env.ENFORCE_AUTOPAY_AT_ACCEPTANCE !== 'false') {
      throw new AppError(
        'Repayment mandate (AutoPay) must be authorized with your bank before loan funds can be disbursed.',
        STATUS_CODES.BAD_REQUEST
      );
    }

    const application = await db.LoanApplication.findOne({
      where: { id: applicationId, user_id: userId },
      include: [{ model: db.User, as: 'user' }],
    });

    if (!application) {
      throw new AppError('Loan application not found', STATUS_CODES.NOT_FOUND);
    }

    // Check if already processed
    const existingLoan = await db.Loan.findOne({
      where: { application_id: applicationId },
    });

    // Acquire atomic lock on offer state transition
    const [updatedRows] = await db.LoanOffer.update(
      { status: 'PROCESSING' },
      { where: { id: offerId, application_id: applicationId, user_id: userId, status: 'OFFERED' } }
    );

    const offer = await db.LoanOffer.findOne({
      where: { id: offerId, application_id: applicationId, user_id: userId },
    });

    if (!offer) {
      throw new AppError('Loan offer not found', STATUS_CODES.NOT_FOUND);
    }

    if (existingLoan && offer.status === 'ACCEPTED') {
      return { application, offer, loan: existingLoan };
    }

    if (updatedRows === 0 && offer.status !== 'ACCEPTED') {
      if (offer.status === 'PROCESSING') {
        throw new AppError(
          'Loan offer is currently being processed by another request',
          STATUS_CODES.CONFLICT
        );
      }
      if (new Date() > new Date(offer.expires_at)) {
        offer.status = 'EXPIRED';
        await offer.save();
        throw new AppError('Loan offer has expired', STATUS_CODES.BAD_REQUEST);
      }
      throw new AppError(`Cannot accept offer in ${offer.status} status`, STATUS_CODES.BAD_REQUEST);
    }

    if (new Date() > new Date(offer.expires_at)) {
      offer.status = 'EXPIRED';
      await offer.save();
      throw new AppError('Loan offer has expired', STATUS_CODES.BAD_REQUEST);
    }

    const user = application.user || (await db.User.findByPk(userId));
    if (!user) {
      throw new AppError('User record not found', STATUS_CODES.NOT_FOUND);
    }

    // Fetch user-designated linked BankAccount for external counterparty disbursement
    if (!application.bank_account_id) {
      throw new AppError(
        'No bank account designated for this loan application',
        STATUS_CODES.BAD_REQUEST
      );
    }
    const bankAccount = await db.BankAccount.findOne({
      where: { id: application.bank_account_id, user_id: userId },
    });

    if (!bankAccount) {
      throw new AppError(
        'The designated bank account for this loan is no longer active or linked',
        STATUS_CODES.BAD_REQUEST
      );
    }

    const idempotencyPrefix = `app_${applicationId.slice(0, 8)}`;

    const isProduction = process.env.NODE_ENV === 'production';
    const borrowerDob = user.date_of_birth || (isProduction ? null : '1990-01-01');
    if (isProduction && !borrowerDob) {
      throw new AppError(
        'Date of birth is required for loan origination verification',
        STATUS_CODES.BAD_REQUEST
      );
    }

    const ssnOrTin = isProduction ? user.preferences?.ssn_or_tin || null : '999001234';

    if (isProduction && !ssnOrTin) {
      throw new AppError(
        'Tax identification / SSN is required for loan origination compliance',
        STATUS_CODES.BAD_REQUEST
      );
    }

    // ─── STAGE 1: Column Person Entity Creation / Mapping ──────────────
    logger.info(
      `[LOAN_ORIGINATION_STAGE_1] Resolving Column Person Entity for borrower email=${user.email}`
    );
    const columnEntity = await columnBankProvider.createEntity(
      {
        email: user.email,
        first_name: user.name ? user.name.split(' ')[0] : 'Borrower',
        last_name:
          user.name && user.name.split(' ').length > 1
            ? user.name.split(' ').slice(1).join(' ')
            : 'Applicant',
        phone: user.phone_number || '+447911123456',
        ssn_or_tin: ssnOrTin,
        date_of_birth: borrowerDob,
      },
      `ent-create:${idempotencyPrefix}`
    );
    logger.info(`[LOAN_ORIGINATION_STAGE_1] Entity Resolved -> Entity ID: ${columnEntity.id}`);

    // ─── STAGE 2: FX Quote & USD Principal Calculation ─────────────────
    const targetCurrency = (application.requested_currency || 'GBP').toUpperCase();
    let wireAmountCents = Number(offer.approved_amount); // Exact amount user requested in local currency
    let usdPrincipalCents = wireAmountCents;
    let fxQuote = null;

    if (targetCurrency !== 'USD') {
      try {
        fxQuote = await columnClient.post(
          '/fx/quotes',
          {
            source_currency: 'USD',
            destination_currency: targetCurrency,
            destination_amount: wireAmountCents,
          },
          `fx-quote:${idempotencyPrefix}`
        );
        usdPrincipalCents = Number(fxQuote.source_amount);
      } catch (fxErr) {
        logger.warn(
          `Column FX quote API failed: ${fxErr.message}. Fetching real-time live FX rate via liveFxService.`
        );
        const liveRate = await liveFxService.getExchangeRate(targetCurrency, 'USD');
        usdPrincipalCents = Math.round(wireAmountCents * liveRate);
        logger.info(
          `[LOAN_ORIGINATION_STAGE_2] Converted ${wireAmountCents} ${targetCurrency} cents -> ${usdPrincipalCents} USD cents at live rate ${liveRate}`
        );
      }
    }

    // ─── STAGE 3: Column Loan Creation ─────────────────────────────────
    logger.info(
      `[LOAN_ORIGINATION_STAGE_3] Originating Column Loan Asset of ${usdPrincipalCents} USD cents for Entity ${columnEntity.id}`
    );
    const columnLoan = await columnLoanProvider.createLoan(
      {
        borrower_entity_id: columnEntity.id,
        principal_amount: usdPrincipalCents,
        interest_rate_bps: Number(offer.interest_rate_bps),
        term_months: Number(offer.tenure_months),
        ...(process.env.COLUMN_LOAN_PROGRAM_ID
          ? { loan_program_id: process.env.COLUMN_LOAN_PROGRAM_ID }
          : {}),
      },
      `loan-create:${idempotencyPrefix}`
    );
    logger.info(`[LOAN_ORIGINATION_STAGE_3] Column Loan Created -> Loan ID: ${columnLoan.id}`);

    // Create preliminary Loan database record incrementally to prevent orphaned BaaS assets on network failure
    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + Number(offer.tenure_months));

    let loanRecord =
      existingLoan ||
      (await db.Loan.findOne({
        where: { application_id: applicationId },
      }));

    if (loanRecord) {
      loanRecord.column_loan_id = columnLoan.id;
      loanRecord.column_entity_id = columnEntity.id;
      loanRecord.bank_account_id = bankAccount.id;
      loanRecord.original_principal = offer.approved_amount;
      loanRecord.interest_rate_bps = offer.interest_rate_bps;
      loanRecord.tenure_months = offer.tenure_months;
      loanRecord.status = 'PENDING';
      loanRecord.start_date = startDate;
      loanRecord.maturity_date = maturityDate;
      await loanRecord.save();
    } else {
      loanRecord = await db.Loan.create({
        user_id: userId,
        application_id: applicationId,
        bank_account_id: bankAccount.id,
        column_loan_id: columnLoan.id,
        column_entity_id: columnEntity.id,
        currency: (application.requested_currency || 'GBP').toUpperCase(),
        original_principal: offer.approved_amount,
        interest_rate_bps: offer.interest_rate_bps,
        tenure_months: offer.tenure_months,
        start_date: startDate,
        maturity_date: maturityDate,
        status: 'PENDING',
        principal_outstanding: offer.approved_amount,
        principal_paid: 0,
        interest_paid: 0,
        last_synced_at: new Date(),
      });
    }

    // ─── STAGE 4: Column Deposit Bank Accounts (Funding & Collection) ──
    logger.info(
      `[LOAN_ORIGINATION_STAGE_4] Creating Column Deposit Accounts under Entity ${columnEntity.id}`
    );
    const fundingAccount = await columnBankProvider.createBankAccount(
      columnEntity.id,
      { name: `${user.name || 'Borrower'} - Loan Funding Account`, type: 'CHECKING' },
      `acct-funding:${idempotencyPrefix}`
    );

    const collectionAccount = await columnBankProvider.createBankAccount(
      columnEntity.id,
      { name: `${user.name || 'Borrower'} - Loan Collection Account`, type: 'CHECKING' },
      `acct-collection:${idempotencyPrefix}`
    );
    logger.info(
      `[LOAN_ORIGINATION_STAGE_4] Accounts Created -> Funding: ${fundingAccount.id}, Collection: ${collectionAccount.id}`
    );

    // ─── STAGE 5: Internal Loan Disbursement (Loan Asset -> Deposit Account) ──
    logger.info(
      `[LOAN_ORIGINATION_STAGE_5] Disbursing ${usdPrincipalCents} cents from Loan ${columnLoan.id} to Deposit Account ${fundingAccount.id}`
    );
    const columnDisbursement = await columnLoanProvider.createDisbursement(
      {
        loan_id: columnLoan.id,
        amount: usdPrincipalCents,
        bank_account_id: fundingAccount.id,
      },
      `disb-create:${idempotencyPrefix}`
    );
    logger.info(
      `[LOAN_ORIGINATION_STAGE_5] Disbursement Created -> ID: ${columnDisbursement.id}, Status: ${columnDisbursement.status || 'COMPLETED'}`
    );

    // ─── STAGE 6: Counterparty Registration & Outbound Wire Dispatch ───
    logger.info(
      `[LOAN_ORIGINATION_STAGE_6] Registering Column Counterparty for linked IBAN ${bankAccount.iban} / BIC ${bankAccount.bic || 'NWBKGB2L'}`
    );
    const columnCounterparty = await columnBankProvider.createCounterparty(
      bankAccount,
      `cp-create:${bankAccount.id}`
    );

    logger.info(
      `[LOAN_ORIGINATION_STAGE_6] Executing International SWIFT Wire to Counterparty ${columnCounterparty.id}`
    );
    const wireTransfer = await columnWireProvider.createInternationalWire(
      {
        bankAccountId: fundingAccount.id,
        counterpartyId: columnCounterparty.id,
        amountCents: wireAmountCents,
        currencyCode: targetCurrency,
        fxQuoteId: fxQuote?.id,
        messageToBeneficiaryBank: `FinConnect Loan Disb ${application.application_number}`,
        description: `Loan Disbursement for Application ${application.application_number}`,
      },
      `wire-disb:${idempotencyPrefix}`
    );
    logger.info(
      `[LOAN_ORIGINATION_STAGE_6] Wire Dispatched -> Wire ID: ${wireTransfer.id}, Status: ${wireTransfer.status}`
    );

    // ─── STAGE 7: Local Postgres State Machine & Read-Model ────────────
    logger.info(
      `[LOAN_ORIGINATION_STAGE_7] Finalizing local PostgreSQL Loan read-model for Application ${applicationId}`
    );

    loanRecord.column_funding_bank_account_id = fundingAccount.id;
    loanRecord.column_collection_bank_account_id = collectionAccount.id;
    loanRecord.status = 'ACTIVE';
    loanRecord.disbursement_status =
      wireTransfer.status === 'SETTLED' || wireTransfer.status === 'COMPLETED'
        ? 'COMPLETED'
        : 'PROCESSING';
    loanRecord.last_synced_at = new Date();
    await loanRecord.save();

    // Generate amortization schedule automatically
    try {
      await loanScheduleService.generateAmortizationSchedule(
        loanRecord.id,
        loanRecord.original_principal,
        loanRecord.tenure_months,
        loanRecord.interest_rate_bps,
        loanRecord.start_date
      );
      logger.info(
        `[LOAN_ORIGINATION_STAGE_7] Amortization schedule generated for Loan ${loanRecord.id}`
      );
    } catch (schedErr) {
      logger.error(`[LOAN_ORIGINATION_STAGE_7] Failed to generate schedule: ${schedErr.message}`);
      // Do not throw here, as the loan is already originated with the external BaaS
    }

    // Update Offer & Application status
    offer.status = 'ACCEPTED';
    offer.accepted_at = new Date();
    await offer.save();

    application.status = 'DISBURSED';
    await application.save();

    // ─── STAGE 8: Activate AutoPay Mandate Record ────────────────────────
    if (consentId) {
      try {
        const safeMonthlyLimit = Number(offer.estimated_emi || 0) + 500;
        let auth = await db.LoanAutopayAuthorization.findOne({
          where: { plaid_authorization_id: consentId },
        });
        if (auth) {
          auth.loan_id = loanRecord.id;
          auth.status = 'ACTIVE';
          auth.authorized_at = new Date();
          await auth.save();
        } else {
          await db.LoanAutopayAuthorization.create({
            loan_id: loanRecord.id,
            user_id: userId,
            plaid_authorization_id: consentId,
            plaid_account_id: bankAccount.external_account_id || null,
            amount: safeMonthlyLimit,
            currency: 'GBP',
            frequency: 'MONTHLY',
            status: 'ACTIVE',
            authorized_at: new Date(),
          });
        }
        logger.info(
          `[loanOriginationService] AutoPay Mandate activated for Loan ${loanRecord.id} with VRP consent ${consentId}`
        );
      } catch (authErr) {
        logger.error(
          `[loanOriginationService] Failed to record AutoPay authorization: ${authErr.message}`
        );
      }
    }

    // Credit borrower's linked BankAccount balance instantly upon loan origination disbursement
    if (bankAccount) {
      const approvedPence = Number(offer.approved_amount || 0);
      const creditPounds = (approvedPence / 100).toFixed(2);

      // Atomic increment in integer pence
      await bankAccount.increment({
        current_balance: approvedPence,
        available_balance: approvedPence,
      });
      await bankAccount.reload();
      logger.info(
        `[loanOriginationService] Atomically credited ${approvedPence} pence to BankAccount ${bankAccount.id}. New Balance: ${bankAccount.current_balance}`
      );

      // Broadcast real-time balance update to borrower
      try {
        const { default: websocketService } = await import('../websocketService.js');
        websocketService.sendToUser(userId, {
          type: 'BALANCE_UPDATED',
          data: {
            accountId: bankAccount.id,
            currentBalance: Number(bankAccount.current_balance),
            availableBalance: Number(bankAccount.available_balance),
            changeType: 'CREDIT',
            amount: approvedPence,
            reason: 'LOAN_DISBURSEMENT',
          },
        });
      } catch (wsErr) {
        logger.warn(`[loanOriginationService] WS balance broadcast error: ${wsErr.message}`);
      }

      // Inject disbursement transaction record into bank account history
      try {
        if (user && user.e2ee_public_key) {
          const extTxId = `disb-${loanRecord.id}`;
          const extTxHash = generateSearchHash(extTxId);
          await db.Transaction.findOrCreate({
            where: { external_transaction_id_hash: extTxHash },
            defaults: {
              account_id: bankAccount.id,
              external_transaction_id: extTxId,
              type: 'credit',
              currency: targetCurrency,
              status: 'settled',
              category: 'Loan Disbursement',
              description_encrypted: eciesEncrypt(
                user.e2ee_public_key,
                'Loan Disbursement Credit',
                'finconnect-txn-desc-v1'
              ),
              amount_encrypted: eciesEncrypt(
                user.e2ee_public_key,
                creditPounds,
                'finconnect-txn-amt-v1'
              ),
              transaction_date: new Date(),
            },
          });
          logger.info(
            `[loanOriginationService] Injected mock disbursement transaction for Loan ${loanRecord.id}`
          );
        }
      } catch (txErr) {
        logger.error(
          `[loanOriginationService] Failed to record disbursement transaction: ${txErr.message}`
        );
      }
    }

    // Send Real-Time Loan Disbursed Notification
    try {
      const { default: notificationService } = await import('../notificationService.js');
      const disbursedPounds = (Number(offer.approved_amount) / 100).toLocaleString('en-GB', {
        minimumFractionDigits: 2,
      });
      await notificationService.createNotification({
        user_id: userId,
        title: 'Loan Funds Disbursed',
        message: `£${disbursedPounds} has been disbursed directly into your ${bankAccount.account_name || 'designated bank account'}. Your first EMI is scheduled as agreed.`,
        type: 'loan',
        action_url: `/app/emi/${applicationId}`,
        metadata: {
          applicationId,
          loanId: loanRecord.id,
          amount: offer.approved_amount,
          bankAccountId: bankAccount.id,
        },
      });
    } catch (notifErr) {
      logger.warn(`[loanOriginationService] Notification error: ${notifErr.message}`);
    }

    // Audit Log Entry
    try {
      await db.AuditLog.create({
        user_id: userId,
        action: 'LOAN_ORIGINATED_AND_DISBURSED',
        metadata: {
          applicationId,
          loanId: loanRecord.id,
          columnLoanId: columnLoan.id,
          columnEntityId: columnEntity.id,
          columnWireTransferId: wireTransfer.id,
          amountCents: offer.approved_amount,
        },
      });
    } catch (auditErr) {
      logger.warn(`[loanOriginationService] Audit log error: ${auditErr.message}`);
    }

    return {
      application,
      offer,
      loan: loanRecord,
      wireTransfer,
      columnDisbursement,
    };
  },
};

export default loanOriginationService;
