const defineLoanPayment = (sequelize, DataTypes) => {
  const LoanPayment = sequelize.define(
    'LoanPayment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      loan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      column_payment_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      column_transfer_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      plaid_transfer_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      amount: {
        // Integer minor units (cents)
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      principal_amount: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      interest_amount: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETURNED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      payment_type: {
        type: DataTypes.ENUM('EMI', 'PRINCIPAL_ONLY', 'PAYOFF'),
        defaultValue: 'EMI',
        allowNull: false,
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      tableName: 'loan_payments',
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ['loan_id'] }, { fields: ['user_id'] }, { fields: ['status'] }],
    }
  );

  LoanPayment.associate = (models) => {
    LoanPayment.belongsTo(models.Loan, { foreignKey: 'loan_id', as: 'loan' });
    LoanPayment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return LoanPayment;
};

export default defineLoanPayment;
