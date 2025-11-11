const { db } = require('../../db/connection');

// ===== GET ALL FEATURES =====
const getAllFeatures = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM features ORDER BY feature_id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch features' });
  }
};

// ===== ADD NEW FEATURE =====
const addFeature = async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: 'Name and price are required' });

    const [result] = await db.query('INSERT INTO features (name, price) VALUES (?, ?)', [name, price]);
    res.status(201).json({ feature_id: result.insertId, name, price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add feature' });
  }
};

// ===== UPDATE FEATURE =====
const updateFeature = async (req, res) => {
  try {
    const { feature_id } = req.params;
    const { name, price } = req.body;

    const [result] = await db.query('UPDATE features SET name = ?, price = ? WHERE feature_id = ?', [name, price, feature_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Feature not found' });

    res.json({ feature_id, name, price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update feature' });
  }
};

// ===== DELETE FEATURE =====
const deleteFeature = async (req, res) => {
  try {
    const { feature_id } = req.params;
    const [result] = await db.query('DELETE FROM features WHERE feature_id = ?', [feature_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Feature not found' });

    res.json({ message: 'Feature deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete feature' });
  }
};

module.exports = {
  getAllFeatures,
  addFeature,
  updateFeature,
  deleteFeature
};
