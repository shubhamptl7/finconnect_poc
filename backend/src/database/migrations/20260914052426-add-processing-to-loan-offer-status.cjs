'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // In Postgres, ALTER TYPE ADD VALUE cannot run inside a transaction block,
      // but running it via raw query outside of the transaction object should work.
      await queryInterface.sequelize.query("ALTER TYPE enum_loan_offers_status ADD VALUE IF NOT EXISTS 'PROCESSING';");
    } catch (error) {
      // If the enum already exists (e.g. from manual patching), ignore the error.
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Postgres does not support removing values from an ENUM type easily.
    // It requires creating a new type, altering the column to use the new type, and dropping the old type.
    // For this migration, down is intentionally left blank.
    console.log("Removing enum values is not natively supported in Postgres. Down migration skipped.");
  }
};
