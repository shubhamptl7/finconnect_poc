'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Users Table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      email_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      phone_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      phone_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
      },
      date_of_birth: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      role: {
        type: Sequelize.ENUM('admin', 'user'),
        defaultValue: 'user',
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'unverified'),
        defaultValue: 'unverified',
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 2. KycVerifications Table
    await queryInterface.createTable('kyc_verifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      provider_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'failed'),
        defaultValue: 'pending',
      },
      provider_reference_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      provider_reference_id_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
      },
      provider_data: {
        type: Sequelize.TEXT,
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

    // 3. BankConnections Table
    await queryInterface.createTable('bank_connections', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      provider_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      bank_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      item_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      item_id_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
      },
      institution_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sync_cursor: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'active',
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

    // 4. BankAccounts Table
    await queryInterface.createTable('bank_accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      connection_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'bank_connections', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      external_account_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      external_account_id_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      account_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      account_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      iban: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      iban_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      bacs_account: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bacs_account_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      sort_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sort_code_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
      },
      current_balance: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: false,
      },
      available_balance: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: true,
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

    // 5. Beneficiaries Table
    await queryInterface.createTable('beneficiaries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      nickname: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      account_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      iban: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      iban_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      bacs_account: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      bacs_account_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      sort_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sort_code_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      bank_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      is_internal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      external_recipient_id: {
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 6. Payments Table
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      beneficiary_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'beneficiaries', key: 'id' },
        onDelete: 'SET NULL',
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'bank_accounts', key: 'id' },
        onDelete: 'SET NULL',
      },
      amount: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending',
      },
      provider_reference: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      provider_reference_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      note: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_internal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      recipient_iban: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      recipient_bacs_account: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      recipient_sort_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      recipient_name: {
        type: Sequelize.STRING(150),
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

    // 7. Transactions Table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'bank_accounts', key: 'id' },
        onDelete: 'CASCADE',
      },
      external_transaction_id: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      external_transaction_id_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
      },
      type: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'settled',
      },
      category: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      transaction_date: {
        type: Sequelize.DATE,
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

    // 8. AuditLogs Table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      action: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 9. Notifications Table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      type: {
        type: Sequelize.STRING(50),
        defaultValue: 'general',
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

    // 10. VerificationTokens Table
    await queryInterface.createTable('verification_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
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

    // Indexes
    await queryInterface.addIndex('bank_accounts', ['connection_id', 'external_account_id_hash'], {
      unique: true,
      name: 'bank_accounts_connection_id_external_account_id_hash',
    });
    await queryInterface.addIndex('bank_accounts', ['user_id']);
    await queryInterface.addIndex('transactions', ['account_id', 'transaction_date']);
    await queryInterface.addIndex('payments', ['user_id', 'created_at']);
    await queryInterface.addIndex('kyc_verifications', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['user_id', 'created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('verification_tokens');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('beneficiaries');
    await queryInterface.dropTable('bank_accounts');
    await queryInterface.dropTable('bank_connections');
    await queryInterface.dropTable('kyc_verifications');
    await queryInterface.dropTable('users');
  },
};
