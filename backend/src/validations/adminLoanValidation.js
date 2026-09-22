const uuidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

export const approveLoanApplicationSchema = {
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
        adminNotes: { type: 'string', maxLength: 1000 },
        customInterestRateBps: { type: 'integer', minimum: 100, maximum: 5000 },
        customApprovedAmountCents: { type: 'integer', minimum: 10000 },
        customTenureMonths: { type: 'integer', minimum: 1, maximum: 60 },
      },
    },
  },
};

export const rejectLoanApplicationSchema = {
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
        rejectionReason: { type: 'string', maxLength: 500 },
        adminNotes: { type: 'string', maxLength: 1000 },
      },
    },
  },
};
