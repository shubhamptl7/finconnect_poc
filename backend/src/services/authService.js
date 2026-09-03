import crypto from 'crypto';
import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';
import { getEmailHTML } from '../utils/templateUtils.js';
import { sendEmail } from '../utils/email.js';
import { generateSearchHash } from '../utils/encryption.js';
import config from '../config/env.js';
import { Op } from 'sequelize';
import logger from '../config/logger.js';

const authService = {
  async register(data, metadata = {}) {
    const { name, email, password, phone, dateOfBirth } = data;
    const normalizedEmail = email.trim().toLowerCase();
    
    const existingUser = await db.User.findOne({ where: { email_hash: generateSearchHash(normalizedEmail) } });
    if (existingUser) {
      throw new AppError('Email is already registered', STATUS_CODES.CONFLICT);
    }

    const newUser = await db.User.create({
      name,
      email: normalizedEmail,
      password,
      phone_number: phone || null,
      date_of_birth: dateOfBirth || null,
      is_email_verified: false,
      e2ee_public_key: data.e2ee_public_key ? (typeof data.e2ee_public_key === 'string' ? data.e2ee_public_key : JSON.stringify(data.e2ee_public_key)) : null,
      e2ee_key_backup: data.e2ee_key_backup ? (typeof data.e2ee_key_backup === 'string' ? data.e2ee_key_backup : JSON.stringify(data.e2ee_key_backup)) : null,
    });

    // Generate email verification token
    const token = crypto.randomBytes(32).toString('hex');
    await db.VerificationToken.create({
      user_id: newUser.id,
      token,
      type: 'email_verification',
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send verification email
    const verificationUrl = `${config.frontend_url}/auth/verify-email/${token}`;
    const emailHtml = await getEmailHTML('email_verification', {
      name: name,
      url: verificationUrl
    });
    
    await sendEmail(newUser.email, 'Verify your email for PayOman', emailHtml);

    await db.AuditLog.create({
      user_id: newUser.id,
      action: 'user_registered',
      metadata
    });

    return newUser.toJSON();
  },

  async login(email, password, metadata = {}) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.User.findOne({ where: { email_hash: generateSearchHash(normalizedEmail) } });
    if (!user) {
      await db.AuditLog.create({ action: 'user_login_failed_not_found', metadata: { ...metadata, email: normalizedEmail } });
      throw new AppError('Invalid email or password', STATUS_CODES.UNAUTHORIZED);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await db.AuditLog.create({ user_id: user.id, action: 'user_login_failed_password', metadata });
      throw new AppError('Invalid email or password', STATUS_CODES.UNAUTHORIZED);
    }

    // Security Check: Block login if email is not verified
    if (!user.is_email_verified) {
      // Send a new verification email to old/unverified users
      const token = crypto.randomBytes(32).toString('hex');
      await db.VerificationToken.create({
        user_id: user.id,
        token,
        type: 'email_verification',
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      const verificationUrl = `${config.frontend_url}/auth/verify-email/${token}`;
      const emailHtml = await getEmailHTML('email_verification', {
        name: user.name,
        url: verificationUrl
      });
      
      await sendEmail(user.email, 'Verify your email for PayOman', emailHtml);

      await db.AuditLog.create({ user_id: user.id, action: 'user_login_blocked_unverified', metadata });

      throw new AppError(
        'Please verify your email before logging in. A new verification link has been sent to your inbox.',
        STATUS_CODES.FORBIDDEN,
        { code: 'EMAIL_UNVERIFIED', userId: user.id }
      );
    }

    if (user.status === 'unverified') {
      await db.AuditLog.create({ user_id: user.id, action: 'user_login_blocked_kyc', metadata });
      throw new AppError(
        'Please complete KYC verification before logging in.',
        STATUS_CODES.FORBIDDEN,
        { code: 'USER_UNVERIFIED', userId: user.id }
      );
    }

    if (user.status === 'suspended') {
      await db.AuditLog.create({ user_id: user.id, action: 'user_login_blocked_suspended', metadata });
      throw new AppError('Account suspended. Please contact support.', STATUS_CODES.FORBIDDEN);
    }

    await db.AuditLog.create({ user_id: user.id, action: 'user_login_success', metadata });

    return user.toJSON();
  },

  async verifyEmail(token, metadata = {}) {
    const verificationToken = await db.VerificationToken.findOne({
      where: {
        token,
        type: 'email_verification',
        expires_at: { [Op.gt]: new Date() },
      },
      include: [{ model: db.User, as: 'user' }],
    });

    if (!verificationToken || !verificationToken.user) {
      throw new AppError('Invalid or expired verification token', STATUS_CODES.BAD_REQUEST);
    }

    const user = verificationToken.user;
    user.is_email_verified = true;
    await user.save();

    await verificationToken.destroy(); // single use

    await db.AuditLog.create({ user_id: user.id, action: 'user_email_verified', metadata });

    return user.toJSON();
  },

  async forgotPassword(email, metadata = {}) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.User.findOne({ where: { email_hash: generateSearchHash(normalizedEmail) } });

    // Fail silently if user doesn't exist to prevent email enumeration
    if (!user) {
      logger.info(`Forgot password requested for non-existent email: ${normalizedEmail}`);
      return;
    }

    // SECURITY FIX: Also fail silently for unverified emails to prevent account enumeration.
    // Previously this threw an AppError which revealed that the account exists but is unverified.
    // Now we log internally and return silently — indistinguishable from a non-existent email.
    if (!user.is_email_verified) {
      logger.info(`Forgot password requested for unverified email: ${normalizedEmail}`);
      return;
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    await db.VerificationToken.create({
      user_id: user.id,
      token,
      type: 'password_reset',
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    const resetUrl = `${config.frontend_url}/auth/reset-password/${token}`;
    const emailHtml = await getEmailHTML('password_reset', {
      name: user.name,
      url: resetUrl
    });
    
    await sendEmail(user.email, 'Password Reset Request', emailHtml);
    await db.AuditLog.create({ user_id: user.id, action: 'user_password_reset_requested', metadata });
  },

  async resetPassword(token, newPassword, confirmPassword, metadata = {}) {
    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', STATUS_CODES.BAD_REQUEST);
    }
    
    // Strict regex validation for new password just like frontend
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,16}$/.test(newPassword)) {
      throw new AppError('Password must be 8-16 characters and contain uppercase, lowercase, number, and special character.', STATUS_CODES.BAD_REQUEST);
    }

    const verificationToken = await db.VerificationToken.findOne({
      where: {
        token,
        type: 'password_reset',
        expires_at: { [Op.gt]: new Date() },
      },
      include: [{ model: db.User, as: 'user' }],
    });

    if (!verificationToken || !verificationToken.user) {
      throw new AppError('Invalid or expired password reset token', STATUS_CODES.BAD_REQUEST);
    }

    const user = verificationToken.user;
    user.password = newPassword; // beforeSave hook hashes it
    await user.save();

    await verificationToken.destroy(); // single use
    await db.AuditLog.create({ user_id: user.id, action: 'password_changed', metadata });
  },
};

export default authService;
