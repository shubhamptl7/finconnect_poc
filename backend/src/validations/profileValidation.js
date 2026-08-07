export const updateProfileSchema = {
  schema: {
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 150, pattern: '^[a-zA-Z\\s]*$' },
        phone_number: { 
          type: ['string', 'null'], 
          maxLength: 15, 
          pattern: '^(?:\\+?[0-9\\s()-]{8,15})?$' 
        },
        date_of_birth: { 
          anyOf: [
            { type: 'string', format: 'date' },
            { type: 'string', maxLength: 0 },
            { type: 'null' }
          ]
        },
        preferences: {
          type: 'object',
          additionalProperties: true
        }
      },
      additionalProperties: false,
    },
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: {
            type: 'object',
            additionalProperties: true // We can be flexible with user data response
          }
        }
      }
    }
  }
};

export const changePasswordSchema = {
  schema: {
    body: {
      type: 'object',
      required: ['currentPassword', 'newPassword', 'confirmPassword'],
      properties: {
        currentPassword: { type: 'string', minLength: 1 },
        newPassword: { 
          type: 'string', 
          minLength: 8, 
          maxLength: 16, 
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,16}$' 
        },
        confirmPassword: { type: 'string' }
      },
      additionalProperties: false,
    },
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  }
};
