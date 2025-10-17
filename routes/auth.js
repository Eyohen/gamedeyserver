
// routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// User registration
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender')
], AuthController.registerUser);

// User login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], AuthController.loginUser);

// Coach registration
router.post('/register/coach', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters'),
  body('experience').optional().isInt({ min: 0, max: 50 }).withMessage('Experience must be 0-50 years'),
  body('hourlyRate').optional().isDecimal().withMessage('Valid hourly rate required'),
  body('specialties').optional().isArray().withMessage('Specialties must be an array'),
  body('certifications').optional().isArray().withMessage('Certifications must be an array')
], AuthController.registerCoach);

// Facility owner registration
router.post('/register/facility', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('facilityName').trim().isLength({ min: 3, max: 100 }).withMessage('Facility name must be 3-100 characters'),
  body('facilityAddress').trim().notEmpty().withMessage('Facility address is required'),
  body('facilityDescription').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('pricePerHour').optional().isDecimal().withMessage('Valid price per hour required'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1')
], AuthController.registerFacilityOwner);

// Admin login
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], AuthController.loginAdmin);

// Refresh token
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], AuthController.refreshToken);

// Logout
router.post('/logout', AuthController.logout);

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], AuthController.forgotPassword);

// Reset Password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], AuthController.resetPassword);

// Admin logout
router.post('/admin/logout', 
  // authenticateToken('admin'), 
  AuthController.adminLogout
);

// Get admin profile
router.get('/admin/profile', 
  // authenticateToken('admin'), 
  AuthController.getAdminProfile
);

// Update admin profile
router.put('/admin/profile', 
  // authenticateToken('admin'),
  [
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('currentPassword').optional().isString().withMessage('Current password must be a string'),
    body('newPassword').optional().isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ],
  AuthController.updateAdminProfile
);





module.exports = router;
