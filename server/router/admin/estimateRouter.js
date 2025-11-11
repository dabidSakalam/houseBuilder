const express = require('express');
const router = express.Router();
const { getEstimateTotalValue, sendToContractor, getRates, getModelLink, getFloors, getAllCityRates } = require('../../controller/admin/estimateController');

// Routes
router.post('/getEstimateTotalValue', getEstimateTotalValue);
router.post('/sendToContractor', sendToContractor);
router.get('/rates', getRates); // existing endpoint
router.get('/getModelLink', getModelLink); // new endpoint for frontend to fetch model link
router.get('/getFloors', getFloors);
router.get('/cityRates', getAllCityRates);

module.exports = router;
