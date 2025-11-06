// routes/upload.js
const express = require('express');
const multer = require('multer');
const UploadController = require('../controllers/UploadController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
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

// Protected routes (require authentication)
router.use(authenticateToken('user'));

// Upload single image
router.post('/image', upload.single('image'), UploadController.uploadImage);

// Upload multiple images
router.post('/images', upload.array('images', 10), UploadController.uploadMultipleImages);

module.exports = router;
