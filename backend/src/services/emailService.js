// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 */
async function sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Hive Academic Hub" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request - Hive Academic Hub',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo-icon {
            display: inline-block;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            border-radius: 12px;
            line-height: 60px;
            font-size: 32px;
          }
          h1 {
            color: #d97706;
            text-align: center;
            margin-bottom: 20px;
          }
          p {
            color: #4b5563;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .button {
            display: block;
            width: fit-content;
            margin: 30px auto;
            padding: 15px 40px;
            background-color: #d97706;
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
          }
          .button:hover {
            background-color: #b45309;
          }
          .expire-notice {
            background-color: #fef3c7;
            border-left: 4px solid #fbbf24;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <div class="logo-icon">🐝</div>
          </div>
          
          <h1>Password Reset Request</h1>
          
          <p>Hello,</p>
          
          <p>We received a request to reset your password for your Hive Academic Hub account. If you didn't make this request, you can safely ignore this email.</p>
          
          <p>To reset your password, click the button below:</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <div class="expire-notice">
            <strong>⏰ This link will expire in 1 hour</strong>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #d97706;">${resetUrl}</p>
          
          <div class="footer">
            <p>This is an automated message from Hive Academic Hub.<br>
            Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
      Password Reset Request
      
      Hello,
      
      We received a request to reset your password for your Hive Academic Hub account.
      
      To reset your password, click the link below or copy it into your browser:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this, you can safely ignore this email.
      
      - Hive Academic Hub
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw error;
    }
}

module.exports = {
    sendPasswordResetEmail,
};
