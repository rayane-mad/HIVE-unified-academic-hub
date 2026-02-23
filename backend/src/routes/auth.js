// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../db'); // Import the connection we just made
const router = express.Router();

// 1. SIGN UP
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to DB
    const result = await db.query(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING user_id, email",
      [email, hashedPassword, name]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "User already exists or DB error" });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];

    // Check password
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(400).json({ error: "Invalid password" });

    // Create Token (The "Passport" for the app)
    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET);

    res.json({ success: true, token, user: { id: user.user_id, name: user.display_name } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// 3. FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    // Check if user exists
    const result = await db.query("SELECT user_id, email, display_name FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    }

    const user = result.rows[0];

    // Generate secure random token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this user
    await db.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.user_id]);

    // Store token in database
    await db.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.user_id, resetToken, expiresAt]
    );

    // Send email
    const emailService = require('../services/emailService');
    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({ success: true, message: "Password reset link sent to your email." });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
});

// 4. RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find valid token
    const tokenResult = await db.query(
      "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1",
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const resetToken = tokenResult.rows[0];

    // Check if token is expired
    if (new Date() > new Date(resetToken.expires_at)) {
      await db.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);
      return res.status(400).json({ error: "Reset token has expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.query(
      "UPDATE users SET password_hash = $1 WHERE user_id = $2",
      [hashedPassword, resetToken.user_id]
    );

    // Delete used token
    await db.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

module.exports = router;