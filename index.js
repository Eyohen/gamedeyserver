// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const auth = require('./routes/auth');
const user = require('./routes/user');
const coach = require('./routes/coach');
const facility = require('./routes/facility');
const sport = require('./routes/sport');
const admin = require('./routes/admin');
const booking = require('./routes/booking');
const community = require('./routes/community');
const payment = require('./routes/payment');
const review = require('./routes/review');
const coachBankRoutes = require('./routes/coach-bank');
const teams = require('./routes/teams');

const app = express();
const PORT = process.env.API_PORT || 3000;
app.use(cors());

app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));




// Security middleware

// Routes
app.use('/api/auth', auth);
app.use('/api/users', user);
app.use('/api/coaches', coach);
app.use('/api/facilities', facility);
app.use('/api/sports', sport);
app.use('/api/admin', admin);
app.use('/api/bookings', booking);
app.use('/api/community', community);
app.use('/api/payments', payment);
app.use('/api/reviews', review);
app.use('/api/coach-banking', coachBankRoutes);
app.use('/api/teams', teams);

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
      sports: '/api/sports',
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
      // console.log(`🔗 Webhook URL: ${process.env.BACKEND_URL || 'localhost'}/api/payments/webhook`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer();

module.exports = app;