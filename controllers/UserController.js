// controllers/UserController.js
const { User, Booking, Review, Post, Transaction, Notification } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class UserController {
  // Get user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      return ResponseUtil.success(res, user, 'Profile retrieved successfully');
    } catch (error) {
      console.error('Get profile error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve profile', 500);
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { firstName, lastName, phone, dateOfBirth, gender, location, preferences } = req.body;
      
      await req.user.update({
        firstName: firstName || req.user.firstName,
        lastName: lastName || req.user.lastName,
        phone: phone || req.user.phone,
        dateOfBirth: dateOfBirth || req.user.dateOfBirth,
        gender: gender || req.user.gender,
        location: location || req.user.location,
        preferences: preferences || req.user.preferences
      });

      return ResponseUtil.success(res, req.user, 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      return ResponseUtil.error(res, 'Failed to update profile', 500);
    }
  }

  // Get user bookings
  static async getBookings(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { userId: req.user.id };
      if (status) {
        whereClause.status = status;
      }

      const { count, rows: bookings } = await Booking.findAndCountAll({
        where: whereClause,
        include: [
          { model: require('../models').Facility, as: 'Facility' },
          { model: require('../models').Coach, as: 'Coach' }
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

      return ResponseUtil.paginated(res, bookings, pagination, 'Bookings retrieved successfully');
    } catch (error) {
      console.error('Get bookings error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve bookings', 500);
    }
  }

  // Get user reviews
  static async getReviews(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: { userId: req.user.id },
        include: [
          { model: require('../models').Facility, as: 'Facility' },
          { model: require('../models').Coach, as: 'Coach' }
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

      return ResponseUtil.paginated(res, reviews, pagination, 'Reviews retrieved successfully');
    } catch (error) {
      console.error('Get reviews error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve reviews', 500);
    }
  }

  // Get user posts
  static async getPosts(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: posts } = await Post.findAndCountAll({
        where: { userId: req.user.id },
        include: [
          { model: require('../models').Sport, as: 'Sport' },
          { model: require('../models').User, as: 'User', attributes: ['id', 'firstName', 'lastName'] }
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

      return ResponseUtil.paginated(res, posts, pagination, 'Posts retrieved successfully');
    } catch (error) {
      console.error('Get posts error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve posts', 500);
    }
  }

  // Get wallet balance and transactions
  static async getWallet(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const user = await User.findByPk(req.user.id, {
        attributes: ['walletBalance']
      });

      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: { userId: req.user.id },
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

      return ResponseUtil.success(res, {
        walletBalance: user.walletBalance,
        transactions,
        pagination
      }, 'Wallet information retrieved successfully');
    } catch (error) {
      console.error('Get wallet error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve wallet information', 500);
    }
  }

  // Get notifications
  static async getNotifications(req, res) {
    try {
      const { page = 1, limit = 10, unreadOnly } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = { userId: req.user.id };
      if (unreadOnly === 'true') {
        whereClause.isRead = false;
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
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

      return ResponseUtil.paginated(res, notifications, pagination, 'Notifications retrieved successfully');
    } catch (error) {
      console.error('Get notifications error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve notifications', 500);
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findOne({
        where: { 
          id: notificationId, 
          userId: req.user.id 
        }
      });

      if (!notification) {
        return ResponseUtil.error(res, 'Notification not found', 404);
      }

      await notification.markAsRead();

      return ResponseUtil.success(res, notification, 'Notification marked as read');
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return ResponseUtil.error(res, 'Failed to mark notification as read', 500);
    }
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead(req, res) {
    try {
      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { userId: req.user.id, isRead: false } }
      );

      return ResponseUtil.success(res, null, 'All notifications marked as read');
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return ResponseUtil.error(res, 'Failed to mark all notifications as read', 500);
    }
  }

  // Delete account
  static async deleteAccount(req, res) {
    try {
      const { password } = req.body;

      // Verify password
      const isValidPassword = await req.user.validatePassword(password);
      if (!isValidPassword) {
        return ResponseUtil.error(res, 'Invalid password', 401);
      }

      // Soft delete - update status instead of actually deleting
      await req.user.update({ status: 'inactive' });

      return ResponseUtil.success(res, null, 'Account deleted successfully');
    } catch (error) {
      console.error('Delete account error:', error);
      return ResponseUtil.error(res, 'Failed to delete account', 500);
    }
  }
}

module.exports = UserController;
