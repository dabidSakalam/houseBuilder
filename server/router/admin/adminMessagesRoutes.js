const express = require('express');
const router = express.Router();
const { getMessagesByInquiry, sendMessage } = require('../../controller/admin/adminMessagesController');

// Get all messages for a specific inquiry
router.get('/:inquiryId', getMessagesByInquiry);

// Send a new message (admin)
router.post('/send', sendMessage);

module.exports = router;
