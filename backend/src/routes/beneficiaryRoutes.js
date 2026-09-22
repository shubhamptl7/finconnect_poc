import * as BeneficiaryController from '../controllers/beneficiaryController.js';
import { authenticate } from '../middlewares/auth.js';
import {
  createBeneficiarySchema,
  updateBeneficiarySchema,
  deleteBeneficiarySchema,
} from '../validations/paymentValidation.js';

export default async function beneficiaryRoutes(fastify, _opts) {
  fastify.get('/', { preHandler: authenticate }, BeneficiaryController.index);
  fastify.post('/', { preHandler: authenticate, ...createBeneficiarySchema }, BeneficiaryController.create);
  fastify.put('/:id', { preHandler: authenticate, ...updateBeneficiarySchema }, BeneficiaryController.update);
  fastify.delete('/:id', { preHandler: authenticate, ...deleteBeneficiarySchema }, BeneficiaryController.remove);
}
