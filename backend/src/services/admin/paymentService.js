import db from '../../models/index.js';

class AdminPaymentService {
  async getAllPayments() {
    return await db.Payment.findAll({
      include: [
        { model: db.User, as: 'user', attributes: ['name', 'email'] },
        { model: db.Beneficiary, as: 'beneficiary' }
      ],
      order: [['created_at', 'DESC']],
    });
  }
}

export default new AdminPaymentService();
