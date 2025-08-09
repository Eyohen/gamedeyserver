// routes/payment.js 
const express = require('express');
const { body, query, param } = require('express-validator');
const PaymentController = require('../controllers/PaymentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken('user'));

// Confirm payment (simplified approach - similar to your ecommerce)
router.post('/confirm', [
  body('bookingId').isUUID().withMessage('Booking ID must be a valid UUID'),
  body('paymentReference').notEmpty().withMessage('Payment reference is required'),
  body('paymentMethod').optional().isString().withMessage('Payment method must be a string')
], PaymentController.confirmPayment);

// Get payment by booking ID
router.get('/booking/:bookingId', [
  param('bookingId').isUUID().withMessage('Booking ID must be a valid UUID')
], PaymentController.getPaymentByBooking);

// Get user payments
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['pending', 'success', 'failed', 'cancelled', 'refunded']).withMessage('Invalid status')
], PaymentController.getUserPayments);

// Optional: Keep webhook for additional verification (but not required for basic flow)
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

module.exports = router;