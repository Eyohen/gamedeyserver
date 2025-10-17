// controllers/SportController.js
const { Sport, Coach, Facility, SessionPackage, User } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class SportController {
  // Get all sports
  static async getAllSports(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category,
        search 
      } = req.query;
      
      const offset = (page - 1) * limit;
      let whereClause = { status: 'active' };
      
      if (category) {
        whereClause.category = category;
      }
      
      if (search) {
        whereClause.name = { [Op.iLike]: `%${search}%` };
      }

      const { count, rows: sports } = await Sport.findAndCountAll({
        where: whereClause,
        order: [['popularityScore', 'DESC'], ['name', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      };

      return ResponseUtil.paginated(res, sports, pagination, 'Sports retrieved successfully');
    } catch (error) {
      console.error('Get all sports error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve sports', 500);
    }
  }

  // Get sport by ID
  static async getSportById(req, res) {
    try {
      const { sportId } = req.params;

      const sport = await Sport.findByPk(sportId);

      if (!sport) {
        return ResponseUtil.error(res, 'Sport not found', 404);
      }

      return ResponseUtil.success(res, sport, 'Sport retrieved successfully');
    } catch (error) {
      console.error('Get sport by ID error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve sport', 500);
    }
  }

  // Get facilities and coaches for a sport
  static async getSportProviders(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { sportId } = req.params;
      const { 
        location, 
        minPrice, 
        maxPrice, 
        minRating,
        page = 1,
        limit = 20
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where clause for filtering
      let facilityWhere = { 
        status: 'active',
        verificationStatus: 'verified'
      };
      let coachWhere = { 
        status: 'active',
        verificationStatus: 'verified'
      };

      if (minPrice || maxPrice) {
        facilityWhere.pricePerHour = {};
        coachWhere.hourlyRate = {};
        if (minPrice) {
          facilityWhere.pricePerHour[Op.gte] = minPrice;
          coachWhere.hourlyRate[Op.gte] = minPrice;
        }
        if (maxPrice) {
          facilityWhere.pricePerHour[Op.lte] = maxPrice;
          coachWhere.hourlyRate[Op.lte] = maxPrice;
        }
      }

      if (minRating) {
        facilityWhere.averageRating = { [Op.gte]: minRating };
        coachWhere.averageRating = { [Op.gte]: minRating };
      }

      // Get facilities that offer this sport
      const facilities = await Facility.findAll({
        where: facilityWhere,
        include: [
          {
            model: Sport,
            as: 'Sports',
            where: { id: sportId },
            through: { attributes: [] }
          },
          {
            model: User,
            as: 'Owner',
            attributes: ['firstName', 'lastName', 'phone']
          }
        ],
        order: [['averageRating', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Get coaches that offer this sport
      const coaches = await Coach.findAll({
        where: coachWhere,
        include: [
          {
            model: Sport,
            as: 'Sports',
            where: { id: sportId },
            through: { attributes: [] }
          },
          {
            model: User,
            as: 'User',
            attributes: ['firstName', 'lastName', 'profileImage', 'location', 'phone']
          }
        ],
        order: [['averageRating', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return ResponseUtil.success(res, {
        facilities,
        coaches,
        total: {
          facilities: facilities.length,
          coaches: coaches.length
        }
      }, 'Sport providers retrieved successfully');

    } catch (error) {
      console.error('Get sport providers error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve sport providers', 500);
    }
  }

  // Get packages for a sport
  static async getSportPackages(req, res) {
    try {
      const { sportId } = req.params;

      const packages = await SessionPackage.findAll({
        where: { 
          sportId,
          status: 'active'
        },
        include: [
          {
            model: Coach,
            as: 'Coach',
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['firstName', 'lastName', 'profileImage']
              }
            ]
          },
          {
            model: Facility,
            as: 'Facility',
            attributes: ['name', 'address', 'images']
          },
          {
            model: Sport,
            as: 'Sport'
          }
        ],
        order: [['totalPrice', 'ASC']]
      });

      return ResponseUtil.success(res, packages, 'Sport packages retrieved successfully');

    } catch (error) {
      console.error('Get sport packages error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve sport packages', 500);
    }
  }
}

module.exports = SportController;