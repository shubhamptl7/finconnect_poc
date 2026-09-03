'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop existing data as decided to start fresh with new schema
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('payments', null, {});
    // Users are kept, but they won't have keys yet.

    // 1. users table changes
    await queryInterface.addColumn('users', 'e2ee_public_key', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'e2ee_key_backup', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'key_version', {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });

    // 2. transactions table changes
    await queryInterface.addColumn('transactions', 'description_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('transactions', 'amount_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    // Remove plaintext columns from transactions
    await queryInterface.removeColumn('transactions', 'description');
    await queryInterface.removeColumn('transactions', 'amount');

    // 3. payments table changes
    await queryInterface.addColumn('payments', 'amount_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('payments', 'note_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('payments', 'recipient_name_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    // We KEEP the plaintext amount, note, recipient_name columns on payments
    // because they are needed for the temporary processing window.
    // They are updated to allow NULL.
    await queryInterface.changeColumn('payments', 'amount', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.changeColumn('payments', 'note', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.changeColumn('payments', 'recipient_name', {
      type: Sequelize.STRING(150),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // 1. Revert users
    await queryInterface.removeColumn('users', 'e2ee_public_key');
    await queryInterface.removeColumn('users', 'e2ee_key_backup');
    await queryInterface.removeColumn('users', 'key_version');

    // 2. Revert transactions
    await queryInterface.addColumn('transactions', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('transactions', 'amount', {
      type: Sequelize.DECIMAL(15, 3), // According to typical old schema
      allowNull: true
    });
    await queryInterface.removeColumn('transactions', 'description_encrypted');
    await queryInterface.removeColumn('transactions', 'amount_encrypted');

    // 3. Revert payments
    await queryInterface.removeColumn('payments', 'amount_encrypted');
    await queryInterface.removeColumn('payments', 'note_encrypted');
    await queryInterface.removeColumn('payments', 'recipient_name_encrypted');
    await queryInterface.changeColumn('payments', 'amount', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};
