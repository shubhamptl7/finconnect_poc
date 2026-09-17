'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bank_accounts', 'bic', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Encrypted SWIFT/BIC code for international wires',
    });

    await queryInterface.addColumn('bank_accounts', 'bic_hash', {
      type: Sequelize.STRING(64),
      allowNull: true,
      comment: 'HMAC search hash for BIC code',
    });

    await queryInterface.addColumn('bank_accounts', 'account_subtype', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Account subtype (e.g., checking, savings)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('bank_accounts', 'account_subtype');
    await queryInterface.removeColumn('bank_accounts', 'bic_hash');
    await queryInterface.removeColumn('bank_accounts', 'bic');
  },
};
