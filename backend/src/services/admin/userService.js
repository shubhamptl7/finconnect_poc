import db from '../../models/index.js';
import AppError from '../../utils/appError.js';
import STATUS_CODES from '../../config/constants.js';
import { generateSearchHash } from '../../utils/encryption.js';

const { Op } = db.Sequelize;

const adminUserService = {
  /**
   * Fetches paginated customers with multi-attribute filtering, search, and identity stats
   */
  async getUsers(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const where = {};

    // 1. Role filter (default to users if not specified, or allow all)
    if (query.role && query.role !== 'all') {
      where.role = query.role;
    }

    // 2. Status filter
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    // 3. Date range filter
    if (query.startDate || query.endDate) {
      where.created_at = {};
      if (query.startDate) {
        where.created_at[Op.gte] = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    // 4. Search filter by name or email hash
    const search = query.search?.trim();
    if (search) {
      const emailHash = generateSearchHash(search.toLowerCase());
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email_hash: emailHash },
      ];
    }

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: [
        'id',
        'email',
        'name',
        'status',
        'role',
        'is_email_verified',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: db.BankAccount,
          as: 'bank_accounts',
          attributes: ['id', 'account_name', 'account_subtype', 'currency', 'current_balance'],
          required: false,
        },
        {
          model: db.KycVerification,
          as: 'kyc_verifications',
          attributes: ['id', 'status', 'provider_name', 'created_at'],
          required: false,
        },
      ],
      order: [['created_at', sortOrder]],
      limit,
      offset,
      distinct: true,
    });

    // Overview counters for metrics bar
    const [totalUsers, activeUsers, verifiedKycCount, pendingUsers] = await Promise.all([
      db.User.count({ where: { role: 'user' } }),
      db.User.count({ where: { role: 'user', status: 'active' } }),
      db.KycVerification.count({ where: { status: 'approved' } }),
      db.User.count({ where: { role: 'user', status: { [Op.ne]: 'active' } } }),
    ]);

    return {
      users: rows,
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
      hasMore: offset + rows.length < count,
      stats: {
        total: totalUsers,
        active: activeUsers,
        verifiedKyc: verifiedKycCount,
        pending: pendingUsers,
        filteredCount: count,
      },
    };
  },

  // Backward compatibility alias
  async getAllUsers(query = {}) {
    return this.getUsers(query);
  },

  /**
   * Fetches detailed profile of a single user
   */
  async getUserDetails(userId) {
    const user = await db.User.findByPk(userId, {
      attributes: [
        'id',
        'email',
        'name',
        'phone_number',
        'date_of_birth',
        'status',
        'role',
        'is_email_verified',
        'created_at',
        'updated_at',
      ],
      include: [
        {
          model: db.BankAccount,
          as: 'bank_accounts',
          attributes: ['id', 'account_name', 'account_subtype', 'currency', 'current_balance', 'created_at'],
        },
        {
          model: db.KycVerification,
          as: 'kyc_verifications',
          attributes: ['id', 'status', 'provider_name', 'created_at'],
        },
        {
          model: db.LoanApplication,
          as: 'loan_applications',
          attributes: ['id', 'application_number', 'requested_amount', 'status', 'created_at'],
        },
      ],
    });

    if (!user) {
      throw new AppError('User not found', STATUS_CODES.NOT_FOUND);
    }
    return user;
  },

  /**
   * Updates user status (active, suspended, unverified) and logs an audit trail
   */
  async updateUserStatus(adminUserId, targetUserId, newStatus) {
    const allowed = ['active', 'suspended', 'unverified'];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid status. Must be one of: ${allowed.join(', ')}`,
        STATUS_CODES.BAD_REQUEST
      );
    }

    const user = await db.User.findByPk(targetUserId);
    if (!user) {
      throw new AppError('User not found', STATUS_CODES.NOT_FOUND);
    }

    const previousStatus = user.status;
    user.status = newStatus;
    await user.save();

    // Log the security event to immutable AuditLog
    await db.AuditLog.create({
      user_id: adminUserId,
      action: 'ADMIN_USER_STATUS_UPDATE',
      metadata: {
        targetUserId,
        previousStatus,
        newStatus,
        timestamp: new Date().toISOString(),
      },
    });

    return user;
  },
};

export default adminUserService;
