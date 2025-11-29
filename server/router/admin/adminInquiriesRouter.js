const express = require('express');
const adminInquiriesRouter = express.Router();
const {
  getAllInquiries,
  getInquiryById,
  sendToContractor
} = require('../../controller/admin/adminInquiriesController');

// ===== ROUTES =====

// Get all inquiries
adminInquiriesRouter.get('/', getAllInquiries);

// Get single inquiry by ID
adminInquiriesRouter.get('/:id', getInquiryById);

// Send inquiry to contractor
adminInquiriesRouter.post('/sendToContractor', sendToContractor);

module.exports = adminInquiriesRouter;
