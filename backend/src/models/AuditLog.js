const defineAuditLog = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      action: {
        type: DataTypes.STRING(150), // e.g., 'user_login_failed', 'payment_initiated'
        allowNull: false,
      },
      metadata: {
        // SECURITY JARGON: Immutable context container.
        // WHY: We store context like IP address, browser info, or before/after state to prevent fraud.
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'audit_logs',
      timestamps: true,
      updatedAt: false, // Audit logs are append-only. No 'updated_at' column for strict security compliance.
      underscored: true,
      indexes: [
        { fields: ['user_id', 'created_at'] }, // Admin Portal: Fast querying of security events
      ],
    }
  );

  AuditLog.associate = (models) => {
    // user_id can be null because system actions might not be tied to a specific logged-in user
    AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user', constraints: false });
  };

  return AuditLog;
};

export default defineAuditLog;
