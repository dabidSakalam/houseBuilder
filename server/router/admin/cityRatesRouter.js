const express = require('express');
const router = express.Router();
const cityRatesController = require('../../controller/admin/cityRatesContoller');

// Routes
router.get('/', cityRatesController.getAllCityRates);
router.post('/', cityRatesController.addCityRate);
router.put('/:id', cityRatesController.updateCityRate);
router.delete('/:id', cityRatesController.deleteCityRate);

module.exports = router;
