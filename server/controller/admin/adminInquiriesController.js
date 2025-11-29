const { db } = require('../../db/connection');

// ===== GET ALL INQUIRIES =====
const getAllInquiries = async (req, res) => {
  try {
    const [inquiries] = await db.query(`
      SELECT i.inquiry_id, u.name AS client_name, i.bedrooms, i.bathrooms, i.floors, i.style,
             i.unit_size, i.city, i.features, i.created_at
      FROM inquiries i
      JOIN users u ON i.user_id = u.user_id
      ORDER BY i.created_at DESC
    `);

    const [allFeatures] = await db.query('SELECT feature_id, name FROM features');

const inquiriesWithFeatures = inquiries.map(inq => {
  let featureIds = [];

  // Robust JSON parsing
  if (Array.isArray(inq.features)) {
    featureIds = inq.features.map(Number);
  } else if (typeof inq.features === 'string') {
    try {
      const parsed = JSON.parse(inq.features);
      if (Array.isArray(parsed)) featureIds = parsed.map(Number);
    } catch (err) {
      featureIds = [];
    }
  }

  const featureNames = allFeatures
    .filter(f => featureIds.includes(Number(f.feature_id)))
    .map(f => f.name);

  return { ...inq, featureNames };
});


    res.json(inquiriesWithFeatures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== GET SINGLE INQUIRY =====
const getInquiryById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM inquiries WHERE inquiry_id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Inquiry not found' });

    const inq = rows[0];

    const [allFeatures] = await db.query('SELECT feature_id, name FROM features');

    let featureIds = [];
    if (Array.isArray(inq.features)) {
    featureIds = inq.features.map(Number);
    } else if (typeof inq.features === 'string') {
    try {
        const parsed = JSON.parse(inq.features);
        if (Array.isArray(parsed)) featureIds = parsed.map(Number);
    } catch (err) {
        featureIds = [];
    }
}


    const featureNames = allFeatures
      .filter(f => featureIds.includes(Number(f.feature_id)))
      .map(f => f.name);

    res.json({ ...inq, featureNames, allFeatures });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===== SEND INQUIRY TO CONTRACTOR =====
const sendToContractor = async (req, res) => {
  try {
    const { inquiry_id } = req.body;
    if (!inquiry_id) return res.status(400).json({ message: 'Inquiry ID is required' });

    await db.query('UPDATE inquiries SET sent_to_contractor = 1 WHERE inquiry_id = ?', [inquiry_id]);

    res.json({ message: 'Inquiry sent to contractor successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllInquiries, getInquiryById, sendToContractor };
