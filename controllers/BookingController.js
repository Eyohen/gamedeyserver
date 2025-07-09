
// controllers/BookingController.js
const { Booking, User, Coach, Facility, Payment, Notification } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class BookingController {
  // Create a new booking
  static async createBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const {
        facilityId,
        coachId,
        bookingType,
        startTime,
        endTime,
        participantsCount,
        notes
      } = req.body;

      // Validate booking type
      if (!['facility', 'coach', 'both'].includes(bookingType)) {
        return ResponseUtil.error(res, 'Invalid booking type', 400);
      }

      // Validate that facility or coach is provided based on booking type
      if (bookingType === 'facility' && !facilityId) {
        return ResponseUtil.error(res, 'Facility ID is required for facility booking', 400);
      }
      if (bookingType === 'coach' && !coachId) {
        return ResponseUtil.error(res, 'Coach ID is required for coach booking', 400);
      }
      if (bookingType === 'both' && (!facilityId || !coachId)) {
        return ResponseUtil.error(res, 'Both facility and coach IDs are required', 400);
      }

      // Check if facility exists and is available
      let facility = null;
      if (facilityId) {
        facility = await Facility.findByPk(facilityId);
        if (!facility) {
          return ResponseUtil.error(res, 'Facility not found', 404);
        }
        if (facility.status !== 'active') {
          return ResponseUtil.error(res, 'Facility is not available', 400);
        }
      }

      // Check if coach exists and is available
      let coach = null;
      if (coachId) {
        coach = await Coach.findByPk(coachId);
        if (!coach) {
          return ResponseUtil.error(res, 'Coach not found', 404);
        }
        if (coach.status !== 'active') {
          return ResponseUtil.error(res, 'Coach is not available', 400);
        }
      }

      // Check for time conflicts
      const conflictingBookings = await Booking.count({
        where: {
          [Op.or]: [
            facilityId ? { facilityId } : {},
            coachId ? { coachId } : {}
          ],
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

      if (conflictingBookings > 0) {
        return ResponseUtil.error(res, 'Time slot is not available', 409);
      }

      // Calculate total amount
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      const durationHours = (endDate - startDate) / (1000 * 60 * 60);
      
      let totalAmount = 0;
      if (facility) {
        totalAmount += parseFloat(facility.pricePerHour) * durationHours;
      }
      if (coach) {
        totalAmount += parseFloat(coach.hourlyRate) * durationHours;
      }

      // Create booking
      const booking = await Booking.create({
        userId: req.user.id,
        facilityId: facilityId || null,
        coachId: coachId || null,
        bookingType,
        startTime,
        endTime,
        totalAmount,
        participantsCount: participantsCount || 1,
        notes: notes || null
      });

      // Include related data in response
      const createdBooking = await Booking.findByPk(booking.id, {
        include: [
          { model: Facility, as: 'Facility' },
          { model: Coach, as: 'Coach', include: [{ model: User, as: 'User' }] }
        ]
      });

      return ResponseUtil.success(res, createdBooking, 'Booking created successfully', 201);
    } catch (error) {
      console.error('Create booking error:', error);
      return ResponseUtil.error(res, 'Failed to create booking', 500);
    }
  }

  // Get booking by ID
  static async getBookingById(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findByPk(bookingId, {
        include: [
          { model: User, as: 'User', attributes: ['firstName', 'lastName', 'phone'] },
          { model: Facility, as: 'Facility' },
          { model: Coach, as: 'Coach', include: [{ model: User, as: 'User' }] },
          { model: Payment, as: 'Payment' }
        ]
      });

      if (!booking) {
        return ResponseUtil.error(res, 'Booking not found', 404);
      }

      // Check if user has permission to view this booking
      if (booking.userId !== req.user.id && !req.user.isSuperAdmin) {
        // Check if user is the coach or facility owner
        const isCoachOwner = booking.Coach && booking.Coach.userId === req.user.id;
        const isFacilityOwner = booking.Facility && booking.Facility.ownerId === req.user.id;
        
        if (!isCoachOwner && !isFacilityOwner) {
          return ResponseUtil.error(res, 'Access denied', 403);
        }
      }

      return ResponseUtil.success(res, booking, 'Booking retrieved successfully');
    } catch (error) {
      console.error('Get booking by ID error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve booking', 500);
    }
  }

  // Update booking status
  static async updateBookingStatus(req, res) {
    try {
      const { bookingId } = req.params;
      const { status, cancellationReason } = req.body;

      if (!['pending', 'confirmed', 'cancelled', 'completed', 'no_show'].includes(status)) {
        return ResponseUtil.error(res, 'Invalid status', 400);
      }

      const booking = await Booking.findByPk(bookingId, {
        include: [
          { model: Coach, as: 'Coach' },
          { model: Facility, as: 'Facility' }
        ]
      });

      if (!booking) {
        return ResponseUtil.error(res, 'Booking not found', 404);
      }

      // Check permissions
      const isBookingOwner = booking.userId === req.user.id;
      const isCoachOwner = booking.Coach && booking.Coach.userId === req.user.id;
      const isFacilityOwner = booking.Facility && booking.Facility.ownerId === req.user.id;

      if (!isBookingOwner && !isCoachOwner && !isFacilityOwner && !req.user.isSuperAdmin) {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      // Validate status transitions
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return ResponseUtil.error(res, 'Cannot modify completed or cancelled booking', 400);
      }

      const updateData = { status };
      
      if (status === 'cancelled') {
        updateData.cancellationReason = cancellationReason;
        updateData.cancelledBy = isBookingOwner ? 'user' : 
                                isCoachOwner ? 'coach' : 
                                isFacilityOwner ? 'facility' : 'admin';
        updateData.cancelledAt = new Date();
      }

      await booking.update(updateData);

      // Create notification for relevant parties
      const notificationMessage = `Booking ${status === 'confirmed' ? 'confirmed' : 
                                                status === 'cancelled' ? 'cancelled' : 
                                                `updated to ${status}`}`;
      
      // Notify booking owner if status changed by others
      if (!isBookingOwner) {
        await Notification.create({
          userId: booking.userId,
          type: `booking_${status}`,
          title: 'Booking Update',
          message: notificationMessage
        });
      }

      return ResponseUtil.success(res, booking, 'Booking status updated successfully');
    } catch (error) {
      console.error('Update booking status error:', error);
      return ResponseUtil.error(res, 'Failed to update booking status', 500);
    }
  }

  // Cancel booking
  static async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;

      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return ResponseUtil.error(res, 'Booking not found', 404);
      }

      // Check if user can cancel this booking
      if (booking.userId !== req.user.id) {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      // Check if booking can be cancelled
      if (!booking.canBeCancelled()) {
        return ResponseUtil.error(res, 'Booking cannot be cancelled (less than 24 hours remaining or already processed)', 400);
      }

      await booking.update({
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: 'user',
        cancelledAt: new Date()
      });

      return ResponseUtil.success(res, booking, 'Booking cancelled successfully');
    } catch (error) {
      console.error('Cancel booking error:', error);
      return ResponseUtil.error(res, 'Failed to cancel booking', 500);
    }
  }

  // Get available time slots
  static async getAvailableTimeSlots(req, res) {
    try {
      const { facilityId, coachId, date } = req.query;

      if (!facilityId && !coachId) {
        return ResponseUtil.error(res, 'Either facility ID or coach ID is required', 400);
      }

      if (!date) {
        return ResponseUtil.error(res, 'Date is required', 400);
      }

      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

      // Get existing bookings for the day
      const existingBookings = await Booking.findAll({
        where: {
          [Op.or]: [
            facilityId ? { facilityId } : {},
            coachId ? { coachId } : {}
          ],
          status: { [Op.in]: ['pending', 'confirmed'] },
          startTime: { [Op.between]: [startOfDay, endOfDay] }
        },
        attributes: ['startTime', 'endTime'],
        order: [['startTime', 'ASC']]
      });

      // Generate available time slots (example: 1-hour slots from 6 AM to 10 PM)
      const availableSlots = [];
      const operatingStart = 6; // 6 AM
      const operatingEnd = 22; // 10 PM

      for (let hour = operatingStart; hour < operatingEnd; hour++) {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(selectedDate);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Check if this slot conflicts with any existing booking
        const hasConflict = existingBookings.some(booking => {
          return (slotStart < new Date(booking.endTime)) && (slotEnd > new Date(booking.startTime));
        });

        if (!hasConflict) {
          availableSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
            available: true
          });
        }
      }

      return ResponseUtil.success(res, availableSlots, 'Available time slots retrieved successfully');
    } catch (error) {
      console.error('Get available time slots error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve available time slots', 500);
    }
  }
}

module.exports = BookingController;