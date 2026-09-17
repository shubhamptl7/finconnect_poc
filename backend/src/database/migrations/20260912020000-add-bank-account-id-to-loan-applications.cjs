'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('loan_applications');
    if (!table.bank_account_id) {
      await queryInterface.addColumn('loan_applications', 'bank_account_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'bank_accounts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Selected bank account for open banking verification and loan disbursement',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('loan_applications');
    if (table.bank_account_id) {
      await queryInterface.removeColumn('loan_applications', 'bank_account_id');
    }
  },
};
