/**
 * Unified Frontend Currency & Monetary Engine
 * Standard: British Pound (GBP - £)
 * Minor Unit: Pence (1 GBP = 100 Pence)
 * Storage: PostgreSQL BIGINT (Integer Pence)
 */

/**
 * Formats integer pence (minor units from DB / API) into standard British currency display: £X,XXX.XX
 * E.g. formatPence(21000) -> "£210.00"
 *      formatPence(500000) -> "£5,000.00"
 *      formatPence("21132") -> "£211.32"
 * 
 * @param {number|string|bigint} pence - Amount in minor units (pence)
 * @returns {string} Formatted currency string
 */
export function formatPence(pence) {
  const num = typeof pence === 'number' ? pence : parseFloat(pence || 0);
  const pounds = (isNaN(num) ? 0 : num) / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pounds);
}

export const formatMinor = formatPence;

/**
 * Formats major currency units (pounds float) into currency display: £X,XXX.XX
 * E.g. formatPounds(210) -> "£210.00"
 * 
 * @param {number|string} pounds - Amount in major units (pounds)
 * @returns {string} Formatted currency string
 */
export function formatPounds(pounds) {
  const num = typeof pounds === 'number' ? pounds : parseFloat(pounds || 0);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

export const formatMajor = formatPounds;

/**
 * Converts user input (e.g. typing "77" or "77.50" into a form) into integer pence for API submission
 * E.g. poundsToPence("77") -> 7700
 *      poundsToPence("77.50") -> 7750
 * 
 * @param {string|number} poundsInput 
 * @returns {number} Integer pence
 */
export function poundsToPence(poundsInput) {
  const num = parseFloat(poundsInput);
  return isNaN(num) || !isFinite(num) ? 0 : Math.round(num * 100);
}

export const inputToMinor = poundsToPence;

/**
 * Converts integer pence into major pounds float (e.g. for sliders or numeric inputs)
 * E.g. penceToPounds(7700) -> 77
 * 
 * @param {number|string} pence 
 * @returns {number} Floating-point pounds
 */
export function penceToPounds(pence) {
  const num = typeof pence === 'number' ? pence : parseFloat(pence || 0);
  return (isNaN(num) ? 0 : num) / 100;
}

export const minorToMajor = penceToPounds;

/**
 * Generic currency formatter (defaults to GBP, supports opts.isMinor)
 * @param {number|string} amount - Monetary amount (major units by default)
 * @param {string} [currency='GBP'] - ISO currency code
 * @param {object} [opts={}] - Formatting options (e.g. { isMinor: true })
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'GBP', opts = {}) {
  if (opts.isMinor) {
    return formatPence(amount);
  }
  const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}
