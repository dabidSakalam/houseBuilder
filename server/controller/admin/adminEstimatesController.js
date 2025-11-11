const { db } = require('../../db/connection');

// ===== GET ALL ESTIMATES =====
const getAllEstimates = async (req, res) => {
  try {
    const [estimates] = await db.query(`
      SELECT e.estimate_id, u.name AS client_name, e.bedrooms, e.bathrooms, e.style,
             e.unit_size, e.floors AS model_floors, e.features, e.city, e.total, e.model_id,
             e.status, e.assumed_date, e.complete_date
      FROM estimates e
      JOIN users u ON e.user_id = u.user_id
      ORDER BY e.created_at DESC
    `);

    const [allFeatures] = await db.query('SELECT * FROM features');

    const estimatesWithFeatures = estimates.map(est => {
      const featureIds = Array.isArray(est.features) ? est.features.map(Number) : [];
      const featureNames = allFeatures
        .filter(f => featureIds.includes(Number(f.feature_id)))
        .map(f => f.name);
      return { ...est, featureNames };
    });

    res.json(estimatesWithFeatures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== GET SINGLE ESTIMATE =====
const getEstimateById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM estimates WHERE estimate_id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Estimate not found' });

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

    // Fetch style name from styles table if not already a string
    let styleName = est.style;
    if (!styleName) {
      const [styleRow] = await db.query('SELECT name FROM styles WHERE style_id = ?', [est.style_id]);
      if (styleRow.length) styleName = styleRow[0].name;
      else styleName = 'N/A';
    }

    res.json({
      ...est,
      style: styleName,   // send actual style name
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

// ===== UPDATE ESTIMATE =====
const updateEstimate = async (req, res) => {
  try {
    let { bedrooms, bathrooms, unit_size, city, features, model_id, floors, style, status, assumed_date } = req.body;
    features = Array.isArray(features) ? features : [];
    if (!assumed_date || assumed_date.trim() === '') assumed_date = null;

    const [styleRow] = await db.query('SELECT * FROM styles WHERE name = ?', [style]);
    if (!styleRow.length) return res.status(400).json({ message: `Style "${style}" not found` });

    const styleName = styleRow[0].name;
    const stylePrice = parseFloat(styleRow[0].price) || 0;

    const [[bedroomRow], [bathroomRow], [floorRow], [cityRateRow], [allFeatures]] = await Promise.all([
      db.query('SELECT * FROM bedrooms WHERE count = ?', [bedrooms]),
      db.query('SELECT * FROM bathrooms WHERE count = ?', [bathrooms]),
      db.query('SELECT * FROM floors WHERE floor_id = ?', [floors]),
      db.query('SELECT * FROM city_rates WHERE city = ?', [city]),
      db.query('SELECT * FROM features')
    ]);

    const bedroomPrice = parseFloat(bedroomRow[0]?.price || 0);
    const bathroomPrice = parseFloat(bathroomRow[0]?.price || 0);
    const floorPrice = parseFloat(floorRow[0]?.price || 0);
    const cityRate = parseFloat(cityRateRow[0]?.rate || 0);
    const featuresPrice = allFeatures.filter(f => features.includes(f.feature_id)).reduce((a, f) => a + parseFloat(f.price), 0);

    const total = (unit_size * cityRate) + bedroomPrice + bathroomPrice + floorPrice + stylePrice + featuresPrice;

    const complete_date = status === 'Completed' ? new Date() : null;

    await db.query(
      `UPDATE estimates 
       SET bedrooms=?, bathrooms=?, unit_size=?, city=?, features=?, model_id=?, floors=?, style=?, total=?, status=?, assumed_date=?, complete_date=?
       WHERE estimate_id=?`,
      [bedrooms, bathrooms, unit_size, city, JSON.stringify(features), model_id, floors, styleName, total, status, assumed_date, complete_date, req.params.id]
    );

    res.json({ message: 'Estimate updated', total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== DELETE ESTIMATE =====
const deleteEstimate = async (req, res) => {
  try {
    await db.query('DELETE FROM estimates WHERE estimate_id = ?', [req.params.id]);
    res.json({ message: 'Estimate deleted' });
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

module.exports = { getAllEstimates, getEstimateById, updateEstimate, deleteEstimate, getCityRates };
