
// routes/coach.js
const express = require('express');
const { body, query, param } = require('express-validator');
const CoachController = require('../controllers/CoachController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('sport').optional().isUUID().withMessage('Sport must be a valid UUID'),
  query('minRate').optional().isDecimal().withMessage('minRate must be a decimal'),
  query('maxRate').optional().isDecimal().withMessage('maxRate must be a decimal'),
  query('minRating').optional().isDecimal({ min: 0, max: 5 }).withMessage('minRating must be 0-5'),
  query('search').optional().isString().withMessage('Search must be a string')
], CoachController.getAllCoaches);

// Protected routes (require authentication) - MUST come before /:coachId route
router.get('/profile/me', authenticateToken('user'), CoachController.getProfile);

// Update coach profile
router.put('/profile/me', authenticateToken('user'), [
  body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters'),
  body('experience').optional().isInt({ min: 0, max: 50 }).withMessage('Experience must be 0-50 years'),
  body('hourlyRate').optional().isDecimal().withMessage('Valid hourly rate required'),
  body('specialties').optional().isArray().withMessage('Specialties must be an array'),
  body('certifications').optional().isArray().withMessage('Certifications must be an array'),
  body('availability').optional().isObject().withMessage('Availability must be an object'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  body('profileImage').optional().isURL().withMessage('Profile image must be a valid URL'),
  body('galleryImages').optional().isArray().withMessage('Gallery images must be an array')
], CoachController.updateProfile);

// Get coach bookings
router.get('/profile/bookings', authenticateToken('user'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).withMessage('Invalid status'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date')
], CoachController.getBookings);

// Get coach reviews
router.get('/profile/reviews', authenticateToken('user'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
], CoachController.getReviews);

// Get coach dashboard stats
router.get('/profile/dashboard', authenticateToken('user'), CoachController.getDashboardStats);

// Update coach sports
router.put('/profile/sports', authenticateToken('user'), [
  body('sportIds').isArray().withMessage('Sport IDs must be an array'),
  body('sportIds.*').isUUID().withMessage('Each sport ID must be a valid UUID')
], CoachController.updateSports);

// Upload coach profile image
router.post('/profile/profile-image', authenticateToken('user'), [
  body('imageUrl').isURL().withMessage('Image URL must be valid')
], CoachController.uploadProfileImage);

// Upload coach gallery images
router.post('/profile/gallery-images', authenticateToken('user'), [
  body('images').isArray().withMessage('Images must be an array'),
  body('images.*').isURL().withMessage('Each image must be a valid URL')
], CoachController.uploadGalleryImages);

// Delete coach gallery image
router.delete('/profile/gallery-images', authenticateToken('user'), [
  body('imageUrl').isURL().withMessage('Image URL must be valid')
], CoachController.deleteGalleryImage);

// Public routes with params - MUST come AFTER all /profile/* routes
router.get('/:coachId', [
  param('coachId').isUUID().withMessage('Coach ID must be a valid UUID')
], CoachController.getCoachById);

module.exports = router;
