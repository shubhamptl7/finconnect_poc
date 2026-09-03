import * as LoanController from '../controllers/loan/loanController.js';
import * as LoanEligibilityController from '../controllers/loan/loanEligibilityController.js';
import * as LoanApplicationController from '../controllers/loan/loanApplicationController.js';
import * as LoanPaymentController from '../controllers/loan/loanPaymentController.js';
import * as LoanCalculatorController from '../controllers/loan/loanCalculatorController.js';
import { authenticate } from '../middlewares/auth.js';

export default async function loanRoutes(fastify, _opts) {
  // Eligibility
  fastify.post('/eligibility/check', { preHandler: [authenticate] }, LoanEligibilityController.checkEligibility);

  // Applications
  fastify.post('/applications', { preHandler: [authenticate] }, LoanApplicationController.createApplication);
  fastify.get('/applications', { preHandler: [authenticate] }, LoanApplicationController.getApplications);

  // Active Loans
  fastify.get('/', { preHandler: [authenticate] }, LoanController.getLoans);
  fastify.get('/:id', { preHandler: [authenticate] }, LoanController.getLoanById);

  // Payments
  fastify.post('/:id/payments', { preHandler: [authenticate] }, LoanPaymentController.processPayment);

  // Calculators
  fastify.get('/calculators/emi', LoanCalculatorController.calculateEmi);
}
