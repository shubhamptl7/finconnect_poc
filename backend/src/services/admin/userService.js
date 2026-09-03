import db from '../../models/index.js';

const adminUserService = {
  async getAllUsers() {
    return await db.User.findAll({
      attributes: ['id', 'email', 'name', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
    });
  },
};

export default adminUserService;
