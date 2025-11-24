import nodemailer from 'nodemailer';
import emailConfig from '../config/email.js';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: emailConfig.from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, username) {
    // In development, avoid sending real emails — just log and resolve.
    if (process.env.NODE_ENV === 'development') {
      console.log(`DEV email: enviar boas-vindas para ${email}`);
      return Promise.resolve();
    }

    const subject = 'Bem-vindo ao PrideConnect';
    const html = `
      <h1>Bem-vindo, ${username}!</h1>
      <p>Obrigado por se juntar ao PrideConnect. Estamos felizes em ter você aqui.</p>
      <p>Explore conteúdo exclusivo e conecte-se com a comunidade.</p>
      <p>— Equipe PrideConnect</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email, verificationToken) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const subject = 'Verify Your Email';
    const html = `
      <h1>Email Verification</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(email, orderDetails) {
    const subject = 'Order Confirmation';
    const html = `
      <h1>Order Confirmation</h1>
      <p>Thank you for your order!</p>
      <p>Order Number: ${orderDetails.orderNumber}</p>
      <p>Total: $${orderDetails.total}</p>
      <p>We'll send you another email when your order ships.</p>
    `;

    return this.sendEmail(email, subject, html);
  }
}

export default new EmailService();
