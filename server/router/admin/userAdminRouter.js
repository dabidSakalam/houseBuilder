const express = require('express');
const router = express.Router();
const verifyToken = require('../../util/verifyToken')
const { register, login, logout } = require('../../controller/admin/userAdminController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Example protected route
router.get('/dashboard', verifyToken, (req, res) => {
  res.status(200).json({ message: `Welcome admin ${req.admin.email}` });
});

module.exports = router;
