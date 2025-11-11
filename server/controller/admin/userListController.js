const { db } = require('../../db/connection');
const bcrypt = require('bcrypt');

// ----------------- Get all users -----------------
const getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT user_id, name, email, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- Search users -----------------
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const [users] = await db.query(
      'SELECT user_id, name, email, created_at FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC',
      [`%${q}%`, `%${q}%`]
    );
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- Add a user -----------------
const addUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

    res.status(201).json({ message: 'User added successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already exists.' });
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- Update a user -----------------
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' });

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET name = ?, email = ?, password = ? WHERE user_id = ?', [name, email, hashedPassword, id]);
    } else {
      await db.query('UPDATE users SET name = ?, email = ? WHERE user_id = ?', [name, email, id]);
    }

    res.status(200).json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- Delete a user -----------------
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

module.exports = {
  getUsers,
  searchUsers,
  addUser,
  updateUser,
  deleteUser,
};
