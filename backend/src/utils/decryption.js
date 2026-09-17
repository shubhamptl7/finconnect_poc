import crypto from 'crypto';

import config from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';

/**
 * Decrypts a ciphertext string back to plaintext using AES-256-GCM.
 * @param {string|null} encryptedText The encrypted string in format: iv:authTag:ciphertext (base64)
 * @returns {string|null} The decrypted plaintext string
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Return as-is if it's not in encrypted format (legacy/development data fallback)
      return encryptedText;
    }

    const [ivBase64, authTagBase64, ciphertextBase64] = parts;
    
    const key = Buffer.from(config.encryption_key, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertextBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, log it and return the original text or null depending on strategy.
    // For now, if we are in transition, returning original text might leak, so it's better to fail securely.
    throw new Error(`Decryption failed: ${error.message}`, { cause: error });
  }
};
