import fp from 'fastify-plugin';
import cors from '@fastify/cors';

import config from '../config/env.js';

const allowedOrigins = config.allowed_origins.split(',').map((origin) => origin.trim());

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
});
