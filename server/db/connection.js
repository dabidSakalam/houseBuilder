const mysql = require("mysql2");
require("dotenv").config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "housebuilderv2",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Wrap pool with promise API for async/await usage
const db = pool.promise();

// Test the connection
db.getConnection()
  .then((conn) => {
    console.log("✅ MySQL connected successfully");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err);
  });

module.exports = { db };
