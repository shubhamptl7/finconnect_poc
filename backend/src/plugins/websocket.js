import fp from 'fastify-plugin';
import fastifyWebsocket from '@fastify/websocket';

export default fp(async (fastify, _opts) => {
  fastify.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB
      // Other global options can go here
    }
  });
});
