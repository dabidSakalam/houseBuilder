const express = require('express');
const adminInquiriesRouter = express.Router();
const {
  getAllInquiries,
  getInquiryById,
  sendToContractor,
  acceptInquiry,
  completeInquiry  // ✅ ADD THIS
} = require('../../controller/admin/adminInquiriesController');

// ===== ROUTES =====

// Get all inquiries
adminInquiriesRouter.get('/', getAllInquiries);

// Get single inquiry by ID
adminInquiriesRouter.get('/:id', getInquiryById);

// Send inquiry to contractor
adminInquiriesRouter.post('/sendToContractor', sendToContractor);

// Accept inquiry
adminInquiriesRouter.put('/:inquiryId/accept', acceptInquiry);

// ✅ Complete inquiry (ADD THIS LINE)
adminInquiriesRouter.put('/:inquiryId/complete', completeInquiry);

module.exports = adminInquiriesRouter;