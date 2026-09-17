import { encrypt, generateSearchHash } from '../utils/encryption.js';
import { decrypt } from '../utils/decryption.js';

const defineBankAccount = (sequelize, DataTypes) => {
  const BankAccount = sequelize.define(
    'BankAccount',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      external_account_id: {
        // PLAID JARGON: Plaid's unique 'account_id'.
        // WHY: A single bank login (Item) can have multiple accounts (checking, savings). This ID identifies a specific checking/savings account.
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          return decrypt(this.getDataValue('external_account_id'));
        },
        set(value) {
          if (value) {
            this.setDataValue('external_account_id', encrypt(value));
            this.setDataValue('external_account_id_hash', generateSearchHash(value));
          } else {
            this.setDataValue('external_account_id', null);
            this.setDataValue('external_account_id_hash', null);
          }
        },
      },
      external_account_id_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      account_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      account_number: {
        // PLAID JARGON: Plaid calls this 'mask'.
        // WHY: For security, Plaid usually only returns the last 4 digits (e.g., "1234") of the account number.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('account_number'));
        },
        set(value) {
          this.setDataValue('account_number', value ? encrypt(value) : null);
        },
      },
      iban: {
        // WHY: The full International Bank Account Number. Extracted via Plaid's /auth/get endpoint.
        // USED FOR: P2P matching — when a payment is sent to this IBAN, we credit this account.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('iban'));
        },
        set(value) {
          if (value) {
            this.setDataValue('iban', encrypt(value));
            this.setDataValue('iban_hash', generateSearchHash(value));
          } else {
            this.setDataValue('iban', null);
            this.setDataValue('iban_hash', null);
          }
        },
      },
      iban_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      bacs_account: {
        // WHY: UK domestic account number (used instead of IBAN for UK banks in BACS/Faster Payments).
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('bacs_account'));
        },
        set(value) {
          if (value) {
            this.setDataValue('bacs_account', encrypt(value));
            this.setDataValue('bacs_account_hash', generateSearchHash(value));
          } else {
            this.setDataValue('bacs_account', null);
            this.setDataValue('bacs_account_hash', null);
          }
        },
      },
      bacs_account_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      sort_code: {
        // WHY: UK sort code (6-digit code identifying the bank branch). Paired with bacs_account.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('sort_code'));
        },
        set(value) {
          if (value) {
            this.setDataValue('sort_code', encrypt(value));
            this.setDataValue('sort_code_hash', generateSearchHash(value));
          } else {
            this.setDataValue('sort_code', null);
            this.setDataValue('sort_code_hash', null);
          }
        },
      },
      sort_code_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      bic: {
        // WHY: SWIFT/BIC code required for international wire payments to UK/EU external bank accounts.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('bic'));
        },
        set(value) {
          if (value) {
            this.setDataValue('bic', encrypt(value));
            this.setDataValue('bic_hash', generateSearchHash(value));
          } else {
            this.setDataValue('bic', null);
            this.setDataValue('bic_hash', null);
          }
        },
      },
      bic_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      routing_number: {
        // WHY: ABA routing number for US ACH & Wire transfers, extracted via Plaid /auth/get endpoint.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('routing_number'));
        },
        set(value) {
          if (value) {
            this.setDataValue('routing_number', encrypt(value));
            this.setDataValue('routing_number_hash', generateSearchHash(value));
          } else {
            this.setDataValue('routing_number', null);
            this.setDataValue('routing_number_hash', null);
          }
        },
      },
      routing_number_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      account_subtype: {
        // WHY: Distinguishes between checking, savings, etc.
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3), // e.g., 'GBP'
        allowNull: false,
        defaultValue: 'GBP',
      },
      current_balance: {
        // Integer minor units (pence)
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      available_balance: {
        // Integer minor units (pence)
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: 0,
      },
      last_synced_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'bank_accounts',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['connection_id', 'external_account_id_hash'],
        },
        { fields: ['user_id'] }, // Frontend Dashboard: Get all accounts for a user
      ],
    }
  );

  BankAccount.associate = (models) => {
    BankAccount.belongsTo(models.BankConnection, { foreignKey: 'connection_id', as: 'connection' });
    BankAccount.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    BankAccount.hasMany(models.Transaction, {
      foreignKey: 'account_id',
      as: 'transactions',
      onDelete: 'CASCADE',
    });
  };

  return BankAccount;
};

export default defineBankAccount;
