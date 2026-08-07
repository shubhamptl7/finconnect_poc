import bankService from '../services/bankService.js';
import STATUS_CODES from '../config/constants.js';
import { successResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Bank Controller
 *
 * WHY THIS EXISTS:
 * Controllers ONLY handle HTTP stuff (taking requests, sending responses).
 * They do not contain any business logic. All heavy lifting is delegated to `bankService`.
 */

export const createLinkToken = async (request, reply) => {
  try {
    const linkToken = await bankService.createLinkToken(request.user.id);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: { linkToken },
    });
  } catch (error) {
    logger.error(`createLinkToken error: ${error.message}`);
    throw error;
  }
};

export const connectBank = async (request, reply) => {
  try {
    const { publicToken, bankName, institutionId } = request.body;

    const metadata = { ip: request.ip, userAgent: request.headers['user-agent'] };
    const result = await bankService.connectBank(
      request.user.id,
      publicToken,
      bankName,
      institutionId,
      metadata
    );

    return successResponse({
      reply,
      statusCode: STATUS_CODES.CREATED,
      message: 'Bank securely connected',
      data: result,
    });
  } catch (error) {
    logger.error(`connectBank error: ${error.message}`);
    throw error;
  }
};

export const getConnections = async (request, reply) => {
  try {
    const connections = await bankService.getConnections(request.user.id);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: connections,
    });
  } catch (error) {
    logger.error(`getConnections error: ${error.message}`);
    throw error;
  }
};

export const getAccounts = async (request, reply) => {
  try {
    const accounts = await bankService.getAccounts(request.user.id);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: accounts,
    });
  } catch (error) {
    logger.error(`getAccounts error: ${error.message}`);
    throw error;
  }
};

export const syncTransactions = async (request, reply) => {
  try {
    const { connectionId } = request.body || {};
    const result = await bankService.syncTransactions(request.user.id, connectionId);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      message: 'Transactions synced successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`syncTransactions error: ${error.message}`);
    throw error;
  }
};

export const getTransactions = async (request, reply) => {
  try {
    const transactions = await bankService.getTransactions(request.user.id);

    return successResponse({
      reply,
      statusCode: STATUS_CODES.OK,
      data: transactions,
    });
  } catch (error) {
    logger.error(`getTransactions error: ${error.message}`);
    throw error;
  }
};
