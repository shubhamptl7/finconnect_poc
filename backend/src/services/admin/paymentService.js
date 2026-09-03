import db from '../../models/index.js';

const adminPaymentService = {
  async getAllPayments() {
    return await db.Payment.findAll({
      include: [
        { model: db.User, as: 'user', attributes: ['name', 'email'] },
        { model: db.Beneficiary, as: 'beneficiary' }
      ],
      order: [['created_at', 'DESC']],
    });
  },
};

export default adminPaymentService;
