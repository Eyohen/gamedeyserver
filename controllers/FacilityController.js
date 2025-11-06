
// controllers/FacilityController.js
const { Facility, User, Booking, Review, Sport } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class FacilityController {
  // Get all facilities with filtering and pagination
  static async getAllFacilities(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sport, 
        location, 
        minPrice, 
        maxPrice, 
        minRating, 
        search,
        amenities 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let whereClause = { 
        status: 'active',
        verificationStatus: 'verified'
      };
      
      if (minPrice || maxPrice) {
        whereClause.pricePerHour = {};
        if (minPrice) whereClause.pricePerHour[Op.gte] = minPrice;
        if (maxPrice) whereClause.pricePerHour[Op.lte] = maxPrice;
      }
      
      if (minRating) {
        whereClause.averageRating = { [Op.gte]: minRating };
      }


      if (search) {
  // Split search terms to handle "Lagos, Nigeria" -> ["Lagos", "Nigeria"]
  const searchTerms = search.toLowerCase().split(/[,\s]+/).filter(term => term.length > 0);
  
  const searchConditions = searchTerms.map(term => ({
    [Op.or]: [
      { name: { [Op.iLike]: `%${term}%` } },
      { description: { [Op.iLike]: `%${term}%` } },
      { address: { [Op.iLike]: `%${term}%` } },
      // Also search in location object if it contains city/state
      ...(facility.location ? [
        { 'location.city': { [Op.iLike]: `%${term}%` } },
        { 'location.state': { [Op.iLike]: `%${term}%` } },
        { 'location.country': { [Op.iLike]: `%${term}%` } }
      ] : [])
    ]
  }));

  // At least one search term should match
  whereClause[Op.and] = searchConditions;
}


      if (amenities) {
        const amenitiesArray = amenities.split(',');
        whereClause.amenities = {
          [Op.contains]: amenitiesArray
        };
      }

      const { count, rows: facilities } = await Facility.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'Owner',
            attributes: ['firstName', 'lastName', 'phone']
          },
          {
            model: Sport,
            as: 'Sports',
            through: { attributes: [] }
          }
        ],
        order: [['averageRating', 'DESC'], ['totalReviews', 'DESC']],
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
      console.error('Get all facilities error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve facilities', 500);
    }
  }

  // Get facility by ID
  static async getFacilityById(req, res) {
    try {
      const { facilityId } = req.params;

      const facility = await Facility.findByPk(facilityId, {
        include: [
          {
            model: User,
            as: 'Owner',
            attributes: ['firstName', 'lastName', 'phone']
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

      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      return ResponseUtil.success(res, facility, 'Facility retrieved successfully');
    } catch (error) {
      console.error('Get facility by ID error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve facility', 500);
    }
  }

  // Get facility profile (for authenticated facility owner)
  static async getProfile(req, res) {
    try {
      const facility = await Facility.findOne({
        where: { ownerId: req.user.id },
        include: [
          {
            model: User,
            as: 'Owner',
            attributes: { exclude: ['password'] }
          },
          {
            model: Sport,
            as: 'Sports',
            through: { attributes: [] }
          }
        ]
      });

      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      return ResponseUtil.success(res, facility, 'Facility profile retrieved successfully');
    } catch (error) {
      console.error('Get facility profile error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve facility profile', 500);
    }
  }

  // Update facility profile
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const facility = await Facility.findOne({ where: { ownerId: req.user.id } });
      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      const {
        name,
        description,
        address,
        location,
        amenities,
        capacity,
        pricePerHour,
        operatingHours,
        contactInfo,
        rules
      } = req.body;

      await facility.update({
        name: name || facility.name,
        description: description || facility.description,
        address: address || facility.address,
        location: location || facility.location,
        amenities: amenities || facility.amenities,
        capacity: capacity || facility.capacity,
        pricePerHour: pricePerHour || facility.pricePerHour,
        operatingHours: operatingHours || facility.operatingHours,
        contactInfo: contactInfo || facility.contactInfo,
        rules: rules || facility.rules
      });

      return ResponseUtil.success(res, facility, 'Facility profile updated successfully');
    } catch (error) {
      console.error('Update facility profile error:', error);
      return ResponseUtil.error(res, 'Failed to update facility profile', 500);
    }
  }

  // Get facility bookings
  static async getBookings(req, res) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;

      const facility = await Facility.findOne({ where: { ownerId: req.user.id } });
      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      let whereClause = { facilityId: facility.id };
      
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
            model: require('../models').Coach,
            as: 'Coach',
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['firstName', 'lastName']
              }
            ]
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

      return ResponseUtil.paginated(res, bookings, pagination, 'Facility bookings retrieved successfully');
    } catch (error) {
      console.error('Get facility bookings error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve facility bookings', 500);
    }
  }

  // Get facility dashboard stats
  static async getDashboardStats(req, res) {
    try {
      const facility = await Facility.findOne({ where: { ownerId: req.user.id } });
      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

      // Get total bookings
      const totalBookings = await Booking.count({
        where: { facilityId: facility.id }
      });

      // Get this month's bookings
      const monthlyBookings = await Booking.count({
        where: { 
          facilityId: facility.id,
          createdAt: { [Op.gte]: startOfMonth }
        }
      });

      // Calculate total revenue
      const completedBookings = await Booking.findAll({
        where: { 
          facilityId: facility.id,
          status: 'completed'
        },
        attributes: ['totalAmount']
      });

      const totalRevenue = completedBookings.reduce((sum, booking) => {
        return sum + parseFloat(booking.totalAmount);
      }, 0);

      // Get monthly revenue
      const monthlyCompletedBookings = await Booking.findAll({
        where: { 
          facilityId: facility.id,
          status: 'completed',
          createdAt: { [Op.gte]: startOfMonth }
        },
        attributes: ['totalAmount']
      });

      const monthlyRevenue = monthlyCompletedBookings.reduce((sum, booking) => {
        return sum + parseFloat(booking.totalAmount);
      }, 0);

      // Get upcoming bookings
      const upcomingBookings = await Booking.findAll({
        where: {
          facilityId: facility.id,
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
        totalRevenue,
        monthlyRevenue,
        averageRating: facility.averageRating,
        totalReviews: facility.totalReviews,
        upcomingBookings
      };

      return ResponseUtil.success(res, stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      console.error('Get facility dashboard stats error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve dashboard stats', 500);
    }
  }

  // Check facility availability
  static async checkAvailability(req, res) {
    try {
      const { facilityId } = req.params;
      const { startTime, endTime } = req.query;

      if (!startTime || !endTime) {
        return ResponseUtil.error(res, 'Start time and end time are required', 400);
      }

      const facility = await Facility.findByPk(facilityId);
      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      // Check for conflicting bookings
      const conflictingBookings = await Booking.count({
        where: {
          facilityId,
          status: { [Op.in]: ['pending', 'confirmed'] },
          [Op.or]: [
            {
              startTime: { [Op.between]: [startTime, endTime] }
            },
            {
              endTime: { [Op.between]: [startTime, endTime] }
            },
            {
              [Op.and]: [
                { startTime: { [Op.lte]: startTime } },
                { endTime: { [Op.gte]: endTime } }
              ]
            }
          ]
        }
      });

      const isAvailable = conflictingBookings === 0;

      return ResponseUtil.success(res, { 
        isAvailable,
        facilityId,
        requestedTime: { startTime, endTime }
      }, `Facility is ${isAvailable ? 'available' : 'not available'} for the requested time`);

    } catch (error) {
      console.error('Check facility availability error:', error);
      return ResponseUtil.error(res, 'Failed to check facility availability', 500);
    }
  }

  // Update facility sports
  static async updateSports(req, res) {
    try {
      const { sportIds } = req.body; // Array of sport IDs

      if (!sportIds || !Array.isArray(sportIds)) {
        return ResponseUtil.error(res, 'Sport IDs must be provided as an array', 400);
      }

      const facility = await Facility.findOne({ where: { ownerId: req.user.id } });
      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      // Verify all sport IDs exist
      const sports = await Sport.findAll({ where: { id: sportIds } });
      if (sports.length !== sportIds.length) {
        return ResponseUtil.error(res, 'One or more invalid sport IDs', 400);
      }

      // Update the facility's sports
      await facility.setSports(sportIds);

      // Fetch updated facility with sports
      const updatedFacility = await Facility.findByPk(facility.id, {
        include: [{ model: Sport, as: 'Sports', through: { attributes: [] } }]
      });

      return ResponseUtil.success(res, updatedFacility, 'Facility sports updated successfully');
    } catch (error) {
      console.error('Update facility sports error:', error);
      return ResponseUtil.error(res, 'Failed to update facility sports', 500);
    }
  }

  // Upload facility images
  static async uploadImages(req, res) {
    try {
      const { images } = req.body; // Array of image URLs (already uploaded to Cloudinary)

      if (!images || !Array.isArray(images)) {
        return ResponseUtil.error(res, 'Images must be provided as an array of URLs', 400);
      }

      const facility = await Facility.findOne({ where: { ownerId: req.user.id } });
      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      // Append new images to existing ones
      const existingImages = facility.images || [];
      const updatedImages = [...existingImages, ...images];

      await facility.update({ images: updatedImages });

      return ResponseUtil.success(res, { images: updatedImages }, 'Facility images uploaded successfully');
    } catch (error) {
      console.error('Upload facility images error:', error);
      return ResponseUtil.error(res, 'Failed to upload facility images', 500);
    }
  }

  // Delete facility image
  static async deleteImage(req, res) {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return ResponseUtil.error(res, 'Image URL is required', 400);
      }

      const facility = await Facility.findOne({ where: { ownerId: req.user.id } });
      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found', 404);
      }

      const existingImages = facility.images || [];
      const updatedImages = existingImages.filter(img => img !== imageUrl);

      await facility.update({ images: updatedImages });

      return ResponseUtil.success(res, { images: updatedImages }, 'Facility image deleted successfully');
    } catch (error) {
      console.error('Delete facility image error:', error);
      return ResponseUtil.error(res, 'Failed to delete facility image', 500);
    }
  }
}

module.exports = FacilityController;