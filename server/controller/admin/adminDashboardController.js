// server/controller/admin/adminDashboardController.js

const { db } = require('../../db/connection');

// ----------------- Get dashboard metrics -----------------
const getDashboardMetrics = async (req, res) => {
  try {
    // Total Users
    const [usersResult] = await db.query(
      'SELECT COUNT(*) AS totalUsers FROM users'
    );
    const totalUsers = usersResult[0].totalUsers;

    // Total Admins
    const [adminsResult] = await db.query(
      'SELECT COUNT(*) AS totalAdmins FROM adminaccount'
    );
    const totalAdmins = adminsResult[0].totalAdmins;

    // Total Models
    const [modelsResult] = await db.query(
      'SELECT COUNT(*) AS totalModels FROM models'
    );
    const totalModels = modelsResult[0].totalModels;

    // ✅ "Total Estimates" = total inquiries
    const [totalInquiriesResult] = await db.query(
      'SELECT COUNT(*) AS totalEstimates FROM inquiries'
    );
    const totalEstimates = totalInquiriesResult[0].totalEstimates;

    // ✅ Pending inquiries
    const [pendingResult] = await db.query(
      "SELECT COUNT(*) AS pendingEstimates FROM inquiries WHERE status = 'pending'"
    );
    const pendingEstimates = pendingResult[0].pendingEstimates;

    // ✅ Completed = accepted inquiries (adjust if you use a different status)
    const [completedResult] = await db.query(
      "SELECT COUNT(*) AS completedEstimates FROM inquiries WHERE status = 'accepted'"
    );
    const completedEstimates = completedResult[0].completedEstimates;

    res.status(200).json({
      totalUsers,
      totalAdmins,
      totalModels,
      totalEstimates,
      pendingEstimates,
      completedEstimates,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- "Estimates" by City (from inquiries) -----------------
const getEstimatesByCity = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT city, COUNT(*) AS count 
      FROM inquiries 
      GROUP BY city
    `);

    const data = {};
    results.forEach((r) => {
      const key = r.city || 'Unknown';
      data[key] = r.count;
    });

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- Inquiries by Style -----------------
const getModelsByStyle = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT style, COUNT(*) AS count 
      FROM inquiries 
      GROUP BY style
    `);

    const data = {};
    results.forEach((r) => {
      const key = r.style || 'Unknown';
      data[key] = r.count;
    });

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- Top 5 Features (from inquiries) -----------------
const getTopFeatures = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT f.name, COUNT(*) AS count
      FROM features f
      JOIN inquiries i 
        ON JSON_CONTAINS(i.features, CAST(f.feature_id AS JSON))
      GROUP BY f.name
      ORDER BY count DESC
      LIMIT 5
    `);

    const data = {};
    results.forEach((r) => {
      data[r.name] = r.count;
    });

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

module.exports = {
  getDashboardMetrics,
  getEstimatesByCity,
  getModelsByStyle,
  getTopFeatures,
};
