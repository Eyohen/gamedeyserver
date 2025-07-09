
// routes/facility.js
const express = require('express');
const { body, query, param } = require('express-validator');
const FacilityController = require('../controllers/FacilityController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('sport').optional().isUUID().withMessage('Sport must be a valid UUID'),
  query('minPrice').optional().isDecimal().withMessage('minPrice must be a decimal'),
  query('maxPrice').optional().isDecimal().withMessage('maxPrice must be a decimal'),
  query('minRating').optional().isDecimal({ min: 0, max: 5 }).withMessage('minRating must be 0-5'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('amenities').optional().isString().withMessage('Amenities must be a string')
], FacilityController.getAllFacilities);

router.get('/:facilityId', [
  param('facilityId').isUUID().withMessage('Facility ID must be a valid UUID')
], FacilityController.getFacilityById);

router.get('/:facilityId/availability', [
  param('facilityId').isUUID().withMessage('Facility ID must be a valid UUID'),
  query('startTime').notEmpty().isISO8601().withMessage('Start time is required and must be valid ISO date'),
  query('endTime').notEmpty().isISO8601().withMessage('End time is required and must be valid ISO date')
], FacilityController.checkAvailability);

// Protected routes (require authentication)
router.use(authenticateToken('user'));

// Get facility profile (for authenticated facility owner)
router.get('/profile/me', FacilityController.getProfile);

// Update facility profile
router.put('/profile/me', [
  body('name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Facility name must be 3-100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('pricePerHour').optional().isDecimal().withMessage('Valid price per hour required'),
  body('operatingHours').optional().isObject().withMessage('Operating hours must be an object'),
  body('contactInfo').optional().isObject().withMessage('Contact info must be an object'),
  body('rules').optional().isArray().withMessage('Rules must be an array')
], FacilityController.updateProfile);

// Get facility bookings
router.get('/profile/bookings', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date')
], FacilityController.getBookings);

// Get facility dashboard stats
router.get('/profile/dashboard', FacilityController.getDashboardStats);

module.exports = router;