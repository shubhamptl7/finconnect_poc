import logger from '../config/logger.js';
import pubSub from '../providers/pubsub/InMemoryPubSubProvider.js';

const connections = new Map();

// Subscribe to PubSub megaphone
pubSub.subscribe('USER_NOTIFICATION', (message) => {
  try {
    const payload = JSON.parse(message);
    websocketService._deliverToLocalConnections(payload.userId, payload.data);
  } catch (err) {
    logger.error(`Error parsing pubsub message: ${err.message}`);
  }
});

const websocketService = {
  connections,

  /**
   * Called by our fastify websocket plugin when a new raw connection is established
   */
  handleConnection(connection, request, fastify) {
    const socket = connection;
    let socketUserId = null;

    const doAuth = async () => {
      // 1. Authentication via HttpOnly Cookie (Sent automatically on upgrade)
      const token = request.cookies?.token;
      if (!token) throw new Error('No auth cookie');

      // Verify JWT signature
      const decoded = fastify.jwt.verify(token);
      const userId = decoded.id;

      // SECURITY FIX: Fetch fresh user from DB to enforce account status checks.
      const { default: db } = await import('../models/index.js');
      const user = await db.User.findByPk(userId);

      if (!user) throw new Error('User no longer exists');
      if (user.status === 'suspended') throw new Error('Account suspended');
      if (!user.is_email_verified) throw new Error('Email not verified');

      return userId;
    };

    doAuth()
      .then((userId) => {
        socketUserId = userId;
        this._addConnection(socketUserId, socket);
        socket.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
      })
      .catch((err) => {
        // "No auth cookie" is normal for unauthenticated / logged-out browser tabs
        // (also doubled by React StrictMode double-mount in development).
        // Only log genuine security anomalies — expired tokens, suspended accounts, etc.
        if (err.message !== 'No auth cookie') {
          logger.warn(`WebSocket auth rejected: ${err.message}`);
        }
        socket.send(JSON.stringify({ type: 'ERROR', message: 'Authentication failed' }));
        socket.close(4401, 'Authentication failed');
      });

    socket.on('message', async (message) => {
      try {
        const _payload = JSON.parse(message);
        // logger.info(`Received WS message from User ${socketUserId}:`, _payload);
      } catch (err) {
        logger.error(`Failed to parse incoming WS message: ${err.message}`);
      }
    });

    socket.on('close', () => {
      if (socketUserId) {
        this._removeConnection(socketUserId, socket);
      }
    });
  },

  /**
   * Called by backend services when an action happens to a user
   */
  sendToUser(userId, payload) {
    pubSub.publish('USER_NOTIFICATION', JSON.stringify({ userId, data: payload }));
  },

  notifyUser(userId, payload) {
    this.sendToUser(userId, payload);
  },

  // --- Internal Connection Management ---

  _addConnection(userId, socket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(socket);
    logger.info(`User ${userId} connected to WebSockets. Connections for this user: ${this.connections.get(userId).size} | Total unique users online: ${this.connections.size}`);
  },

  _removeConnection(userId, socket) {
    if (this.connections.has(userId)) {
      const userSockets = this.connections.get(userId);
      userSockets.delete(socket);
      if (userSockets.size === 0) {
        this.connections.delete(userId);
      }
      logger.info(`User ${userId} disconnected from WebSockets. Connections remaining for this user: ${userSockets.size} | Total unique users online: ${this.connections.size}`);
    }
  },

  _deliverToLocalConnections(userId, payload) {
    if (this.connections.has(userId)) {
      const userSockets = this.connections.get(userId);
      for (const socket of userSockets) {
        if (socket.readyState === 1) { // OPEN
          socket.send(JSON.stringify(payload));
        }
      }
    }
  },
};

export default websocketService;
