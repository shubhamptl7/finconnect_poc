import fp from 'fastify-plugin';
import compress from '@fastify/compress';

export default fp(async (fastify) => {
  await fastify.register(compress);
});
