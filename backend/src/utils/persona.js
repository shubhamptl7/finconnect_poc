import crypto from 'crypto';

import config from '../config/env.js';

/**
 * Verifies a Persona webhook signature.
 *
 * @param {string} signatureHeader - The 'Persona-Signature' header
 * @param {Buffer|string} rawBody - The exact raw request body
 * @returns {boolean} True if the signature is valid
 */
export const verifyPersonaSignature = (signatureHeader, rawBody) => {
  if (!signatureHeader || !rawBody) return false;

  try {
    const parts = signatureHeader.split(',');

    // Find timestamp (t=...) and signature (v1=...)
    let t = null;
    let v1 = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') t = value;
      if (key === 'v1') v1 = value;
    }

    if (!t || !v1) return false;

    // The payload to sign is `${t}.${rawBody}`
    const payload = `${t}.${rawBody.toString('utf8')}`;

    const expectedSignature = crypto
      .createHmac('sha256', config.persona_webhook_secret)
      .update(payload)
      .digest('hex');

    // Use constant-time comparison
    return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expectedSignature));
  } catch (error) {
    return false;
  }
};
