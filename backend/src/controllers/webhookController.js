import crypto from 'crypto';

import { importJWK, jwtVerify, decodeProtectedHeader } from 'jose';

import logger from '../config/logger.js';
import STATUS_CODES from '../config/constants.js';
import webhookService from '../services/webhookService.js';
import columnWebhookService from '../services/loan/columnWebhookService.js';
import { loanWebhookService } from '../services/loan/loanWebhookService.js';
import plaidClient from '../providers/plaid/plaidClient.js';

// Size-bounded, TTL-aware cache for Plaid public verification keys.
// Max 50 entries, 1-hour TTL — prevents memory exhaustion from fabricated key IDs.
const KEY_CACHE_MAX = 50;
const KEY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

class BoundedKeyCache {
  constructor() {
    this._store = new Map(); // Map<keyId, { key, expiresAt }>
  }

  get(keyId) {
    const entry = this._store.get(keyId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(keyId);
      return null;
    }
    return entry.key;
  }

  set(keyId, key) {
    // Evict oldest entry if at capacity
    if (this._store.size >= KEY_CACHE_MAX) {
      const firstKey = this._store.keys().next().value;
      this._store.delete(firstKey);
    }
    this._store.set(keyId, { key, expiresAt: Date.now() + KEY_CACHE_TTL_MS });
  }

  has(keyId) {
    return this.get(keyId) !== null;
  }
}

const keyCache = new BoundedKeyCache();

/**
 * Helper function to get Plaid's public key by Key ID.
 */
async function getPlaidKey(keyId) {
  const cached = keyCache.get(keyId);
  if (cached) return cached;

  const response = await plaidClient.webhookVerificationKeyGet({ key_id: keyId });
  const key = await importJWK(response.data.key);
  keyCache.set(keyId, key);
  return key;
}

/**
 * Handles incoming webhooks from Plaid.
 * Plaid sends these events asynchronously when payments settle or transactions are ready to sync.
 */
export const handlePlaidWebhook = async (request, reply) => {
  try {
    const payload = request.body;
    const verificationHeader = request.headers['plaid-verification'];

    // 1. Check if verification header exists
    if (!verificationHeader) {
      logger.warn('[WebhookController] Missing plaid-verification header.');
      return reply.code(STATUS_CODES.UNAUTHORIZED).send({ error: 'Missing signature' });
    }

    // 2. Decode the header to get the key ID
    const protectedHeader = decodeProtectedHeader(verificationHeader);
    const keyId = protectedHeader.kid;

    if (protectedHeader.alg !== 'ES256') {
      logger.warn(`[WebhookController] Unsupported alg: ${protectedHeader.alg}`);
      return reply.code(STATUS_CODES.UNAUTHORIZED).send({ error: 'Invalid algorithm' });
    }

    // 3. Fetch the public key from Plaid
    const publicKey = await getPlaidKey(keyId);

    // 4. Verify the JWT signature
    const { payload: jwtPayload } = await jwtVerify(verificationHeader, publicKey);

    // 5. Verify the request body hash
    const requestBodyHash = crypto
      .createHash('sha256')
      .update(request.rawBody || JSON.stringify(request.body))
      .digest('hex');

    if (jwtPayload.request_body_sha256 !== requestBodyHash) {
      logger.error('[WebhookController] Webhook body hash mismatch. Possible tampering.');
      return reply.code(STATUS_CODES.UNAUTHORIZED).send({ error: 'Hash mismatch' });
    }

    // 6. Verify the timestamp (must be within the last 5 minutes)
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 5 * 60;
    if (jwtPayload.iat < fiveMinutesAgo) {
      logger.error('[WebhookController] Webhook timestamp is too old. Possible replay attack.');
      return reply.code(STATUS_CODES.UNAUTHORIZED).send({ error: 'Expired webhook' });
    }

    // Log the incoming webhook event at the controller level for observability
    logger.info(
      `[WebhookController] Verified webhook from Plaid. Type: [${payload.webhook_type}], Code: [${payload.webhook_code}]`
    );

    // Delegate business logic and processing to the service layer
    await webhookService.processPlaidWebhook(payload);
    
    // Also delegate to the Loan Service layer (it has its own idempotency)
    await loanWebhookService.processPlaidWebhook(payload);

    // Always respond with 200 OK so Plaid knows we successfully received and processed it
    return reply.code(STATUS_CODES.OK).send({ received: true });
  } catch (error) {
    logger.error(`[WebhookController] Webhook processing failed: ${error.message}`, {
      error: error.stack,
    });

    // Return 500 INTERNAL SERVER ERROR so Plaid knows we failed and will retry with exponential backoff.
    // This is critical to ensure zero data loss (e.g. dropped payment settlements).
    return reply
      .code(STATUS_CODES.SERVER_ERROR)
      .send({ error: 'Internal processing error' });
  }
};

/**
 * Handles incoming webhooks from Column BaaS.
 * Receives transfer.completed, transfer.settled, disbursement.completed events.
 */
export const handleColumnWebhook = async (request, reply) => {
  try {
    const signature = request.headers['column-signature'] || request.headers['x-column-signature'];
    const body = request.body || {};
    const rawBody = request.rawBody || JSON.stringify(body);

    const isValid = columnWebhookService.verifySignature(signature, rawBody);
    if (!isValid && process.env.NODE_ENV === 'production') {
      logger.warn('[WebhookController] Invalid Column signature');
      return reply.code(STATUS_CODES.UNAUTHORIZED).send({ error: 'Invalid Column signature' });
    }

    const result = await columnWebhookService.processEvent(body);
    return reply.code(STATUS_CODES.OK).send({ received: true, ...result });
  } catch (error) {
    logger.error(`[WebhookController] Column Webhook error: ${error.message}`);
    return reply.code(STATUS_CODES.SERVER_ERROR).send({ error: 'Internal processing error' });
  }
};
