import * as BeneficiaryController from '../controllers/beneficiaryController.js';
import { authenticate } from '../middlewares/auth.js';

export default async function beneficiaryRoutes(fastify, _opts) {
  fastify.get('/', { preHandler: authenticate }, BeneficiaryController.index);
  fastify.post('/', { preHandler: authenticate }, BeneficiaryController.create);
  fastify.put('/:id', { preHandler: authenticate }, BeneficiaryController.update);
  fastify.delete('/:id', { preHandler: authenticate }, BeneficiaryController.remove);
}
