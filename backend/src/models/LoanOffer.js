const defineLoanOffer = (sequelize, DataTypes) => {
  const LoanOffer = sequelize.define(
    'LoanOffer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      application_id: {
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
      approved_amount: {
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
      estimated_emi: {
        // Integer minor units (cents)
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      total_interest: {
        // Integer minor units (cents)
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      total_repayment: {
        // Integer minor units (cents)
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('OFFERED', 'PROCESSING', 'ACCEPTED', 'REJECTED', 'EXPIRED'),
        defaultValue: 'OFFERED',
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      accepted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'loan_offers',
      timestamps: true,
      underscored: true,
      indexes: [{ fields: ['application_id'] }, { fields: ['user_id'] }],
    }
  );

  LoanOffer.associate = (models) => {
    LoanOffer.belongsTo(models.LoanApplication, { foreignKey: 'application_id', as: 'application' });
    LoanOffer.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return LoanOffer;
};

export default defineLoanOffer;
