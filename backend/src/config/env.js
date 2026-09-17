import path from 'path';

import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  app_name: process.env.APP_NAME || 'FinConnectPOC',
  port: process.env.PORT || 3000,
  base_url: process.env.BASE_URL || `http://localhost:${process.env.PORT}`,
  jwt_secret: process.env.JWT_SECRET,
  env: process.env.NODE_ENV || 'development',
  allowed_origins: process.env.ALLOWED_ORIGINS,
  redis_port: process.env.REDIS_PORT,
  frontend_url: process.env.FRONTEND_URL,
  webhook_url: process.env.WEBHOOK_URL,
  persona_webhook_secret: process.env.PERSONA_WEBHOOK_SECRET,
  persona_template_id: process.env.PERSONA_TEMPLATE_ID,

  plaid_client_id: process.env.PLAID_CLIENT_ID ? process.env.PLAID_CLIENT_ID.trim() : '',
  plaid_client_secret: process.env.PLAID_CLIENT_SECRET ? process.env.PLAID_CLIENT_SECRET.trim() : '',
  plaid_env: process.env.PLAID_ENV ? process.env.PLAID_ENV.trim() : 'sandbox',
  
  encryption_key: process.env.ENCRYPTION_KEY,
  search_hash_key: process.env.SEARCH_HASH_KEY,

  db: {
    host: process.env.DEV_DB_HOST,
    port: process.env.DEV_DB_PORT,
    user: process.env.DEV_DB_USER,
    name: process.env.DEV_DB_NAME,
    password: process.env.DEV_DB_PASSWORD,
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    providers: {
      mailtrap: {
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        user: process.env.MAILTRAP_USER,
        password: process.env.MAILTRAP_PASSWORD,
        secure: process.env.MAILTRAP_SECURE,
      },
    },
  },
};

export default config;
