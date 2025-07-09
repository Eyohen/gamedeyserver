
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

// User management
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'email']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Invalid sort order')
], AdminController.getAllUsers);

router.get('/users/:userId', [
  param('userId').isUUID().withMessage('User ID must be a valid UUID')
], AdminController.getUserById);

router.patch('/users/:userId/status', [
  param('userId').isUUID().withMessage('User ID must be a valid UUID'),
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], AdminController.updateUserStatus);

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
  body('action').isIn(['approve', 'hide', 'delete']).withMessage('Invalid moderation action'),
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

module.exports = router;