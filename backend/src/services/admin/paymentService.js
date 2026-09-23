import db from '../../models/index.js';

const { Op } = db.Sequelize;

const adminPaymentService = {
  /**
   * Fetches paginated payments with search, status, amount, and date filtering
   */
  async getPayments(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const where = {};

    // 1. Status filter
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }

    // 2. Amount range (in minor units / pence)
    if (query.minAmount !== undefined && query.minAmount !== '') {
      where.amount = where.amount || {};
      where.amount[Op.gte] = Number(query.minAmount);
    }
    if (query.maxAmount !== undefined && query.maxAmount !== '') {
      where.amount = where.amount || {};
      where.amount[Op.lte] = Number(query.maxAmount);
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

    // 4. Search across sender name, recipient name, or note
    const search = query.search?.trim();
    if (search) {
      where[Op.or] = [
        { recipient_name: { [Op.iLike]: `%${search}%` } },
        { note: { [Op.iLike]: `%${search}%` } },
        { '$user.name$': { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await db.Payment.findAndCountAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: db.Beneficiary, as: 'beneficiary' },
      ],
      order: [['created_at', sortOrder]],
      limit,
      offset,
      subQuery: false,
      distinct: true,
    });

    // Compute volume and status statistics
    const [totalRecords, settledRecords, initiatedRecords, settledSumResult] = await Promise.all([
      db.Payment.count(),
      db.Payment.count({ where: { status: 'settled' } }),
      db.Payment.count({ where: { status: { [Op.in]: ['initiated', 'pending'] } } }),
      db.Payment.sum('amount', { where: { status: 'settled' } }),
    ]);

    const settledVolume = Number(settledSumResult || 0);

    return {
      payments: rows,
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
      hasMore: offset + rows.length < count,
      stats: {
        total: totalRecords,
        volume: settledVolume,
        settled: settledRecords,
        initiated: initiatedRecords,
        filteredCount: count,
      },
    };
  },

  // Backward compatibility alias
  async getAllPayments(query = {}) {
    return this.getPayments(query);
  },
};

export default adminPaymentService;
