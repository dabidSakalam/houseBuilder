const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../../db/connection");
require("dotenv").config();

// ---------------- Register ----------------
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required." });

  try {
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    res.status(201).json({ message: "User registered successfully!", user_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// ---------------- Login ----------------
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "All fields are required." });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "Invalid email or password." });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { registerUser, loginUser };
