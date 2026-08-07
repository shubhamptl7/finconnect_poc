import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

import config from '../config/env.js';

/**
 * Singleton Plaid Client Configuration
 *
 * WHY THIS EXISTS:
 * We want exactly ONE instance of the Plaid SDK configured with our secrets.
 * This prevents memory leaks and ensures consistent API calls.
 */

// We default to sandbox for POC. In production, this would be PlaidEnvironments.production.
const environment =
  config.plaid_env === 'production' ? PlaidEnvironments.production : PlaidEnvironments.sandbox;

const configuration = new Configuration({
  basePath: environment,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': config.plaid_client_id,
      'PLAID-SECRET': config.plaid_client_secret,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export default plaidClient;
