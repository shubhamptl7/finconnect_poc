import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';

class ProfileService {
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
  }

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
  }
}

export default new ProfileService();
