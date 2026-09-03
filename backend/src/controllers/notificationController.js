import notificationService from '../services/notificationService.js';
import STATUS_CODES from '../config/constants.js';
import { successResponse } from '../utils/response.js';
import logger from '../config/logger.js';

export const getNotifications = async (request, reply) => {
  try {
    const userId = request.user.id;
    const { limit = 50, offset = 0 } = request.query;

    const result = await notificationService.getNotifications(userId, limit, offset);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Notifications retrieved successfully',
      data: {
        notifications: result.rows,
        total: result.count,
      },
    });
  } catch (error) {
    logger.error(`getNotifications error: ${error.message}`);
    throw error;
  }
};

export const getUnreadCount = async (request, reply) => {
  try {
    const userId = request.user.id;
    const count = await notificationService.getUnreadCount(userId);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Unread count retrieved successfully',
      data: { count },
    });
  } catch (error) {
    logger.error(`getUnreadCount error: ${error.message}`);
    throw error;
  }
};

export const markAsRead = async (request, reply) => {
  try {
    const userId = request.user.id;
    const { id } = request.params;

    const notification = await notificationService.markAsRead(userId, id);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    logger.error(`markAsRead error: ${error.message}`);
    throw error;
  }
};

export const markAllAsRead = async (request, reply) => {
  try {
    const userId = request.user.id;

    await notificationService.markAllAsRead(userId);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error(`markAllAsRead error: ${error.message}`);
    throw error;
  }
};

