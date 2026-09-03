const defineLoanSchedule = (sequelize, DataTypes) => {
  const LoanSchedule = sequelize.define(
    'LoanSchedule',
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
      installment_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      scheduled_amount: {
        // Integer minor units (cents)
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      scheduled_principal: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      scheduled_interest: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      paid_amount: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      paid_principal: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      paid_interest: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'WAIVED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
    },
    {
      tableName: 'loan_schedules',
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ['loan_id', 'installment_number'] },
        { fields: ['due_date'] },
      ],
    }
  );

  LoanSchedule.associate = (models) => {
    LoanSchedule.belongsTo(models.Loan, { foreignKey: 'loan_id', as: 'loan' });
  };

  return LoanSchedule;
};

export default defineLoanSchedule;
