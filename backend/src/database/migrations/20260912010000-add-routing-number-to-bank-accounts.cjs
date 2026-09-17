'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bank_accounts', 'routing_number', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Encrypted ABA routing number for US ACH / wire transfers',
    });

    await queryInterface.addColumn('bank_accounts', 'routing_number_hash', {
      type: Sequelize.STRING(64),
      allowNull: true,
      comment: 'HMAC search hash for routing number',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('bank_accounts', 'routing_number_hash');
    await queryInterface.removeColumn('bank_accounts', 'routing_number');
  },
};
