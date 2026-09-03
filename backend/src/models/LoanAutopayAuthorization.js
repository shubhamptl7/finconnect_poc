const defineLoanAutopayAuthorization = (sequelize, DataTypes) => {
  const LoanAutopayAuthorization = sequelize.define(
    'LoanAutopayAuthorization',
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
      plaid_authorization_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      plaid_recurring_transfer_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      plaid_account_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ach_authorization_reference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      amount: {
        // Integer minor units (cents)
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      frequency: {
        type: DataTypes.ENUM('MONTHLY'),
        defaultValue: 'MONTHLY',
        allowNull: false,
      },
      schedule_interval: {
        type: DataTypes.STRING(50),
        defaultValue: 'MONTHLY',
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'AUTOPAY_NOT_CONFIGURED',
          'AUTHORIZATION_PENDING',
          'AUTHORIZED',
          'RECURRING_TRANSFER_CREATING',
          'ACTIVE',
          'PAUSED',
          'CANCELLED',
          'EXPIRED',
          'FAILED'
        ),
        defaultValue: 'AUTOPAY_NOT_CONFIGURED',
        allowNull: false,
      },
      authorized_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      starts_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ends_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'loan_autopay_authorizations',
      timestamps: true,
      underscored: true,
    }
  );

  LoanAutopayAuthorization.associate = (models) => {
    LoanAutopayAuthorization.belongsTo(models.Loan, { foreignKey: 'loan_id', as: 'loan' });
    LoanAutopayAuthorization.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return LoanAutopayAuthorization;
};

export default defineLoanAutopayAuthorization;
