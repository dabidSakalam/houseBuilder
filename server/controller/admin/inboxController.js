const { db } = require('../../db/connection');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

// ===== Helper to decode JWT =====
const getUserIdFromToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error('No token provided');
    if(!authHeader.startsWith('Bearer ')) throw new Error('Malformed token');
    const token = authHeader.split(' ')[1];
    if (!token) throw new Error('Invalid token');
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.user_id;
};

// ===== GET USER INBOX =====
const getUserInbox = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);

        const [inquiries] = await db.query(
            `SELECT * FROM inquiries WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        for(let i=0; i<inquiries.length; i++){
            const [messages] = await db.query(
                `SELECT m.messageId, m.inquiryId, m.senderType, m.message, m.createdAt,
                        CASE WHEN m.senderType='admin' THEN a.name ELSE u.name END AS senderName
                 FROM InquiryMessages m
                 LEFT JOIN adminaccount a ON m.senderType='admin' AND m.senderId=a.user_id
                 LEFT JOIN users u ON m.senderType='user' AND m.senderId=u.user_id
                 WHERE m.inquiryId = ?
                 ORDER BY m.createdAt ASC`,
                [inquiries[i].inquiry_id]
            );
            inquiries[i].messages = messages;
        }

        res.json(inquiries);
    } catch(err){
        console.error(err);
        res.status(401).json({ message: 'Unauthorized: ' + err.message });
    }
};

// ===== GET MESSAGES FOR ONE INQUIRY =====
const getMessagesByInquiry = async (req, res) => {
    const { inquiryId } = req.params;
    try {
        const userId = getUserIdFromToken(req);

        const [messages] = await db.query(
            `SELECT m.messageId, m.inquiryId, m.senderType, m.message, m.createdAt,
                    CASE WHEN m.senderType='admin' THEN a.name ELSE u.name END AS senderName
             FROM InquiryMessages m
             LEFT JOIN adminaccount a ON m.senderType='admin' AND m.senderId=a.user_id
             LEFT JOIN users u ON m.senderType='user' AND m.senderId=u.user_id
             WHERE m.inquiryId = ?`,
            [inquiryId]
        );

        res.json(messages);
    } catch(err){
        console.error(err);
        res.status(401).json({ message: 'Unauthorized: ' + err.message });
    }
};

// ===== SEND MESSAGE =====
const sendMessage = async (req, res) => {
    const { inquiryId, message } = req.body;
    if(!inquiryId || !message) return res.status(400).json({ message: 'Missing fields' });

    try {
        const userId = getUserIdFromToken(req);

        const [result] = await db.query(
            `INSERT INTO InquiryMessages (inquiryId, senderType, senderId, message)
             VALUES (?, 'user', ?, ?)`,
            [inquiryId, userId, message]
        );

        res.json({ message: 'Message sent successfully', messageId: result.insertId });
    } catch(err){
        console.error(err);
        res.status(401).json({ message: 'Unauthorized: ' + err.message });
    }
};

module.exports = { getUserInbox, getMessagesByInquiry, sendMessage };
