// routes/chat.js
const express = require('express');
const { body, query, param } = require('express-validator');
const ChatController = require('../controllers/ChatController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken());

/**
 * GET /api/chat/conversations
 * Get all conversations for the authenticated user
 * Query params: status (active|archived|closed), page, limit
 */
router.get('/conversations', [
  query('status').optional().isIn(['active', 'archived', 'closed']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], ChatController.getMyConversations);

/**
 * GET /api/chat/conversations/:conversationId
 * Get a specific conversation with messages
 * Query params: limit (number of messages), before (timestamp for pagination)
 */
router.get('/conversations/:conversationId', [
  param('conversationId').isUUID().withMessage('Conversation ID must be a valid UUID'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('before').optional().isISO8601().withMessage('Before must be a valid ISO date')
], ChatController.getConversation);

/**
 * POST /api/chat/conversations/:conversationId/messages
 * Send a message to a conversation
 * Body: content, messageType (text|image|file)
 */
router.post('/conversations/:conversationId/messages', [
  param('conversationId').isUUID().withMessage('Conversation ID must be a valid UUID'),
  body('content').notEmpty().trim().withMessage('Message content is required'),
  body('messageType').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type')
], ChatController.sendMessage);

/**
 * GET /api/chat/bookings/:bookingId/conversation
 * Get conversation for a specific booking
 */
router.get('/bookings/:bookingId/conversation', [
  param('bookingId').isUUID().withMessage('Booking ID must be a valid UUID')
], ChatController.getConversationByBookingId);

/**
 * PATCH /api/chat/conversations/:conversationId/read
 * Mark a conversation as read
 */
router.patch('/conversations/:conversationId/read', [
  param('conversationId').isUUID().withMessage('Conversation ID must be a valid UUID')
], ChatController.markAsRead);

module.exports = router;
