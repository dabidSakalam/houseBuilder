const { db } = require('../../db/connection');

// GET all features
const getAllFeatures = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT feature_id, name FROM features ORDER BY feature_id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch features' });
  }
};

// ADD new feature
const addFeature = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Feature name is required' });

    const [result] = await db.query('INSERT INTO features (name) VALUES (?)', [name]);
    res.status(201).json({ feature_id: result.insertId, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add feature' });
  }
};

// UPDATE feature
const updateFeature = async (req, res) => {
  try {
    const { feature_id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Feature name is required' });

    const [result] = await db.query('UPDATE features SET name = ? WHERE feature_id = ?', [name, feature_id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Feature not found' });
    res.json({ feature_id, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update feature' });
  }
};

// DELETE feature
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

module.exports = { getAllFeatures, addFeature, updateFeature, deleteFeature };
