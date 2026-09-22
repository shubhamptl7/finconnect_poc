import * as LoanController from '../controllers/loan/loanController.js';
import * as LoanEligibilityController from '../controllers/loan/loanEligibilityController.js';
import * as LoanApplicationController from '../controllers/loan/loanApplicationController.js';
import * as LoanServicingController from '../controllers/loan/loanServicingController.js';
import { authenticate } from '../middlewares/auth.js';
import {
  checkEligibilitySchema,
  createApplicationSchema,
  updateDraftSchema,
  idParamSchema,
  acceptOfferSchema,
  setupOfferAutopaySchema,
  activateAutopaySchema,
  manualPaymentSchema,
} from '../validations/loanValidation.js';

export default async function loanRoutes(fastify, _opts) {
  // Eligibility
  fastify.post('/eligibility/check', { preHandler: [authenticate], ...checkEligibilitySchema }, LoanEligibilityController.checkEligibility);

  // Applications
  fastify.post('/applications', { preHandler: [authenticate], ...createApplicationSchema }, LoanApplicationController.createApplication);
  fastify.get('/applications', { preHandler: [authenticate] }, LoanApplicationController.getApplications);
  fastify.get('/applications/:id', { preHandler: [authenticate], ...idParamSchema }, LoanApplicationController.getApplicationById);
  fastify.patch('/applications/:id', { preHandler: [authenticate], ...updateDraftSchema }, LoanApplicationController.updateDraft);
  fastify.post('/applications/:id/submit', { preHandler: [authenticate], ...idParamSchema }, LoanApplicationController.submitApplication);
  fastify.post('/applications/:id/setup-autopay', { preHandler: [authenticate], ...setupOfferAutopaySchema }, LoanApplicationController.setupOfferAutopay);
  fastify.post('/applications/:id/offers/:offerId/setup-autopay', { preHandler: [authenticate], ...setupOfferAutopaySchema }, LoanApplicationController.setupOfferAutopay);
  fastify.post('/applications/:id/accept-offer', { preHandler: [authenticate], ...acceptOfferSchema }, LoanApplicationController.acceptOffer);
  fastify.post('/applications/:id/offers/:offerId/accept', { preHandler: [authenticate], ...acceptOfferSchema }, LoanApplicationController.acceptOffer);

  // Active Loans
  fastify.get('/', { preHandler: [authenticate] }, LoanController.getLoans);
  fastify.get('/:id', { preHandler: [authenticate], ...idParamSchema }, LoanController.getLoanById);

  // Servicing & Payments
  fastify.get('/:id/schedule', { preHandler: [authenticate], ...idParamSchema }, LoanServicingController.getSchedule);
  fastify.get('/:id/schedule/upcoming', { preHandler: [authenticate], ...idParamSchema }, LoanServicingController.getUpcomingEmi);
  
  fastify.post('/:id/autopay/setup', { preHandler: [authenticate], ...idParamSchema }, LoanServicingController.setupAutopay);
  fastify.post('/:id/autopay/activate', { preHandler: [authenticate], ...activateAutopaySchema }, LoanServicingController.activateAutopay);
  fastify.post('/:id/autopay/revoke', { preHandler: [authenticate], ...idParamSchema }, LoanServicingController.revokeAutopay);
  
  // Plaid manual repayment
  fastify.post('/:id/payments/manual', { preHandler: [authenticate], ...manualPaymentSchema }, LoanServicingController.initiateManualPayment);
}
