const { db } = require('../../db/connection');
const { sendInquiryNotification } = require('../../services/emailService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ===== MULTER CONFIGURATION FOR DESIGN IMAGES =====
const designStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/designs';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `design-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadDesignImages = multer({
  storage: designStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'));
    }
  }
}).array('designImages', 5);

// ===== GET ESTIMATE TOTAL VALUE =====
const getEstimateTotalValue = async (req, res) => {
  try {
    const data = req.method === 'GET' ? req.query : req.body;
    const { bedrooms, bathrooms, floors, style, features, unit } = data;
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

    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

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

// ===== SEND INQUIRY TO CONTRACTOR (NEW TABLE) WITH EMAIL NOTIFICATION =====
const sendInquiry = async (req, res) => {
  try {
    const { userid, bedrooms, bathrooms, style, floors, unit_size, city, features } = req.body;

    // Check user exists and get details
    const [users] = await db.query(
      'SELECT user_id, name, email FROM users WHERE user_id = ? LIMIT 1',
      [userid]
    );
    if (!users.length) {
      return res.status(400).json({ message: 'User not found' });
    }

    const clientInfo = {
      first_name: users[0].name || 'Client',
      last_name: '',
      email: users[0].email
    };

    // Get feature names if features are provided
    let featureNames = [];
    if (features && features.length > 0) {
      const placeholders = features.map(() => '?').join(',');
      const [featRows] = await db.query(
        `SELECT name FROM features WHERE feature_id IN (${placeholders})`,
        features
      );
      featureNames = featRows.map(f => f.name);
    }

    // Insert into inquiries table
    const [result] = await db.query(
      `INSERT INTO inquiries 
      (user_id, bedrooms, bathrooms, floors, style, unit_size, city, features, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userid, bedrooms, bathrooms, floors, style, unit_size, city, JSON.stringify(features || [])]
    );

    // Prepare inquiry data for email
    const inquiryData = {
      bedrooms,
      bathrooms,
      style,
      floors,
      unit_size,
      city,
      features: featureNames
    };

    // Send email notification (non-blocking)
    sendInquiryNotification(inquiryData, clientInfo)
      .then(emailResult => {
        if (emailResult.success) {
          console.log('✅ Email notification sent to contractor - MessageID:', emailResult.messageId);
        } else {
          console.error('⚠️ Failed to send email notification:', emailResult.error);
        }
      })
      .catch(err => {
        console.error('⚠️ Email notification error:', err);
      });

    // Return success immediately
    res.status(201).json({
      message: 'Inquiry sent successfully',
      inquiryId: result.insertId
    });

  } catch (err) {
    console.error('❌ Error in sendInquiry:', err);
    res.status(500).json({ message: err.message });
  }
};

// ===== SUBMIT ESTIMATE WITH MESSAGE AND IMAGES =====
const submitEstimateWithImages = async (req, res) => {
  uploadDesignImages(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const {
        userid,
        bedrooms,
        bathrooms,
        floors,
        style,
        city,
        unit_size,
        features,
        clientMessage
      } = req.body;

      // Get userId from token if not in body
      const userId = userid || req.user?.user_id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate required fields
      if (!bedrooms || !bathrooms || !floors || !style || !city || !unit_size) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Prepare design images paths
      const designImages = req.files ? req.files.map(file => `/uploads/designs/${file.filename}`) : [];

      // Parse features if it's a string
      let featuresArray = [];
      if (features) {
        try {
          featuresArray = typeof features === 'string' ? JSON.parse(features) : features;
        } catch (e) {
          featuresArray = [];
        }
      }

      // Get user info for email
      const [users] = await db.query(
        'SELECT user_id, name, email FROM users WHERE user_id = ? LIMIT 1',
        [userId]
      );

      if (!users.length) {
        return res.status(400).json({ message: 'User not found' });
      }

      const clientInfo = {
        first_name: users[0].name || 'Client',
        last_name: '',
        email: users[0].email
      };

      // Get feature names
      let featureNames = [];
      if (featuresArray && featuresArray.length > 0) {
        const placeholders = featuresArray.map(() => '?').join(',');
        const [featRows] = await db.query(
          `SELECT name FROM features WHERE feature_id IN (${placeholders})`,
          featuresArray
        );
        featureNames = featRows.map(f => f.name);
      }

      // Insert inquiry with message and images
      const [result] = await db.query(
        `INSERT INTO inquiries 
        (user_id, bedrooms, bathrooms, floors, style, unit_size, city, features, client_message, design_images, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          userId,
          bedrooms,
          bathrooms,
          floors,
          style,
          unit_size,
          city,
          JSON.stringify(featuresArray),
          clientMessage || null,
          JSON.stringify(designImages)
        ]
      );

      const inquiryId = result.insertId;

      // Prepare inquiry data for email with new fields
      const inquiryData = {
        inquiry_id: inquiryId,
        bedrooms,
        bathrooms,
        floors,
        style,
        unit_size,
        city,
        features: featureNames,
        client_message: clientMessage,
        has_images: designImages.length > 0,
        image_count: designImages.length
      };

      // Send email notification (non-blocking)
      sendInquiryNotification(inquiryData, clientInfo)
        .then(emailResult => {
          if (emailResult.success) {
            console.log('✅ Email notification sent - MessageID:', emailResult.messageId);
          } else {
            console.error('⚠️ Failed to send email:', emailResult.error);
          }
        })
        .catch(err => {
          console.error('⚠️ Email error:', err);
        });

      res.status(201).json({
        message: 'Inquiry submitted successfully',
        inquiryId
      });

    } catch (error) {
      console.error('Error submitting estimate:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
};

// ===== GET INQUIRY DETAILS (FOR ADMIN VIEW) =====
const getInquiryDetails = async (req, res) => {
  try {
    const { inquiryId } = req.params;

    const [inquiries] = await db.query(
      `SELECT 
        i.*,
        u.name as user_name,
        u.email as user_email
      FROM inquiries i
      JOIN users u ON i.user_id = u.user_id
      WHERE i.inquiry_id = ?`,
      [inquiryId]
    );

    if (inquiries.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    const inquiry = inquiries[0];

    // ✅ Parse features and get names
    if (inquiry.features) {
      try {
        const featureIds = JSON.parse(inquiry.features);
        if (Array.isArray(featureIds) && featureIds.length > 0) {
          const placeholders = featureIds.map(() => '?').join(',');
          const [featRows] = await db.query(
            `SELECT name FROM features WHERE feature_id IN (${placeholders})`,
            featureIds
          );
          inquiry.feature_names = featRows.map(f => f.name);
        } else {
          inquiry.feature_names = [];
        }
      } catch (e) {
        console.error('Error parsing features:', e);
        inquiry.feature_names = [];
      }
    } else {
      inquiry.feature_names = [];
    }

    // ✅ Parse design images - CRITICAL FIX
    if (inquiry.design_images) {
      try {
        // Check if it's already an array or a JSON string
        if (typeof inquiry.design_images === 'string') {
          inquiry.design_images = JSON.parse(inquiry.design_images);
        }
        
        // Ensure it's an array
        if (!Array.isArray(inquiry.design_images)) {
          inquiry.design_images = [];
        }
        
        console.log('✅ Parsed design_images:', inquiry.design_images);
      } catch (e) {
        console.error('❌ Error parsing design images:', e);
        console.error('Raw design_images value:', inquiry.design_images);
        inquiry.design_images = [];
      }
    } else {
      inquiry.design_images = [];
    }

    // Log for debugging
    console.log('📋 Inquiry Details Response:', {
      inquiry_id: inquiry.inquiry_id,
      has_message: !!inquiry.client_message,
      has_images: inquiry.design_images.length > 0,
      image_count: inquiry.design_images.length,
      images: inquiry.design_images
    });

    res.json(inquiry);

  } catch (error) {
    console.error('❌ Error fetching inquiry details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // ... other exports
  getInquiryDetails
};
// ===== GET ALL RATES =====
const getRates = async (req, res) => {
  try {
    const [floorRows] = await db.query('SELECT name, price FROM floors');
    const [bedRows] = await db.query('SELECT count, price FROM bedrooms');
    const [bathRows] = await db.query('SELECT count, price FROM bathrooms');
    const [styleRows] = await db.query('SELECT name, price FROM styles');
    const [featRows] = await db.query('SELECT feature_id, price FROM features');
    const [cityRows] = await db.query('SELECT city FROM city_rates');

    res.json({
      floorRates: Object.fromEntries(floorRows.map(r => [r.name, parseFloat(r.price)])),
      bedroomRates: Object.fromEntries(bedRows.map(r => [r.count, parseFloat(r.price)])),
      bathroomRates: Object.fromEntries(bathRows.map(r => [r.count, parseFloat(r.price)])),
      styleRates: Object.fromEntries(styleRows.map(r => [r.name, parseFloat(r.price)])),
      featureRates: Object.fromEntries(featRows.map(r => [r.feature_id, parseFloat(r.price)])),
      cityRates: cityRows.map(r => r.city),
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
    const [rows] = await db.query(`SELECT id, city FROM city_rates ORDER BY city ASC`);
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

    summary.push({ label: `🛏️ Bedrooms (${bedrooms})` });
    summary.push({ label: `🛁 Bathrooms (${bathrooms})` });
    summary.push({ label: `🏢 Floors (${floors})` });
    summary.push({ label: `🎨 Style (${style})` });

    if (features && features.length) {
      const placeholders = features.map(() => '?').join(',');
      const [featRows] = await db.query(`SELECT name FROM features WHERE feature_id IN (${placeholders})`, features);
      featRows.forEach(f => summary.push({ label: `🏡 Feature - ${f.name}` }));
    } else {
      summary.push({ label: `🏡 Features` });
    }

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
  getProjectSummary,
  submitEstimateWithImages,
  getInquiryDetails
};
