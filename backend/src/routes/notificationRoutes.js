import * as NotificationController from '../controllers/notificationController.js';
import websocketService from '../services/websocketService.js';
import notificationService from '../services/notificationService.js';
import { authenticate } from '../middlewares/auth.js';

export default async function notificationRoutes(fastify, options) {
  // REST endpoints (requires JWT authentication)
  fastify.get(
    '/',
    { preHandler: [authenticate] },
    NotificationController.getNotifications
  );

  fastify.get(
    '/unread-count',
    { preHandler: [authenticate] },
    NotificationController.getUnreadCount
  );

  fastify.patch(
    '/:id/read',
    { preHandler: [authenticate] },
    NotificationController.markAsRead
  );

  fastify.patch(
    '/read-all',
    { preHandler: [authenticate] },
    NotificationController.markAllAsRead
  );

  // WebSocket endpoint
  // Authentication is handled via the handshake inside handleConnection, not via preHandler.
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    websocketService.handleConnection(connection, req, fastify);
  });
}
