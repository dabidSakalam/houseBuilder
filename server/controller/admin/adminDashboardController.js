const { db } = require('../../db/connection');

// ----------------- Get dashboard metrics -----------------
const getDashboardMetrics = async (req, res) => {
  try {
    // Total Users
    const [usersResult] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
    const totalUsers = usersResult[0].totalUsers;

    // Total Admins
    const [adminsResult] = await db.query('SELECT COUNT(*) AS totalAdmins FROM adminaccount');
    const totalAdmins = adminsResult[0].totalAdmins;

    // Total Models
    const [modelsResult] = await db.query('SELECT COUNT(*) AS totalModels FROM models');
    const totalModels = modelsResult[0].totalModels;

    // Total Estimates
    const [estimatesResult] = await db.query('SELECT COUNT(*) AS totalEstimates FROM estimates');
    const totalEstimates = estimatesResult[0].totalEstimates;

    // Pending Estimates
    const [pendingResult] = await db.query("SELECT COUNT(*) AS pendingEstimates FROM estimates WHERE status='In Progress'");
    const pendingEstimates = pendingResult[0].pendingEstimates;

    // Completed Estimates
    const [completedResult] = await db.query("SELECT COUNT(*) AS completedEstimates FROM estimates WHERE status='Completed'");
    const completedEstimates = completedResult[0].completedEstimates;

    res.status(200).json({ 
      totalUsers, 
      totalAdmins, 
      totalModels, 
      totalEstimates, 
      pendingEstimates, 
      completedEstimates 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- Estimates by City -----------------
const getEstimatesByCity = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT city, COUNT(*) AS count 
      FROM estimates 
      GROUP BY city
    `);

    const data = {};
    results.forEach(r => data[r.city] = r.count);

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- Models by Style -----------------
const getModelsByStyle = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT category AS style, COUNT(*) AS count 
      FROM models 
      GROUP BY category
    `);

    const data = {};
    results.forEach(r => data[r.style] = r.count);

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

// ----------------- Top 5 Features -----------------
const getTopFeatures = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT f.name, COUNT(*) AS count
      FROM features f
      JOIN estimates e ON JSON_CONTAINS(e.features, CAST(f.feature_id AS JSON))
      GROUP BY f.name
      ORDER BY count DESC
      LIMIT 5
    `);

    const data = {};
    results.forEach(r => data[r.name] = r.count);

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
  getTopFeatures 
};
