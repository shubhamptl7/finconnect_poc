import fp from 'fastify-plugin';

import config from '../config/env.js';
import db from '../models/index.js';

async function dbLifecyclePlugin(fastify, _opts) {
  fastify.addHook('onReady', async () => {
    try {
      await db.sequelize.authenticate();
      fastify.log.info(
        `Database connected successfully to: ${config.db.name} on ${config.db.host}`
      );
    } catch (error) {
      fastify.log.error('Database connection or synchronization failed!');
      fastify.log.error(error);
      throw error;
    }
  });

  fastify.addHook('onClose', async () => {
    await db.sequelize.close();
    fastify.log.info('Database connection closed cleanly.');
  });
}

export default fp(dbLifecyclePlugin);
