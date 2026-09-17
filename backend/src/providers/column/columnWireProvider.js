import logger from '../../config/logger.js';

import columnClient from './columnClient.js';

/**
 * Column International Wire Provider Adapter
 * Handles outbound international wire transfers (/transfers/wire/international)
 * used for disbursing loan funds to UK/EU borrower bank accounts via IBAN + BIC.
 */
const columnWireProvider = {
  /**
   * Obtains a locked FX exchange rate quote for cross-border international wire transfers.
   * INT-19 Sub-step: POST /transfers/international-wire/fx-rate
   *
   * @param {Object} params FX Quote Request parameters
   * @param {number} params.amountCents Source USD disbursement amount in integer cents
   * @param {string} [params.currency='GBP'] Target currency code (e.g. 'GBP')
   * @returns {Promise<Object>} Column FX Quote object ({ id: 'fxqt_xxx', fx_rate: 0.79, ... })
   */
  async getFxQuote({ amountCents, currency = 'GBP' }) {
    logger.info('[ColumnWireProvider] getFxQuote:', { amountCents, currency });

    return await columnClient.post('/transfers/international-wire/fx-rate', {
      buy_currency_code: currency,
      buy_amount: amountCents,
    });
  },

  /**
   * Initiates an outbound International Wire Transfer to a Column Counterparty over SWIFT.
   * INT-19: POST /transfers/international-wire
   *
   * @param {Object} params Request parameters
   * @param {string} params.bankAccountId Source Column Deposit Account ID (`bacc_xxx`)
   * @param {string} params.counterpartyId Target Column Counterparty ID (`cp_xxx`)
   * @param {number} params.amountCents Transfer amount in integer cents (minor units)
   * @param {string} [params.currencyCode='GBP'] ISO 4217 Currency Code ('GBP')
   * @param {string} [params.fxQuoteId] FX Quote ID (`fxqt_xxx`)
   * @param {Object|string} [params.intermediaryBank] Intermediary bank BIC object/string
   * @param {string} [params.messageToBeneficiaryBank] Message to beneficiary bank
   * @param {string} [params.chargeBearer='DEBT'] Charge bearer ('DEBT')
   * @param {boolean} [params.allowOverdraft=false] Allow overdraft flag
   * @param {string} [params.purposeCode='LOAN'] Payment purpose code ('LOAN')
   * @param {string} [params.description] Remittance description
   * @param {string|null} [idempotencyKey=null] Unique idempotency key for payment dispatch
   * @returns {Promise<Object>} Column Transfer response object ({ id: 'tr_xxx', status: 'PROCESSING', ... })
   */
  async createInternationalWire(
    {
      bankAccountId,
      counterpartyId,
      amountCents,
      currencyCode = 'GBP',
      fxQuoteId = null,
      intermediaryBank = null,
      messageToBeneficiaryBank = 'FBO Borrower Loan Funding',
      chargeBearer = 'DEBT',
      allowOverdraft = true,
      purposeCode = 'LOAN',
      description = 'FinConnect Loan Disbursement Wire',
    },
    idempotencyKey = null
  ) {
    logger.info('[ColumnWireProvider] createInternationalWire', {
      bankAccountId,
      counterpartyId,
      amountCents,
      currencyCode,
      fxQuoteId,
      idempotencyKey,
    });

    const payload = {
      bank_account_id: bankAccountId,
      counterparty_id: counterpartyId,
      amount: amountCents,
      currency_code: currencyCode,
      message_to_beneficiary_bank: messageToBeneficiaryBank,
      charge_bearer: chargeBearer,
      allow_overdraft: allowOverdraft,
      purpose_code: purposeCode,
      description,
    };

    if (intermediaryBank && typeof intermediaryBank === 'object' && intermediaryBank.bic) {
      payload.intermediary_bank = intermediaryBank;
    }

    if (fxQuoteId) {
      payload.fx_quote_id = fxQuoteId;
    }

    return await columnClient.post('/transfers/international-wire', payload, idempotencyKey);
  },

  /**
   * Retrieves an International Wire Transfer status by ID.
   * INT-19/20: GET /transfers/international-wire/:id
   *
   * @param {string} transferId Column Transfer ID (tr_xxx)
   * @returns {Promise<Object>} Column Transfer status object
   */
  async getInternationalWire(transferId) {
    logger.info('[ColumnWireProvider] getInternationalWire:', transferId);

    return await columnClient.get(`/transfers/international-wire/${transferId}`);
  },
};

export default columnWireProvider;
