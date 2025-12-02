const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getUserInbox, getMessagesByInquiry, sendMessage, sendImage } = require('../../controllers/inboxControllers');

// Create uploads folder
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Routes
router.get('/inbox', getUserInbox);
router.get('/messages/:inquiryId', getMessagesByInquiry);
router.post('/messages/send', sendMessage);
router.post('/messages/send-image', upload.single('image'), sendImage);

module.exports = router;