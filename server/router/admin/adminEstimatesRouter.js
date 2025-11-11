const express = require('express');
const adminEstimatesRouter = express.Router();
const {
  getAllEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getCityRates
} = require('../../controller/admin/adminEstimatesController');

// Get all estimates
adminEstimatesRouter.get('/', getAllEstimates);

// Get single estimate
adminEstimatesRouter.get('/:id', getEstimateById);

// Update estimate
adminEstimatesRouter.put('/:id', updateEstimate);

// Delete estimate
adminEstimatesRouter.delete('/:id', deleteEstimate);

// Get city rates for dropdown
adminEstimatesRouter.get('/cities/rates', getCityRates);

module.exports = adminEstimatesRouter;
