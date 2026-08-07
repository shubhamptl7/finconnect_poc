import db from '../models/index.js';
import AppError from '../utils/appError.js';
import STATUS_CODES from '../config/constants.js';
import logger from '../config/logger.js';
import { generateSearchHash } from '../utils/encryption.js';

/**
 * Beneficiary Service
 *
 * WHY THIS EXISTS:
 * Manages the user's address book of payment recipients. Each beneficiary is
 * user-scoped (a user can only read/edit/delete their own). The service also
 * automatically detects if a beneficiary is an internal PayOman user by checking
 * if their IBAN matches an existing bank_account in our database, enabling P2P.
 */
const beneficiaryService = {
  /**
   * Lists all beneficiaries belonging to the user, ordered by most recently used.
   */
  async getAll(userId) {
    return await db.Beneficiary.findAll({
      where: { user_id: userId },
      order: [['updated_at', 'DESC']],
    });
  },

  /**
   * Creates a new beneficiary.
   * Automatically checks if their IBAN is registered in our platform (internal P2P).
   */
  async create(userId, data) {
    const { name, nickname, iban, bacs_account, sort_code, bank_name, account_number } = data;

    if (!name) {
      throw new AppError('Name is required.', STATUS_CODES.BAD_REQUEST);
    }
    if (!iban && (!bacs_account || !sort_code)) {
      throw new AppError(
        'Either an IBAN or a UK Account (Sort Code & Account Number) is required.',
        STATUS_CODES.BAD_REQUEST
      );
    }

    let normalizedIban = null;
    let normalizedBacs = null;
    let normalizedSortCode = null;
    let internalAccount = null;

    if (iban) {
      normalizedIban = iban.replace(/\s/g, '').toUpperCase();
      internalAccount = await db.BankAccount.findOne({ where: { iban_hash: generateSearchHash(normalizedIban) } });
    } else {
      normalizedBacs = bacs_account.replace(/\s|-/g, '');
      normalizedSortCode = sort_code.replace(/\s|-/g, '');

      if (!/^\d{8}$/.test(normalizedBacs)) {
        throw new AppError('UK Account Number must be exactly 8 digits.', STATUS_CODES.BAD_REQUEST);
      }
      if (!/^\d{6}$/.test(normalizedSortCode)) {
        throw new AppError('Sort Code must be exactly 6 digits.', STATUS_CODES.BAD_REQUEST);
      }

      internalAccount = await db.BankAccount.findOne({
        where: {
          bacs_account_hash: generateSearchHash(normalizedBacs),
          sort_code_hash: generateSearchHash(normalizedSortCode),
        },
      });
    }

    const isInternal = !!internalAccount;

    if (isInternal) {
      logger.info(`[Beneficiary] Matched internal account — P2P enabled for this beneficiary.`);
      if (internalAccount.bacs_account && internalAccount.sort_code) {
        normalizedBacs = internalAccount.bacs_account;
        normalizedSortCode = internalAccount.sort_code;
      }
      if (internalAccount.iban) {
        normalizedIban = internalAccount.iban;
      }
    }

    const beneficiary = await db.Beneficiary.create({
      user_id: userId,
      name,
      nickname: nickname || null,
      iban: normalizedIban,
      bacs_account: normalizedBacs,
      sort_code: normalizedSortCode,
      account_number: account_number || null,
      bank_name: bank_name || null,
      is_internal: isInternal,
    });

    return beneficiary;
  },

  /**
   * Updates an existing beneficiary (only if it belongs to the user).
   */
  async update(userId, beneficiaryId, data) {
    const beneficiary = await db.Beneficiary.findOne({
      where: { id: beneficiaryId, user_id: userId },
    });

    if (!beneficiary) {
      throw new AppError('Beneficiary not found.', STATUS_CODES.NOT_FOUND);
    }

    const { name, nickname, iban, bacs_account, sort_code, bank_name, account_number } = data;

    let internalAccount = null;

    if (iban !== undefined) {
      if (iban) {
        const normalizedIban = iban.replace(/\s/g, '').toUpperCase();
        internalAccount = await db.BankAccount.findOne({ where: { iban_hash: generateSearchHash(normalizedIban) } });
        beneficiary.iban = normalizedIban;
        beneficiary.bacs_account = null;
        beneficiary.sort_code = null;
      }
    } else if (bacs_account !== undefined && sort_code !== undefined) {
      if (bacs_account && sort_code) {
        const normalizedBacs = bacs_account.replace(/\s|-/g, '');
        const normalizedSortCode = sort_code.replace(/\s|-/g, '');

        if (!/^\d{8}$/.test(normalizedBacs)) {
          throw new AppError(
            'UK Account Number must be exactly 8 digits.',
            STATUS_CODES.BAD_REQUEST
          );
        }
        if (!/^\d{6}$/.test(normalizedSortCode)) {
          throw new AppError('Sort Code must be exactly 6 digits.', STATUS_CODES.BAD_REQUEST);
        }

        internalAccount = await db.BankAccount.findOne({
          where: {
            bacs_account_hash: generateSearchHash(normalizedBacs),
            sort_code_hash: generateSearchHash(normalizedSortCode),
          },
        });
        beneficiary.bacs_account = normalizedBacs;
        beneficiary.sort_code = normalizedSortCode;
        beneficiary.iban = null;
      }
    }

    if (iban !== undefined || (bacs_account !== undefined && sort_code !== undefined)) {
      beneficiary.is_internal = !!internalAccount;
      if (internalAccount) {
        if (internalAccount.bacs_account && internalAccount.sort_code) {
          beneficiary.bacs_account = internalAccount.bacs_account;
          beneficiary.sort_code = internalAccount.sort_code;
        }
        if (internalAccount.iban) {
          beneficiary.iban = internalAccount.iban;
        }
      }
    }

    if (name !== undefined) beneficiary.name = name;
    if (nickname !== undefined) beneficiary.nickname = nickname;
    if (bank_name !== undefined) beneficiary.bank_name = bank_name;
    if (account_number !== undefined) beneficiary.account_number = account_number;

    await beneficiary.save();
    return beneficiary;
  },

  /**
   * Soft-deletes a beneficiary (paranoid: true means the record stays in DB).
   */
  async delete(userId, beneficiaryId) {
    const beneficiary = await db.Beneficiary.findOne({
      where: { id: beneficiaryId, user_id: userId },
    });

    if (!beneficiary) {
      throw new AppError('Beneficiary not found.', STATUS_CODES.NOT_FOUND);
    }

    await beneficiary.destroy(); // Soft delete via paranoid
    return { success: true };
  },
};

export default beneficiaryService;
