import db from '../models/index.js';
import logger from '../config/logger.js';

import websocketService from './websocketService.js';

const notificationService = {
  /**
   * Create a notification in the database and push it via WebSockets
   * @param {Object} params
   * @param {string} params.user_id
   * @param {string} params.title
   * @param {string} params.message 
   * @param {string} [params.type]
   * @param {Object} [options] Sequelize transaction options
   */
  async createNotification({ user_id, title, message, type }, options = {}) {
    try {
      // 1. Save to database
      // The schema for Notification has title, content, is_read.
      // Wait, let me check the model to be sure. It was title, content, is_read.
      // In webhookService it was using `title, message, read`.
      // I will standardize to the model.
      
      const notification = await db.Notification.create(
        {
          user_id,
          type: type || 'default',
          title,
          content: message,
          is_read: false,
        },
        options
      );

      // 2. Broadcast via PubSub / WebSockets (Real-time Push)
      // We don't want a failed WS broadcast to rollback the DB transaction, so we catch errors.
      try {
        websocketService.notifyUser(user_id, {
          type: 'NEW_NOTIFICATION',
          data: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            content: notification.content,
            is_read: notification.is_read,
            createdAt: notification.createdAt,
          },
        });
      } catch (broadcastErr) {
        logger.error(`Failed to push notification to user ${user_id}: ${broadcastErr.message}`);
      }

      return notification;
    } catch (err) {
      logger.error(`Error creating notification: ${err.message}`);
      throw err;
    }
  },

  async getNotifications(userId, limit = 50, offset = 0) {
    return db.Notification.findAndCountAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
  },

  async getUnreadCount(userId) {
    return db.Notification.count({
      where: { user_id: userId, is_read: false },
    });
  },

  async markAsRead(userId, notificationId) {
    const notification = await db.Notification.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.is_read = true;
    await notification.save();
    return notification;
  },

  async markAllAsRead(userId) {
    await db.Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );
  }
};

export default notificationService;
