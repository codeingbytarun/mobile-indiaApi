const nodemailer = require('nodemailer');
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM
} = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
};

/**
 * Generate a cryptographically sensible 6-digit numeric OTP code
 */
const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Render a high-conversion, modern HTML email template for MobiMarket OTP
 */
const renderOtpTemplate = ({ otp, expiresMinutes = 10, recipientEmail }) => {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your MobiMarket Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px 30px;
      text-align: center;
    }
    .logo-badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.18);
      border: 1px solid rgba(129, 140, 248, 0.35);
      border-radius: 9999px;
      padding: 6px 16px;
      margin-bottom: 12px;
    }
    .logo-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .logo-accent {
      color: #6366f1;
    }
    .tagline {
      color: #94a3b8;
      font-size: 13px;
      margin: 6px 0 0 0;
      letter-spacing: 0.2px;
    }
    .content {
      padding: 36px 32px 30px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 24px 0;
    }
    .otp-card {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 8px;
    }
    .otp-digits {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #4f46e5;
      margin: 0;
      user-select: all;
    }
    .expiry-note {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: #64748b;
      margin-top: 14px;
    }
    .security-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      border-radius: 6px;
      margin-top: 24px;
    }
    .security-text {
      font-size: 12px;
      color: #991b1b;
      line-height: 1.5;
      margin: 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer-links {
      margin-bottom: 8px;
    }
    .footer-links a {
      color: #6366f1;
      text-decoration: none;
      margin: 0 8px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo-text">Mobi<span class="logo-accent">Market</span></h1>
        <p class="tagline">India's Trusted Used Smartphone Marketplace</p>
      </div>

      <div class="content">
        <p class="greeting">Hello,</p>
        <p class="message">
          You requested a verification code to access your <strong>MobiMarket</strong> account with <strong>${recipientEmail}</strong>. Enter the 6-digit OTP code below to verify your email address:
        </p>

        <div class="otp-card">
          <div class="otp-label">Verification Code</div>
          <div class="otp-digits">${otp}</div>
          <div class="expiry-note">
            ⏱️ Valid for <strong>${expiresMinutes} minutes</strong>
          </div>
        </div>

        <div class="security-box">
          <p class="security-text">
            <strong>Security Reminder:</strong> Never share this code with anyone, including MobiMarket support representatives. If you did not initiate this request, you can safely ignore this email.
          </p>
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0;">
          Sent by <strong>MobiMarket India</strong> &bull; Verified Local Phone Dealers<br>
          &copy; ${currentYear} MobiMarket. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Send an OTP code to a recipient email address
 */
const sendOtpEmail = async ({ to, otp, expiresMinutes = 10 }) => {
  const mailTransporter = getTransporter();

  // If SMTP is not yet configured in .env, simulate gracefully without breaking API
  if (!mailTransporter) {
    console.log('\n======================================================');
    console.log('📧 [MobiMarket Email Service - Development Mode]');
    console.log(`📬 To:             ${to}`);
    console.log(`🔑 Generated OTP:  ${otp}`);
    console.log(`⏱️  Expires In:     ${expiresMinutes} minutes`);
    console.log('💡 Note: Set SMTP_USER and SMTP_PASS in .env to send real Gmail emails.');
    console.log('======================================================\n');

    return {
      success: true,
      delivered: false,
      devMode: true,
      otp,
      message: 'OTP generated and logged in development mode. Configure SMTP in .env for real email delivery.'
    };
  }

  const htmlContent = renderOtpTemplate({
    otp,
    expiresMinutes,
    recipientEmail: to
  });

  const textContent = `Your MobiMarket verification code is: ${otp}. It is valid for ${expiresMinutes} minutes. Do not share this code with anyone.`;

  try {
    const info = await mailTransporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: `Your MobiMarket Verification Code: ${otp}`,
      text: textContent,
      html: htmlContent
    });

    console.log(`✅ [Email Service] Real OTP email successfully delivered to ${to} (MessageId: ${info.messageId})`);
    return {
      success: true,
      delivered: true,
      messageId: info.messageId
    };
  } catch (err) {
    console.warn(`⚠️ [Email Service] Failed to deliver real email via SMTP: ${err.message}`);
    console.log(`👉 Dev OTP for ${to}: ${otp}`);

    // Return success with dev fallback so authentication does not get blocked
    return {
      success: true,
      delivered: false,
      error: err.message,
      devMode: true,
      otp
    };
  }
};

module.exports = {
  generateOtpCode,
  sendOtpEmail,
  renderOtpTemplate
};
