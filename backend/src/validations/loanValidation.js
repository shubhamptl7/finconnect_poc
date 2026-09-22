const uuidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

export const checkEligibilitySchema = {
  schema: {
    body: {
      type: 'object',
      properties: {
        requestedAmountCents: { type: 'number', minimum: 10000, maximum: 5000000 },
        requested_amount: { type: 'number', minimum: 100, maximum: 50000 },
        tenureMonths: { type: 'integer', minimum: 1, maximum: 60 },
        tenure_months: { type: 'integer', minimum: 1, maximum: 60 },
        monthlyIncomeCents: { type: 'number', minimum: 0 },
        monthly_income: { type: 'number', minimum: 0 },
        existingObligationsCents: { type: 'number', minimum: 0 },
        existing_obligations: { type: 'number', minimum: 0 },
        interestRateBps: { type: 'integer', minimum: 100, maximum: 5000 },
        currency: { type: 'string', minLength: 3, maxLength: 3 },
      },
    },
  },
};

export const createApplicationSchema = {
  schema: {
    body: {
      type: 'object',
      required: ['requested_amount', 'requested_tenure_months'],
      properties: {
        requested_amount: { type: 'number', minimum: 100 },
        requested_tenure_months: { type: 'integer', minimum: 1, maximum: 60 },
        purpose: { type: 'string', maxLength: 500 },
        monthly_income: { type: 'number', minimum: 0 },
        bank_account_id: { type: 'string', pattern: uuidPattern },
        employment_status: { type: 'string', maxLength: 100 },
        housing_status: { type: 'string', maxLength: 100 },
      },
    },
  },
};

export const updateDraftSchema = {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: uuidPattern },
      },
    },
    body: {
      type: 'object',
      properties: {
        requested_amount: { type: 'number', minimum: 100 },
        requested_tenure_months: { type: 'integer', minimum: 1, maximum: 60 },
        purpose: { type: 'string', maxLength: 500 },
        monthly_income: { type: 'number', minimum: 0 },
        bank_account_id: { type: 'string', pattern: uuidPattern },
        employment_status: { type: 'string', maxLength: 100 },
        housing_status: { type: 'string', maxLength: 100 },
      },
    },
  },
};

export const idParamSchema = {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: uuidPattern },
      },
    },
  },
};

export const acceptOfferSchema = {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: uuidPattern },
        offerId: { type: 'string', pattern: uuidPattern },
      },
    },
    body: {
      type: 'object',
      properties: {
        offerId: { type: 'string', pattern: uuidPattern },
        consent_id: { type: 'string' },
        consentId: { type: 'string' },
      },
    },
  },
};

export const setupOfferAutopaySchema = {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: uuidPattern },
        offerId: { type: 'string', pattern: uuidPattern },
      },
    },
    body: {
      type: 'object',
      properties: {
        offerId: { type: 'string', pattern: uuidPattern },
      },
    },
  },
};

export const activateAutopaySchema = {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: uuidPattern },
      },
    },
    body: {
      type: 'object',
      required: ['consentId'],
      properties: {
        consentId: { type: 'string', minLength: 1 },
      },
    },
  },
};

export const manualPaymentSchema = {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: uuidPattern },
      },
    },
    body: {
      type: 'object',
      required: ['amountMinor'],
      properties: {
        amountMinor: { type: 'number', minimum: 1 },
        paymentType: { type: 'string', enum: ['EMI', 'PRINCIPAL_ONLY', 'PAYOFF'] },
      },
    },
  },
};
