const express = require('express');
const router = express.Router();
const {
  getAllFeatures,
  addFeature,
  updateFeature,
  deleteFeature
} = require('../../controller/admin/featuresController');

// GET all features
router.get('/', getAllFeatures);

// POST add new feature
router.post('/', addFeature);

// PUT update feature
router.put('/:feature_id', updateFeature);

// DELETE feature
router.delete('/:feature_id', deleteFeature);

module.exports = router;
