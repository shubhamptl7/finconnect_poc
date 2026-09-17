'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create loan_schedules table
    await queryInterface.createTable('loan_schedules', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      loan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'id',
        },
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
        defaultValue: 0,
      },
      scheduled_principal: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      scheduled_interest: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      paid_amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      paid_principal: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      paid_interest: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'WAIVED'),
        allowNull: false,
        defaultValue: 'PENDING',
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
      }
    });

    // 2. Create loan_autopay_authorizations table
    await queryInterface.createTable('loan_autopay_authorizations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      loan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      plaid_authorization_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      plaid_recurring_transfer_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      plaid_account_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ach_authorization_reference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'GBP',
      },
      frequency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'MONTHLY',
      },
      schedule_interval: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('AUTOPAY_NOT_CONFIGURED', 'AUTHORIZATION_PENDING', 'AUTHORIZED', 'RECURRING_TRANSFER_CREATING', 'ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'FAILED'),
        allowNull: false,
        defaultValue: 'AUTOPAY_NOT_CONFIGURED',
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
      }
    });

    // 3. Create loan_payments table
    await queryInterface.createTable('loan_payments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      loan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      column_payment_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      column_transfer_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      plaid_transfer_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amount: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      principal_amount: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      interest_amount: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'GBP',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETURNED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      payment_type: {
        type: Sequelize.ENUM('EMI', 'PRINCIPAL_ONLY', 'PAYOFF'),
        allowNull: false,
        defaultValue: 'EMI',
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
      }
    });

    // 4. Create loan_webhook_events table
    await queryInterface.createTable('loan_webhook_events', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      provider: {
        type: Sequelize.ENUM('PLAID', 'PERSONA', 'COLUMN'),
        allowNull: false,
      },
      external_event_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payload_hash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      processing_status: {
        type: Sequelize.ENUM('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED'),
        allowNull: false,
        defaultValue: 'RECEIVED',
      },
      received_at: {
        type: Sequelize.DATE,
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
      }
    });

    // Add indexes for loan_webhook_events to enforce idempotency
    await queryInterface.addIndex('loan_webhook_events', ['provider', 'external_event_id'], {
      unique: true,
      name: 'idx_webhook_events_provider_external_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('loan_webhook_events');
    await queryInterface.dropTable('loan_payments');
    await queryInterface.dropTable('loan_autopay_authorizations');
    await queryInterface.dropTable('loan_schedules');
  }
};
