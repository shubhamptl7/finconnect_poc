import { encrypt, generateSearchHash } from '../utils/encryption.js';
import { decrypt } from '../utils/decryption.js';

const defineBeneficiary = (sequelize, DataTypes) => {
  const Beneficiary = sequelize.define(
    'Beneficiary',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        // WHY: Full legal name of the recipient (used in payment descriptions).
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      nickname: {
        // WHY: User-friendly label (e.g., "Mum", "Landlord") for quick recognition.
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      account_number: {
        // WHY: Masked last-4 digits for display purposes only (not used for matching).
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
        // WHY: The full IBAN typed by the user when adding the beneficiary.
        // CRITICAL: This is the key used to both initiate Plaid payments AND match P2P transfers.
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

      bank_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      is_internal: {
        // WHY: True if this beneficiary's IBAN matches a bank_account in our own database.
        // When true, payments are fulfilled internally without needing Plaid.
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      external_recipient_id: {
        // PLAID JARGON: 'recipient_id'.
        // WHY: To send money via Plaid Payment Initiation, Plaid requires us to create a 'recipient' on their end first. We save their ID here to reuse it.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('external_recipient_id'));
        },
        set(value) {
          this.setDataValue('external_recipient_id', value ? encrypt(value) : null);
        },
      },
    },
    {
      tableName: 'beneficiaries',
      timestamps: true,
      paranoid: true, // Enables soft deletes
      underscored: true,
      indexes: [
        { fields: ['user_id'] }, // Frontend: Loading transfer contacts
      ],
    }
  );

  Beneficiary.associate = (models) => {
    Beneficiary.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Beneficiary;
};

export default defineBeneficiary;
