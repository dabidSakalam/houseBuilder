const express = require('express');
const router = express.Router();
const verifyToken = require('../../util/verifyToken')
const { getDashboardMetrics, getEstimatesByCity, getModelsByStyle, getTopFeatures } = require('../../controller/admin/adminDashboardController');

// Protected dashboard routes
router.get('/metrics', verifyToken, getDashboardMetrics);
router.get('/estimates-by-city', verifyToken, getEstimatesByCity);
router.get('/models-by-style', verifyToken, getModelsByStyle);
router.get('/top-features', verifyToken, getTopFeatures);

module.exports = router;
