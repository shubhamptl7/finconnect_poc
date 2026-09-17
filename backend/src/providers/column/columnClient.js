/* eslint-disable n/no-unsupported-features/node-builtins */
import logger from '../../config/logger.js';
import AppError from '../../utils/appError.js';
import STATUS_CODES from '../../config/constants.js';

/**
 * Column API Base HTTP Client
 * Handles HTTP Basic Authentication (API key as password with empty username),
 * base URL configuration, idempotency headers, error normalization, and logging.
 */
class ColumnClient {
  constructor() {
    this.baseUrl = process.env.COLUMN_BASE_URL || 'https://api.column.com';
    this.apiKey = process.env.COLUMN_API_KEY || '';
    this.environment = process.env.COLUMN_ENV || 'sandbox';
  }

  /**
   * Generates HTTP headers for Column API.
   * Column uses HTTP Basic Authentication: Base64(":" + apiKey)
   *
   * @param {string|null} idempotencyKey Unique idempotency key for POST/PUT requests
   * @returns {Object} HTTP headers
   */
  getHeaders(idempotencyKey = null) {
    const authString = Buffer.from(`:${this.apiKey}`).toString('base64');
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${authString}`,
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return headers;
  }

  /**
   * Dispatches an HTTP request to Column API.
   *
   * @param {string} endpoint Path starting with / (e.g. '/entities/person')
   * @param {Object} options Fetch request options (method, body, headers)
   * @param {string|null} idempotencyKey Optional idempotency header
   * @returns {Promise<Object>} JSON response payload
   */
  async request(endpoint, options = {}, idempotencyKey = null) {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${path}`;
    const headers = {
      ...this.getHeaders(idempotencyKey),
      ...(options.headers || {}),
    };

    logger.info(`[ColumnClient] ${options.method || 'GET'} ${path} [Env: ${this.environment}]`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error(`[ColumnClient] Error ${response.status} from ${path}:`, data);
        throw new AppError(
          data.message || data.error || `Column API error (${response.status})`,
          response.status || STATUS_CODES.SERVER_ERROR,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`[ColumnClient] Request failed for ${path}: ${error.message}`);
      throw new AppError(
        `Column API request failed: ${error.message}`,
        STATUS_CODES.SERVER_ERROR
      );
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body = {}, idempotencyKey = null) {
    return this.request(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      idempotencyKey
    );
  }

  async put(endpoint, body = {}, idempotencyKey = null) {
    return this.request(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      idempotencyKey
    );
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const columnClient = new ColumnClient();
export default columnClient;
