const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Import authentication middleware
const { authenticateToken } = require("../../middleware/authMiddleware");

// ✅ Import reCAPTCHA middleware
const verifyRecaptcha = require("../../middleware/verifyRecaptcha");

// ✅ Import user controllers
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUserInquiries,
  cancelInquiry,
  getUserInbox,
  forgotPassword,
  resetPassword,
  getInquiryDetails, // ✅ ADD THIS NEW FUNCTION
} = require("../../controller/user/userController");

// ✅ Import inbox/message controllers
const {
  getMessagesByInquiry,
  sendMessage,
  sendImage,
} = require("../../controllers/inboxControllers");

console.log("📝 User Router loaded!");

// ✅ Multer setup for image uploads
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ==================== AUTH ROUTES (PUBLIC) ====================
// ✅ Apply verifyRecaptcha BEFORE registerUser
router.post("/register", verifyRecaptcha, registerUser);
router.post("/login", loginUser);

// ==================== PASSWORD RESET ROUTES (PUBLIC) ====================
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ==================== USER PROFILE ROUTES (PROTECTED) ====================
router.get("/profile/:userId", authenticateToken, (req, res, next) => {
  console.log("📝 Profile route hit! UserId:", req.params.userId);
  getUserProfile(req, res, next);
});

router.get("/inquiries/:userId", authenticateToken, (req, res, next) => {
  console.log("📝 Inquiries route hit! UserId:", req.params.userId);
  getUserInquiries(req, res, next);
});

// ✅✅✅ ADD THIS NEW ROUTE FOR INQUIRY DETAILS ✅✅✅
router.get(
  "/inquiries/:userId/details/:inquiryId",
  authenticateToken,
  (req, res, next) => {
    console.log(
      "📝 Inquiry Details route hit! UserId:",
      req.params.userId,
      "InquiryId:",
      req.params.inquiryId
    );
    getInquiryDetails(req, res, next);
  }
);

// ✅ Cancel inquiry route
router.put(
  "/inquiries/:inquiryId/cancel",
  authenticateToken,
  (req, res, next) => {
    console.log("📝 Cancel route hit! InquiryId:", req.params.inquiryId);
    cancelInquiry(req, res, next);
  }
);

// ==================== INBOX & MESSAGES ROUTES (PROTECTED) ====================

// ✅ Get user inbox (accepted inquiries with messages)
router.get("/inbox", authenticateToken, (req, res, next) => {
  console.log("📝 Inbox route hit! UserId:", req.user?.user_id);
  getUserInbox(req, res, next);
});

// ✅ Get messages for specific inquiry
router.get("/messages/:inquiryId", authenticateToken, (req, res, next) => {
  console.log("📝 Get Messages route hit! InquiryId:", req.params.inquiryId);
  getMessagesByInquiry(req, res, next);
});

// ✅ Send text message
router.post("/messages/send", authenticateToken, (req, res, next) => {
  console.log("📝 Send Message route hit!");
  console.log("Body:", req.body);
  sendMessage(req, res, next);
});

// ✅ Send image message
router.post(
  "/messages/send-image",
  authenticateToken,
  upload.single("image"),
  (req, res, next) => {
    console.log("📝 Send Image route hit!");
    sendImage(req, res, next);
  }
);

module.exports = router;
