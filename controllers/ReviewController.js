// controllers/ReviewController.js
const { Review, User, Coach, Facility, Booking } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class ReviewController {
  // Create a new review
  static async createReview(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const {
        bookingId,
        facilityId,
        coachId,
        rating,
        title,
        comment,
        images
      } = req.body;

      // Validate that either facilityId or coachId is provided
      if (!facilityId && !coachId) {
        return ResponseUtil.error(res, 'Review must be for either a facility or coach', 400);
      }

      // If bookingId is provided, verify the booking exists and belongs to the user
      if (bookingId) {
        const booking = await Booking.findOne({
          where: {
            id: bookingId,
            userId: req.user.id,
            status: 'completed'
          }
        });

        if (!booking) {
          return ResponseUtil.error(res, 'Booking not found or not completed', 404);
        }

        // Check if review already exists for this booking
        const existingReview = await Review.findOne({
          where: {
            userId: req.user.id,
            [Op.or]: [
              { facilityId: booking.facilityId },
              { coachId: booking.coachId }
            ]
          }
        });

        if (existingReview) {
          return ResponseUtil.error(res, 'You have already reviewed this service', 409);
        }
      }

      // Verify facility or coach exists
      if (facilityId) {
        const facility = await Facility.findByPk(facilityId);
        if (!facility) {
          return ResponseUtil.error(res, 'Facility not found', 404);
        }
      }

      if (coachId) {
        const coach = await Coach.findByPk(coachId);
        if (!coach) {
          return ResponseUtil.error(res, 'Coach not found', 404);
        }
      }

      // Create the review
      const review = await Review.create({
        userId: req.user.id,
        facilityId: facilityId || null,
        coachId: coachId || null,
        rating,
        title: title || null,
        comment: comment || null,
        images: images || []
      });

      // Update facility or coach rating
      if (facilityId) {
        await updateFacilityRating(facilityId);
      }
      if (coachId) {
        await updateCoachRating(coachId);
      }

      // Fetch the complete review with associations
      const createdReview = await Review.findByPk(review.id, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Facility,
            as: 'Facility',
            attributes: ['id', 'name']
          },
          {
            model: Coach,
            as: 'Coach',
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['firstName', 'lastName']
              }
            ]
          }
        ]
      });

      return ResponseUtil.success(res, createdReview, 'Review created successfully', 201);
    } catch (error) {
      console.error('Create review error:', error);
      return ResponseUtil.error(res, 'Failed to create review', 500);
    }
  }

  // Get reviews for a facility
  static async getFacilityReviews(req, res) {
    try {
      const { facilityId } = req.params;
      const { page = 1, limit = 10, rating, sortBy = 'createdAt' } = req.query;
      
      const offset = (page - 1) * limit;
      
      let whereClause = { 
        facilityId,
        status: 'active'
      };
      
      if (rating) {
        whereClause.rating = rating;
      }

      let orderClause;
      switch (sortBy) {
        case 'rating':
          orderClause = [['rating', 'DESC'], ['createdAt', 'DESC']];
          break;
        case 'helpful':
          orderClause = [['helpfulCount', 'DESC'], ['createdAt', 'DESC']];
          break;
        default:
          orderClause = [['createdAt', 'DESC']];
      }

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
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

      return ResponseUtil.paginated(res, reviews, pagination, 'Facility reviews retrieved successfully');
    } catch (error) {
      console.error('Get facility reviews error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve facility reviews', 500);
    }
  }

  // Get reviews for a coach
  static async getCoachReviews(req, res) {
    try {
      const { coachId } = req.params;
      const { page = 1, limit = 10, rating, sortBy = 'createdAt' } = req.query;
      
      const offset = (page - 1) * limit;
      
      let whereClause = { 
        coachId,
        status: 'active'
      };
      
      if (rating) {
        whereClause.rating = rating;
      }

      let orderClause;
      switch (sortBy) {
        case 'rating':
          orderClause = [['rating', 'DESC'], ['createdAt', 'DESC']];
          break;
        case 'helpful':
          orderClause = [['helpfulCount', 'DESC'], ['createdAt', 'DESC']];
          break;
        default:
          orderClause = [['createdAt', 'DESC']];
      }

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
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

      return ResponseUtil.paginated(res, reviews, pagination, 'Coach reviews retrieved successfully');
    } catch (error) {
      console.error('Get coach reviews error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve coach reviews', 500);
    }
  }

  // Get user's reviews
  static async getUserReviews(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: { 
          userId: req.user.id,
          status: 'active'
        },
        include: [
          {
            model: Facility,
            as: 'Facility',
            attributes: ['id', 'name', 'address']
          },
          {
            model: Coach,
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

      return ResponseUtil.paginated(res, reviews, pagination, 'User reviews retrieved successfully');
    } catch (error) {
      console.error('Get user reviews error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve user reviews', 500);
    }
  }

  // Get review by ID
  static async getReviewById(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByPk(reviewId, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Facility,
            as: 'Facility',
            attributes: ['id', 'name', 'address']
          },
          {
            model: Coach,
            as: 'Coach',
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['firstName', 'lastName']
              }
            ]
          }
        ]
      });

      if (!review) {
        return ResponseUtil.error(res, 'Review not found', 404);
      }

      return ResponseUtil.success(res, review, 'Review retrieved successfully');
    } catch (error) {
      console.error('Get review by ID error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve review', 500);
    }
  }

  // Update review
  static async updateReview(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { reviewId } = req.params;
      const { rating, title, comment, images } = req.body;

      const review = await Review.findByPk(reviewId);
      if (!review) {
        return ResponseUtil.error(res, 'Review not found', 404);
      }

      // Check if user owns the review
      if (review.userId !== req.user.id) {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      await review.update({
        rating: rating || review.rating,
        title: title || review.title,
        comment: comment || review.comment,
        images: images || review.images
      });

      // Update facility or coach rating
      if (review.facilityId) {
        await updateFacilityRating(review.facilityId);
      }
      if (review.coachId) {
        await updateCoachRating(review.coachId);
      }

      return ResponseUtil.success(res, review, 'Review updated successfully');
    } catch (error) {
      console.error('Update review error:', error);
      return ResponseUtil.error(res, 'Failed to update review', 500);
    }
  }

  // Delete review
  static async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByPk(reviewId);
      if (!review) {
        return ResponseUtil.error(res, 'Review not found', 404);
      }

      // Check if user owns the review
      if (review.userId !== req.user.id) {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      await review.update({ status: 'hidden' });

      // Update facility or coach rating
      if (review.facilityId) {
        await updateFacilityRating(review.facilityId);
      }
      if (review.coachId) {
        await updateCoachRating(review.coachId);
      }

      return ResponseUtil.success(res, null, 'Review deleted successfully');
    } catch (error) {
      console.error('Delete review error:', error);
      return ResponseUtil.error(res, 'Failed to delete review', 500);
    }
  }

  // Mark review as helpful
  static async markHelpful(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByPk(reviewId);
      if (!review) {
        return ResponseUtil.error(res, 'Review not found', 404);
      }

      await review.increment('helpfulCount');

      return ResponseUtil.success(res, { helpfulCount: review.helpfulCount + 1 }, 'Review marked as helpful');
    } catch (error) {
      console.error('Mark helpful error:', error);
      return ResponseUtil.error(res, 'Failed to mark review as helpful', 500);
    }
  }

  // Flag review
  static async flagReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;

      const review = await Review.findByPk(reviewId);
      if (!review) {
        return ResponseUtil.error(res, 'Review not found', 404);
      }

      await review.update({ status: 'flagged' });

      return ResponseUtil.success(res, null, 'Review flagged successfully');
    } catch (error) {
      console.error('Flag review error:', error);
      return ResponseUtil.error(res, 'Failed to flag review', 500);
    }
  }
}

// Helper function to update facility rating
async function updateFacilityRating(facilityId) {
  try {
    const reviews = await Review.findAll({
      where: { facilityId, status: 'active' },
      attributes: ['rating']
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    await Facility.update(
      { 
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      },
      { where: { id: facilityId } }
    );
  } catch (error) {
    console.error('Update facility rating error:', error);
  }
}

// Helper function to update coach rating
async function updateCoachRating(coachId) {
  try {
    const reviews = await Review.findAll({
      where: { coachId, status: 'active' },
      attributes: ['rating']
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    await Coach.update(
      { 
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews
      },
      { where: { id: coachId } }
    );
  } catch (error) {
    console.error('Update coach rating error:', error);
  }
}

module.exports = ReviewController;