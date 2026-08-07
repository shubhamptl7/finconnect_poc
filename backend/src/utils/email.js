import nodemailer from 'nodemailer';
import config from '../config/env.js';
import logger from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host: config.email.providers.mailtrap.host,
  port: config.email.providers.mailtrap.port,
  secure: config.email.providers.mailtrap.secure === 'true', // true for 465, false for other ports
  auth: {
    user: config.email.providers.mailtrap.user,
    pass: config.email.providers.mailtrap.password,
  },
});

/**
 * Sends an email using the configured Mailtrap transporter.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    
    // In local development, Mailtrap is often used to inspect emails
    logger.debug(`Preview URL (if available): ${nodemailer.getTestMessageUrl(info)}`);
    
    return info;
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    throw new Error('Failed to send email');
  }
};
