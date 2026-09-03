import logger from '../../config/logger.js';

/**
 * Column API Base HTTP Client (Skeleton)
 * Handles authentication headers, base URL configuration, timeouts, error normalization, and idempotency.
 */
class ColumnClient {
  constructor() {
    this.baseUrl = process.env.COLUMN_BASE_URL || 'https://api.column.com';
    this.apiKey = process.env.COLUMN_API_KEY || '';
    this.environment = process.env.COLUMN_ENV || 'sandbox';
  }

  getHeaders(idempotencyKey = null) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    logger.info(`[ColumnClient] Request to ${endpoint} (${options.method || 'GET'}) [Env: ${this.environment}]`);
    // Skeleton implementation — returns null/mock in Phase 1
    return { success: true, stub: true, endpoint };
  }
}

const columnClient = new ColumnClient();
export default columnClient;
