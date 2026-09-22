/* eslint-disable n/no-unsupported-features/node-builtins */
import logger from '../config/logger.js';

// 10-minute in-memory cache to prevent rate-limiting while keeping rates live and fresh
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

const BASELINE_FALLBACK_RATES = {
  GBP_USD: 1.33,
  USD_GBP: 0.75,
  EUR_USD: 1.08,
  USD_EUR: 0.92,
};

const liveFxService = {
  /**
   * Fetches the real-time live exchange rate between two currencies using open-source FX APIs.
   * Primary: open.er-api.com (ExchangeRate-API open access)
   * Fallback: api.frankfurter.dev (European Central Bank open-source API)
   *
   * @param {string} from - Source currency code (e.g., 'GBP')
   * @param {string} to - Target currency code (e.g., 'USD')
   * @returns {Promise<number>} Real-time exchange rate
   */
  async getExchangeRate(from = 'GBP', to = 'USD') {
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    if (fromCode === toCode) {
      return 1.0;
    }

    const pairKey = `${fromCode}_${toCode}`;
    const cached = cache.get(pairKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.rate;
    }

    // 1. Primary: open.er-api.com
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${fromCode}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.result === 'success' && data.rates?.[toCode]) {
          const rate = Number(data.rates[toCode]);
          logger.info(`[liveFxService] Fetched live FX rate via open.er-api: 1 ${fromCode} = ${rate} ${toCode}`);
          cache.set(pairKey, { rate, expiresAt: Date.now() + CACHE_TTL_MS });
          return rate;
        }
      }
    } catch (primaryErr) {
      logger.warn(`[liveFxService] Primary FX API (open.er-api) failed: ${primaryErr.message}. Trying Frankfurter...`);
    }

    // 2. Secondary Fallback: api.frankfurter.dev
    try {
      const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${fromCode}&symbols=${toCode}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.rates?.[toCode]) {
          const rate = Number(data.rates[toCode]);
          logger.info(`[liveFxService] Fetched live FX rate via Frankfurter: 1 ${fromCode} = ${rate} ${toCode}`);
          cache.set(pairKey, { rate, expiresAt: Date.now() + CACHE_TTL_MS });
          return rate;
        }
      }
    } catch (secondaryErr) {
      logger.warn(`[liveFxService] Secondary FX API (Frankfurter) failed: ${secondaryErr.message}.`);
    }

    // 3. Fallback to expired cache if available
    if (cached) {
      logger.warn(`[liveFxService] Using expired cached rate for ${pairKey}: ${cached.rate}`);
      return cached.rate;
    }

    // 4. Fallback baseline if external APIs are completely unreachable
    const fallbackRate = BASELINE_FALLBACK_RATES[pairKey] || 1.30;
    logger.warn(`[liveFxService] External FX APIs unreachable. Using safe baseline rate for ${pairKey}: ${fallbackRate}`);
    return fallbackRate;
  },

  /**
   * Converts an amount in minor units (cents/pence) using the live exchange rate.
   *
   * @param {Object} params
   * @param {number} params.amountMinor - Source amount in integer minor units (e.g. 500000 pence for £5,000)
   * @param {string} params.fromCurrency - Source currency code (e.g. 'GBP')
   * @param {string} params.toCurrency - Destination currency code (e.g. 'USD')
   * @returns {Promise<{ convertedAmountMinor: number, rate: number }>}
   */
  async convertAmount({ amountMinor, fromCurrency = 'GBP', toCurrency = 'USD' }) {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmountMinor = Math.round(Number(amountMinor) * rate);
    return {
      convertedAmountMinor,
      rate,
    };
  },
};

export default liveFxService;
