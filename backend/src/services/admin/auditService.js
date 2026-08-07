import db from '../../models/index.js';

class AdminAuditService {
  async getAllLogs() {
    return await db.AuditLog.findAll({
      include: [{ model: db.User, as: 'user', attributes: ['name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: 1000,
    });
  }
}

export default new AdminAuditService();
