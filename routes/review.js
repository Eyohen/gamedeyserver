// routes/review.js
const express = require('express');
const { body, query, param } = require('express-validator');
const ReviewController = require('../controllers/ReviewController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes - Get reviews
router.get('/facility/:facilityId', [
  param('facilityId').isUUID().withMessage('Facility ID must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  query('sortBy').optional().isIn(['createdAt', 'rating', 'helpful']).withMessage('Invalid sort option')
], ReviewController.getFacilityReviews);

router.get('/coach/:coachId', [
  param('coachId').isUUID().withMessage('Coach ID must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  query('sortBy').optional().isIn(['createdAt', 'rating', 'helpful']).withMessage('Invalid sort option')
], ReviewController.getCoachReviews);

router.get('/:reviewId', [
  param('reviewId').isUUID().withMessage('Review ID must be a valid UUID')
], ReviewController.getReviewById);

// Protected routes (require authentication)
router.use(authenticateToken('user'));

// Create review
router.post('/', [
  body('facilityId').optional().isUUID().withMessage('Facility ID must be a valid UUID'),
  body('coachId').optional().isUUID().withMessage('Coach ID must be a valid UUID'),
  body('bookingId').optional().isUUID().withMessage('Booking ID must be a valid UUID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('comment').optional().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),
  body('images').optional().isArray().withMessage('Images must be an array')
], ReviewController.createReview);

// Get user's reviews
router.get('/user/me', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
], ReviewController.getUserReviews);

// Update review
router.put('/:reviewId', [
  param('reviewId').isUUID().withMessage('Review ID must be a valid UUID'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('comment').optional().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),
  body('images').optional().isArray().withMessage('Images must be an array')
], ReviewController.updateReview);

// Delete review
router.delete('/:reviewId', [
  param('reviewId').isUUID().withMessage('Review ID must be a valid UUID')
], ReviewController.deleteReview);

// Mark review as helpful
router.post('/:reviewId/helpful', [
  param('reviewId').isUUID().withMessage('Review ID must be a valid UUID')
], ReviewController.markHelpful);

// Flag review
router.post('/:reviewId/flag', [
  param('reviewId').isUUID().withMessage('Review ID must be a valid UUID'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], ReviewController.flagReview);

module.exports = router;