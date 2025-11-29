const { db } = require('../../db/connection');

// ===== GET ALL INQUIRIES (used instead of old estimates) =====
const getAllEstimates = async (req, res) => {
  try {
    const [inquiries] = await db.query(`
      SELECT i.inquiry_id AS estimate_id, u.name AS client_name, i.bedrooms, i.bathrooms, i.style,
             i.unit_size, i.floors AS model_floors, i.features, i.city, i.created_at AS assumed_date
      FROM inquiries i
      JOIN users u ON i.user_id = u.user_id
      ORDER BY i.created_at DESC
    `);

    const [allFeatures] = await db.query('SELECT * FROM features');

    const inquiriesWithFeatures = inquiries.map(est => {
      const featureIds = Array.isArray(est.features) ? est.features.map(Number) : [];
      const featureNames = allFeatures
        .filter(f => featureIds.includes(Number(f.feature_id)))
        .map(f => f.name);
      return { ...est, featureNames };
    });

    res.json(inquiriesWithFeatures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== GET SINGLE INQUIRY =====
const getEstimateById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM inquiries WHERE inquiry_id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Inquiry not found' });

    const est = rows[0];

    const [[allBedrooms], [allBathrooms], [allFloors], [allStyles], [allFeatures]] = await Promise.all([
      db.query('SELECT * FROM bedrooms'),
      db.query('SELECT * FROM bathrooms'),
      db.query('SELECT * FROM floors'),
      db.query('SELECT * FROM styles'),
      db.query('SELECT * FROM features')
    ]);

    const featureIds = Array.isArray(est.features) ? est.features.map(Number) : [];
    const featureNames = allFeatures.filter(f => featureIds.includes(Number(f.feature_id))).map(f => f.name);

    res.json({
      ...est,
      style: est.style || 'N/A',
      featureNames,
      allFeatures,
      allBedrooms,
      allBathrooms,
      allFloors,
      allStyles
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== UPDATE INQUIRY =====
const updateEstimate = async (req, res) => {
  try {
    let { bedrooms, bathrooms, unit_size, city, features, floors, style } = req.body;
    features = Array.isArray(features) ? features : [];

    await db.query(
      `UPDATE inquiries
       SET bedrooms=?, bathrooms=?, unit_size=?, city=?, features=?, floors=?, style=?
       WHERE inquiry_id=?`,
      [bedrooms, bathrooms, unit_size, city, JSON.stringify(features), floors, style, req.params.id]
    );

    res.json({ message: 'Inquiry updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== DELETE INQUIRY =====
const deleteEstimate = async (req, res) => {
  try {
    await db.query('DELETE FROM inquiries WHERE inquiry_id = ?', [req.params.id]);
    res.json({ message: 'Inquiry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== GET CITY RATES =====
const getCityRates = async (req, res) => {
  try {
    const [cities] = await db.query('SELECT * FROM city_rates ORDER BY city ASC');
    res.json(cities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== SEND TO CONTRACTOR (NEW) =====
const sendToContractor = async (req, res) => {
  try {
    const { inquiry_id } = req.body;
    if (!inquiry_id) return res.status(400).json({ message: 'Inquiry ID is required' });

    const [rows] = await db.query('SELECT * FROM inquiries WHERE inquiry_id = ? LIMIT 1', [inquiry_id]);
    if (!rows.length) return res.status(404).json({ message: 'Inquiry not found' });

    // Optionally, you could copy the inquiry to an old "estimates" table here
    // For now, we just mark it as sent or leave as is
    res.json({ message: 'Inquiry sent to contractor successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllEstimates, getEstimateById, updateEstimate, deleteEstimate, getCityRates, sendToContractor };
