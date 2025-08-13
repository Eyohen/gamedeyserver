
// // routes/community.js
// const express = require('express');
// const { body, query, param } = require('express-validator');
// const CommunityController = require('../controllers/CommunityController');
// const { authenticateToken } = require('../middleware/auth');

// const router = express.Router();

// // Public routes
// router.get('/posts', [
//   query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
//   query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
//   query('sport').optional().isUUID().withMessage('Sport must be a valid UUID'),
//   query('location').optional().isString().withMessage('Location must be a string'),
//   query('type').optional().isIn(['discussion', 'question', 'tip', 'event', 'review']).withMessage('Invalid post type'),
//   query('search').optional().isString().withMessage('Search must be a string'),
//   query('sortBy').optional().isIn(['createdAt', 'popular', 'recent', 'comments']).withMessage('Invalid sort option')
// ], CommunityController.getAllPosts);

// router.get('/posts/trending', [
//   query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be 1-20')
// ], CommunityController.getTrendingPosts);

// router.get('/posts/:postId', [
//   param('postId').isUUID().withMessage('Post ID must be a valid UUID')
// ], CommunityController.getPostById);

// // Protected routes (require authentication)
// router.use(authenticateToken('user'));

// // Create post
// router.post('/posts', [
//   body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
//   body('content').trim().isLength({ min: 10, max: 5000 }).withMessage('Content must be 10-5000 characters'),
//   body('type').optional().isIn(['discussion', 'question', 'tip', 'event', 'review']).withMessage('Invalid post type'),
//   body('sportId').optional().isUUID().withMessage('Sport ID must be a valid UUID'),
//   body('tags').optional().isArray().withMessage('Tags must be an array'),
//   body('location').optional().isObject().withMessage('Location must be an object'),
//   body('images').optional().isArray().withMessage('Images must be an array')
// ], CommunityController.createPost);

// // Update post
// router.put('/posts/:postId', [
//   param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
//   body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
//   body('content').optional().trim().isLength({ min: 10, max: 5000 }).withMessage('Content must be 10-5000 characters'),
//   body('tags').optional().isArray().withMessage('Tags must be an array'),
//   body('location').optional().isObject().withMessage('Location must be an object')
// ], CommunityController.updatePost);

// // Delete post
// router.delete('/posts/:postId', [
//   param('postId').isUUID().withMessage('Post ID must be a valid UUID')
// ], CommunityController.deletePost);

// // Create comment
// router.post('/posts/:postId/comments', [
//   param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
//   body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Content must be 1-1000 characters'),
//   body('parentId').optional().isUUID().withMessage('Parent ID must be a valid UUID')
// ], CommunityController.createComment);

// // Vote on post
// router.post('/posts/:postId/vote', [
//   param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
//   body('type').isIn(['upvote', 'downvote']).withMessage('Invalid vote type')
// ], CommunityController.voteOnPost);

// // Flag post
// router.post('/posts/:postId/flag', [
//   param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
//   body('reason').optional().isString().withMessage('Reason must be a string')
// ], CommunityController.flagPost);

// module.exports = router;



// routes/community.js - Updated with admin moderation routes
const express = require('express');
const { body, query, param } = require('express-validator');
const CommunityController = require('../controllers/CommunityController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/posts', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('sport').optional().isUUID().withMessage('Sport must be a valid UUID'),
  query('location').optional().isString().withMessage('Location must be a string'),
  query('type').optional().isIn(['discussion', 'question', 'tip', 'event', 'review']).withMessage('Invalid post type'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sortBy').optional().isIn(['createdAt', 'popular', 'recent', 'comments']).withMessage('Invalid sort option'),
  query('showAll').optional().isBoolean().withMessage('showAll must be boolean')
], CommunityController.getAllPosts);

router.get('/posts/trending', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be 1-20')
], CommunityController.getTrendingPosts);

router.get('/posts/:postId', [
  param('postId').isUUID().withMessage('Post ID must be a valid UUID')
], CommunityController.getPostById);

// Protected routes (require authentication)
router.use(authenticateToken('user'));

// Create post
router.post('/posts', [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('content').trim().isLength({ min: 2, max: 5000 }).withMessage('Content must be 10-5000 characters'),
  body('type').optional().isIn(['discussion', 'question', 'tip', 'event', 'review']).withMessage('Invalid post type'),
  body('sportId').optional().isUUID().withMessage('Sport ID must be a valid UUID'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  body('images').optional().isArray().withMessage('Images must be an array')
], CommunityController.createPost);

// Update post
router.put('/posts/:postId', [
  param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
  body('title').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('content').optional().trim().isLength({ min: 2, max: 5000 }).withMessage('Content must be 2-5000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('location').optional().isObject().withMessage('Location must be an object')
], CommunityController.updatePost);

// Delete post
router.delete('/posts/:postId', [
  param('postId').isUUID().withMessage('Post ID must be a valid UUID')
], CommunityController.deletePost);

// Share post
router.post('/posts/:postId/share', [
  param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
  body('platform').optional().isString().withMessage('Platform must be a string'),
  body('message').optional().isString().withMessage('Message must be a string')
], CommunityController.sharePost);

// Create comment
router.post('/posts/:postId/comments', [
  param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Content must be 1-1000 characters'),
  body('parentId').optional().isUUID().withMessage('Parent ID must be a valid UUID')
], CommunityController.createComment);

// Vote on post
router.post('/posts/:postId/vote', [
  param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
  body('type').isIn(['upvote', 'downvote']).withMessage('Invalid vote type')
], CommunityController.voteOnPost);

// Flag post
router.post('/posts/:postId/flag', [
  param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], CommunityController.flagPost);

// Admin only routes
router.use(authenticateToken('admin'));

// Get posts for moderation
router.get('/admin/posts', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('status').optional().isIn(['pending', 'active', 'rejected', 'flagged', 'all']).withMessage('Invalid status')
], CommunityController.getPostsForModeration);

// Moderate post
router.patch('/admin/posts/:postId/moderate', [
  param('postId').isUUID().withMessage('Post ID must be a valid UUID'),
  body('action').isIn(['approve', 'reject', 'flag']).withMessage('Invalid action'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], CommunityController.moderatePost);

module.exports = router;