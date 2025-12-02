const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getMessagesByInquiry, sendMessage, sendAdminImage } = require('../../controller/admin/adminMessagesController');

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
router.get('/:inquiryId', getMessagesByInquiry);
router.post('/send', sendMessage);
router.post('/send-image', upload.single('image'), sendAdminImage);

module.exports = router;