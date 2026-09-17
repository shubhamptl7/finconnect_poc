import * as LoanController from '../controllers/loan/loanController.js';
import * as LoanEligibilityController from '../controllers/loan/loanEligibilityController.js';
import * as LoanApplicationController from '../controllers/loan/loanApplicationController.js';
import * as LoanPaymentController from '../controllers/loan/loanPaymentController.js';
import * as LoanServicingController from '../controllers/loan/loanServicingController.js';
import { authenticate } from '../middlewares/auth.js';

export default async function loanRoutes(fastify, _opts) {
  // Eligibility
  fastify.post('/eligibility/check', { preHandler: [authenticate] }, LoanEligibilityController.checkEligibility);

  // Applications
  fastify.post('/applications', { preHandler: [authenticate] }, LoanApplicationController.createApplication);
  fastify.get('/applications', { preHandler: [authenticate] }, LoanApplicationController.getApplications);
  fastify.get('/applications/:id', { preHandler: [authenticate] }, LoanApplicationController.getApplicationById);
  fastify.patch('/applications/:id', { preHandler: [authenticate] }, LoanApplicationController.updateDraft);
  fastify.post('/applications/:id/submit', { preHandler: [authenticate] }, LoanApplicationController.submitApplication);
  fastify.post('/applications/:id/accept-offer', { preHandler: [authenticate] }, LoanApplicationController.acceptOffer);
  fastify.post('/applications/:id/offers/:offerId/accept', { preHandler: [authenticate] }, LoanApplicationController.acceptOffer);

  // Active Loans
  fastify.get('/', { preHandler: [authenticate] }, LoanController.getLoans);
  fastify.get('/:id', { preHandler: [authenticate] }, LoanController.getLoanById);

  // Servicing & Payments
  fastify.get('/:id/schedule', { preHandler: [authenticate] }, LoanServicingController.getSchedule);
  fastify.get('/:id/schedule/upcoming', { preHandler: [authenticate] }, LoanServicingController.getUpcomingEmi);
  
  fastify.post('/:id/autopay/setup', { preHandler: [authenticate] }, LoanServicingController.setupAutopay);
  fastify.post('/:id/autopay/activate', { preHandler: [authenticate] }, LoanServicingController.activateAutopay);
  fastify.post('/:id/autopay/revoke', { preHandler: [authenticate] }, LoanServicingController.revokeAutopay);
  
  // Replaces the old generic processPayment with our new Plaid one
  fastify.post('/:id/payments/manual', { preHandler: [authenticate] }, LoanServicingController.initiateManualPayment);
}
