'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('notifications');
    if (!table.action_url) {
      await queryInterface.addColumn('notifications', 'action_url', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Frontend route or deep link navigated to when clicking this notification',
      });
    }
    if (!table.metadata) {
      await queryInterface.addColumn('notifications', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Arbitrary structured contextual data (e.g. applicationId, loanId, amount)',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('notifications');
    if (table.action_url) {
      await queryInterface.removeColumn('notifications', 'action_url');
    }
    if (table.metadata) {
      await queryInterface.removeColumn('notifications', 'metadata');
    }
  },
};
