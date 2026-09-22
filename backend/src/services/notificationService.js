import db from '../models/index.js';
import logger from '../config/logger.js';

import websocketService from './websocketService.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1FA00}-\u{1FAFF}\u{200D}\u{FE0F}]/gu;

function stripEmojis(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(EMOJI_REGEX, '').replace(/\s+/g, ' ').trim();
}

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
  async createNotification({ user_id, title, message, type, action_url, metadata }, options = {}) {
    try {
      const cleanTitle = stripEmojis(title);
      const cleanContent = stripEmojis(message);

      const notification = await db.Notification.create(
        {
          user_id,
          type: type || 'default',
          title: cleanTitle,
          content: cleanContent,
          action_url: action_url || null,
          metadata: metadata || null,
          is_read: false,
        },
        options
      );

      // Broadcast via PubSub / WebSockets (Real-time Push)
      try {
        websocketService.sendToUser(user_id, {
          type: 'NEW_NOTIFICATION',
          data: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            content: notification.content,
            action_url: notification.action_url,
            metadata: notification.metadata,
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

  async getNotifications(userId, options = {}) {
    const limit = typeof options === 'number' ? options : (options.limit || 50);
    const offset = typeof options === 'object' ? (options.offset || 0) : 0;
    const type = typeof options === 'object' ? options.type : null;
    const unreadOnly = typeof options === 'object' ? options.unreadOnly : false;

    const where = { user_id: userId };
    if (unreadOnly) {
      where.is_read = false;
    }
    if (type && type !== 'all') {
      where.type = type;
    }

    return db.Notification.findAndCountAll({
      where,
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
