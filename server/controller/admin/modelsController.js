const { db } = require('../../db/connection');
const cloudinary = require('../../config/cloudinary');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// ===== Multer setup =====
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===== Helper: Save file locally =====
function saveModelFileLocally(file, category, filename) {
  const folderPath = path.join(__dirname, '../../assets/HouseBuilder/models', category);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filePath = path.join(folderPath, filename);
  fs.writeFileSync(filePath, file.buffer);

  return `/assets/HouseBuilder/models/${category}/${filename}`;
}

// ===== GET all models =====
exports.getAllModels = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM models ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== GET single model =====
exports.getModelById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM models WHERE model_id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Model not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== ADD new model =====
exports.addModel = async (req, res) => {
  try {
    const { name, category, floors, status, saveLocally } = req.body;

    if (!name || !category || !floors || !status) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!req.file) return res.status(400).json({ message: 'Model file is required.' });

    let filePath;

    if (saveLocally === 'true') {
      // Save locally
      filePath = saveModelFileLocally(req.file, category, req.file.originalname);
    } else {
      // Upload to Cloudinary
      filePath = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'housebuilder/models' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    }

    await db.query(
      'INSERT INTO models (name, category, floors, file_path, status) VALUES (?, ?, ?, ?, ?)',
      [name, category, floors, filePath, status]
    );

    res.status(201).json({ message: 'Model added successfully.' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== UPDATE model =====
exports.updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, floors, status, saveLocally } = req.body;

    let filePath;

    if (req.file) {
      if (saveLocally === 'true') {
        filePath = saveModelFileLocally(req.file, category, req.file.originalname);
      } else {
        filePath = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'housebuilder/models' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );
          stream.end(req.file.buffer);
        });
      }
    }

    const query = filePath
      ? 'UPDATE models SET name=?, category=?, floors=?, file_path=?, status=? WHERE model_id=?'
      : 'UPDATE models SET name=?, category=?, floors=?, status=? WHERE model_id=?';

    const params = filePath
      ? [name, category, floors, filePath, status, id]
      : [name, category, floors, status, id];

    await db.query(query, params);

    res.json({ message: 'Model updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== DELETE model =====
exports.deleteModel = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM models WHERE model_id = ?', [id]);
    res.json({ message: 'Model deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===== Export multer middleware =====
exports.upload = upload.single('file');
