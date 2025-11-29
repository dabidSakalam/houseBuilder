const { db } = require('../../db/connection');

// ===== GET all cities =====
exports.getAllCities = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM city_rates ORDER BY city ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add new city
exports.addCity = async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ message: 'City is required.' });

    await db.query('INSERT INTO city_rates (city) VALUES (?)', [city]);
    res.status(201).json({ message: 'City added successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update city
exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { city } = req.body;
    if (!city) return res.status(400).json({ message: 'City is required.' });

    const [result] = await db.query('UPDATE city_rates SET city = ? WHERE id = ?', [city, id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'City not found.' });

    res.json({ message: 'City updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete city
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM city_rates WHERE id = ?', [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'City not found.' });

    res.json({ message: 'City deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
