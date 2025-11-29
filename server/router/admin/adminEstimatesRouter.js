const express = require('express');
const adminEstimatesRouter = express.Router();
const {
  getAllEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getCityRates,
  sendToContractor
} = require('../../controller/admin/adminEstimatesController');

// Get all inquiries
adminEstimatesRouter.get('/', getAllEstimates);

// Get single inquiry
adminEstimatesRouter.get('/:id', getEstimateById);

// Update inquiry
adminEstimatesRouter.put('/:id', updateEstimate);

// Delete inquiry
adminEstimatesRouter.delete('/:id', deleteEstimate);

// Get city rates for dropdown
adminEstimatesRouter.get('/cities/rates', getCityRates);

// Send inquiry to contractor
adminEstimatesRouter.post('/sendToContractor', sendToContractor);

module.exports = adminEstimatesRouter;
