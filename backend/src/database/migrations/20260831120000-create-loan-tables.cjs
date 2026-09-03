'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 0. column_customer_accounts
    await queryInterface.createTable('column_customer_accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      column_entity_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      column_bank_account_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      column_account_number_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 1. loan_applications
    await queryInterface.createTable('loan_applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      application_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      requested_amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      requested_currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      requested_tenure_months: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      purpose: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      monthly_income: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      existing_monthly_obligations: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      employment_type: {
        type: Sequelize.ENUM('FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'CONTRACT', 'UNEMPLOYED', 'RETIRED', 'OTHER'),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
          'DRAFT',
          'SUBMITTED',
          'VERIFICATION_PENDING',
          'VERIFIED',
          'UNDERWRITING',
          'APPROVED',
          'REJECTED',
          'OFFER_GENERATED',
          'ACCEPTED',
          'LOAN_CREATED',
          'DISBURSED',
          'CLOSED',
          'CANCELLED'
        ),
        defaultValue: 'DRAFT',
        allowNull: false,
      },
      eligibility_status: {
        type: Sequelize.ENUM('PENDING', 'ELIGIBLE', 'INELIGIBLE'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      verification_status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'MANUAL_REVIEW'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      underwriting_status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      column_entity_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      column_loan_program_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      column_loan_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 2. loan_offers
    await queryInterface.createTable('loan_offers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'loan_applications', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      approved_amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      interest_rate_bps: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tenure_months: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      estimated_emi: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      total_interest: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      total_repayment: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'),
        defaultValue: 'OFFERED',
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 3. loans
    await queryInterface.createTable('loans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'loan_applications', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      column_loan_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      column_entity_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      column_loan_program_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      column_funding_bank_account_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      column_collection_bank_account_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      original_principal: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      interest_rate_bps: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tenure_months: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      maturity_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'ACTIVE', 'DELINQUENT', 'CHARGED_OFF', 'PAID_OFF', 'CLOSED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      disbursement_status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      principal_outstanding: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      principal_paid: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      interest_paid: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      last_synced_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 4. loan_payments
    await queryInterface.createTable('loan_payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      loan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'loans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      column_payment_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      column_transfer_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      plaid_transfer_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      principal_amount: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      interest_amount: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETURNED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      payment_type: {
        type: Sequelize.ENUM('EMI', 'PRINCIPAL_ONLY', 'PAYOFF'),
        defaultValue: 'EMI',
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 5. loan_schedules
    await queryInterface.createTable('loan_schedules', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      loan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'loans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      installment_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      scheduled_amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      scheduled_principal: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      scheduled_interest: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      paid_amount: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      paid_principal: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      paid_interest: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'WAIVED'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 6. loan_verifications
    await queryInterface.createTable('loan_verifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      loan_application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'loan_applications', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      verification_type: {
        type: Sequelize.ENUM('IDENTITY', 'INCOME_ESTIMATE', 'BANK_ACCOUNT', 'FINANCIAL_ANALYSIS', 'CREDIT'),
        allowNull: false,
      },
      provider: {
        type: Sequelize.ENUM('PERSONA', 'PLAID', 'COLUMN', 'FINCONNECT'),
        allowNull: false,
      },
      provider_reference: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PASSED', 'FAILED', 'MANUAL_REVIEW'),
        defaultValue: 'PENDING',
        allowNull: false,
      },
      result: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 7. loan_webhook_events
    await queryInterface.createTable('loan_webhook_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      provider: {
        type: Sequelize.ENUM('PLAID', 'PERSONA', 'COLUMN'),
        allowNull: false,
      },
      external_event_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      payload_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      processing_status: {
        type: Sequelize.ENUM('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED'),
        defaultValue: 'RECEIVED',
        allowNull: false,
      },
      received_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 8. loan_autopay_authorizations
    await queryInterface.createTable('loan_autopay_authorizations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      loan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'loans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      plaid_authorization_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      plaid_recurring_transfer_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      plaid_account_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ach_authorization_reference: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      frequency: {
        type: Sequelize.ENUM('MONTHLY'),
        defaultValue: 'MONTHLY',
        allowNull: false,
      },
      schedule_interval: {
        type: Sequelize.STRING(50),
        defaultValue: 'MONTHLY',
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'AUTOPAY_NOT_CONFIGURED',
          'AUTHORIZATION_PENDING',
          'AUTHORIZED',
          'RECURRING_TRANSFER_CREATING',
          'ACTIVE',
          'PAUSED',
          'CANCELLED',
          'EXPIRED',
          'FAILED'
        ),
        defaultValue: 'AUTOPAY_NOT_CONFIGURED',
        allowNull: false,
      },
      authorized_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      starts_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('loan_autopay_authorizations');
    await queryInterface.dropTable('loan_webhook_events');
    await queryInterface.dropTable('loan_verifications');
    await queryInterface.dropTable('loan_schedules');
    await queryInterface.dropTable('loan_payments');
    await queryInterface.dropTable('loans');
    await queryInterface.dropTable('loan_offers');
    await queryInterface.dropTable('loan_applications');
    await queryInterface.dropTable('column_customer_accounts');

    // Drop PostgreSQL ENUM types safely
    const enumTypes = [
      'enum_column_customer_accounts_status',
      'enum_loan_applications_employment_type',
      'enum_loan_applications_status',
      'enum_loan_applications_eligibility_status',
      'enum_loan_applications_verification_status',
      'enum_loan_applications_underwriting_status',
      'enum_loan_offers_status',
      'enum_loans_status',
      'enum_loans_disbursement_status',
      'enum_loan_payments_status',
      'enum_loan_payments_payment_type',
      'enum_loan_schedules_status',
      'enum_loan_verifications_verification_type',
      'enum_loan_verifications_provider',
      'enum_loan_verifications_status',
      'enum_loan_webhook_events_provider',
      'enum_loan_webhook_events_processing_status',
      'enum_loan_autopay_authorizations_frequency',
      'enum_loan_autopay_authorizations_status',
    ];

    for (const enumType of enumTypes) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE;`);
    }
  },
};
