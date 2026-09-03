const defineColumnCustomerAccount = (sequelize, DataTypes) => {
  const ColumnCustomerAccount = sequelize.define(
    'ColumnCustomerAccount',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      column_entity_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      column_bank_account_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      column_account_number_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
    },
    {
      tableName: 'column_customer_accounts',
      timestamps: true,
      underscored: true,
    }
  );

  ColumnCustomerAccount.associate = (models) => {
    ColumnCustomerAccount.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return ColumnCustomerAccount;
};

export default defineColumnCustomerAccount;
