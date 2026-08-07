import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import { generateSearchHash } from '../utils/encryption.js';

const kycService = {
  /**
   * Processes webhook events from Persona
   * @param {Object} payload - The parsed JSON payload from Persona
   */
  async processWebhook(payload) {
    const { data } = payload;
    logger.info('data: ', data);
    if (!data || data.type !== 'event') {
      return { success: false, message: 'Invalid payload structure' };
    }

    const eventName = data.attributes.name;
    const inquiry = data.attributes.payload?.data;

    if (!inquiry || inquiry.type !== 'inquiry') {
      return { success: false, message: 'Payload does not contain inquiry data' };
    }

    const referenceId =
      inquiry.attributes['reference-id'] ||
      inquiry.attributes.referenceId ||
      inquiry.attributes.reference_id;

    if (!referenceId) {
      logger.error(
        `Persona Webhook Error: No referenceId found in inquiry attributes:`,
        inquiry.attributes
      );
      return { success: false, message: 'No referenceId provided in inquiry' };
    }

    const user = await db.User.findByPk(referenceId);
    if (!user) {
      logger.warn(`Persona Webhook Warning: User ${referenceId} not found`);
      return { success: false, message: `User with id ${referenceId} not found` };
    }

    // Log the inquiry into the KycVerification table for auditing
    const providerReferenceId = inquiry.id; // e.g. "inq_xyz123"
    let [kycRecord, created] = await db.KycVerification.findOrCreate({
      where: { provider_reference_id_hash: generateSearchHash(providerReferenceId) },
      defaults: {
        user_id: user.id,
        provider_name: 'persona',
        status: 'pending',
        provider_data: payload,
      },
    });

    // In Persona sandbox, 'inquiry.completed' is commonly used if auto-approve isn't set up.
    if (eventName === 'inquiry.approved' || eventName === 'inquiry.completed') {
      user.status = 'active';
      await user.save();

      kycRecord.status = 'approved';
      kycRecord.verified_at = new Date();
      kycRecord.provider_data = payload;
      await kycRecord.save();

      return { success: true, message: 'User activated successfully' };
    } else if (eventName === 'inquiry.declined' || eventName === 'inquiry.failed') {
      user.status = 'suspended';
      await user.save();

      kycRecord.status = 'failed';
      kycRecord.provider_data = payload;
      await kycRecord.save();

      return { success: true, message: 'User suspended due to failed KYC' };
    } else {
      kycRecord.provider_data = payload;
      await kycRecord.save();

      logger.warn(`Persona Webhook: Unhandled event type ${eventName}`);
      return { success: true, message: `Unhandled event type: ${eventName}` };
    }
  },
};

export default kycService;
