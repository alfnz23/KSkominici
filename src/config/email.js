const nodemailer = require('nodemailer');

// SMTP configuration fallback
const createSMTPTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Email service wrapper
class EmailService {
  constructor() {
    this.resend = null;
    this.smtp = null;
    
    // Initialize Resend if API key is available
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    
    // Initialize SMTP as fallback
    if (process.env.SMTP_HOST) {
      this.smtp = createSMTPTransporter();
    }
  }

  async sendEmail(emailData) {
    // Try Resend first
    if (this.resend) {
      try {
        return await this.resend.emails.send(emailData);
      } catch (error) {
        console.error('Resend failed, trying SMTP:', error);
      }
    }

    // Fallback to SMTP
    if (this.smtp) {
      const smtpData = {
        from: emailData.from,
        to: emailData.to.join(', '),
        cc: emailData.cc ? emailData.cc.join(', ') : undefined,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.type
        }))
      };

      return await this.smtp.sendMail(smtpData);
    }

    throw new Error('No email service configured');
  }

  async verifyConnection() {
    if (this.smtp) {
      return await this.smtp.verify();
    }
    return true; // Resend doesn't need verification
  }
}

module.exports = new EmailService();