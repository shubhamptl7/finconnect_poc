import db from '../../models/index.js';

class AdminUserService {
  async getAllUsers() {
    // In a real scenario, this would include pagination and filtering
    return await db.User.findAll({
      attributes: ['id', 'email', 'name', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
    });
  }
}

export default new AdminUserService();
