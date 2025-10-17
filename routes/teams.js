// routes/teams.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const TeamController = require('../controllers/TeamController');
const { authenticateToken } = require('../middleware/auth');

// All team routes require authentication
router.use(authenticateToken);

// Get available sports (sports user has booked)
router.get('/available-sports', TeamController.getAvailableSports);

// Get team statistics
router.get('/stats', TeamController.getTeamStats);

// Get all user's teams (with optional sport filter)
router.get('/', TeamController.getTeams);

// Get single team
router.get('/:id', TeamController.getTeam);

// Create team
router.post('/', [
  body('sportId').notEmpty().withMessage('Sport ID is required'),
  body('name').notEmpty().isLength({ min: 2, max: 100 }).withMessage('Team name must be between 2 and 100 characters'),
  body('formation').optional().isString(),
  body('coach').optional().isString(),
  body('venue').optional().isString(),
  body('members').optional().isArray()
], TeamController.createTeam);

// Update team
router.put('/:id', [
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Team name must be between 2 and 100 characters'),
  body('formation').optional().isString(),
  body('coach').optional().isString(),
  body('venue').optional().isString(),
  body('members').optional().isArray(),
  body('wins').optional().isInt({ min: 0 }),
  body('losses').optional().isInt({ min: 0 }),
  body('draws').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'disbanded'])
], TeamController.updateTeam);

// Delete team
router.delete('/:id', TeamController.deleteTeam);

module.exports = router;
