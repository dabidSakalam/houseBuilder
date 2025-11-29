const express = require('express');
const router = express.Router();
const cityController = require('../../controller/admin/cityRatesContoller');

// GET all cities
router.get('/', cityController.getAllCities);

// POST add new city
router.post('/', cityController.addCity);

// PUT update city
router.put('/:id', cityController.updateCity);

// DELETE city
router.delete('/:id', cityController.deleteCity);

module.exports = router;
