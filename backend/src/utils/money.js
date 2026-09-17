/**
 * Unified Financial Money Value Object & Currency Utilities
 * Standard: British Pound (GBP - £)
 * Minor Unit: Pence (1 GBP = 100 Pence)
 * Storage: PostgreSQL BIGINT (Integer Pence)
 */

export class Money {
  /**
   * @param {bigint|number|string} amountPence - Amount in integer pence (e.g. 500000 for £5,000.00)
   * @param {string} currency - Standard currency code (defaults to 'GBP')
   */
  constructor(amountPence, currency = 'GBP') {
    this.currency = (currency || 'GBP').toUpperCase();
    // Safely parse string/number/bigint from PostgreSQL or API
    const rawNum = typeof amountPence === 'bigint' 
      ? Number(amountPence) 
      : Math.round(Number(amountPence) || 0);
    
    this.pence = isNaN(rawNum) || !isFinite(rawNum) ? 0 : rawNum;
  }

  /**
   * Creates a Money instance from database minor units (pence)
   * Handles string from Sequelize BIGINT: Money.fromPence("21132")
   */
  static fromPence(pence, currency = 'GBP') {
    return new Money(pence, currency);
  }

  static fromMinor(minor, currency = 'GBP') {
    return new Money(minor, currency);
  }

  /**
   * Creates a Money instance from major currency units (pounds float)
   * E.g. Money.fromPounds(77.50) -> 7750 pence
   */
  static fromPounds(pounds, currency = 'GBP') {
    const raw = Number(pounds) || 0;
    const pence = Math.round(raw * 100);
    return new Money(pence, currency);
  }

  static fromMajor(major, currency = 'GBP') {
    return Money.fromPounds(major, currency);
  }

  /**
   * Arithmetic addition
   */
  add(other) {
    const otherPence = other instanceof Money ? other.toPence() : Math.round(Number(other) || 0);
    return new Money(this.pence + otherPence, this.currency);
  }

  /**
   * Arithmetic subtraction
   */
  subtract(other) {
    const otherPence = other instanceof Money ? other.toPence() : Math.round(Number(other) || 0);
    return new Money(this.pence - otherPence, this.currency);
  }

  /**
   * Arithmetic multiplication
   */
  multiply(factor) {
    const mult = Number(factor) || 0;
    return new Money(Math.round(this.pence * mult), this.currency);
  }

  /**
   * Returns integer pence for DB storage or minor unit APIs
   * @returns {number}
   */
  toPence() {
    return this.pence;
  }

  toMinor() {
    return this.pence;
  }

  toBigInt() {
    return BigInt(this.pence);
  }

  /**
   * Returns major currency units (pounds float)
   * @returns {number}
   */
  toPounds() {
    return this.pence / 100;
  }

  toMajor() {
    return this.toPounds();
  }

  /**
   * Formats into standard British currency display: £X,XXX.XX
   * @returns {string}
   */
  toFormatted() {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.toPounds());
  }

  toJSON() {
    return {
      pence: this.pence,
      pounds: this.toPounds(),
      currency: this.currency,
      formatted: this.toFormatted(),
    };
  }

  toString() {
    return this.toFormatted();
  }
}

/**
 * Functional helpers
 */
export function poundsToPence(pounds) {
  return Money.fromPounds(pounds).toPence();
}

export function penceToPounds(pence) {
  return Money.fromPence(pence).toPounds();
}

export function formatPence(pence) {
  return Money.fromPence(pence).toFormatted();
}

export function formatPounds(pounds) {
  return Money.fromPounds(pounds).toFormatted();
}

export default Money;
