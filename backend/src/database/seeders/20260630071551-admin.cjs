'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-gcm';

const encrypt = (text) => {
  if (!text) return text;
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
};

const generateSearchHash = (text) => {
  if (!text) return text;
  const key = Buffer.from(process.env.SEARCH_HASH_KEY, 'hex');
  return crypto.createHmac('sha256', key).update(String(text).toLowerCase().trim()).digest('hex');
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Admin@1234', 10);
    const emailVal = 'admin@finconnect.com';

    await queryInterface.bulkInsert(
      'users',
      [
        {
          id: uuidv4(),
          name: 'System Admin',
          email: encrypt(emailVal),
          email_hash: generateSearchHash(emailVal),
          password: hashedPassword,
          role: 'admin',
          status: 'active',
          preferences: JSON.stringify({ theme: 'light', notifications: true }),
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          is_email_verified: true,
        },
      ],
      {
        fields: [
          'id',
          'name',
          'email',
          'email_hash',
          'password',
          'role',
          'status',
          'preferences',
          'created_at',
          'updated_at',
          'deleted_at',
          'is_email_verified',
        ],
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email_hash: generateSearchHash('admin@finconnect.com') }, {});
  },
};
