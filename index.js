// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const auth = require('./routes/auth');
const user = require('./routes/user');
const coach = require('./routes/coach');
const facility = require('./routes/facility');
const admin = require('./routes/admin');
const booking = require('./routes/booking');
const community = require('./routes/community');
const payment = require('./routes/payment');
const review = require('./routes/review');

const app = express();
const PORT = process.env.API_PORT || 3000;
app.use(cors());

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });

// Basic middleware
// app.use(limiter);

// IMPORTANT: Handle webhook route BEFORE general JSON parsing
// This allows the webhook to receive raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));




// Security middleware

// Routes
app.use('/api/auth', auth);
app.use('/api/users', user);
app.use('/api/coaches', coach);
app.use('/api/facilities', facility);
app.use('/api/admin', admin);
app.use('/api/bookings', booking);
app.use('/api/community', community);
app.use('/api/payments', payment);
app.use('/api/reviews', review); 

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Gamedey API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});


// API info route
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Gamedey API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      coaches: '/api/coaches', 
      facilities: '/api/facilities',
      admin: '/api/admin',
      bookings: '/api/bookings',
      community: '/api/community',
      payments: '/api/payments',
      reviews: '/api/reviews'
    }
  });
});


// Test webhook endpoint for debugging
app.post('/test-webhook', express.json(), (req, res) => {
  console.log('Test webhook received:', req.body);
  res.status(200).json({ status: 'received' });
});

// Error handling middleware
app.use(errorHandler);

// Database synchronization and server start
const startServer = async () => {
  try {
    let syncOptions = { alter: true };
    
    if (process.env.NODE_ENV === "development") {
      // In development, you might want to force sync
      // syncOptions = { force: true }; // Uncomment to reset DB
    }
    
    // Sync database
    await sequelize.sync(syncOptions);
    console.log('✅ Database synchronized');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💳 Paystack Integration: ${process.env.PAYSTACK_SECRET_KEY ? 'Enabled' : 'Disabled'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
      console.log(`🔗 Webhook URL: ${process.env.BACKEND_URL || 'localhost'}/api/payments/webhook`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer();

module.exports = app;