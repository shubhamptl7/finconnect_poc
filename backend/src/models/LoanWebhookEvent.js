const defineLoanWebhookEvent = (sequelize, DataTypes) => {
  const LoanWebhookEvent = sequelize.define(
    'LoanWebhookEvent',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      provider: {
        type: DataTypes.ENUM('PLAID', 'PERSONA', 'COLUMN'),
        allowNull: false,
      },
      external_event_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      event_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      payload_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      processing_status: {
        type: DataTypes.ENUM('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED'),
        defaultValue: 'RECEIVED',
        allowNull: false,
      },
      received_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'loan_webhook_events',
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ['provider', 'external_event_id'] },
        { fields: ['processing_status'] },
      ],
    }
  );

  return LoanWebhookEvent;
};

export default defineLoanWebhookEvent;
