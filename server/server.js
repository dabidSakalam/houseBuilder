require("dotenv").config();
const express = require("express");
const cors = require("cors");

const userRoutes = require("./router/user/userRouter");
const adminRoutes = require("./router/admin/userAdminRouter");
const adminDashboardRoutes = require("./router/admin/adminDashboardRouter");
const userListRoutes = require("./router/admin/userListRouter");
const estimateRoutes = require("./router/admin/estimateRouter");
const cityRatesRoutes = require('./router/admin/cityRatesRouter');
const modelsRoutes = require('./router/admin/modelsRouter'); // <-- add this
const featuresRoutes = require('./router/admin/featuresRouter');
const adminEstimatesRouter = require('./router/admin/adminEstimatesRouter');
const adminInquiriesRouter = require('./router/admin/adminInquiriesRouter');
const adminMessagesRouter = require('./router/admin/adminMessagesRoutes');

const inboxRouter = require('./router/admin/inboxRouter');

// other routes ...
// Mount routers

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

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
app.use('/api/v1/models', modelsRoutes); // <-- add this

//Features
app.use('/api/v1/admin/features', featuresRoutes);

//admin Estimate
app.use('/api/v1/admin/adminEstimates', adminEstimatesRouter);

app.use('/api/v1/admin/adminInquiries', adminInquiriesRouter);
app.use('/api/v1/admin/adminInquiries', adminInquiriesRouter);
app.use('/api/v1/admin/messages', adminMessagesRouter);

app.use('/api/v1/user', inboxRouter);

// Health check
app.get("/", (req, res) => res.send("✅ HouseBuilder API running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
