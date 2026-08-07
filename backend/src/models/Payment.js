import { encrypt, generateSearchHash } from '../utils/encryption.js';
import { decrypt } from '../utils/decryption.js';

const definePayment = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    'Payment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 3),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: 'pending',
      },
      provider_reference: {
        // PLAID JARGON: 'payment_id'.
        // WHY: The unique ID Plaid generates when a payment is initiated. Used to check the payment's real-time status via webhooks.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('provider_reference'));
        },
        set(value) {
          if (value) {
            this.setDataValue('provider_reference', encrypt(value));
            this.setDataValue('provider_reference_hash', generateSearchHash(value));
          } else {
            this.setDataValue('provider_reference', null);
            this.setDataValue('provider_reference_hash', null);
          }
        },
      },
      provider_reference_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      account_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      note: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_internal: {
        // WHY: When true, this payment was settled internally (P2P within PayOman).
        // The sender's balance is debited and the recipient's balance is credited directly,
        // without waiting for Plaid's webhook (since it's simulated internally).
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      recipient_iban: {
        // WHY: Stored so the webhookService can look up the recipient in our bank_accounts table.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('recipient_iban'));
        },
        set(value) {
          this.setDataValue('recipient_iban', value ? encrypt(value) : null);
        },
      },
      recipient_bacs_account: {
        // WHY: Same as recipient_iban but for UK Domestic transfers.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('recipient_bacs_account'));
        },
        set(value) {
          this.setDataValue('recipient_bacs_account', value ? encrypt(value) : null);
        },
      },
      recipient_sort_code: {
        // WHY: Same as recipient_iban but for UK Domestic transfers.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('recipient_sort_code'));
        },
        set(value) {
          this.setDataValue('recipient_sort_code', value ? encrypt(value) : null);
        },
      },
      recipient_name: {
        // WHY: Stored for display in transaction descriptions.
        type: DataTypes.STRING(150),
        allowNull: true,
      },
    },
    {
      tableName: 'payments',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['user_id', 'created_at'] }, // Frontend: Loading payment history quickly
      ],
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Payment.belongsTo(models.Beneficiary, { foreignKey: 'beneficiary_id', as: 'beneficiary' });
    Payment.belongsTo(models.BankAccount, { foreignKey: 'account_id', as: 'account' });
  };

  return Payment;
};

export default definePayment;
