// // routes/sport.js
// const express = require('express');
// const { query, param } = require('express-validator');
// const SportController = require('../controllers/SportController');
// const { authenticateToken } = require('../middleware/auth');

// const router = express.Router();

// // Public routes
// router.get('/', SportController.getAllSports);
// router.get('/:sportId', SportController.getSportById);

// // Get facilities and coaches for a specific sport
// router.get('/:sportId/providers', [
//   param('sportId').isUUID().withMessage('Sport ID must be valid UUID'),
//   query('location').optional().isString(),
//   query('minPrice').optional().isDecimal(),
//   query('maxPrice').optional().isDecimal(),
//   query('minRating').optional().isDecimal()
// ], SportController.getSportProviders);

// // Get packages for a sport
// router.get('/:sportId/packages', [
//   param('sportId').isUUID().withMessage('Sport ID must be valid UUID')
// ], SportController.getSportPackages);

// module.exports = router;




const express = require('express');
const { query, param } = require('express-validator');
const SportController = require('../controllers/SportController');

const router = express.Router();

// Public routes - specific routes MUST come before /:sportId
router.get('/', SportController.getAllSports);

router.get('/:sportId/providers', [
  param('sportId').isUUID()
], SportController.getSportProviders);

router.get('/:sportId/packages', [
  param('sportId').isUUID()
], SportController.getSportPackages);

// Generic route with param - MUST come AFTER specific routes
router.get('/:sportId', [
  param('sportId').isUUID()
], SportController.getSportById);

module.exports = router;