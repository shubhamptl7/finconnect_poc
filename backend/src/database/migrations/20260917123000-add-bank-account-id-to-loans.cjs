'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('loans');
    if (!table.bank_account_id) {
      await queryInterface.addColumn('loans', 'bank_account_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'bank_accounts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Designated bank account tied to this loan for disbursement and EMI auto-debit',
      });
    }

    // Backfill loans.bank_account_id from loan_applications.bank_account_id for existing loans
    await queryInterface.sequelize.query(`
      UPDATE loans l
      SET bank_account_id = la.bank_account_id
      FROM loan_applications la
      WHERE l.application_id = la.id
        AND la.bank_account_id IS NOT NULL
        AND l.bank_account_id IS NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('loans');
    if (table.bank_account_id) {
      await queryInterface.removeColumn('loans', 'bank_account_id');
    }
  },
};
