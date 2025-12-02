require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const userRoutes = require("./router/user/userRouter");
const adminRoutes = require("./router/admin/userAdminRouter");
const adminDashboardRoutes = require("./router/admin/adminDashboardRouter");
const userListRoutes = require("./router/admin/userListRouter");
const estimateRoutes = require("./router/admin/estimateRouter");
const cityRatesRoutes = require('./router/admin/cityRatesRouter');
const modelsRoutes = require('./router/admin/modelsRouter');
const featuresRoutes = require('./router/admin/featuresRouter');
const adminEstimatesRouter = require('./router/admin/adminEstimatesRouter');
const adminInquiriesRouter = require('./router/admin/adminInquiriesRouter');
const adminMessagesRouter = require('./router/admin/adminMessagesRoutes');
const inboxRouter = require('./router/admin/inboxRouter');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// IMPORTANT: Serve uploaded images as static files (BEFORE routes)
app.use("/uploads", express.static("uploads"));

// Make io accessible to routes
app.set('io', io);

// ✅ ADD DEBUG LOG HERE:
console.log('📋 Mounting user routes at /api/v1/users');
console.log('📋 userRoutes type:', typeof userRoutes);

// User routes
app.use("/api/v1/users", userRoutes);

// Admin auth
app.use("/api/v1/admin", adminRoutes);

// Admin dashboard
app.use("/api/v1/admin/dashboard", adminDashboardRoutes);

// Admin user management
app.use("/api/v1/admin/users", userListRoutes);

// Estimates (both admin & user)
app.use('/api/v1/estimates', estimateRoutes); 
app.use('/api/v1/admin/estimates', estimateRoutes);

// City rates
app.use('/api/v1/cityRates', cityRatesRoutes);

// Models
app.use('/api/v1/models', modelsRoutes);

// Features
app.use('/api/v1/admin/features', featuresRoutes);

// Admin Estimate
app.use('/api/v1/admin/adminEstimates', adminEstimatesRouter);

app.use('/api/v1/admin/adminInquiries', adminInquiriesRouter);
app.use('/api/v1/admin/messages', adminMessagesRouter);



// ✅ ADD THIS DEBUG ROUTE TO TEST:
app.get('/api/v1/users/test', (req, res) => {
  res.json({ message: 'User routes are working!' });
});

// Health check
app.get("/", (req, res) => res.send("✅ HouseBuilder API running"));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-inquiry', (inquiryId) => {
    socket.join(`inquiry-${inquiryId}`);
    console.log(`User ${socket.id} joined inquiry ${inquiryId}`);
  });

  socket.on('leave-inquiry', (inquiryId) => {
    socket.leave(`inquiry-${inquiryId}`);
    console.log(`User ${socket.id} left inquiry ${inquiryId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
