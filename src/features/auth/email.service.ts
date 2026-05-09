import nodemailer from "nodemailer";
import { config } from "@/config/app.config.js";
import { logger } from "@/shared/utils/logger.js";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  if (!config.smtp.host) {
    logger.warn(`⚠️ SMTP not configured. Email not sent: ${options.subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: config.smtp.from || '"Terra Coffee" <no-reply@terracoffee.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    logger.error(error, "❌ Error sending email");
    // Don't throw error to prevent breaking the request flow
  }
};

export const sendVerificationEmail = async (
  email: string,
  token: string,
): Promise<void> => {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  const html = `
    <h1>Verify your email</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}">${verificationUrl}</a>
  `;

  await sendEmail({
    to: email,
    subject: "Verify your email - Terra Coffee",
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  const html = `
    <h1>Reset your password</h1>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
  `;

  await sendEmail({
    to: email,
    subject: "Reset your password - Terra Coffee",
    html,
  });
};
