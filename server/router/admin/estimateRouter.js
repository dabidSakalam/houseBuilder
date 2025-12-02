const express = require('express');
const router = express.Router();
const { 
  getEstimateTotalValue, 
  sendToContractor, 
  sendInquiry,
  getRates, 
  getModelLink, 
  getFloors, 
  getAllCityRates, 
  getProjectSummary,
  submitEstimateWithImages,  // ✨ NEW
  getInquiryDetails         // ✨ NEW
} = require('../../controller/admin/estimateController');

const { authenticateToken } = require('../../middleware/authMiddleware');

// Existing routes
router.post('/getEstimateTotalValue', getEstimateTotalValue);
router.post('/sendToContractor', sendToContractor);
router.post('/sendInquiry', authenticateToken, sendInquiry);
router.get('/rates', getRates);
router.get('/getModelLink', getModelLink);
router.get('/getFloors', getFloors);
router.get('/cityRates', getAllCityRates);
router.post('/getProjectSummary', getProjectSummary);

// ✨ NEW ROUTES
router.post('/submit', authenticateToken, submitEstimateWithImages);
router.get('/inquiries/:inquiryId/details', authenticateToken, getInquiryDetails);

module.exports = router;