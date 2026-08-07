export const connectBankSchema = {
  schema: {
    body: {
      type: 'object',
      required: ['publicToken'],
      properties: {
        publicToken: { type: 'string' },
        bankName: { type: 'string' },
      },
    },
  },
};
