import crypto from 'crypto';
import config from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param {string|null} text
 * @returns {string|null} The encrypted string in format: iv:authTag:ciphertext (base64)
 */
export const encrypt = (text) => {
  if (!text) return text;
  
  // Ensure the encryption key is a buffer
  const key = Buffer.from(config.encryption_key, 'base64');
  
  // Generate random Initialization Vector
  const iv = crypto.randomBytes(16);
  
  // Create Cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt
  let encrypted = cipher.update(String(text), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get Auth Tag (for GCM)
  const authTag = cipher.getAuthTag().toString('base64');
  
  // Return combined string
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
};

/**
 * Generates a deterministic, non-reversible blind index for searchable fields (like email).
 * Uses HMAC-SHA-256.
 * @param {string|null} text
 * @returns {string|null} Hex representation of the hash
 */
export const generateSearchHash = (text) => {
  if (!text) return text;
  
  const key = Buffer.from(config.search_hash_key, 'hex');
  return crypto.createHmac('sha256', key).update(String(text).toLowerCase().trim()).digest('hex');
};
