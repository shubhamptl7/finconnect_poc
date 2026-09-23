import db from '../../models/index.js';

const { Op } = db.Sequelize;

const adminAuditService = {
  /**
   * Fetches paginated audit logs with search, actor filtering, action categorization, and date filtering
   */
  async getLogs(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const where = {};

    // 1. Action / Category filter
    if (query.action && query.action !== 'all') {
      where.action = { [Op.iLike]: `%${query.action}%` };
    }

    // 2. Actor Type: all | user | system
    if (query.actorType === 'user') {
      where.user_id = { [Op.ne]: null };
    } else if (query.actorType === 'system') {
      where.user_id = null;
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

    // 4. Multi-field search (action or user name)
    const search = query.search?.trim();
    if (search) {
      where[Op.or] = [
        { action: { [Op.iLike]: `%${search}%` } },
        { '$user.name$': { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await db.AuditLog.findAndCountAll({
      where,
      include: [{ model: db.User, as: 'user', attributes: ['id', 'name', 'email', 'status', 'role'] }],
      order: [['created_at', sortOrder]],
      limit,
      offset,
      subQuery: false,
      distinct: true,
    });

    // Overview statistics for dashboard/header counters
    const [totalUserActions, totalSystemEvents] = await Promise.all([
      db.AuditLog.count({ where: { user_id: { [Op.ne]: null } } }),
      db.AuditLog.count({ where: { user_id: null } }),
    ]);

    return {
      logs: rows,
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
      hasMore: offset + rows.length < count,
      stats: {
        total: totalUserActions + totalSystemEvents,
        userActions: totalUserActions,
        systemEvents: totalSystemEvents,
        filteredCount: count,
      },
    };
  },

  // Backward compatibility alias
  async getAllLogs(query = {}) {
    return this.getLogs(query);
  },
};

export default adminAuditService;
