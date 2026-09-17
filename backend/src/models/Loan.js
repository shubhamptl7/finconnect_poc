const defineLoan = (sequelize, DataTypes) => {
  const Loan = sequelize.define(
    'Loan',
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
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'loan_applications',
          key: 'id',
        },
      },
      bank_account_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'bank_accounts',
          key: 'id',
        },
      },
      column_loan_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      column_entity_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      column_loan_program_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      column_funding_bank_account_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      column_collection_bank_account_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      original_principal: {
        // Integer minor units (cents)
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      interest_rate_bps: {
        // Basis points (e.g. 1000 = 10.00%)
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tenure_months: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      maturity_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'ACTIVE', 'DELINQUENT', 'CHARGED_OFF', 'PAID_OFF', 'CLOSED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      disbursement_status: {
        type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      // Local Read Model (Cached Provider Balances)
      principal_outstanding: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      principal_paid: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      interest_paid: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      last_synced_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'loans',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['application_id'] },
        { fields: ['bank_account_id'] },
        { fields: ['column_loan_id'] },
        { fields: ['status'] },
      ],
    }
  );

  Loan.associate = (models) => {
    Loan.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Loan.belongsTo(models.LoanApplication, { foreignKey: 'application_id', as: 'application' });
    Loan.belongsTo(models.BankAccount, { foreignKey: 'bank_account_id', as: 'bankAccount' });
    Loan.hasMany(models.LoanPayment, { foreignKey: 'loan_id', as: 'payments' });
    Loan.hasMany(models.LoanSchedule, { foreignKey: 'loan_id', as: 'schedules' });
    Loan.hasOne(models.LoanAutopayAuthorization, { foreignKey: 'loan_id', as: 'autopay' });
  };

  return Loan;
};

export default defineLoan;
