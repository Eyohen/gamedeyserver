
// routes/user.js
const express = require('express');
const { body, query } = require('express-validator');
const UserController = require('../controllers/UserController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken('user'));

// Get user profile
router.get('/profile', UserController.getProfile);

// Update user profile
router.put('/profile', [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
], UserController.updateProfile);

// Get user bookings
router.get('/bookings', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).withMessage('Invalid status')
], UserController.getBookings);

// Get user reviews
router.get('/reviews', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
], UserController.getReviews);

// Get user posts
router.get('/posts', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
], UserController.getPosts);

// Get wallet information
router.get('/wallet', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
], UserController.getWallet);

// Get notifications
router.get('/notifications', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be boolean')
], UserController.getNotifications);

// Mark notification as read
router.patch('/notifications/:notificationId/read', UserController.markNotificationAsRead);

// Mark all notifications as read
router.patch('/notifications/read-all', UserController.markAllNotificationsAsRead);

// Delete account
router.delete('/account', [
  body('password').notEmpty().withMessage('Password is required for account deletion')
], UserController.deleteAccount);

module.exports = router;