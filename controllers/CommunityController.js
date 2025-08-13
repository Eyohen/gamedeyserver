
// // controllers/CommunityController.js
// const { Post, Comment, Vote, User, Sport } = require('../models');
// const ResponseUtil = require('../utils/response');
// const { validationResult } = require('express-validator');
// const { Op } = require('sequelize');

// class CommunityController {
//   // Get all posts with filtering and pagination
//   static async getAllPosts(req, res) {
//     try {
//       const { 
//         page = 1, 
//         limit = 10, 
//         sport, 
//         location, 
//         type, 
//         search, 
//         sortBy = 'createdAt' 
//       } = req.query;
      
//       const offset = (page - 1) * limit;
      
//       let whereClause = { status: 'active' };
      
//       if (sport) {
//         whereClause.sportId = sport;
//       }
      
//       if (type) {
//         whereClause.type = type;
//       }
      
//       if (search) {
//         whereClause[Op.or] = [
//           { title: { [Op.iLike]: `%${search}%` } },
//           { content: { [Op.iLike]: `%${search}%` } }
//         ];
//       }
      
//       if (location) {
//         whereClause['location.city'] = location;
//       }

//       let orderClause;
//       switch (sortBy) {
//         case 'popular':
//           orderClause = [['upvotes', 'DESC'], ['createdAt', 'DESC']];
//           break;
//         case 'recent':
//           orderClause = [['createdAt', 'DESC']];
//           break;
//         case 'comments':
//           orderClause = [['commentCount', 'DESC'], ['createdAt', 'DESC']];
//           break;
//         default:
//           orderClause = [['createdAt', 'DESC']];
//       }

//       const { count, rows: posts } = await Post.findAndCountAll({
//         where: whereClause,
//         include: [
//           {
//             model: User,
//             as: 'User',
//             attributes: ['id', 'firstName', 'lastName', 'profileImage']
//           },
//           {
//             model: Sport,
//             as: 'Sport',
//             attributes: ['id', 'name', 'icon']
//           }
//         ],
//         order: orderClause,
//         limit: parseInt(limit),
//         offset: parseInt(offset)
//       });

//       const pagination = {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total: count,
//         pages: Math.ceil(count / limit)
//       };

//       return ResponseUtil.paginated(res, posts, pagination, 'Posts retrieved successfully');
//     } catch (error) {
//       console.error('Get all posts error:', error);
//       return ResponseUtil.error(res, 'Failed to retrieve posts', 500);
//     }
//   }

//   // Create a new post
//   static async createPost(req, res) {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
//       }

//       const { title, content, type, sportId, tags, location, images } = req.body;

//       const post = await Post.create({
//         userId: req.user.id,
//         title,
//         content,
//         type: type || 'discussion',
//         sportId: sportId || null,
//         tags: tags || [],
//         location: location || null,
//         images: images || []
//       });

//       const createdPost = await Post.findByPk(post.id, {
//         include: [
//           {
//             model: User,
//             as: 'User',
//             attributes: ['id', 'firstName', 'lastName', 'profileImage']
//           },
//           {
//             model: Sport,
//             as: 'Sport',
//             attributes: ['id', 'name', 'icon']
//           }
//         ]
//       });

//       return ResponseUtil.success(res, createdPost, 'Post created successfully', 201);
//     } catch (error) {
//       console.error('Create post error:', error);
//       return ResponseUtil.error(res, 'Failed to create post', 500);
//     }
//   }

//   // Get post by ID with comments
//   static async getPostById(req, res) {
//     try {
//       const { postId } = req.params;

//       const post = await Post.findByPk(postId, {
//         include: [
//           {
//             model: User,
//             as: 'User',
//             attributes: ['id', 'firstName', 'lastName', 'profileImage']
//           },
//           {
//             model: Sport,
//             as: 'Sport',
//             attributes: ['id', 'name', 'icon']
//           },
//           {
//             model: Comment,
//             as: 'Comments',
//             include: [
//               {
//                 model: User,
//                 as: 'User',
//                 attributes: ['id', 'firstName', 'lastName', 'profileImage']
//               }
//             ],
//             where: { status: 'active' },
//             required: false,
//             order: [['createdAt', 'ASC']]
//           }
//         ]
//       });

//       if (!post) {
//         return ResponseUtil.error(res, 'Post not found', 404);
//       }

//       // Increment view count
//       await post.increment('viewCount');

//       return ResponseUtil.success(res, post, 'Post retrieved successfully');
//     } catch (error) {
//       console.error('Get post by ID error:', error);
//       return ResponseUtil.error(res, 'Failed to retrieve post', 500);
//     }
//   }

//   // Update post
//   static async updatePost(req, res) {
//     try {
//       const { postId } = req.params;
//       const { title, content, tags, location } = req.body;

//       const post = await Post.findByPk(postId);
//       if (!post) {
//         return ResponseUtil.error(res, 'Post not found', 404);
//       }

//       // Check if user owns the post
//       if (post.userId !== req.user.id) {
//         return ResponseUtil.error(res, 'Access denied', 403);
//       }

//       await post.update({
//         title: title || post.title,
//         content: content || post.content,
//         tags: tags || post.tags,
//         location: location || post.location
//       });

//       return ResponseUtil.success(res, post, 'Post updated successfully');
//     } catch (error) {
//       console.error('Update post error:', error);
//       return ResponseUtil.error(res, 'Failed to update post', 500);
//     }
//   }

//   // Delete post
//   static async deletePost(req, res) {
//     try {
//       const { postId } = req.params;

//       const post = await Post.findByPk(postId);
//       if (!post) {
//         return ResponseUtil.error(res, 'Post not found', 404);
//       }

//       // Check if user owns the post
//       if (post.userId !== req.user.id) {
//         return ResponseUtil.error(res, 'Access denied', 403);
//       }

//       await post.update({ status: 'deleted' });

//       return ResponseUtil.success(res, null, 'Post deleted successfully');
//     } catch (error) {
//       console.error('Delete post error:', error);
//       return ResponseUtil.error(res, 'Failed to delete post', 500);
//     }
//   }

//   // Create comment
//   static async createComment(req, res) {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
//       }

//       const { postId } = req.params;
//       const { content, parentId } = req.body;

//       const post = await Post.findByPk(postId);
//       if (!post) {
//         return ResponseUtil.error(res, 'Post not found', 404);
//       }

//       const comment = await Comment.create({
//         userId: req.user.id,
//         postId,
//         parentId: parentId || null,
//         content
//       });

//       // Increment comment count on post
//       await post.increment('commentCount');

//       const createdComment = await Comment.findByPk(comment.id, {
//         include: [
//           {
//             model: User,
//             as: 'User',
//             attributes: ['id', 'firstName', 'lastName', 'profileImage']
//           }
//         ]
//       });

//       return ResponseUtil.success(res, createdComment, 'Comment created successfully', 201);
//     } catch (error) {
//       console.error('Create comment error:', error);
//       return ResponseUtil.error(res, 'Failed to create comment', 500);
//     }
//   }

//   // Vote on post
//   static async voteOnPost(req, res) {
//     try {
//       const { postId } = req.params;
//       const { type } = req.body; // 'upvote' or 'downvote'

//       if (!['upvote', 'downvote'].includes(type)) {
//         return ResponseUtil.error(res, 'Invalid vote type', 400);
//       }

//       const post = await Post.findByPk(postId);
//       if (!post) {
//         return ResponseUtil.error(res, 'Post not found', 404);
//       }

//       // Check if user already voted
//       const existingVote = await Vote.findOne({
//         where: { userId: req.user.id, postId }
//       });

//       if (existingVote) {
//         if (existingVote.type === type) {
//           // Remove vote if same type
//           await existingVote.destroy();
          
//           if (type === 'upvote') {
//             await post.decrement('upvotes');
//           } else {
//             await post.decrement('downvotes');
//           }
          
//           return ResponseUtil.success(res, { removed: true }, 'Vote removed');
//         } else {
//           // Change vote type
//           await existingVote.update({ type });
          
//           if (type === 'upvote') {
//             await post.increment('upvotes');
//             await post.decrement('downvotes');
//           } else {
//             await post.increment('downvotes');
//             await post.decrement('upvotes');
//           }
          
//           return ResponseUtil.success(res, existingVote, 'Vote updated');
//         }
//       } else {
//         // Create new vote
//         const vote = await Vote.create({
//           userId: req.user.id,
//           postId,
//           type
//         });
        
//         if (type === 'upvote') {
//           await post.increment('upvotes');
//         } else {
//           await post.increment('downvotes');
//         }
        
//         return ResponseUtil.success(res, vote, 'Vote created', 201);
//       }
//     } catch (error) {
//       console.error('Vote on post error:', error);
//       return ResponseUtil.error(res, 'Failed to process vote', 500);
//     }
//   }

//   // Flag post
//   static async flagPost(req, res) {
//     try {
//       const { postId } = req.params;
//       const { reason } = req.body;

//       const post = await Post.findByPk(postId);
//       if (!post) {
//         return ResponseUtil.error(res, 'Post not found', 404);
//       }

//       // Increment flag count
//       await post.increment('flagCount');
      
//       // Auto-hide if flagged by 3 or more users
//       if (post.flagCount + 1 >= 3) {
//         await post.update({ status: 'flagged' });
//       }

//       return ResponseUtil.success(res, null, 'Post flagged successfully');
//     } catch (error) {
//       console.error('Flag post error:', error);
//       return ResponseUtil.error(res, 'Failed to flag post', 500);
//     }
//   }

//   // Get trending posts
//   static async getTrendingPosts(req, res) {
//     try {
//       const { limit = 10 } = req.query;

//       // Calculate trending score based on upvotes, comments, and recency
//       const posts = await Post.findAll({
//         where: { status: 'active' },
//         include: [
//           {
//             model: User,
//             as: 'User',
//             attributes: ['id', 'firstName', 'lastName', 'profileImage']
//           },
//           {
//             model: Sport,
//             as: 'Sport',
//             attributes: ['id', 'name', 'icon']
//           }
//         ],
//         order: [
//           ['upvotes', 'DESC'],
//           ['commentCount', 'DESC'],
//           ['createdAt', 'DESC']
//         ],
//         limit: parseInt(limit)
//       });

//       return ResponseUtil.success(res, posts, 'Trending posts retrieved successfully');
//     } catch (error) {
//       console.error('Get trending posts error:', error);
//       return ResponseUtil.error(res, 'Failed to retrieve trending posts', 500);
//     }
//   }
// }

// module.exports = CommunityController;















// controllers/CommunityController.js - Updated with admin moderation
const { Post, Comment, Vote, User, Sport } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class CommunityController {
  // Get all posts with filtering and pagination
  static async getAllPosts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sport, 
        location, 
        type, 
        search, 
        sortBy = 'createdAt',
        showAll = false // Admin flag to see all posts including pending
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let whereClause = {};
      
      // If not admin or not showing all, only show approved posts
      if (!showAll || req.user?.type !== 'admin') {
        whereClause.status = 'active';
      }
      
      if (sport) {
        whereClause.sportId = sport;
      }
      
      if (type) {
        whereClause.type = type;
      }
      
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (location) {
        whereClause['location.city'] = location;
      }

      let orderClause;
      switch (sortBy) {
        case 'popular':
          orderClause = [['upvotes', 'DESC'], ['createdAt', 'DESC']];
          break;
        case 'recent':
          orderClause = [['createdAt', 'DESC']];
          break;
        case 'comments':
          orderClause = [['commentCount', 'DESC'], ['createdAt', 'DESC']];
          break;
        default:
          orderClause = [['createdAt', 'DESC']];
      }

      const { count, rows: posts } = await Post.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Sport,
            as: 'Sport',
            attributes: ['id', 'name', 'icon']
          }
        ],
        order: orderClause,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      };

      return ResponseUtil.paginated(res, posts, pagination, 'Posts retrieved successfully');
    } catch (error) {
      console.error('Get all posts error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve posts', 500);
    }
  }

  // Create a new post (requires admin approval)
  static async createPost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { title, content, type, sportId, tags, location, images } = req.body;

      const post = await Post.create({
        userId: req.user.id,
        title,
        content,
        type: type || 'discussion',
        sportId: sportId || null,
        tags: tags || [],
        location: location || null,
        images: images || [],
        status: 'pending', // All posts start as pending for admin review
        moderationStatus: 'pending'
      });

      const createdPost = await Post.findByPk(post.id, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Sport,
            as: 'Sport',
            attributes: ['id', 'name', 'icon']
          }
        ]
      });

      return ResponseUtil.success(res, createdPost, 'Post created and sent for approval', 201);
    } catch (error) {
      console.error('Create post error:', error);
      return ResponseUtil.error(res, 'Failed to create post', 500);
    }
  }

  // Get post by ID with comments
  static async getPostById(req, res) {
    try {
      const { postId } = req.params;

      const post = await Post.findByPk(postId, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Sport,
            as: 'Sport',
            attributes: ['id', 'name', 'icon']
          },
          {
            model: Comment,
            as: 'Comments',
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['id', 'firstName', 'lastName', 'profileImage']
              }
            ],
            where: { status: 'active' },
            required: false,
            order: [['createdAt', 'ASC']]
          }
        ]
      });

      if (!post) {
        return ResponseUtil.error(res, 'Post not found', 404);
      }

      // Only allow viewing if post is active or user is admin/owner
      if (post.status !== 'active' && post.userId !== req.user.id && req.user.type !== 'admin') {
        return ResponseUtil.error(res, 'Post not available', 403);
      }

      // Increment view count
      await post.increment('viewCount');

      return ResponseUtil.success(res, post, 'Post retrieved successfully');
    } catch (error) {
      console.error('Get post by ID error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve post', 500);
    }
  }

  // Share post
  static async sharePost(req, res) {
    try {
      const { postId } = req.params;
      const { platform, message } = req.body;

      const post = await Post.findByPk(postId);
      if (!post) {
        return ResponseUtil.error(res, 'Post not found', 404);
      }

      if (post.status !== 'active') {
        return ResponseUtil.error(res, 'Post cannot be shared', 400);
      }

      // Increment share count
      await post.increment('shareCount');

      // You can implement actual sharing logic here
      // For now, we'll just log the share and return success
      console.log(`Post ${postId} shared on ${platform} by user ${req.user.id}`);

      return ResponseUtil.success(res, { 
        shared: true, 
        platform, 
        shareCount: post.shareCount + 1 
      }, 'Post shared successfully');
    } catch (error) {
      console.error('Share post error:', error);
      return ResponseUtil.error(res, 'Failed to share post', 500);
    }
  }

  // Update post
  static async updatePost(req, res) {
    try {
      const { postId } = req.params;
      const { title, content, tags, location } = req.body;

      const post = await Post.findByPk(postId);
      if (!post) {
        return ResponseUtil.error(res, 'Post not found', 404);
      }

      // Check if user owns the post
      if (post.userId !== req.user.id) {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      await post.update({
        title: title || post.title,
        content: content || post.content,
        tags: tags || post.tags,
        location: location || post.location,
        status: 'pending', // Reset to pending for re-approval
        moderationStatus: 'pending'
      });

      return ResponseUtil.success(res, post, 'Post updated and sent for re-approval');
    } catch (error) {
      console.error('Update post error:', error);
      return ResponseUtil.error(res, 'Failed to update post', 500);
    }
  }

  // Delete post
  static async deletePost(req, res) {
    try {
      const { postId } = req.params;

      const post = await Post.findByPk(postId);
      if (!post) {
        return ResponseUtil.error(res, 'Post not found', 404);
      }

      // Check if user owns the post or is admin
      if (post.userId !== req.user.id && req.user.type !== 'admin') {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      await post.update({ status: 'deleted' });

      return ResponseUtil.success(res, null, 'Post deleted successfully');
    } catch (error) {
      console.error('Delete post error:', error);
      return ResponseUtil.error(res, 'Failed to delete post', 500);
    }
  }

  // Create comment
  static async createComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { postId } = req.params;
      const { content, parentId } = req.body;

      const post = await Post.findByPk(postId);
      if (!post) {
        return ResponseUtil.error(res, 'Post not found', 404);
      }

      if (post.status !== 'active') {
        return ResponseUtil.error(res, 'Cannot comment on this post', 400);
      }

      const comment = await Comment.create({
        userId: req.user.id,
        postId,
        parentId: parentId || null,
        content,
        status: 'pending' // Comments also need approval
      });

      // Don't increment comment count until approved
      const createdComment = await Comment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          }
        ]
      });

      return ResponseUtil.success(res, createdComment, 'Comment created and sent for approval', 201);
    } catch (error) {
      console.error('Create comment error:', error);
      return ResponseUtil.error(res, 'Failed to create comment', 500);
    }
  }

  // Vote on post
  static async voteOnPost(req, res) {
    try {
      const { postId } = req.params;
      const { type } = req.body; // 'upvote' or 'downvote'

      if (!['upvote', 'downvote'].includes(type)) {
        return ResponseUtil.error(res, 'Invalid vote type', 400);
      }

      const post = await Post.findByPk(postId);
      if (!post) {
        return ResponseUtil.error(res, 'Post not found', 404);
      }

      if (post.status !== 'active') {
        return ResponseUtil.error(res, 'Cannot vote on this post', 400);
      }

      // Check if user already voted
      const existingVote = await Vote.findOne({
        where: { userId: req.user.id, postId }
      });

      if (existingVote) {
        if (existingVote.type === type) {
          // Remove vote if same type
          await existingVote.destroy();
          
          if (type === 'upvote') {
            await post.decrement('upvotes');
          } else {
            await post.decrement('downvotes');
          }
          
          return ResponseUtil.success(res, { removed: true }, 'Vote removed');
        } else {
          // Change vote type
          await existingVote.update({ type });
          
          if (type === 'upvote') {
            await post.increment('upvotes');
            await post.decrement('downvotes');
          } else {
            await post.increment('downvotes');
            await post.decrement('upvotes');
          }
          
          return ResponseUtil.success(res, existingVote, 'Vote updated');
        }
      } else {
        // Create new vote
        const vote = await Vote.create({
          userId: req.user.id,
          postId,
          type
        });
        
        if (type === 'upvote') {
          await post.increment('upvotes');
        } else {
          await post.increment('downvotes');
        }
        
        return ResponseUtil.success(res, vote, 'Vote created', 201);
      }
    } catch (error) {
      console.error('Vote on post error:', error);
      return ResponseUtil.error(res, 'Failed to process vote', 500);
    }
  }

  // Flag post
  static async flagPost(req, res) {
    try {
      const { postId } = req.params;
      const { reason } = req.body;

      const post = await Post.findByPk(postId);
      if (!post) {
        return ResponseUtil.error(res, 'Post not found', 404);
      }

      // Increment flag count
      await post.increment('flagCount');
      
      // Auto-hide if flagged by 3 or more users
      if (post.flagCount + 1 >= 3) {
        await post.update({ status: 'flagged' });
      }

      return ResponseUtil.success(res, null, 'Post flagged successfully');
    } catch (error) {
      console.error('Flag post error:', error);
      return ResponseUtil.error(res, 'Failed to flag post', 500);
    }
  }

  // Get trending posts
  static async getTrendingPosts(req, res) {
    try {
      const { limit = 10 } = req.query;

      // Calculate trending score based on upvotes, comments, and recency
      const posts = await Post.findAll({
        where: { status: 'active' },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Sport,
            as: 'Sport',
            attributes: ['id', 'name', 'icon']
          }
        ],
        order: [
          ['upvotes', 'DESC'],
          ['commentCount', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit)
      });

      return ResponseUtil.success(res, posts, 'Trending posts retrieved successfully');
    } catch (error) {
      console.error('Get trending posts error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve trending posts', 500);
    }
  }

  // Get posts for moderation (Admin only)
  static async getPostsForModeration(req, res) {
    try {
      const { page = 1, limit = 10, status = 'pending' } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: posts } = await Post.findAndCountAll({
        where: { 
          status: status === 'all' ? { [Op.ne]: 'deleted' } : status 
        },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Sport,
            as: 'Sport',
            attributes: ['id', 'name', 'icon']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      };

      return ResponseUtil.paginated(res, posts, pagination, 'Posts for moderation retrieved successfully');
    } catch (error) {
      console.error('Get posts for moderation error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve posts for moderation', 500);
    }
  }

  // Moderate post (Admin only)
  static async moderatePost(req, res) {
    try {
      const { postId } = req.params;
      const { action, reason } = req.body; // action: 'approve', 'reject', 'flag'

      if (!['approve', 'reject', 'flag'].includes(action)) {
        return ResponseUtil.error(res, 'Invalid moderation action', 400);
      }

      const post = await Post.findByPk(postId);
      if (!post) {
        return ResponseUtil.error(res, 'Post not found', 404);
      }

      let newStatus;
      switch (action) {
        case 'approve':
          newStatus = 'active';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'flag':
          newStatus = 'flagged';
          break;
      }

      await post.update({
        status: newStatus,
        moderationStatus: action,
        moderationReason: reason || null,
        moderatedAt: new Date(),
        moderatedBy: req.user.id
      });

      return ResponseUtil.success(res, post, `Post ${action}ed successfully`);
    } catch (error) {
      console.error('Moderate post error:', error);
      return ResponseUtil.error(res, 'Failed to moderate post', 500);
    }
  }
}

module.exports = CommunityController;