const express = require('express');
const router = express.Router();
const { 
  getEstimateTotalValue, 
  sendToContractor, 
  sendInquiry,      // <-- import sendInquiry
  getRates, 
  getModelLink, 
  getFloors, 
  getAllCityRates, 
  getProjectSummary 
} = require('../../controller/admin/estimateController');

// Routes
router.post('/getEstimateTotalValue', getEstimateTotalValue);
router.post('/sendToContractor', sendToContractor);
router.post('/sendInquiry', sendInquiry);   // <-- add this
router.get('/rates', getRates);
router.get('/getModelLink', getModelLink);
router.get('/getFloors', getFloors);
router.get('/cityRates', getAllCityRates);
router.post('/getProjectSummary', getProjectSummary);

module.exports = router;
