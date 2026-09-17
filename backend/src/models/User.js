import bcrypt from 'bcrypt';

import { encrypt, generateSearchHash } from '../utils/encryption.js';
import { decrypt } from '../utils/decryption.js';
const defineUser = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      e2ee_public_key: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      e2ee_key_backup: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      key_version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },

      email: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          // Note: Sequelize validation runs on the *plaintext* before the setter if using Model.create(),
          // but if we overwrite set(), validation might run on the ciphertext.
          // Actually, Sequelize runs validation on the underlying dataValue. 
          // We will remove isEmail here because it would fail on the ciphertext.
        },
        get() {
          return decrypt(this.getDataValue('email'));
        },
        set(value) {
          if (value) {
            const lowerVal = value.toLowerCase().trim();
            this.setDataValue('email', encrypt(lowerVal));
            this.setDataValue('email_hash', generateSearchHash(lowerVal));
          }
        },
      },
      email_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },

      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      phone_number: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('phone_number'));
        },
        set(value) {
          if (value) {
            this.setDataValue('phone_number', encrypt(value));
            this.setDataValue('phone_hash', generateSearchHash(value));
          } else {
            this.setDataValue('phone_number', null);
            this.setDataValue('phone_hash', null);
          }
        },
      },
      phone_hash: {
        type: DataTypes.STRING(64),
        unique: true,
        allowNull: true,
      },

      date_of_birth: {
        type: DataTypes.TEXT, // Changed to TEXT for ciphertext
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('date_of_birth'));
        },
        set(value) {
          this.setDataValue('date_of_birth', value ? encrypt(value) : null);
        },
      },

      preferences: {
        // WHAT IT IS: A flexible JSON container for custom app settings (e.g., theme: "dark")
        // WHY IT'S HERE: Avoids altering the database schema every time we add a new minor user configuration.
        type: DataTypes.JSONB,
        defaultValue: {},
      },

      role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user',
      },

      status: {
        type: DataTypes.ENUM('active', 'suspended', 'unverified'),
        defaultValue: 'unverified',
      },

      is_email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      plaid_user_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      paranoid: true, // Enables soft deletes (creates 'deleted_at' instead of actually deleting rows)
      underscored: true, // Enforces snake_case for DB columns (created_at, updated_at)
      indexes: [{ unique: true, fields: ['email_hash'] }],
    }
  );

  User.associate = (models) => {
    User.hasMany(models.KycVerification, { foreignKey: 'user_id', as: 'kyc_verifications' });
    User.hasMany(models.BankConnection, { foreignKey: 'user_id', as: 'bank_connections' });
    User.hasMany(models.BankAccount, { foreignKey: 'user_id', as: 'bank_accounts' });
    User.hasMany(models.Beneficiary, { foreignKey: 'user_id', as: 'beneficiaries' });
    User.hasMany(models.Payment, { foreignKey: 'user_id', as: 'payments' });
    User.hasMany(models.AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
    User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications' });
    User.hasMany(models.VerificationToken, { foreignKey: 'user_id', as: 'verification_tokens' });
    User.hasMany(models.LoanApplication, { foreignKey: 'user_id', as: 'loan_applications' });
    User.hasMany(models.LoanOffer, { foreignKey: 'user_id', as: 'loan_offers' });
    User.hasMany(models.Loan, { foreignKey: 'user_id', as: 'loans' });
    User.hasMany(models.LoanPayment, { foreignKey: 'user_id', as: 'loan_payments' });
    User.hasMany(models.LoanVerification, { foreignKey: 'user_id', as: 'loan_verifications' });
    User.hasMany(models.ColumnCustomerAccount, { foreignKey: 'user_id', as: 'column_customer_accounts' });
    User.hasMany(models.LoanAutopayAuthorization, { foreignKey: 'user_id', as: 'loan_autopay_authorizations' });
  };

  // SECURITY: Hash password before saving to DB
  User.beforeSave(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.prototype.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  // SECURITY: Automatically hide password from API responses
  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
};

export default defineUser;
