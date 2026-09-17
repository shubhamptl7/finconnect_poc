import adminLoanService from './adminLoanService.js';
import userService from './userService.js';
import paymentService from './paymentService.js';
import auditService from './auditService.js';

export {
  adminLoanService,
  userService,
  paymentService,
  auditService,
};

export default {
  loan: adminLoanService,
  user: userService,
  payment: paymentService,
  audit: auditService,
};
