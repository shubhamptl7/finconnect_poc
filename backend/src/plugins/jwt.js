import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

import config from '../config/env.js';

async function jwtPlugin(fastify, _options) {
  // SECURITY: Fail hard at startup if JWT_SECRET is not configured.
  // A missing secret would silently fall back to a publicly known key, enabling auth bypass.
  if (!config.jwt_secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  }

  fastify.register(fastifyJwt, {
    secret: config.jwt_secret,
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
    } catch (_err) {
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
