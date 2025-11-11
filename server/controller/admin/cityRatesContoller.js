const { db } = require('../../db/connection');

// ===== GET all city rates =====
exports.getAllCityRates = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM city_rates ORDER BY city ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== ADD new city =====
exports.addCityRate = async (req, res) => {
  try {
    const { city, rate } = req.body;
    if (!city || !rate) return res.status(400).json({ message: 'City and rate are required.' });

    await db.query('INSERT INTO city_rates (city, rate) VALUES (?, ?)', [city, rate]);
    res.status(201).json({ message: 'City added successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== UPDATE city rate (allow changing city name too) =====
exports.updateCityRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { city, rate } = req.body;
    if (!city || !rate) return res.status(400).json({ message: 'City and rate are required.' });

    const [result] = await db.query(
      'UPDATE city_rates SET city = ?, rate = ? WHERE id = ?',
      [city, rate, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'City not found.' });

    res.json({ message: 'City updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== DELETE city =====
exports.deleteCityRate = async (req, res) => {
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
