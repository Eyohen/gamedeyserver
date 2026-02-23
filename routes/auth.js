
// routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage (for certificate uploads during registration)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

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

// Coach registration (with file upload support for certificate and profile images)
router.post('/register/coach',
  upload.fields([
    { name: 'certificateImage', maxCount: 1 },
    { name: 'profileImages', maxCount: 3 }
  ]),
  [
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
    body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be less than 1000 characters'),
    body('experience').optional(),
    body('hourlyRate').optional(),
    body('specialties').optional(),
    body('certifications').optional(),
    body('country').optional().trim().isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
    body('state').optional().trim().isLength({ max: 100 }).withMessage('State must be less than 100 characters')
  ],
  AuthController.registerCoach
);

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

// Email Verification
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required')
], AuthController.verifyEmail);

// Resend Verification Email
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], AuthController.resendVerificationEmail);

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], AuthController.forgotPassword);

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], AuthController.verifyOTP);

// Reset Password
router.post('/reset-password', [
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
