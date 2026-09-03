import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';

const profileService = {
  async updateProfile(userId, data) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', STATUS_CODES.NOT_FOUND);
    }

    const { name, phone_number, date_of_birth, preferences } = data;

    if (name !== undefined) user.name = name;
    if (phone_number !== undefined) user.phone_number = phone_number || null;
    if (date_of_birth !== undefined) user.date_of_birth = date_of_birth || null;
    
    if (preferences !== undefined) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }

    await user.save();
    return user.toJSON();
  },

  async changePassword(userId, data) {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError('Current password, new password, and confirm password are required', STATUS_CODES.BAD_REQUEST);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('New password and confirm password do not match', STATUS_CODES.BAD_REQUEST);
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', STATUS_CODES.NOT_FOUND);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Incorrect current password', STATUS_CODES.UNAUTHORIZED);
    }

    user.password = newPassword;
    await user.save();
    
    return true;
  },

  async verifyPassword(userId, password) {
    if (!password) {
      throw new AppError('Password is required', STATUS_CODES.BAD_REQUEST);
    }
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', STATUS_CODES.NOT_FOUND);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Incorrect account password', STATUS_CODES.UNAUTHORIZED);
    }
    return true;
  },

  async updateE2eeKey(userId, data) {
    const { e2ee_public_key, e2ee_key_backup } = data;

    if (!e2ee_public_key || !e2ee_key_backup) {
      throw new AppError('e2ee_public_key and e2ee_key_backup are required', STATUS_CODES.BAD_REQUEST);
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', STATUS_CODES.NOT_FOUND);
    }

    user.e2ee_public_key = typeof e2ee_public_key === 'string' ? e2ee_public_key : JSON.stringify(e2ee_public_key);
    user.e2ee_key_backup = typeof e2ee_key_backup === 'string' ? e2ee_key_backup : JSON.stringify(e2ee_key_backup);
    
    await user.save();

    return { success: true };
  },

  async consumeEmergencySlot(userId, slotId) {
    return await db.sequelize.transaction(async (t) => {
      const user = await db.User.findByPk(userId, { transaction: t, lock: true });
      if (!user) {
        throw new AppError('User not found', STATUS_CODES.NOT_FOUND);
      }

      if (!user.e2ee_key_backup) {
        throw new AppError('No E2EE key backup found for user', STATUS_CODES.BAD_REQUEST);
      }

      let backupData;
      try {
        backupData = typeof user.e2ee_key_backup === 'string'
          ? JSON.parse(user.e2ee_key_backup)
          : user.e2ee_key_backup;
      } catch (e) {
        throw new AppError('Invalid key backup format on server', STATUS_CODES.SERVER_ERROR);
      }

      // Normalize legacy backup format if needed
      if (!backupData.slots) {
        backupData = {
          version: 2,
          slots: [{ id: 'primary', type: 'primary', status: 'AVAILABLE', ...backupData }]
        };
      }

      // Find the requested slot (by id or emergency index)
      const slot = backupData.slots.find(
        s => s.id === slotId || 
        (slotId === '1' || slotId === 1 ? s.id === 'emergency_1' : false) ||
        (slotId === '2' || slotId === 2 ? s.id === 'emergency_2' : false)
      );
      
      if (!slot) {
        throw new AppError(`Emergency slot '${slotId}' not found`, STATUS_CODES.NOT_FOUND);
      }

      // IDEMPOTENCY CHECK:
      // If already consumed, return success without error so retries succeed safely
      if (slot.status === 'CONSUMED') {
        const activeEmergencySlots = backupData.slots.filter(s => s.type === 'emergency' && s.status === 'AVAILABLE');
        return {
          alreadyConsumed: true,
          consumedSlotId: slot.id,
          remainingEmergencyCount: activeEmergencySlots.length,
          slots: backupData.slots
        };
      }

      // ATOMIC CONSUMPTION:
      // Mark as CONSUMED and strip encrypted ciphertext from server
      slot.status = 'CONSUMED';
      delete slot.ct;
      delete slot.tag;
      delete slot.iv;

      user.e2ee_key_backup = JSON.stringify(backupData);
      await user.save({ transaction: t });

      const activeEmergencySlots = backupData.slots.filter(s => s.type === 'emergency' && s.status === 'AVAILABLE');

      return {
        alreadyConsumed: false,
        consumedSlotId: slot.id,
        remainingEmergencyCount: activeEmergencySlots.length,
        slots: backupData.slots
      };
    });
  },
};

export default profileService;
