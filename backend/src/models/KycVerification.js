import { encrypt, generateSearchHash } from '../utils/encryption.js';
import { decrypt } from '../utils/decryption.js';

const defineKycVerification = (sequelize, DataTypes) => {
  const KycVerification = sequelize.define(
    'KycVerification',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      provider_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'failed'),
        defaultValue: 'pending',
      },
      provider_reference_id: {
        // PERSONA JARGON: This stores Persona's "inquiry_id" (e.g., inq_xyz123).
        // WHY: When Persona finishes checking an ID card, they send a webhook with this ID. We match it here to approve the user.
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          return decrypt(this.getDataValue('provider_reference_id'));
        },
        set(value) {
          if (value) {
            this.setDataValue('provider_reference_id', encrypt(value));
            this.setDataValue('provider_reference_id_hash', generateSearchHash(value));
          } else {
            this.setDataValue('provider_reference_id', null);
            this.setDataValue('provider_reference_id_hash', null);
          }
        },
      },
      provider_reference_id_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
      provider_data: {
        // PERSONA JARGON: Webhook payload dump.
        // WHY: Persona extracts data from ID cards (like confidence scores or expiry dates). We securely store the raw JSON here without needing rigid DB columns.
        type: DataTypes.TEXT, // Changed from JSONB to store encrypted text
        allowNull: true,
        get() {
          const raw = this.getDataValue('provider_data');
          if (!raw) return raw;
          try {
            return JSON.parse(decrypt(raw));
          } catch (e) {
            return null;
          }
        },
        set(value) {
          this.setDataValue('provider_data', value ? encrypt(JSON.stringify(value)) : null);
        },
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'kyc_verifications',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['user_id'] }, // Frontend: Check if user is verified on login
      ],
    }
  );

  KycVerification.associate = (models) => {
    KycVerification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return KycVerification;
};

export default defineKycVerification;
