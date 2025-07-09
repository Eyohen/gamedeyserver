
// controllers/AdminController.js
const { Admin, User, Coach, Facility, Booking, Review, Post, Transaction } = require('../models');
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

      // Get user statistics
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: 'active' } });
      const newUsersThisMonth = await User.count({
        where: { createdAt: { [Op.gte]: startOfMonth } }
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

      // Get revenue statistics
      const totalRevenue = await Booking.sum('totalAmount', {
        where: { status: 'completed' }
      }) || 0;

      const monthlyRevenue = await Booking.sum('totalAmount', {
        where: { 
          status: 'completed',
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
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth
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
      const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};
      
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
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
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
      const { userId } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return ResponseUtil.error(res, 'Invalid status', 400);
      }

      const user = await User.findByPk(userId);
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
      if (verificationStatus === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      await coach.update(updateData);

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
}

module.exports = AdminController;