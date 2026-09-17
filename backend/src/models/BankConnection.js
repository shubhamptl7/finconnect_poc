import { encrypt, generateSearchHash } from '../utils/encryption.js';
import { decrypt } from '../utils/decryption.js';

const defineBankConnection = (sequelize, DataTypes) => {
  const BankConnection = sequelize.define(
    'BankConnection',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      provider_name: {
        type: DataTypes.STRING(100), // e.g., 'plaid'
        allowNull: false,
      },
      bank_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      item_id: {
        // PLAID JARGON: 'Item ID' represents a single bank login connection.
        // WHY: Plaid uses this ID when sending webhooks (e.g., "New transactions available for Item X").
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          return decrypt(this.getDataValue('item_id'));
        },
        set(value) {
          if (value) {
            this.setDataValue('item_id', encrypt(value));
            this.setDataValue('item_id_hash', generateSearchHash(value));
          } else {
            this.setDataValue('item_id', null);
            this.setDataValue('item_id_hash', null);
          }
        },
      },
      item_id_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
      institution_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      access_token: {
        // PLAID JARGON: The permanent secret key to fetch data from the bank.
        // WHY: Unlike standard OAuth, Plaid tokens don't expire. We use this token for all Plaid API calls.
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          return decrypt(this.getDataValue('access_token'));
        },
        set(value) {
          this.setDataValue('access_token', value ? encrypt(value) : null);
        },
      },
      sync_cursor: {
        // PLAID JARGON: A 'cursor' is a bookmark for syncing transactions.
        // WHY: Plaid's /transactions/sync endpoint uses this so we only download *new* transactions instead of the whole 5-year history every time.
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: 'active',
      },
    },
    {
      tableName: 'bank_connections',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['user_id'] }, // Frontend: Dashboard loading connected banks
      ],
    }
  );

  BankConnection.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.access_token;
    delete values.item_id;
    delete values.item_id_hash;
    return values;
  };

  BankConnection.associate = (models) => {
    BankConnection.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    BankConnection.hasMany(models.BankAccount, {
      foreignKey: 'connection_id',
      as: 'accounts',
      onDelete: 'CASCADE',
    });
  };

  return BankConnection;
};

export default defineBankConnection;
