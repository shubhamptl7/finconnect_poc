const uuidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

export const initiatePaymentSchema = {
  schema: {
    body: {
      type: 'object',
      required: ['amount'],
      properties: {
        accountId: { type: 'string', pattern: uuidPattern },
        account_id: { type: 'string', pattern: uuidPattern },
        beneficiaryId: { type: 'string', pattern: uuidPattern },
        beneficiary_id: { type: 'string', pattern: uuidPattern },
        amount: { type: ['number', 'string'] },
        note: { type: 'string', maxLength: 255 },
        iban: { type: 'string', maxLength: 34 },
        recipient_iban: { type: 'string', maxLength: 34 },
        bacsAccount: { type: 'string', maxLength: 8 },
        bacs_account: { type: 'string', maxLength: 8 },
        recipient_bacs_account: { type: 'string', maxLength: 8 },
        sortCode: { type: 'string', maxLength: 8 },
        sort_code: { type: 'string', maxLength: 8 },
        recipient_sort_code: { type: 'string', maxLength: 8 },
        recipientName: { type: 'string', maxLength: 150 },
        recipient_name: { type: 'string', maxLength: 150 },
      },
    },
  },
};

export const cancelPaymentSchema = {
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

export const createBeneficiarySchema = {
  schema: {
    body: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 150 },
        nickname: { type: 'string', maxLength: 100 },
        iban: { type: 'string', maxLength: 34 },
        bacs_account: { type: 'string', maxLength: 8 },
        sort_code: { type: 'string', maxLength: 8 },
        account_number: { type: 'string', maxLength: 34 },
        bank_name: { type: 'string', maxLength: 150 },
      },
    },
  },
};

export const updateBeneficiarySchema = {
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
        name: { type: 'string', minLength: 1, maxLength: 150 },
        nickname: { type: 'string', maxLength: 100 },
        iban: { type: 'string', maxLength: 34 },
        bacs_account: { type: 'string', maxLength: 8 },
        sort_code: { type: 'string', maxLength: 8 },
        account_number: { type: 'string', maxLength: 34 },
        bank_name: { type: 'string', maxLength: 150 },
      },
    },
  },
};

export const deleteBeneficiarySchema = {
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
