import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Renders an EJS template to HTML string.
 * @param {string} templateName - The name of the template file without the .ejs extension (e.g., 'email_verification')
 * @param {object} data - The data object to pass to the template
 * @returns {Promise<string>} The rendered HTML string
 */
export const getEmailHTML = async (templateName, data) => {
  try {
    const templatePath = path.resolve(__dirname, `../templates/emails/${templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, data);
    return html;
  } catch (error) {
    logger.error(`Error compiling email template ${templateName}: ${error.message}`);
    throw new Error('Failed to generate email content');
  }
};
