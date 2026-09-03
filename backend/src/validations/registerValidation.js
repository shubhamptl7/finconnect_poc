export const registerSchema = {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 150 },
        email: { type: 'string', format: 'email', maxLength: 150 },
        password: { type: 'string', minLength: 8, maxLength: 16 },
        phone: { type: 'string', maxLength: 15, pattern: '^(?:\\+?[0-9\\s()-]{8,15})?$' },
        dateOfBirth: { type: 'string', format: 'date' },
        e2ee_public_key: { type: ['object', 'string'] },
        e2ee_key_backup: { type: ['object', 'string'] },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
