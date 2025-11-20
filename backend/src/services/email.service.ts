import nodemailer from 'nodemailer';
import { isServiceConfigured } from '../config/env.validation';
import { logInfo, logError } from '../config/logger';

// Email transporter
let transporter: nodemailer.Transporter | null = null;

// Initialize email transporter
export const initializeEmailService = () => {
  if (!isServiceConfigured('email')) {
    console.log('⚠️  Email service not configured. Email features will be disabled.');
    return;
  }

  try {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    logInfo('Email service initialized successfully');
  } catch (error) {
    logError('Failed to initialize email service', error);
  }
};

// Check if email service is available
export const isEmailServiceAvailable = (): boolean => {
  return transporter !== null;
};

// Send email
export const sendEmail = async (options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> => {
  if (!transporter) {
    logError('Email service not initialized');
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"SEO Audit Tool" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logInfo(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    logError(`Failed to send email to ${options.to}`, error);
    return false;
  }
};

// Send verification email
export const sendVerificationEmail = async (
  email: string,
  verificationToken: string
): Promise<boolean> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4F46E5;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Verify Your Email Address</h2>
        <p>Thank you for registering with SEO Audit Tool!</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" class="button">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <div class="footer">
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - SEO Audit Tool',
    html,
    text: `Please verify your email by visiting: ${verificationUrl}`,
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4F46E5;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .alert { background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your password for your SEO Audit Tool account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <div class="alert">
          <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for security reasons.
        </div>
        <div class="footer">
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          <p>For security reasons, please do not share this email with anyone.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - SEO Audit Tool',
    html,
    text: `Reset your password by visiting: ${resetUrl}. This link expires in 1 hour.`,
  });
};

// Send audit completion notification
export const sendAuditCompletionEmail = async (
  email: string,
  auditId: string,
  domain: string,
  healthScore: number
): Promise<boolean> => {
  const auditUrl = `${process.env.FRONTEND_URL}/audits/${auditId}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .score {
          font-size: 48px;
          font-weight: bold;
          color: ${healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#F59E0B' : '#EF4444'};
          text-align: center;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4F46E5;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Your SEO Audit is Complete!</h2>
        <p>We've finished analyzing <strong>${domain}</strong>.</p>
        <div class="score">${healthScore}/100</div>
        <p style="text-align: center;">SEO Health Score</p>
        <p>Click the button below to view your detailed audit results:</p>
        <div style="text-align: center;">
          <a href="${auditUrl}" class="button">View Audit Results</a>
        </div>
        <div class="footer">
          <p>Thank you for using SEO Audit Tool!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `SEO Audit Complete: ${domain} - Score: ${healthScore}/100`,
    html,
    text: `Your SEO audit for ${domain} is complete! Health Score: ${healthScore}/100. View results at: ${auditUrl}`,
  });
};

// Initialize on module load
initializeEmailService();
