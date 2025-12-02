// Imports
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../../db/connection");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Config for reset links and email sending
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5500/client/src/user";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for others
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------------- Register ----------------
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [existing] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    return res
      .status(201)
      .json({ message: "User registered successfully!", user_id: result.insertId });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------- Login ----------------
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      userId: user.user_id
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------- Forgot Password (request reset link) ----------------
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    // 1. Find user
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      // For security, always respond success even if email doesn't exist
      return res.status(200).json({
        message: "A reset link has been sent. Please check your email.",
      });
    }

    const user = users[0];

    // 2. Generate token & expiry (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // 3. Remove any existing reset tokens for this user
    await db.query("DELETE FROM password_resets WHERE user_id = ?", [
      user.user_id,
    ]);

    // 4. Insert new reset token
    await db.query(
      "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.user_id, token, expiresAt]
    );

    // 5. Build reset link
    const resetLink = `${FRONTEND_URL}/resetPassword.html?token=${token}`;

    // 6. Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "HouseBuilder - Password Reset",
      html: `
        <p>Hello ${user.name || ""},</p>
        <p>You requested a password reset for your HouseBuilder account.</p>
        <p>Click the link below to set a new password (valid for 1 hour):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });

    return res.status(200).json({
      message: "A reset link has been sent. Please check your email.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------- Reset Password (using token) ----------------
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res
      .status(400)
      .json({ message: "Token and new password are required." });
  }

  try {
    // 1. Find token and ensure it's not expired
    const [rows] = await db.query(
      "SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }

    const resetRow = rows[0];
    const userId = resetRow.user_id;

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Update user password
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [
      hashedPassword,
      userId,
    ]);

    // 4. Delete used token
    await db.query("DELETE FROM password_resets WHERE token = ?", [token]);

    return res
      .status(200)
      .json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ---------------- Get User Profile ----------------
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await db.query(
      'SELECT user_id, name, email, created_at FROM users WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Get User Inquiries ----------------
const getUserInquiries = async (req, res) => {
  try {
    const { userId } = req.params;

    const [inquiries] = await db.query(
      `SELECT 
        inquiry_id, 
        bedrooms, 
        bathrooms, 
        floors, 
        style, 
        unit_size, 
        city, 
        features,
        status, 
        created_at 
      FROM inquiries 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [userId]
    );

    // If no inquiries, return empty array
    if (!inquiries || inquiries.length === 0) {
      return res.json([]);
    }

    // Process each inquiry to get feature names
    const processedInquiries = await Promise.all(
      inquiries.map(async (inquiry) => {
        let featureNames = [];

        if (inquiry.features) {
          try {
            const featureIds = JSON.parse(inquiry.features);

            if (Array.isArray(featureIds) && featureIds.length > 0) {
              const placeholders = featureIds.map(() => '?').join(',');
              const [featRows] = await db.query(
                `SELECT name FROM features WHERE feature_id IN (${placeholders})`,
                featureIds
              );
              featureNames = featRows.map(f => f.name);
            }
          } catch (e) {
            console.error('Error parsing features for inquiry', inquiry.inquiry_id, ':', e);
            // Continue with empty features array
          }
        }

        return {
          inquiry_id: inquiry.inquiry_id,
          bedrooms: inquiry.bedrooms,
          bathrooms: inquiry.bathrooms,
          floors: inquiry.floors,
          style: inquiry.style,
          unit_size: inquiry.unit_size,
          city: inquiry.city,
          features: featureNames,
          status: inquiry.status,
          created_at: inquiry.created_at
        };
      })
    );

    res.json(processedInquiries);
  } catch (err) {
    console.error('Error fetching user inquiries:', err);
    res.status(500).json({ message: err.message });
  }
};
// Add this at the end before module.exports

// ---------------- Cancel Inquiry ----------------
const cancelInquiry = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const userId = req.user?.user_id; // Assuming you have auth middleware

    // Check if inquiry exists and belongs to user
    const [inquiry] = await db.query(
      'SELECT * FROM inquiries WHERE inquiry_id = ? AND user_id = ?',
      [inquiryId, userId]
    );

    if (inquiry.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Check if already accepted
    if (inquiry[0].status === 'accepted') {
      return res.status(400).json({ message: 'Cannot cancel accepted inquiry' });
    }

    // Check if already cancelled
    if (inquiry[0].status === 'cancelled') {
      return res.status(400).json({ message: 'Inquiry already cancelled' });
    }

    // Update status to cancelled
    await db.query(
      'UPDATE inquiries SET status = ? WHERE inquiry_id = ?',
      ['cancelled', inquiryId]
    );

    // Get user info for email
    const [user] = await db.query(
      'SELECT name as first_name, email FROM users WHERE user_id = ?',
      [userId]
    );

    // Send cancellation email
    const { sendCancellationNotification } = require('../../services/emailService');
    await sendCancellationNotification(inquiry[0], user[0]);

    res.json({
      message: 'Inquiry cancelled successfully',
      inquiryId
    });

  } catch (err) {
    console.error('Error cancelling inquiry:', err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Get User Inbox (Accepted Inquiries Only) ----------------
const getUserInbox = async (req, res) => {
  try {
    const userId = req.user?.user_id; // From auth middleware

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only fetch ACCEPTED inquiries for inbox
    const [inquiries] = await db.query(
      `SELECT 
        inquiry_id, 
        bedrooms, 
        bathrooms, 
        floors, 
        style, 
        unit_size, 
        city, 
        status,
        created_at 
      FROM inquiries 
      WHERE user_id = ? AND status = 'accepted'
      ORDER BY created_at DESC`,
      [userId]
    );

    // Get messages from CONVERSATION table for each inquiry
    const inquiriesWithMessages = await Promise.all(
      inquiries.map(async (inquiry) => {
        const [messages] = await db.query(
          `SELECT 
            conversationId as messageId,
            inquiryId,
            senderType,
            senderId,
            message,
            createdAt
          FROM conversation 
          WHERE inquiryId = ? 
          ORDER BY createdAt ASC`,
          [inquiry.inquiry_id]
        );

        // Add sender name based on senderType
        const messagesWithNames = await Promise.all(
          messages.map(async (msg) => {
            let senderName = 'Unknown';

            if (msg.senderType === 'user') {
              const [user] = await db.query('SELECT name FROM users WHERE user_id = ?', [msg.senderId]);
              senderName = user[0]?.name || 'User';
            } else if (msg.senderType === 'admin') {
              const [admin] = await db.query('SELECT username FROM adminaccount WHERE admin_id = ?', [msg.senderId]);
              senderName = admin[0]?.username || 'Admin';
            }

            return {
              ...msg,
              senderName
            };
          })
        );

        return {
          ...inquiry,
          messages: messagesWithNames
        };
      })
    );

    res.json(inquiriesWithMessages);
  } catch (err) {
    console.error('Error fetching user inbox:', err);
    res.status(500).json({ message: err.message });
  }
};

// Exports
module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  getUserInquiries,
  cancelInquiry,
  getUserInbox
};