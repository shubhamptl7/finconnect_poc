import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

import config from '../config/env.js';

async function jwtPlugin(fastify, options) {
  fastify.register(fastifyJwt, {
    secret: config.jwt_secret || 'super_secret_fallback_key_for_dev_only',
    cookie: {
      cookieName: 'token',
      signed: false, // Ensure we don't accidentally sign the JWT string again as a fastify-cookie
    },
    sign: {
      expiresIn: '1d', // Force global 1-day expiry for all JWTs
    }
  });

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply
        .status(401)
        .send({ error: 'Unauthorized', message: 'Invalid or missing token.' });
    }
  });
}

export default fp(jwtPlugin, {
  name: 'jwt-plugin',
  dependencies: ['@fastify/cookie'],
});
