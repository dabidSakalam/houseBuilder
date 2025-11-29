const { db } = require('../../db/connection');

// ===== GET ESTIMATE TOTAL VALUE =====
const getEstimateTotalValue = async (req, res) => {
  try {
    const data = req.method === 'GET' ? req.query : req.body;
    const { bedrooms, bathrooms, floors, style, features, unit } = data; // removed city
    let total = 0;

    // Floors price
    const [floorRows] = await db.query('SELECT price FROM floors WHERE name = ? LIMIT 1', [floors]);
    if (floorRows.length) total += parseFloat(floorRows[0].price);

    // Bedrooms price
    const [bedRows] = await db.query('SELECT price FROM bedrooms WHERE count = ? LIMIT 1', [bedrooms]);
    if (bedRows.length) total += parseFloat(bedRows[0].price);

    // Bathrooms price
    const [bathRows] = await db.query('SELECT price FROM bathrooms WHERE count = ? LIMIT 1', [bathrooms]);
    if (bathRows.length) total += parseFloat(bathRows[0].price);

    // Style price
    const [styleRows] = await db.query('SELECT price FROM styles WHERE name = ? LIMIT 1', [style === 'Modern' ? 'Modern / Contemporary' : style]);
    if (styleRows.length) total += parseFloat(styleRows[0].price);

    // Features price (by ID)
    if (features && features.length) {
      const placeholders = features.map(() => '?').join(',');
      const [featRows] = await db.query(`SELECT price FROM features WHERE feature_id IN (${placeholders})`, features);
      total += featRows.reduce((sum, f) => sum + parseFloat(f.price), 0);
    }

    // Removed city rate calculation
    // total += (parseFloat(unit) || 0) * cityRate; 

    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== SEND ESTIMATE TO CONTRACTOR (OLD TABLE) =====
// ===== SEND ESTIMATE TO CONTRACTOR (TO INQUIRIES TABLE) =====
const sendToContractor = async (req, res) => {
  try {
    const { userid, bedrooms, bathrooms, style, floors, unit_size, city, features } = req.body;

    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ? LIMIT 1', [userid]);
    if (!users.length) return res.status(400).json({ message: 'User not found' });

    // Insert into inquiries table
    await db.query(
      `INSERT INTO inquiries 
        (user_id, unit_size, style, floors, features, city, bedrooms, bathrooms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userid, unit_size, style, floors, JSON.stringify(features || []), city, bedrooms, bathrooms]
    );

    res.status(201).json({ message: 'Estimate sent to contractor successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// ===== SEND INQUIRY TO CONTRACTOR (NEW TABLE) =====
const sendInquiry = async (req, res) => {
  try {
    const { userid, bedrooms, bathrooms, style, floors, unit_size, city, features } = req.body;

    // Check user exists
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ? LIMIT 1', [userid]);
    if (!users.length) return res.status(400).json({ message: 'User not found' });

    // Insert into inquiries table
    await db.query(
      `INSERT INTO inquiries 
      (user_id, bedrooms, bathrooms, floors, style, unit_size, city, features, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userid, bedrooms, bathrooms, floors, style, unit_size, city, JSON.stringify(features || [])]
    );

    res.status(201).json({ message: 'Inquiry sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== GET ALL RATES =====
const getRates = async (req, res) => {
  try {
    const [floorRows] = await db.query('SELECT name, price FROM floors');
    const [bedRows] = await db.query('SELECT count, price FROM bedrooms');
    const [bathRows] = await db.query('SELECT count, price FROM bathrooms');
    const [styleRows] = await db.query('SELECT name, price FROM styles');
    const [featRows] = await db.query('SELECT feature_id, price FROM features'); // use ID
    const [cityRows] = await db.query('SELECT city FROM city_rates'); // removed rate

    res.json({
      floorRates: Object.fromEntries(floorRows.map(r => [r.name, parseFloat(r.price)])),
      bedroomRates: Object.fromEntries(bedRows.map(r => [r.count, parseFloat(r.price)])),
      bathroomRates: Object.fromEntries(bathRows.map(r => [r.count, parseFloat(r.price)])),
      styleRates: Object.fromEntries(styleRows.map(r => [r.name, parseFloat(r.price)])),
      featureRates: Object.fromEntries(featRows.map(r => [r.feature_id, parseFloat(r.price)])), // map by ID
      cityRates: cityRows.map(r => r.city), // now only returns city names
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== GET MODEL LINK FOR FRONTEND =====
const getModelLink = async (req, res) => {
  try {
    const { style, floors } = req.query;
    if (!style || !floors) return res.status(400).json({ message: 'Style and floors are required' });

    const floorMap = {
      "Bungalow (1 Floor)": "1",
      "Two-Storey": "2",
      "Three-Storey": "3",
      "High-Rise (4+ Floors)": "4"
    };
    const dbFloor = floorMap[floors] || floors;

    const [models] = await db.query(
      'SELECT file_path, name FROM models WHERE category = ? AND floors = ? AND status = "Available" LIMIT 1',
      [style, dbFloor]
    );
    if (models.length) return res.json(models[0]);

    const [fallback] = await db.query(
      'SELECT file_path, name FROM models WHERE category = ? AND status = "Available" LIMIT 1',
      [style]
    );
    if (!fallback.length) return res.status(404).json({ message: 'No model found' });

    res.json(fallback[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== GET FLOORS =====
const getFloors = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT name, price FROM floors');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== GET ALL CITY RATES =====
const getAllCityRates = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT id, city FROM city_rates ORDER BY city ASC`); // removed rate
    res.json(rows);
  } catch (err) {
    console.error('Error fetching city rates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== GET PROJECT SUMMARY =====
const getProjectSummary = async (req, res) => {
  try {
    const data = req.method === 'GET' ? req.query : req.body;
    const { bedrooms, bathrooms, floors, style, features, unit, city } = data;

    const summary = [];

    // --- Bedrooms ---
    summary.push({ label: `🛏️ Bedrooms (${bedrooms})` });

    // --- Bathrooms ---
    summary.push({ label: `🛁 Bathrooms (${bathrooms})` });

    // --- Floors ---
    summary.push({ label: `🏢 Floors (${floors})` });

    // --- Style ---
    summary.push({ label: `🎨 Style (${style})` });

    // --- Features ---
    if (features && features.length) {
      const placeholders = features.map(() => '?').join(',');
      const [featRows] = await db.query(`SELECT name FROM features WHERE feature_id IN (${placeholders})`, features);
      featRows.forEach(f => summary.push({ label: `🏡 Feature - ${f.name}` }));
    } else {
      summary.push({ label: `🏡 Features` });
    }

    // --- Unit & City ---
    summary.push({ label: `📏 Unit Size (${unit} sqm)` });
    summary.push({ label: `📍 Location: ${city}` });

    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  getEstimateTotalValue, 
  sendToContractor, 
  sendInquiry, 
  getRates, 
  getModelLink, 
  getFloors, 
  getAllCityRates, 
  getProjectSummary  
};
