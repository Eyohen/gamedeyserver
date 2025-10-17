
// controllers/CoachController.js
const { Coach, User, Booking, Review, Sport } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class CoachController {
  // Get all coaches with filtering and pagination
  static async getAllCoaches(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sport, 
        location, 
        minRate, 
        maxRate, 
        minRating, 
        search 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let whereClause = { 
        status: 'active',
        verificationStatus: 'verified'
      };
      
      if (minRate || maxRate) {
        whereClause.hourlyRate = {};
        if (minRate) whereClause.hourlyRate[Op.gte] = minRate;
        if (maxRate) whereClause.hourlyRate[Op.lte] = maxRate;
      }
      
      if (minRating) {
        whereClause.averageRating = { [Op.gte]: minRating };
      }

      let include = [
        {
          model: User,
          as: 'User',
          attributes: ['firstName', 'lastName', 'profileImage', 'location']
        },
        {
          model: Sport,
          as: 'Sports',
          through: { attributes: [] }
        }
      ];

      // Add search filter
      // if (search) {
      //   include[0].where = {
      //     [Op.or]: [
      //       { firstName: { [Op.iLike]: `%${search}%` } },
      //       { lastName: { [Op.iLike]: `%${search}%` } }
      //     ]
      //   };
      // }
      if (search) {
  const searchTerms = search.toLowerCase().split(/[,\s]+/).filter(term => term.length > 0);
  
  const searchConditions = searchTerms.map(term => ({
    [Op.or]: [
      // Search in User fields
      { '$User.firstName$': { [Op.iLike]: `%${term}%` } },
      { '$User.lastName$': { [Op.iLike]: `%${term}%` } },
      { '$User.location$': { [Op.iLike]: `%${term}%` } },
      // Search in coach bio and location
      { bio: { [Op.iLike]: `%${term}%` } },
      { location: { [Op.iLike]: `%${term}%` } }
    ]
  }));

  whereClause[Op.and] = searchConditions;
}

      const { count, rows: coaches } = await Coach.findAndCountAll({
        where: whereClause,
        include,
        order: [['averageRating', 'DESC'], ['totalReviews', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      };

      return ResponseUtil.paginated(res, coaches, pagination, 'Coaches retrieved successfully');
    } catch (error) {
      console.error('Get all coaches error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve coaches', 500);
    }
  }

  // Get coach by ID
  static async getCoachById(req, res) {
    try {
      const { coachId } = req.params;

      const coach = await Coach.findByPk(coachId, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['firstName', 'lastName', 'profileImage', 'location', 'phone']
          },
          {
            model: Sport,
            as: 'Sports',
            through: { attributes: [] }
          },
          {
            model: Review,
            as: 'Reviews',
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['firstName', 'lastName', 'profileImage']
              }
            ],
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!coach) {
        return ResponseUtil.error(res, 'Coach not found', 404);
      }

      return ResponseUtil.success(res, coach, 'Coach retrieved successfully');
    } catch (error) {
      console.error('Get coach by ID error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve coach', 500);
    }
  }

  // Get coach profile (for authenticated coach)
  static async getProfile(req, res) {
    try {
      const coach = await Coach.findOne({
        where: { userId: req.user.id },
        include: [
          {
            model: User,
            as: 'User',
            attributes: { exclude: ['password'] }
          },
          {
            model: Sport,
            as: 'Sports',
            through: { attributes: [] }
          }
        ]
      });

      if (!coach) {
        return ResponseUtil.error(res, 'Coach profile not found', 404);
      }

      return ResponseUtil.success(res, coach, 'Coach profile retrieved successfully');
    } catch (error) {
      console.error('Get coach profile error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve coach profile', 500);
    }
  }

  // Update coach profile
  // static async updateProfile(req, res) {
  //   try {
  //     const errors = validationResult(req);
  //     if (!errors.isEmpty()) {
  //       return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
  //     }

  //     const coach = await Coach.findOne({ where: { userId: req.user.id } });
  //     if (!coach) {
  //       return ResponseUtil.error(res, 'Coach profile not found', 404);
  //     }

  //     const {
  //       bio,
  //       experience,
  //       hourlyRate,
  //       specialties,
  //       certifications,
  //       availability,
  //       location
  //     } = req.body;

  //     await coach.update({
  //       bio: bio || coach.bio,
  //       experience: experience || coach.experience,
  //       hourlyRate: hourlyRate || coach.hourlyRate,
  //       specialties: specialties || coach.specialties,
  //       certifications: certifications || coach.certifications,
  //       availability: availability || coach.availability,
  //       location: location || coach.location
  //     });

  //     return ResponseUtil.success(res, coach, 'Coach profile updated successfully');
  //   } catch (error) {
  //     console.error('Update coach profile error:', error);
  //     return ResponseUtil.error(res, 'Failed to update coach profile', 500);
  //   }
  // }
  // controllers/CoachController.js - Add image handling
static async updateProfile(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
    }

    const coach = await Coach.findOne({ where: { userId: req.user.id } });
    if (!coach) {
      return ResponseUtil.error(res, 'Coach profile not found', 404);
    }

    const {
      bio,
      experience,
      hourlyRate,
      specialties,
      certifications,
      availability,
      location,
      profileImage,
      galleryImages
    } = req.body;

    await coach.update({
      bio: bio || coach.bio,
      experience: experience || coach.experience,
      hourlyRate: hourlyRate || coach.hourlyRate,
      specialties: specialties || coach.specialties,
      certifications: certifications || coach.certifications,
      availability: availability || coach.availability,
      location: location || coach.location,
      profileImage: profileImage || coach.profileImage,
      galleryImages: galleryImages || coach.galleryImages
    });

    return ResponseUtil.success(res, coach, 'Coach profile updated successfully');
  } catch (error) {
    console.error('Update coach profile error:', error);
    return ResponseUtil.error(res, 'Failed to update coach profile', 500);
  }
}

  // Get coach bookings
  static async getBookings(req, res) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;

      const coach = await Coach.findOne({ where: { userId: req.user.id } });
      if (!coach) {
        return ResponseUtil.error(res, 'Coach profile not found', 404);
      }

      let whereClause = { coachId: coach.id };
      
      if (status) {
        whereClause.status = status;
      }
      
      if (startDate && endDate) {
        whereClause.startTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const { count, rows: bookings } = await Booking.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['firstName', 'lastName', 'phone', 'profileImage']
          },
          {
            model: require('../models').Facility,
            as: 'Facility',
            attributes: ['name', 'address']
          }
        ],
        order: [['startTime', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      };

      return ResponseUtil.paginated(res, bookings, pagination, 'Coach bookings retrieved successfully');
    } catch (error) {
      console.error('Get coach bookings error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve coach bookings', 500);
    }
  }

  // Get coach reviews
  static async getReviews(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const coach = await Coach.findOne({ where: { userId: req.user.id } });
      if (!coach) {
        return ResponseUtil.error(res, 'Coach profile not found', 404);
      }

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: { coachId: coach.id, status: 'active' },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['firstName', 'lastName', 'profileImage']
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

      return ResponseUtil.paginated(res, reviews, pagination, 'Coach reviews retrieved successfully');
    } catch (error) {
      console.error('Get coach reviews error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve coach reviews', 500);
    }
  }

  // Get coach dashboard stats
  static async getDashboardStats(req, res) {
    try {
      const coach = await Coach.findOne({ where: { userId: req.user.id } });
      if (!coach) {
        return ResponseUtil.error(res, 'Coach profile not found', 404);
      }

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

      // Get total bookings
      const totalBookings = await Booking.count({
        where: { coachId: coach.id }
      });

      // Get this month's bookings
      const monthlyBookings = await Booking.count({
        where: { 
          coachId: coach.id,
          createdAt: { [Op.gte]: startOfMonth }
        }
      });

      // Get this week's bookings
      const weeklyBookings = await Booking.count({
        where: { 
          coachId: coach.id,
          createdAt: { [Op.gte]: startOfWeek }
        }
      });

      // Calculate total earnings
      const completedBookings = await Booking.findAll({
        where: { 
          coachId: coach.id,
          status: 'completed'
        },
        attributes: ['totalAmount']
      });

      const totalEarnings = completedBookings.reduce((sum, booking) => {
        return sum + parseFloat(booking.totalAmount);
      }, 0);

      // Get upcoming bookings
      const upcomingBookings = await Booking.findAll({
        where: {
          coachId: coach.id,
          status: 'confirmed',
          startTime: { [Op.gte]: new Date() }
        },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['firstName', 'lastName']
          }
        ],
        order: [['startTime', 'ASC']],
        limit: 5
      });

      const stats = {
        totalBookings,
        monthlyBookings,
        weeklyBookings,
        totalEarnings,
        averageRating: coach.averageRating,
        totalReviews: coach.totalReviews,
        upcomingBookings
      };

      return ResponseUtil.success(res, stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      console.error('Get coach dashboard stats error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve dashboard stats', 500);
    }
  }
}

module.exports = CoachController;