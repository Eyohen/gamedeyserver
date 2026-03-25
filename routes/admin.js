
// routes/admin.js
const express = require('express');
const { body, query, param } = require('express-validator');
const AdminController = require('../controllers/AdminController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken('admin'));

// Dashboard overview
router.get('/dashboard', AdminController.getDashboardOverview);

// Player management (aliased from /users to /players)
const playerValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'email']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Invalid sort order')
];
const playerIdValidation = [param('playerId').isUUID().withMessage('Player ID must be a valid UUID')];
const playerStatusValidation = [
  param('playerId').isUUID().withMessage('Player ID must be a valid UUID'),
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
];

router.get('/players', playerValidation, AdminController.getAllUsers);
router.get('/players/:playerId', playerIdValidation, AdminController.getUserById);
router.patch('/players/:playerId/status', playerStatusValidation, AdminController.updateUserStatus);

// Legacy /users routes (backward compatibility)
router.get('/users', playerValidation, AdminController.getAllUsers);
router.get('/users/:playerId', playerIdValidation, AdminController.getUserById);
router.patch('/users/:playerId/status', playerStatusValidation, AdminController.updateUserStatus);

// Coach management
router.get('/coaches', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('verificationStatus').optional().isIn(['pending', 'verified', 'rejected']).withMessage('Invalid verification status'),
  query('search').optional().isString().withMessage('Search must be a string')
], AdminController.getAllCoachesForReview);

router.patch('/coaches/:coachId/verification', [
  param('coachId').isUUID().withMessage('Coach ID must be a valid UUID'),
  body('verificationStatus').isIn(['pending', 'verified', 'rejected']).withMessage('Invalid verification status'),
  body('rejectionReason').optional().isString().withMessage('Rejection reason must be a string')
], AdminController.updateCoachVerification);

// Facility management
router.get('/facilities', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('verificationStatus').optional().isIn(['pending', 'verified', 'rejected']).withMessage('Invalid verification status'),
  query('search').optional().isString().withMessage('Search must be a string')
], AdminController.getAllFacilitiesForReview);

router.patch('/facilities/:facilityId/verification', [
  param('facilityId').isUUID().withMessage('Facility ID must be a valid UUID'),
  body('verificationStatus').isIn(['pending', 'verified', 'rejected']).withMessage('Invalid verification status'),
  body('rejectionReason').optional().isString().withMessage('Rejection reason must be a string')
], AdminController.updateFacilityVerification);


// Content moderation 
router.get('/content/flagged', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('type').optional().isIn(['all', 'posts', 'comments']).withMessage('Invalid content type')
], AdminController.getFlaggedContent);

router.post('/content/moderate', [
  body('contentId').isUUID().withMessage('Content ID must be a valid UUID'),
  body('contentType').isIn(['post', 'comment']).withMessage('Invalid content type'),
  body('action').isIn(['approve', 'hide', 'delete', 'reject']).withMessage('Invalid moderation action'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], AdminController.moderateContent);



// Admin management (super admin only)
router.post('/admins', requirePermission('create_admin'), [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'moderator', 'super_admin']).withMessage('Invalid role'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
], AdminController.createAdmin);

// Analytics
router.get('/analytics', [
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid period')
], AdminController.getPlatformAnalytics);


// Community statistics
router.get('/community/stats', AdminController.getCommunityStats);

// Financial oversight
router.get('/financial-overview', AdminController.getFinancialOverview);

router.get('/bookings', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled', 'all']).withMessage('Invalid status')
], AdminController.getAllBookings);

// ==================== SESSION PACKAGES ====================

// Get all session packages
router.get('/session-packages', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('sportId').optional().isUUID().withMessage('Sport ID must be a valid UUID'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string')
], AdminController.getAllSessionPackages);

// Get a single session package
router.get('/session-packages/:packageId', [
  param('packageId').isUUID().withMessage('Package ID must be a valid UUID')
], AdminController.getSessionPackageById);

// Create a session package
router.post('/session-packages', [
  body('sportId').isUUID().withMessage('Sport ID must be a valid UUID'),
  body('coachId').optional({ nullable: true }).isUUID().withMessage('Coach ID must be a valid UUID'),
  body('facilityId').optional({ nullable: true }).isUUID().withMessage('Facility ID must be a valid UUID'),
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('numberOfSessions').isInt({ min: 1 }).withMessage('Number of sessions must be at least 1'),
  body('pricePerSession').isFloat({ min: 0 }).withMessage('Price per session must be a positive number'),
  body('totalPrice').isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be 0-100'),
  body('validityDays').optional().isInt({ min: 1 }).withMessage('Validity days must be at least 1')
], AdminController.createSessionPackage);

// Update a session package
router.put('/session-packages/:packageId', [
  param('packageId').isUUID().withMessage('Package ID must be a valid UUID'),
  body('sportId').optional().isUUID().withMessage('Sport ID must be a valid UUID'),
  body('coachId').optional({ nullable: true }).isUUID().withMessage('Coach ID must be a valid UUID'),
  body('facilityId').optional({ nullable: true }).isUUID().withMessage('Facility ID must be a valid UUID'),
  body('name').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('numberOfSessions').optional().isInt({ min: 1 }).withMessage('Number of sessions must be at least 1'),
  body('pricePerSession').optional().isFloat({ min: 0 }).withMessage('Price per session must be a positive number'),
  body('totalPrice').optional().isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be 0-100'),
  body('validityDays').optional().isInt({ min: 1 }).withMessage('Validity days must be at least 1'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
], AdminController.updateSessionPackage);

// Delete a session package
router.delete('/session-packages/:packageId', [
  param('packageId').isUUID().withMessage('Package ID must be a valid UUID')
], AdminController.deleteSessionPackage);

// ==================== SPORT MANAGEMENT ====================

// Update sport (home session price)
router.patch('/sports/:sportId', [
  param('sportId').isUUID().withMessage('Sport ID must be a valid UUID'),
  body('homeSessionPrice').optional().isFloat({ min: 0 }).withMessage('Home session price must be a positive number')
], AdminController.updateSport);

// Admin notifications
router.get('/notifications', AdminController.getAdminNotifications);
router.get('/notifications/unread-count', AdminController.getUnreadNotificationCount);
router.patch('/notifications/:id/read', [
  param('id').isUUID().withMessage('Notification ID must be a valid UUID')
], AdminController.markNotificationRead);
router.patch('/notifications/read-all', AdminController.markAllNotificationsRead);

module.exports = router;