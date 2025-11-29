const express = require('express');
const router = express.Router();
const { getUserInbox, getMessagesByInquiry, sendMessage } = require('../../controller/admin/inboxController');

router.get('/inbox', getUserInbox);
router.get('/messages/:inquiryId', getMessagesByInquiry);
router.post('/messages/send', sendMessage);

module.exports = router;
