const { db } = require('../../db/connection'); // destructured because we export { db }
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '2h';

// ----------------- Admin Registration -----------------
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO adminAccount (name, email, password) VALUES (?, ?, ?)';
    await db.query(query, [name, email, hashedPassword]);

    return res.status(201).json({ message: 'Admin registered successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    return res.status(500).json({ message: 'Database error.', error: err });
  }
};

// ----------------- Admin Login -----------------
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [results] = await db.query('SELECT * FROM adminAccount WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const admin = results[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: admin.user_id, email: admin.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    return res.status(500).json({ message: 'Database error.', error: err });
  }
};

// ----------------- Admin Logout -----------------
const logout = async (req, res) => {
  // For JWT, logout is handled client-side by removing token
  return res.status(200).json({ message: 'Logged out successfully' });
};



module.exports = { register, login, logout };
