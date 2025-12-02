const express = require('express');
const router = express.Router();
const messagesRoutes = require('./messages'); // adjust path if needed
const inboxController = require('../controllers/inboxController');
const { authenticateToken } = require('../middleware/auth');

// Import user controller functions
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/userController'); // adjust path based on your structure

// User authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Inbox route (requires authentication)
router.get('/inbox', authenticateToken, inboxController.getUserInbox);

// Connect messages routes
router.use('/messages', messagesRoutes);

module.exports = router;