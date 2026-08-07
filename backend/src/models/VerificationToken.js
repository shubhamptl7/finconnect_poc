const defineVerificationToken = (sequelize, DataTypes) => {
  const VerificationToken = sequelize.define(
    'VerificationToken',
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
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM('email_verification', 'password_reset'),
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'verification_tokens',
      timestamps: true,
      underscored: true,
    }
  );

  VerificationToken.associate = (models) => {
    VerificationToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return VerificationToken;
};

export default defineVerificationToken;
