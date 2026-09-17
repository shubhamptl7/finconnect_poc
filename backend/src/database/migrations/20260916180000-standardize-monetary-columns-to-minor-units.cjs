'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    // 1. Create safety snapshot backup tables before modifying anything
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts_pre_money_backup AS 
      SELECT * FROM bank_accounts;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payments_pre_money_backup AS 
      SELECT * FROM payments;
    `);

    // 2. Standardize bank_accounts currency to GBP
    await sequelize.query(`
      UPDATE bank_accounts 
      SET currency = 'GBP' 
      WHERE currency IS NULL OR currency != 'GBP';
    `);

    // 3. Convert bank_accounts current_balance and available_balance from major units to integer pence (BIGINT)
    // Scale: 1 GBP = 100 pence. E.g. 210.000 GBP -> 21000 pence
    await sequelize.query(`
      ALTER TABLE bank_accounts 
      ALTER COLUMN current_balance TYPE BIGINT 
      USING ROUND(COALESCE(current_balance, 0) * 100)::BIGINT;
    `);

    await sequelize.query(`
      ALTER TABLE bank_accounts 
      ALTER COLUMN available_balance TYPE BIGINT 
      USING ROUND(COALESCE(available_balance, 0) * 100)::BIGINT;
    `);

    // 4. Set default values and not-null constraints for bank_accounts
    await sequelize.query(`
      ALTER TABLE bank_accounts 
      ALTER COLUMN current_balance SET DEFAULT 0,
      ALTER COLUMN current_balance SET NOT NULL,
      ALTER COLUMN available_balance SET DEFAULT 0;
    `);

    // 5. Convert payments.amount from DECIMAL to BIGINT in pence
    // For rows where amount was already stored, scale by 100 (e.g. £33 -> 3300 pence).
    // If a test row was stored as >= 1000 without decimals (e.g. 5000000, 10000), preserve if already in pence or scale appropriately.
    await sequelize.query(`
      ALTER TABLE payments 
      ALTER COLUMN amount TYPE BIGINT 
      USING (
        CASE 
          WHEN amount IS NULL THEN NULL
          WHEN amount < 1000 THEN ROUND(amount * 100)::BIGINT
          ELSE ROUND(amount)::BIGINT
        END
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    // Restore from backup snapshot tables if they exist
    await sequelize.query(`
      UPDATE bank_accounts ba
      SET current_balance = b.current_balance,
          available_balance = b.available_balance,
          currency = b.currency
      FROM bank_accounts_pre_money_backup b
      WHERE ba.id = b.id;
    `);

    await sequelize.query(`
      ALTER TABLE bank_accounts 
      ALTER COLUMN current_balance TYPE DECIMAL(15, 3),
      ALTER COLUMN available_balance TYPE DECIMAL(15, 3);
    `);

    await sequelize.query(`
      UPDATE payments p
      SET amount = b.amount
      FROM payments_pre_money_backup b
      WHERE p.id = b.id;
    `);

    await sequelize.query(`
      ALTER TABLE payments 
      ALTER COLUMN amount TYPE DECIMAL(15, 3);
    `);
  },
};
