import Fastify from 'fastify';
import fastifyRawBody from 'fastify-raw-body';

import errorHandler from './middlewares/errorHandler.js';
import STATUS_CODES from './config/constants.js';
import helmetPlugin from './plugins/helmet.js';
import corsPlugin from './plugins/cors.js';
import dbPlugin from './plugins/database.js';
import cookiePlugin from './plugins/cookie.js';
import compressPlugin from './plugins/compress.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import jwtPlugin from './plugins/jwt.js';
import websocketPlugin from './plugins/websocket.js';
import routes from './routes/index.js';
import logger from './config/logger.js';

const app = Fastify({
  loggerInstance: logger,
  trustProxy: true,
  disableRequestLogging: true,
  forceCloseConnections: true,
});

app.setErrorHandler(errorHandler);

app.register(helmetPlugin);
app.register(compressPlugin);
app.register(rateLimitPlugin);
app.register(cookiePlugin);
app.register(jwtPlugin);
app.register(corsPlugin);
app.register(dbPlugin);
app.register(websocketPlugin);

app.register(fastifyRawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true,
});

app.register(routes, {
  prefix: '/api/v1',
});

app.setNotFoundHandler(async (request, reply) => {
  return reply.status(STATUS_CODES.NOT_FOUND).send({
    status: 'error',
    message: 'Route Not Found',
    statusCode: STATUS_CODES.NOT_FOUND,
  });
});

export default app;
