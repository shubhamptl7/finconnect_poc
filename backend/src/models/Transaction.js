import { encrypt, generateSearchHash } from '../utils/encryption.js';
import { decrypt } from '../utils/decryption.js';

const defineTransaction = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    'Transaction',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      account_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'bank_accounts',
          key: 'id',
        },
      },
      external_transaction_id: {
        // PLAID JARGON: Plaid's 'transaction_id'.
        // WHY: To ensure we don't accidentally save the same transaction twice when we sync.
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          return decrypt(this.getDataValue('external_transaction_id'));
        },
        set(value) {
          if (value) {
            this.setDataValue('external_transaction_id', encrypt(value));
            this.setDataValue('external_transaction_id_hash', generateSearchHash(value));
          } else {
            this.setDataValue('external_transaction_id', null);
            this.setDataValue('external_transaction_id_hash', null);
          }
        },
      },
      external_transaction_id_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
      type: {
        type: DataTypes.STRING(20), // 'credit' or 'debit'
        allowNull: false,
      },
      amount_encrypted: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
      },
      status: {
        // PLAID JARGON: 'pending' vs 'settled'.
        // WHY: A swiped card at a cafe is 'pending'. When the money officially moves days later, Plaid updates the status to 'settled'.
        type: DataTypes.STRING(50),
        defaultValue: 'settled',
      },
      category: {
        // PLAID JARGON: Personal Finance category.
        // WHY: Plaid automatically categorizes transactions (e.g., "Food and Drink"). We save it for user insights.
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      description_encrypted: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'transactions',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['account_id', 'transaction_date'] }, // Frontend: Viewing account history sorted by date
      ],
    }
  );

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.BankAccount, { foreignKey: 'account_id', as: 'account' });
  };

  return Transaction;
};

export default defineTransaction;
