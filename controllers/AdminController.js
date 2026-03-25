
// controllers/AdminController.js
const { Admin, User, Coach, Facility, Booking, Payment, Review, Post, Transaction, Comment, Vote, CoachEarning, BankAccount, Sport, SessionPackage, AdminNotification } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

class AdminController {
  // Get admin dashboard overview
  static async getDashboardOverview(req, res) {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

      // Get IDs of users who are coaches or facility owners (to exclude from player count)
      const coachUserIds = await Coach.findAll({ attributes: ['userId'], raw: true });
      const facilityOwnerIds = await Facility.findAll({ attributes: ['ownerId'], raw: true });
      const excludeIds = [...new Set([
        ...coachUserIds.map(c => c.userId),
        ...facilityOwnerIds.map(f => f.ownerId)
      ])];

      // Get player-only statistics (excluding coaches & facility owners)
      const playerWhere = excludeIds.length > 0 ? { id: { [Op.notIn]: excludeIds } } : {};
      const totalPlayers = await User.count({ where: playerWhere });
      const activePlayers = await User.count({ where: { ...playerWhere, status: 'active' } });
      const newPlayersThisMonth = await User.count({
        where: { ...playerWhere, createdAt: { [Op.gte]: startOfMonth } }
      });

      // Get coach statistics
      const totalCoaches = await Coach.count();
      const verifiedCoaches = await Coach.count({ where: { verificationStatus: 'verified' } });
      const pendingCoachVerifications = await Coach.count({ where: { verificationStatus: 'pending' } });

      // Get facility statistics
      const totalFacilities = await Facility.count();
      const verifiedFacilities = await Facility.count({ where: { verificationStatus: 'verified' } });
      const pendingFacilityVerifications = await Facility.count({ where: { verificationStatus: 'pending' } });

      // Get booking statistics
      const totalBookings = await Booking.count();
      const bookingsThisMonth = await Booking.count({
        where: { createdAt: { [Op.gte]: startOfMonth } }
      });
      const pendingBookings = await Booking.count({ where: { status: 'pending' } });

      // Get revenue statistics (from successful payments)
      const totalRevenue = await Payment.sum('amount', {
        where: { status: 'success' }
      }) || 0;

      const monthlyRevenue = await Payment.sum('amount', {
        where: {
          status: 'success',
          createdAt: { [Op.gte]: startOfMonth }
        }
      }) || 0;

      // Get community statistics
      const totalPosts = await Post.count();
      const postsThisMonth = await Post.count({
        where: { createdAt: { [Op.gte]: startOfMonth } }
      });
      const flaggedPosts = await Post.count({ where: { status: 'flagged' } });

      const overview = {
        players: {
          total: totalPlayers,
          active: activePlayers,
          newThisMonth: newPlayersThisMonth
        },
        coaches: {
          total: totalCoaches,
          verified: verifiedCoaches,
          pendingVerification: pendingCoachVerifications
        },
        facilities: {
          total: totalFacilities,
          verified: verifiedFacilities,
          pendingVerification: pendingFacilityVerifications
        },
        bookings: {
          total: totalBookings,
          thisMonth: bookingsThisMonth,
          pending: pendingBookings
        },
        revenue: {
          total: totalRevenue,
          thisMonth: monthlyRevenue
        },
        community: {
          totalPosts,
          postsThisMonth,
          flaggedPosts
        }
      };

      return ResponseUtil.success(res, overview, 'Dashboard overview retrieved successfully');
    } catch (error) {
      console.error('Get dashboard overview error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve dashboard overview', 500);
    }
  }

  // Get all users with filtering and pagination
  static async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'DESC', playersOnly } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};

      // If playersOnly=true, exclude users who are coaches or facility owners
      if (playersOnly === 'true') {
        const coachUserIds = await Coach.findAll({ attributes: ['userId'], raw: true });
        const facilityOwnerIds = await Facility.findAll({ attributes: ['ownerId'], raw: true });
        const excludeIds = [...new Set([
          ...coachUserIds.map(c => c.userId),
          ...facilityOwnerIds.map(f => f.ownerId)
        ])];
        if (excludeIds.length > 0) {
          whereClause.id = { [Op.notIn]: excludeIds };
        }
      }

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      };

      return ResponseUtil.paginated(res, users, pagination, 'Users retrieved successfully');
    } catch (error) {
      console.error('Get all users error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve users', 500);
    }
  }

  // Get user details by ID
  static async getUserById(req, res) {
    try {
      const playerId = req.params.playerId || req.params.userId;

      const user = await User.findByPk(playerId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Booking,
            as: 'Bookings',
            limit: 5,
            order: [['createdAt', 'DESC']]
          },
          {
            model: Review,
            as: 'Reviews',
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!user) {
        return ResponseUtil.error(res, 'User not found', 404);
      }

      return ResponseUtil.success(res, user, 'User details retrieved successfully');
    } catch (error) {
      console.error('Get user by ID error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve user details', 500);
    }
  }

  // Update user status
  static async updateUserStatus(req, res) {
    try {
      const playerId = req.params.playerId || req.params.userId;
      const { status } = req.body;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return ResponseUtil.error(res, 'Invalid status', 400);
      }

      const user = await User.findByPk(playerId);
      if (!user) {
        return ResponseUtil.error(res, 'User not found', 404);
      }

      await user.update({ status });

      return ResponseUtil.success(res, user, 'User status updated successfully');
    } catch (error) {
      console.error('Update user status error:', error);
      return ResponseUtil.error(res, 'Failed to update user status', 500);
    }
  }

  // Get all coaches for admin review
  static async getAllCoachesForReview(req, res) {
    try {
      const { page = 1, limit = 10, verificationStatus, search } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};
      
      if (verificationStatus) {
        whereClause.verificationStatus = verificationStatus;
      }

      const { count, rows: coaches } = await Coach.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'User',
            attributes: { exclude: ['password'] },
            where: search ? {
              [Op.or]: [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
              ]
            } : undefined
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

      return ResponseUtil.paginated(res, coaches, pagination, 'Coaches retrieved successfully');
    } catch (error) {
      console.error('Get all coaches for review error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve coaches', 500);
    }
  }

  // Update coach verification status
  static async updateCoachVerification(req, res) {
    try {
      const { coachId } = req.params;
      const { verificationStatus, rejectionReason } = req.body;

      if (!['pending', 'verified', 'rejected'].includes(verificationStatus)) {
        return ResponseUtil.error(res, 'Invalid verification status', 400);
      }

      const coach = await Coach.findByPk(coachId);
      if (!coach) {
        return ResponseUtil.error(res, 'Coach not found', 404);
      }

      const updateData = { verificationStatus };

      // Set profileVisible based on verification status
      if (verificationStatus === 'verified') {
        updateData.profileVisible = true;  // Make profile visible when verified
      } else {
        updateData.profileVisible = false;  // Hide profile if pending or rejected
      }

      if (verificationStatus === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      await coach.update(updateData);

      // Link coach to sports if verified and not already linked
      if (verificationStatus === 'verified' && coach.specialties && coach.specialties.length > 0) {
        try {
          const existingSports = await coach.getSports();
          if (existingSports.length === 0) {
            const matchingSports = await Sport.findAll({
              where: {
                [Op.or]: coach.specialties.map(specialty => ({
                  name: { [Op.iLike]: specialty }
                }))
              }
            });
            if (matchingSports.length > 0) {
              await coach.setSports(matchingSports);
              console.log(`📌 Linked coach to ${matchingSports.length} sports on verification`);
            }
          }
        } catch (sportLinkError) {
          console.error('⚠️ Failed to link coach to sports:', sportLinkError);
        }
      }

      return ResponseUtil.success(res, coach, 'Coach verification status updated successfully');
    } catch (error) {
      console.error('Update coach verification error:', error);
      return ResponseUtil.error(res, 'Failed to update coach verification status', 500);
    }
  }

  // Get all facilities for admin review
  static async getAllFacilitiesForReview(req, res) {
    try {
      const { page = 1, limit = 10, verificationStatus, search } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};
      
      if (verificationStatus) {
        whereClause.verificationStatus = verificationStatus;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: facilities } = await Facility.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'Owner',
            attributes: { exclude: ['password'] }
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

      return ResponseUtil.paginated(res, facilities, pagination, 'Facilities retrieved successfully');
    } catch (error) {
      console.error('Get all facilities for review error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve facilities', 500);
    }
  }

  // Update facility verification status
  static async updateFacilityVerification(req, res) {
    try {
      const { facilityId } = req.params;
      const { verificationStatus, rejectionReason } = req.body;

      if (!['pending', 'verified', 'rejected'].includes(verificationStatus)) {
        return ResponseUtil.error(res, 'Invalid verification status', 400);
      }

      const facility = await Facility.findByPk(facilityId);
      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      const updateData = { verificationStatus };
      if (verificationStatus === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      await facility.update(updateData);

      return ResponseUtil.success(res, facility, 'Facility verification status updated successfully');
    } catch (error) {
      console.error('Update facility verification error:', error);
      return ResponseUtil.error(res, 'Failed to update facility verification status', 500);
    }
  }

  // Get flagged content for moderation
  static async getFlaggedContent(req, res) {
    try {
      const { page = 1, limit = 10, type = 'all' } = req.query;
      const offset = (page - 1) * limit;

      let flaggedContent = [];

      if (type === 'all' || type === 'posts') {
        const flaggedPosts = await Post.findAll({
          where: { status: 'flagged' },
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['firstName', 'lastName', 'email']
            }
          ],
          order: [['updatedAt', 'DESC']],
          limit: type === 'posts' ? parseInt(limit) : undefined,
          offset: type === 'posts' ? parseInt(offset) : undefined
        });

        flaggedContent = flaggedContent.concat(flaggedPosts.map(post => ({
          ...post.toJSON(),
          contentType: 'post'
        })));
      }

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: flaggedContent.length,
        pages: Math.ceil(flaggedContent.length / limit)
      };

      return ResponseUtil.paginated(res, flaggedContent, pagination, 'Flagged content retrieved successfully');
    } catch (error) {
      console.error('Get flagged content error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve flagged content', 500);
    }
  }

  // Moderate content
  static async moderateContent(req, res) {
    try {
      const { contentId, contentType, action, reason } = req.body;

      if (!['approve', 'hide', 'delete'].includes(action)) {
        return ResponseUtil.error(res, 'Invalid moderation action', 400);
      }

      let content;
      let newStatus;

      switch (action) {
        case 'approve':
          newStatus = 'active';
          break;
        case 'hide':
          newStatus = 'hidden';
          break;
        case 'delete':
          newStatus = 'deleted';
          break;
      }

      if (contentType === 'post') {
        content = await Post.findByPk(contentId);
        if (!content) {
          return ResponseUtil.error(res, 'Post not found', 404);
        }
        await content.update({ status: newStatus, moderationReason: reason });
      }

      return ResponseUtil.success(res, content, 'Content moderated successfully');
    } catch (error) {
      console.error('Moderate content error:', error);
      return ResponseUtil.error(res, 'Failed to moderate content', 500);
    }
  }

  // Create new admin
  static async createAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      // Check if requesting admin has permission to create admins
      if (!req.user.isSuperAdmin()) {
        return ResponseUtil.error(res, 'Insufficient permissions', 403);
      }

      const { firstName, lastName, email, password, role, permissions } = req.body;

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ where: { email } });
      if (existingAdmin) {
        return ResponseUtil.error(res, 'Admin already exists with this email', 409);
      }

      const admin = await Admin.create({
        firstName,
        lastName,
        email,
        password,
        role: role || 'admin',
        permissions: permissions || []
      });

      return ResponseUtil.success(res, admin, 'Admin created successfully', 201);
    } catch (error) {
      console.error('Create admin error:', error);
      return ResponseUtil.error(res, 'Failed to create admin', 500);
    }
  }

  // Get platform analytics
  static async getPlatformAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      let startDate;
      const endDate = new Date();

      switch (period) {
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // User growth
      const userGrowth = await User.count({
        where: { createdAt: { [Op.between]: [startDate, endDate] } }
      });

      // Booking trends
      const bookingTrends = await Booking.count({
        where: { createdAt: { [Op.between]: [startDate, endDate] } }
      });

      // Revenue trends
      const revenueTrends = await Booking.sum('totalAmount', {
        where: { 
          status: 'completed',
          createdAt: { [Op.between]: [startDate, endDate] }
        }
      }) || 0;

      // Top performing facilities
      const topFacilities = await Facility.findAll({
        attributes: ['id', 'name', 'averageRating', 'totalBookings'],
        order: [['totalBookings', 'DESC']],
        limit: 5
      });

      // Top performing coaches
      const topCoaches = await Coach.findAll({
        attributes: ['id', 'averageRating', 'totalBookings'],
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['firstName', 'lastName']
          }
        ],
        order: [['totalBookings', 'DESC']],
        limit: 5
      });

      const analytics = {
        period,
        userGrowth,
        bookingTrends,
        revenueTrends,
        topFacilities,
        topCoaches
      };

      return ResponseUtil.success(res, analytics, 'Platform analytics retrieved successfully');
    } catch (error) {
      console.error('Get platform analytics error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve platform analytics', 500);
    }
  }



    // Get flagged content for moderation (UPDATED)
  static async getFlaggedContent(req, res) {
    try {
      const { page = 1, limit = 10, type = 'all' } = req.query;
      const offset = (page - 1) * limit;

      let flaggedContent = [];

      if (type === 'all' || type === 'posts') {
        const flaggedPosts = await Post.findAll({
          where: { 
            [Op.or]: [
              { status: 'flagged' },
              { status: 'pending' }
            ]
          },
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['firstName', 'lastName', 'email']
            }
          ],
          order: [['updatedAt', 'DESC']],
          limit: type === 'posts' ? parseInt(limit) : undefined,
          offset: type === 'posts' ? parseInt(offset) : undefined
        });

        flaggedContent = flaggedContent.concat(flaggedPosts.map(post => ({
          ...post.toJSON(),
          contentType: 'post'
        })));
      }

      if (type === 'all' || type === 'comments') {
        const flaggedComments = await Comment.findAll({
          where: { 
            [Op.or]: [
              { status: 'flagged' },
              { status: 'pending' }
            ]
          },
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['firstName', 'lastName', 'email']
            },
            {
              model: Post,
              as: 'Post',
              attributes: ['title']
            }
          ],
          order: [['updatedAt', 'DESC']],
          limit: type === 'comments' ? parseInt(limit) : undefined,
          offset: type === 'comments' ? parseInt(offset) : undefined
        });

        flaggedContent = flaggedContent.concat(flaggedComments.map(comment => ({
          ...comment.toJSON(),
          contentType: 'comment'
        })));
      }

      // Sort by updated date
      flaggedContent.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      // Apply pagination if showing all
      if (type === 'all') {
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        flaggedContent = flaggedContent.slice(startIndex, endIndex);
      }

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: flaggedContent.length,
        pages: Math.ceil(flaggedContent.length / limit)
      };

      return ResponseUtil.paginated(res, flaggedContent, pagination, 'Flagged content retrieved successfully');
    } catch (error) {
      console.error('Get flagged content error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve flagged content', 500);
    }
  }

  // Moderate content (UPDATED)
  static async moderateContent(req, res) {
    try {
      const { contentId, contentType, action, reason } = req.body;

      if (!['approve', 'hide', 'delete', 'reject'].includes(action)) {
        return ResponseUtil.error(res, 'Invalid moderation action', 400);
      }

      let content;
      let newStatus;

      switch (action) {
        case 'approve':
          newStatus = 'active';
          break;
        case 'hide':
          newStatus = 'hidden';
          break;
        case 'delete':
          newStatus = 'deleted';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
      }

      if (contentType === 'post') {
        content = await Post.findByPk(contentId);
        if (!content) {
          return ResponseUtil.error(res, 'Post not found', 404);
        }
        
        await content.update({ 
          status: newStatus, 
          moderationReason: reason,
          moderatedAt: new Date(),
          moderatedBy: null
          // moderatedBy: req.user.id
        });

        // If approving a post, increment comment count for approved comments
        if (action === 'approve') {
          const approvedComments = await Comment.count({
            where: { postId: contentId, status: 'active' }
          });
          await content.update({ commentCount: approvedComments });
        }
      }

      if (contentType === 'comment') {
        content = await Comment.findByPk(contentId);
        if (!content) {
          return ResponseUtil.error(res, 'Comment not found', 404);
        }
        
        await content.update({ 
          status: newStatus, 
          moderationReason: reason,
          moderatedAt: new Date(),
          // moderatedBy: req.user.id
        });

        // Update post comment count
        if (action === 'approve') {
          await Post.increment('commentCount', { where: { id: content.postId } });
        } else if (content.status === 'active' && ['hide', 'delete', 'reject'].includes(action)) {
          await Post.decrement('commentCount', { where: { id: content.postId } });
        }
      }

      return ResponseUtil.success(res, content, 'Content moderated successfully');
    } catch (error) {
      console.error('Moderate content error:', error);
      return ResponseUtil.error(res, 'Failed to moderate content', 500);
    }
  }

  // Get community statistics
  static async getCommunityStats(req, res) {
    try {
      const totalPosts = await Post.count();
      const activePosts = await Post.count({ where: { status: 'active' } });
      const pendingPosts = await Post.count({ where: { status: 'pending' } });
      const flaggedPosts = await Post.count({ where: { status: 'flagged' } });
      
      const totalComments = await Comment.count();
      const activeComments = await Comment.count({ where: { status: 'active' } });
      const pendingComments = await Comment.count({ where: { status: 'pending' } });
      
      const totalVotes = await Vote.count();

      const stats = {
        posts: {
          total: totalPosts,
          active: activePosts,
          pending: pendingPosts,
          flagged: flaggedPosts
        },
        comments: {
          total: totalComments,
          active: activeComments,
          pending: pendingComments
        },
        engagement: {
          totalVotes
        }
      };

      return ResponseUtil.success(res, stats, 'Community statistics retrieved successfully');
    } catch (error) {
      console.error('Get community stats error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve community statistics', 500);
    }
  }

  // Get financial overview (bookings stats and revenue)
  static async getFinancialOverview(req, res) {
    try {
      console.log('📊 [ADMIN] getFinancialOverview called');
      // Get booking counts by type
      const totalBookings = await Booking.count();
      console.log('Total bookings:', totalBookings);
      const facilityBookings = await Booking.count({ where: { bookingType: { [Op.in]: ['facility', 'both'] } } });
      const coachBookings = await Booking.count({ where: { bookingType: { [Op.in]: ['coach', 'both'] } } });

      // Calculate total platform revenue from confirmed/completed bookings
      const allBookings = await Booking.findAll({
        attributes: ['totalAmount', 'status']
      });

      const totalRevenue = allBookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, booking) => sum + parseFloat(booking.totalAmount || 0), 0);

      // Calculate growth percentages (comparing to previous month)
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      const bookingsThisMonth = await Booking.count({
        where: { createdAt: { [Op.gte]: startOfMonth } }
      });

      const bookingsLastMonth = await Booking.count({
        where: {
          createdAt: {
            [Op.gte]: startOfLastMonth,
            [Op.lte]: endOfLastMonth
          }
        }
      });

      const totalGrowth = bookingsLastMonth > 0
        ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth * 100).toFixed(1)
        : 0;

      const overview = {
        totalBookings,
        facilityBookings,
        coachBookings,
        totalRevenue,
        totalRevenueFormatted: `₦${totalRevenue.toLocaleString()}`,
        growthPercentage: parseFloat(totalGrowth),
        bookingsThisMonth,
        bookingsLastMonth
      };

      return ResponseUtil.success(res, overview, 'Financial overview retrieved successfully');
    } catch (error) {
      console.error('Get financial overview error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve financial overview', 500);
    }
  }

  // Get all bookings with revenue information
  static async getAllBookings(req, res) {
    try {
      console.log('📋 [ADMIN] getAllBookings called with params:', req.query);
      const { page = 1, limit = 20, status = 'all' } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status && status !== 'all') {
        whereClause.status = status;
      }
      console.log('Where clause:', whereClause);

      const { count, rows: bookings } = await Booking.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Coach,
            as: 'Coach',
            include: [{
              model: User,
              as: 'User',
              attributes: ['firstName', 'lastName']
            }]
          },
          {
            model: Facility,
            as: 'Facility',
            attributes: ['id', 'name']
          },
          {
            model: Sport,
            as: 'Sport',
            attributes: ['id', 'name']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      // Calculate total platform revenue
      const allBookings = await Booking.findAll({
        attributes: ['totalAmount', 'status']
      });

      const totalRevenue = allBookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, booking) => sum + parseFloat(booking.totalAmount || 0), 0);

      console.log('Found bookings count:', count);

      const formattedBookings = bookings.map(booking => {
        const serviceName = booking.bookingType === 'coach'
          ? (booking.Coach?.User ? `${booking.Coach.User.firstName} ${booking.Coach.User.lastName}` : 'Coach')
          : booking.bookingType === 'facility'
          ? (booking.Facility?.name || 'Facility')
          : 'Combined Booking';

        return {
          id: booking.id,
          bookingId: `#${booking.id.substring(0, 8).toUpperCase()}`,
          userName: booking.User ? `${booking.User.firstName} ${booking.User.lastName}` : 'Unknown',
          userEmail: booking.User?.email || 'N/A',
          serviceName,
          sport: booking.Sport?.name || 'N/A',
          bookingType: booking.bookingType,
          amount: `₦${parseFloat(booking.totalAmount || 0).toLocaleString()}`,
          totalAmount: parseFloat(booking.totalAmount || 0),
          status: booking.status,
          startTime: booking.startTime,
          endTime: booking.endTime,
          bookingDate: booking.createdAt
        };
      });

      console.log('Total revenue:', totalRevenue);
      console.log('Formatted bookings count:', formattedBookings.length);

      return ResponseUtil.success(res, {
        bookings: formattedBookings,
        totalRevenue: `₦${totalRevenue.toLocaleString()}`,
        totalRevenueValue: totalRevenue,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }, 'Bookings retrieved successfully');

    } catch (error) {
      console.error('Get all bookings error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve bookings', 500);
    }
  }

  // ==================== SESSION PACKAGES ====================

  // Get all session packages with filtering
  static async getAllSessionPackages(req, res) {
    try {
      const { page = 1, limit = 20, sportId, status, search } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};

      if (sportId) {
        whereClause.sportId = sportId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: packages } = await SessionPackage.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Sport,
            as: 'Sport',
            attributes: ['id', 'name', 'category', 'icon']
          },
          {
            model: Coach,
            as: 'Coach',
            include: [{
              model: User,
              as: 'User',
              attributes: ['firstName', 'lastName', 'profileImage']
            }]
          },
          {
            model: Facility,
            as: 'Facility',
            attributes: ['id', 'name', 'address', 'images']
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

      return ResponseUtil.paginated(res, packages, pagination, 'Session packages retrieved successfully');
    } catch (error) {
      console.error('Get all session packages error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve session packages', 500);
    }
  }

  // Get a single session package by ID
  static async getSessionPackageById(req, res) {
    try {
      const { packageId } = req.params;

      const pkg = await SessionPackage.findByPk(packageId, {
        include: [
          {
            model: Sport,
            as: 'Sport',
            attributes: ['id', 'name', 'category', 'icon']
          },
          {
            model: Coach,
            as: 'Coach',
            include: [{
              model: User,
              as: 'User',
              attributes: ['firstName', 'lastName', 'profileImage']
            }]
          },
          {
            model: Facility,
            as: 'Facility',
            attributes: ['id', 'name', 'address', 'images']
          }
        ]
      });

      if (!pkg) {
        return ResponseUtil.error(res, 'Session package not found', 404);
      }

      return ResponseUtil.success(res, pkg, 'Session package retrieved successfully');
    } catch (error) {
      console.error('Get session package by ID error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve session package', 500);
    }
  }

  // Create a new session package
  static async createSessionPackage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { sportId, coachId, facilityId, name, description, numberOfSessions, pricePerSession, totalPrice, discount, validityDays } = req.body;

      // Verify sport exists
      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        return ResponseUtil.error(res, 'Sport not found', 404);
      }

      // Verify coach exists if provided
      if (coachId) {
        const coach = await Coach.findByPk(coachId);
        if (!coach) {
          return ResponseUtil.error(res, 'Coach not found', 404);
        }
      }

      // Verify facility exists if provided
      if (facilityId) {
        const facility = await Facility.findByPk(facilityId);
        if (!facility) {
          return ResponseUtil.error(res, 'Facility not found', 404);
        }
      }

      const pkg = await SessionPackage.create({
        sportId,
        coachId: coachId || null,
        facilityId: facilityId || null,
        name,
        description,
        numberOfSessions,
        pricePerSession,
        totalPrice,
        discount: discount || 0,
        validityDays: validityDays || 90,
        status: 'active'
      });

      // Fetch with associations
      const createdPackage = await SessionPackage.findByPk(pkg.id, {
        include: [
          { model: Sport, as: 'Sport', attributes: ['id', 'name', 'category'] },
          { model: Coach, as: 'Coach', include: [{ model: User, as: 'User', attributes: ['firstName', 'lastName'] }] },
          { model: Facility, as: 'Facility', attributes: ['id', 'name'] }
        ]
      });

      return ResponseUtil.success(res, createdPackage, 'Session package created successfully', 201);
    } catch (error) {
      console.error('Create session package error:', error);
      return ResponseUtil.error(res, 'Failed to create session package', 500);
    }
  }

  // Update a session package
  static async updateSessionPackage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { packageId } = req.params;
      const { sportId, coachId, facilityId, name, description, numberOfSessions, pricePerSession, totalPrice, discount, validityDays, status } = req.body;

      const pkg = await SessionPackage.findByPk(packageId);
      if (!pkg) {
        return ResponseUtil.error(res, 'Session package not found', 404);
      }

      // Verify sport if changing
      if (sportId && sportId !== pkg.sportId) {
        const sport = await Sport.findByPk(sportId);
        if (!sport) {
          return ResponseUtil.error(res, 'Sport not found', 404);
        }
      }

      const updateData = {};
      if (sportId !== undefined) updateData.sportId = sportId;
      if (coachId !== undefined) updateData.coachId = coachId || null;
      if (facilityId !== undefined) updateData.facilityId = facilityId || null;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (numberOfSessions !== undefined) updateData.numberOfSessions = numberOfSessions;
      if (pricePerSession !== undefined) updateData.pricePerSession = pricePerSession;
      if (totalPrice !== undefined) updateData.totalPrice = totalPrice;
      if (discount !== undefined) updateData.discount = discount;
      if (validityDays !== undefined) updateData.validityDays = validityDays;
      if (status !== undefined) updateData.status = status;

      await pkg.update(updateData);

      // Fetch updated with associations
      const updatedPackage = await SessionPackage.findByPk(packageId, {
        include: [
          { model: Sport, as: 'Sport', attributes: ['id', 'name', 'category'] },
          { model: Coach, as: 'Coach', include: [{ model: User, as: 'User', attributes: ['firstName', 'lastName'] }] },
          { model: Facility, as: 'Facility', attributes: ['id', 'name'] }
        ]
      });

      return ResponseUtil.success(res, updatedPackage, 'Session package updated successfully');
    } catch (error) {
      console.error('Update session package error:', error);
      return ResponseUtil.error(res, 'Failed to update session package', 500);
    }
  }

  // Delete a session package
  static async deleteSessionPackage(req, res) {
    try {
      const { packageId } = req.params;

      const pkg = await SessionPackage.findByPk(packageId);
      if (!pkg) {
        return ResponseUtil.error(res, 'Session package not found', 404);
      }

      // Check if there are active bookings using this package
      const activeBookings = await Booking.count({
        where: {
          packageId,
          status: { [Op.in]: ['pending', 'confirmed'] }
        }
      });

      if (activeBookings > 0) {
        return ResponseUtil.error(res, 'Cannot delete package with active bookings. Deactivate it instead.', 400);
      }

      await pkg.destroy();

      return ResponseUtil.success(res, null, 'Session package deleted successfully');
    } catch (error) {
      console.error('Delete session package error:', error);
      return ResponseUtil.error(res, 'Failed to delete session package', 500);
    }
  }

  // Update sport (home session price, etc.)
  static async updateSport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { sportId } = req.params;
      const { homeSessionPrice } = req.body;

      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        return ResponseUtil.error(res, 'Sport not found', 404);
      }

      await sport.update({ homeSessionPrice });

      return ResponseUtil.success(res, sport, 'Sport updated successfully');
    } catch (error) {
      console.error('Update sport error:', error);
      return ResponseUtil.error(res, 'Failed to update sport', 500);
    }
  }
  // Get admin notifications
  static async getAdminNotifications(req, res) {
    try {
      const { limit = 20 } = req.query;
      const notifications = await AdminNotification.findAll({
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });
      return ResponseUtil.success(res, notifications, 'Notifications retrieved');
    } catch (error) {
      console.error('Get admin notifications error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve notifications', 500);
    }
  }

  // Get unread notification count
  static async getUnreadNotificationCount(req, res) {
    try {
      const count = await AdminNotification.count({ where: { isRead: false } });
      return ResponseUtil.success(res, { count }, 'Unread count retrieved');
    } catch (error) {
      console.error('Get unread count error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve unread count', 500);
    }
  }

  // Mark notification as read
  static async markNotificationRead(req, res) {
    try {
      const { id } = req.params;
      await AdminNotification.update({ isRead: true }, { where: { id } });
      return ResponseUtil.success(res, null, 'Notification marked as read');
    } catch (error) {
      console.error('Mark notification read error:', error);
      return ResponseUtil.error(res, 'Failed to mark notification as read', 500);
    }
  }

  // Mark all notifications as read
  static async markAllNotificationsRead(req, res) {
    try {
      await AdminNotification.update({ isRead: true }, { where: { isRead: false } });
      return ResponseUtil.success(res, null, 'All notifications marked as read');
    } catch (error) {
      console.error('Mark all read error:', error);
      return ResponseUtil.error(res, 'Failed to mark all as read', 500);
    }
  }

  // Helper: Create admin notification (static utility)
  static async createNotification(type, title, message, data = {}) {
    try {
      await AdminNotification.create({ type, title, message, data });
    } catch (error) {
      console.error('Create admin notification error:', error);
    }
  }
}

module.exports = AdminController;