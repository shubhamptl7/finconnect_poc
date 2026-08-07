import jwt from '@fastify/jwt';
import logger from '../config/logger.js';
import pubSub from '../providers/pubsub/InMemoryPubSubProvider.js';

class WebSocketService {
  constructor() {
    // Maps userId -> Set of WebSocket connections
    // A user might be logged in from multiple tabs/devices
    this.connections = new Map();
    
    // Subscribe to our PubSub megaphone
    // When ANY server broadcasts a message to a user, this server checks if it has that user connected.
    pubSub.subscribe('USER_NOTIFICATION', (message) => {
      try {
        const payload = JSON.parse(message);
        this._deliverToLocalConnections(payload.userId, payload.data);
      } catch (err) {
        logger.error(`Error parsing pubsub message: ${err.message}`);
      }
    });
  }

  /**
   * Called by our fastify websocket plugin when a new raw connection is established
   */
  handleConnection(connection, request, fastify) {
    const socket = connection;
    let socketUserId = null;

    try {
      // 1. Authentication via HttpOnly Cookie (Sent automatically on upgrade)
      const token = request.cookies?.token;
      if (!token) throw new Error('No auth cookie');

      // Verify JWT
      const decoded = fastify.jwt.verify(token);
      socketUserId = decoded.id; 
      
      this._addConnection(socketUserId, socket);
      socket.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
    } catch (err) {
      logger.error(`WebSocket auth error: ${err.message}`);
      socket.send(JSON.stringify({ type: 'ERROR', message: 'Authentication failed' }));
      socket.close();
      return;
    }

    socket.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message);

        // 2. Handle ping (Heartbeat)
        if (parsedMessage.type === 'PING') {
          socket.send(JSON.stringify({ type: 'PONG' }));
          return;
        }

      } catch (err) {
        logger.error(`WebSocket message error: ${err.message}`);
        socket.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message' }));
      }
    });

    socket.on('close', () => {
      if (socketUserId) {
        this._removeConnection(socketUserId, socket);
      }
    });
  }

  /**
   * Broadcasts a notification to a specific user.
   * This uses PubSub so it works across multiple servers.
   */
  notifyUser(userId, payload) {
    // Publish to the megaphone
    pubSub.publish('USER_NOTIFICATION', JSON.stringify({ userId, data: payload }));
  }

  // --- Internal Connection Management ---

  _addConnection(userId, socket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId).add(socket);
    logger.info(`User ${userId} connected to WebSockets. Connections for this user: ${this.connections.get(userId).size} | Total unique users online: ${this.connections.size}`);
  }

  _removeConnection(userId, socket) {
    if (this.connections.has(userId)) {
      const userSockets = this.connections.get(userId);
      userSockets.delete(socket);
      if (userSockets.size === 0) {
        this.connections.delete(userId);
      }
      logger.info(`User ${userId} disconnected from WebSockets. Connections remaining for this user: ${userSockets.size} | Total unique users online: ${this.connections.size}`);
    }
  }

  _deliverToLocalConnections(userId, payload) {
    if (this.connections.has(userId)) {
      const userSockets = this.connections.get(userId);
      for (const socket of userSockets) {
        if (socket.readyState === 1) { // OPEN
          socket.send(JSON.stringify(payload));
        }
      }
    }
  }
}

export default new WebSocketService();
