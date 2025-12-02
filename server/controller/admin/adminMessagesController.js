const { db } = require('../../db/connection');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

// ===== GET ALL MESSAGES FOR AN INQUIRY =====
const getMessagesByInquiry = async (req, res) => {
  const { inquiryId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT m.messageId, m.inquiryId, m.senderType, m.senderId, m.message, m.imageUrl, m.createdAt,
              CASE 
                WHEN m.senderType='admin' THEN a.name
                ELSE u.name 
              END AS senderName
       FROM InquiryMessages m
       LEFT JOIN adminaccount a ON m.senderType='admin' AND m.senderId=a.user_id
       LEFT JOIN users u ON m.senderType='user' AND m.senderId=u.user_id
       WHERE m.inquiryId = ?
       ORDER BY m.createdAt ASC`,
      [inquiryId]
    );

    res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== SEND MESSAGE =====
const sendMessage = async (req, res) => {
  const { inquiryId, senderType, message } = req.body;

  // Validate required fields
  if (!inquiryId || !senderType || !message)
    return res.status(400).json({ message: 'Missing fields' });

  try {
    // Get senderId from JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const senderId = decoded.userId || decoded.user_id; // supports both admin and user tokens

    // Insert new message
    const [result] = await db.query(
      `INSERT INTO InquiryMessages (inquiryId, senderType, senderId, message)
       VALUES (?, ?, ?, ?)`,
      [inquiryId, senderType, senderId, message]
    );

    // Return the newly inserted message
    const [rows] = await db.query(
      `SELECT m.messageId, m.inquiryId, m.senderType, m.senderId, m.message, m.imageUrl, m.createdAt,
              CASE 
                WHEN m.senderType='admin' THEN a.name
                ELSE u.name 
              END AS senderName
       FROM InquiryMessages m
       LEFT JOIN adminaccount a ON m.senderType='admin' AND m.senderId=a.user_id
       LEFT JOIN users u ON m.senderType='user' AND m.senderId=u.user_id
       WHERE m.messageId = ?`,
      [result.insertId]
    );

    // Emit socket event
    const io = req.app.get('io');
    io.to(`inquiry-${inquiryId}`).emit('new-message', rows[0]);

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== SEND IMAGE (ADMIN) =====
const sendAdminImage = async (req, res) => {
  const { inquiryId, senderType, message } = req.body;

  // Validate required fields
  if (!inquiryId) {
    return res.status(400).json({ message: 'inquiryId is required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  try {
    // Get senderId from JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const senderId = decoded.userId || decoded.user_id;

    // Create image URL
    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    // Insert message with image
    const [result] = await db.query(
      `INSERT INTO InquiryMessages (inquiryId, senderType, senderId, message, imageUrl)
       VALUES (?, 'admin', ?, ?, ?)`,
      [inquiryId, senderId, message || '', imageUrl]
    );

    // Return the newly inserted message
    const [rows] = await db.query(
      `SELECT m.messageId, m.inquiryId, m.senderType, m.senderId, m.message, m.imageUrl, m.createdAt,
              CASE 
                WHEN m.senderType='admin' THEN a.name
                ELSE u.name 
              END AS senderName
       FROM InquiryMessages m
       LEFT JOIN adminaccount a ON m.senderType='admin' AND m.senderId=a.user_id
       LEFT JOIN users u ON m.senderType='user' AND m.senderId=u.user_id
       WHERE m.messageId = ?`,
      [result.insertId]
    );

    // Emit socket event
    const io = req.app.get('io');
    io.to(`inquiry-${inquiryId}`).emit('new-message', rows[0]);

    res.json({
      success: true,
      message: 'Image sent successfully',
      data: rows[0],
      imageUrl: imageUrl
    });
  } catch (err) {
    console.error('Admin image upload error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMessagesByInquiry, sendMessage, sendAdminImage };