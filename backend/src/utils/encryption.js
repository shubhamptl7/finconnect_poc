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

/**
 * Encrypts a plaintext string using ECIES (ECDH P-256 + HKDF-SHA256 + AES-256-GCM)
 * for a specific user, returning a JSON envelope.
 * 
 * @param {string|object} userPublicKeyJwk - The recipient's public key (JWK string or object)
 * @param {string} plaintext - The data to encrypt
 * @param {string} hkdfInfo - A context string unique to the field being encrypted
 * @returns {string} The JSON envelope string
 */
export const eciesEncrypt = (userPublicKeyJwk, plaintext, hkdfInfo) => {
  if (plaintext === undefined || plaintext === null) return null;

  // 1. Parse JWK if it's a string
  const jwk = typeof userPublicKeyJwk === 'string' ? JSON.parse(userPublicKeyJwk) : userPublicKeyJwk;

  // 2. Extract uncompressed public key from JWK coordinates
  const xBuf = Buffer.from(jwk.x, 'base64url');
  const yBuf = Buffer.from(jwk.y, 'base64url');
  const recipientRawKey = Buffer.concat([ Buffer.from([0x04]), xBuf, yBuf ]);

  // 3. Generate ephemeral ECDH P-256 keypair
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();

  // 4. Compute shared secret
  const sharedSecret = ecdh.computeSecret(recipientRawKey);

  // 5. Derive AES key via HKDF
  const hkdfSalt = crypto.randomBytes(32);
  const aesKey = crypto.hkdfSync('sha256', sharedSecret, hkdfSalt, hkdfInfo, 32);

  // 6. Encrypt with AES-256-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  
  let ct = cipher.update(String(plaintext), 'utf8', 'base64url');
  ct += cipher.final('base64url');
  const tag = cipher.getAuthTag().toString('base64url');

  // 7. Get ephemeral public key as uncompressed raw buffer for the envelope (65 bytes)
  const epk = ecdh.getPublicKey('base64url', 'uncompressed');

  // 8. Build JSON envelope
  const envelope = {
    v: 1,
    alg: 'ECDH-P256-HKDF-SHA256-AES256GCM',
    epk: epk,
    hkdf_salt: hkdfSalt.toString('base64url'),
    hkdf_info: hkdfInfo,
    iv: iv.toString('base64url'),
    ct: ct,
    tag: tag
  };

  return JSON.stringify(envelope);
};
