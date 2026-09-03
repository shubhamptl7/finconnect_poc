const defineLoanApplication = (sequelize, DataTypes) => {
  const LoanApplication = sequelize.define(
    'LoanApplication',
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
      application_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      requested_amount: {
        // Integer minor units (e.g. $5,000.00 = 500000 cents)
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      requested_currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      requested_tenure_months: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      purpose: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      monthly_income: {
        // Integer minor units (cents)
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      existing_monthly_obligations: {
        // Integer minor units (cents)
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      employment_type: {
        type: DataTypes.ENUM('FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'CONTRACT', 'UNEMPLOYED', 'RETIRED', 'OTHER'),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          'DRAFT',
          'SUBMITTED',
          'VERIFICATION_PENDING',
          'VERIFIED',
          'UNDERWRITING',
          'APPROVED',
          'REJECTED',
          'OFFER_GENERATED',
          'ACCEPTED',
          'LOAN_CREATED',
          'DISBURSED',
          'CLOSED',
          'CANCELLED'
        ),
        defaultValue: 'DRAFT',
        allowNull: false,
      },
      eligibility_status: {
        type: DataTypes.ENUM('PENDING', 'ELIGIBLE', 'INELIGIBLE'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      verification_status: {
        type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'MANUAL_REVIEW'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      underwriting_status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      column_entity_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      column_loan_program_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      column_loan_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'loan_applications',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { unique: true, fields: ['application_number'] },
        { fields: ['status'] },
      ],
    }
  );

  LoanApplication.associate = (models) => {
    LoanApplication.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    LoanApplication.hasOne(models.LoanOffer, { foreignKey: 'application_id', as: 'offer' });
    LoanApplication.hasOne(models.Loan, { foreignKey: 'application_id', as: 'loan' });
    LoanApplication.hasMany(models.LoanVerification, {
      foreignKey: 'loan_application_id',
      as: 'verifications',
    });
  };

  return LoanApplication;
};

export default defineLoanApplication;
