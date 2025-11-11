const express = require('express');
const router = express.Router();
const verifyToken = require('../../util/verifyToken');
const {
  getUsers,
  searchUsers,
  addUser,
  updateUser,
  deleteUser,
} = require('../../controller/admin/userListController');

// Protected routes (only admin)
router.get('/', verifyToken, getUsers);
router.get('/search', verifyToken, searchUsers);
router.post('/', verifyToken, addUser);
router.put('/:id', verifyToken, updateUser);
router.delete('/:id', verifyToken, deleteUser);

module.exports = router;
