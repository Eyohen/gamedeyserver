// // routes/payment.js - FIXED VERSION
// const express = require('express');
// const { body, query, param } = require('express-validator');
// const PaymentController = require('../controllers/PaymentController');
// const { authenticateToken } = require('../middleware/auth');

// const router = express.Router();

// // Webhook route (MUST be BEFORE authentication middleware and raw body parser)
// router.post('/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
//   // Convert raw buffer to JSON for processing
//   if (req.body && Buffer.isBuffer(req.body)) {
//     try {
//       req.body = JSON.parse(req.body.toString());
//     } catch (error) {
//       console.error('Error parsing webhook body:', error);
//       return res.status(400).json({ error: 'Invalid JSON' });
//     }
//   }
//   next();
// }, PaymentController.handleWebhook);

// // All other routes require authentication
// router.use(authenticateToken('user'));

// // Initialize payment
// router.post('/initialize', [
//   body('bookingId').isUUID().withMessage('Booking ID must be a valid UUID')
// ], PaymentController.initializePayment);

// // Verify payment
// router.get('/verify/:reference', [
//   param('reference').notEmpty().withMessage('Payment reference is required')
// ], PaymentController.verifyPayment);

// // Get payment by ID
// router.get('/:paymentId', [
//   param('paymentId').isUUID().withMessage('Payment ID must be a valid UUID')
// ], PaymentController.getPaymentById);

// // Get user payments
// router.get('/', [
//   query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
//   query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
//   query('status').optional().isIn(['pending', 'success', 'failed', 'cancelled', 'refunded']).withMessage('Invalid status')
// ], PaymentController.getUserPayments);

// module.exports = router;




// routes/payment.js - Updated for Frontend Integration
const express = require('express');
const { body, query, param } = require('express-validator');
const PaymentController = require('../controllers/PaymentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Webhook route (MUST be BEFORE authentication middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  // Convert raw buffer to JSON for processing
  if (req.body && Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString());
    } catch (error) {
      console.error('Error parsing webhook body:', error);
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  next();
}, PaymentController.handleWebhook);

// All other routes require authentication
router.use(authenticateToken('user'));

// Create payment record (called before Paystack popup)
router.post('/create-record', [
  body('bookingId').isUUID().withMessage('Booking ID must be a valid UUID'),
  body('reference').notEmpty().withMessage('Payment reference is required'),
  body('amount').isDecimal().withMessage('Valid amount is required')
], PaymentController.createPaymentRecord);

// Verify payment (called after successful Paystack popup)
router.post('/verify', [
  body('reference').notEmpty().withMessage('Payment reference is required'),
  body('bookingId').isUUID().withMessage('Booking ID must be a valid UUID')
], PaymentController.verifyPayment);

// Get payment by booking ID
router.get('/booking/:bookingId', [
  param('bookingId').isUUID().withMessage('Booking ID must be a valid UUID')
], PaymentController.getPaymentByBooking);

// Get payment status by reference
router.get('/status/:reference', [
  param('reference').notEmpty().withMessage('Payment reference is required')
], PaymentController.getPaymentStatus);

// Get user payments
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['pending', 'success', 'failed', 'cancelled', 'refunded']).withMessage('Invalid status')
], PaymentController.getUserPayments);

module.exports = router;