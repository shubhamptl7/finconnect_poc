'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add ADMIN_REVIEW_PENDING to status ENUM if PostgreSQL ENUM exists
    try {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_loan_applications_status" ADD VALUE IF NOT EXISTS 'ADMIN_REVIEW_PENDING';
      `);
    } catch (enumErr) {
      console.warn('Enum value addition warning (may already exist or not be PG enum):', enumErr.message);
    }

    // 2. Add Phase 2 Underwriting & Admin Approval columns to loan_applications
    await queryInterface.addColumn('loan_applications', 'verified_monthly_income', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn('loan_applications', 'verified_monthly_debt', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    await queryInterface.addColumn('loan_applications', 'verified_dti_bps', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('loan_applications', 'system_recommendation', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn('loan_applications', 'system_recommendation_reason', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn('loan_applications', 'approved_by_admin_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('loan_applications', 'admin_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('loan_applications', 'admin_notes');
    await queryInterface.removeColumn('loan_applications', 'approved_by_admin_id');
    await queryInterface.removeColumn('loan_applications', 'system_recommendation_reason');
    await queryInterface.removeColumn('loan_applications', 'system_recommendation');
    await queryInterface.removeColumn('loan_applications', 'verified_dti_bps');
    await queryInterface.removeColumn('loan_applications', 'verified_monthly_debt');
    await queryInterface.removeColumn('loan_applications', 'verified_monthly_income');
  },
};
