const defineLoanVerification = (sequelize, DataTypes) => {
  const LoanVerification = sequelize.define(
    'LoanVerification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      loan_application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'loan_applications',
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
      verification_type: {
        type: DataTypes.ENUM('IDENTITY', 'INCOME_ESTIMATE', 'BANK_ACCOUNT', 'FINANCIAL_ANALYSIS', 'CREDIT'),
        allowNull: false,
      },
      provider: {
        type: DataTypes.ENUM('PERSONA', 'PLAID', 'COLUMN', 'FINCONNECT'),
        allowNull: false,
      },
      provider_reference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'PASSED', 'FAILED', 'MANUAL_REVIEW'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      result: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'loan_verifications',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['loan_application_id'] },
        { fields: ['user_id'] },
        { fields: ['verification_type'] },
      ],
    }
  );

  LoanVerification.associate = (models) => {
    LoanVerification.belongsTo(models.LoanApplication, {
      foreignKey: 'loan_application_id',
      as: 'application',
    });
    LoanVerification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return LoanVerification;
};

export default defineLoanVerification;
