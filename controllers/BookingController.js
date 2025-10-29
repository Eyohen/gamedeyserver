
// controllers/BookingController.js
const { Booking, User, Coach, Facility, Payment, Notification, Sport, SessionPackage } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const emailService = require('../utils/emailService');
const ChatController = require('./ChatController');

class BookingController {
  // Create a new booking
  // static async createBooking(req, res) {
  //   try {
  //     const errors = validationResult(req);
  //     if (!errors.isEmpty()) {
  //       return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
  //     }

  //     const {
  //       facilityId,
  //       coachId,
  //       bookingType,
  //       startTime,
  //       endTime,
  //       participantsCount,
  //       notes
  //     } = req.body;

  //     // Validate booking type
  //     if (!['facility', 'coach', 'both'].includes(bookingType)) {
  //       return ResponseUtil.error(res, 'Invalid booking type', 400);
  //     }

  //     // Validate that facility or coach is provided based on booking type
  //     if (bookingType === 'facility' && !facilityId) {
  //       return ResponseUtil.error(res, 'Facility ID is required for facility booking', 400);
  //     }
  //     if (bookingType === 'coach' && !coachId) {
  //       return ResponseUtil.error(res, 'Coach ID is required for coach booking', 400);
  //     }
  //     if (bookingType === 'both' && (!facilityId || !coachId)) {
  //       return ResponseUtil.error(res, 'Both facility and coach IDs are required', 400);
  //     }

  //     // Check if facility exists and is available
  //     let facility = null;
  //     if (facilityId) {
  //       facility = await Facility.findByPk(facilityId);
  //       if (!facility) {
  //         return ResponseUtil.error(res, 'Facility not found', 404);
  //       }
  //       if (facility.status !== 'active') {
  //         return ResponseUtil.error(res, 'Facility is not available', 400);
  //       }
  //     }

  //     // Check if coach exists and is available
  //     let coach = null;
  //     if (coachId) {
  //       coach = await Coach.findByPk(coachId);
  //       if (!coach) {
  //         return ResponseUtil.error(res, 'Coach not found', 404);
  //       }
  //       if (coach.status !== 'active') {
  //         return ResponseUtil.error(res, 'Coach is not available', 400);
  //       }
  //     }

  //     // Check for time conflicts
  //     const conflictingBookings = await Booking.count({
  //       where: {
  //         [Op.or]: [
  //           facilityId ? { facilityId } : {},
  //           coachId ? { coachId } : {}
  //         ],
  //         status: { [Op.in]: ['pending', 'confirmed'] },
  //         [Op.or]: [
  //           {
  //             startTime: { [Op.between]: [startTime, endTime] }
  //           },
  //           {
  //             endTime: { [Op.between]: [startTime, endTime] }
  //           },
  //           {
  //             [Op.and]: [
  //               { startTime: { [Op.lte]: startTime } },
  //               { endTime: { [Op.gte]: endTime } }
  //             ]
  //           }
  //         ]
  //       }
  //     });

  //     if (conflictingBookings > 0) {
  //       return ResponseUtil.error(res, 'Time slot is not available', 409);
  //     }

  //     // Calculate total amount
  //     const startDate = new Date(startTime);
  //     const endDate = new Date(endTime);
  //     const durationHours = (endDate - startDate) / (1000 * 60 * 60);
      
  //     let totalAmount = 0;
  //     if (facility) {
  //       totalAmount += parseFloat(facility.pricePerHour) * durationHours;
  //     }
  //     if (coach) {
  //       totalAmount += parseFloat(coach.hourlyRate) * durationHours;
  //     }

  //     // Create booking
  //     const booking = await Booking.create({
  //       userId: req.user.id,
  //       facilityId: facilityId || null,
  //       coachId: coachId || null,
  //       bookingType,
  //       startTime,
  //       endTime,
  //       totalAmount,
  //       participantsCount: participantsCount || 1,
  //       notes: notes || null
  //     });

  //     // Include related data in response
  //     const createdBooking = await Booking.findByPk(booking.id, {
  //       include: [
  //         { model: Facility, as: 'Facility' },
  //         { model: Coach, as: 'Coach', include: [{ model: User, as: 'User' }] }
  //       ]
  //     });

  //     return ResponseUtil.success(res, createdBooking, 'Booking created successfully', 201);
  //   } catch (error) {
  //     console.error('Create booking error:', error);
  //     return ResponseUtil.error(res, 'Failed to create booking', 500);
  //   }
  // }
  // In controllers/BookingController.js - update createBooking method
static async createBooking(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
    }

    const {
      facilityId,
      coachId,
      sportId, // NEW: Required
      packageId, // NEW: Optional
      bookingType,
      startTime,
      endTime,
      participantsCount,
      notes
    } = req.body;

    // Validate sport exists
    const sport = await Sport.findByPk(sportId);
    if (!sport) {
      return ResponseUtil.error(res, 'Sport not found', 404);
    }

    // Validate booking type - now we support 'both' as primary option
    if (!['facility', 'coach', 'both'].includes(bookingType)) {
      return ResponseUtil.error(res, 'Invalid booking type', 400);
    }

    // NEW: For 'both' type, require both facility and coach
    if (bookingType === 'both' && (!facilityId || !coachId)) {
      return ResponseUtil.error(res, 'Both facility and coach are required for combined booking', 400);
    }

    if (bookingType === 'facility' && !facilityId) {
      return ResponseUtil.error(res, 'Facility ID is required for facility booking', 400);
    }
    if (bookingType === 'coach' && !coachId) {
      return ResponseUtil.error(res, 'Coach ID is required for coach booking', 400);
    }

    // Check if facility exists, is available, and offers the sport
    let facility = null;
    if (facilityId) {
      facility = await Facility.findByPk(facilityId, {
        include: [{
          model: Sport,
          as: 'Sports',
          where: { id: sportId },
          required: true
        }]
      });
      
      if (!facility) {
        return ResponseUtil.error(res, 'Facility not found or does not offer this sport', 404);
      }
      if (facility.status !== 'active') {
        return ResponseUtil.error(res, 'Facility is not available', 400);
      }
    }

    // Check if coach exists, is available, and offers the sport
    let coach = null;
    if (coachId) {
      coach = await Coach.findByPk(coachId, {
        include: [{
          model: Sport,
          as: 'Sports',
          where: { id: sportId },
          required: true
        }]
      });
      
      if (!coach) {
        return ResponseUtil.error(res, 'Coach not found or does not offer this sport', 404);
      }
      if (coach.status !== 'active') {
        return ResponseUtil.error(res, 'Coach is not available', 400);
      }
    }

    // Check for time conflicts (both facility AND coach must be available)
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
      return ResponseUtil.error(res, 'Time slot is not available for selected facility/coach', 409);
    }

    // Calculate subtotal (before service fee)
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);

    let subtotal = 0;

    // If package is selected, use package pricing
    if (packageId) {
      const sessionPackage = await SessionPackage.findByPk(packageId);
      if (!sessionPackage) {
        return ResponseUtil.error(res, 'Package not found', 404);
      }
      subtotal = parseFloat(sessionPackage.pricePerSession);
    } else {
      // Calculate based on hourly rates
      if (facility) {
        subtotal += parseFloat(facility.pricePerHour) * durationHours;
      }
      if (coach) {
        subtotal += parseFloat(coach.hourlyRate) * durationHours;
      }
    }

    // Calculate service fee (7.5% of subtotal)
    const serviceFeePercentage = 0.075; // 7.5%
    const serviceFee = parseFloat((subtotal * serviceFeePercentage).toFixed(2));

    // Calculate total amount (subtotal + service fee)
    const totalAmount = parseFloat((subtotal + serviceFee).toFixed(2));

    // Create booking
    const booking = await Booking.create({
      userId: req.user.id,
      facilityId: facilityId || null,
      coachId: coachId || null,
      sportId: sportId,
      packageId: packageId || null,
      bookingType,
      startTime,
      endTime,
      subtotal,
      serviceFee,
      totalAmount,
      participantsCount: participantsCount || 1,
      notes: notes || null
    });

    // Include related data in response
    const createdBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: Facility, as: 'Facility' },
        { model: Coach, as: 'Coach', include: [{ model: User, as: 'User' }] },
        { model: Sport, as: 'Sport' },
        { model: SessionPackage, as: 'Package' },
        { model: User, as: 'User' }
      ]
    });

    // Send booking confirmation email if booking is auto-confirmed
    if (createdBooking.status === 'confirmed' && createdBooking.User) {
      try {
        const bookingName = createdBooking.bookingType === 'facility'
          ? createdBooking.Facility?.name
          : createdBooking.bookingType === 'coach'
          ? `${createdBooking.Coach?.User?.firstName} ${createdBooking.Coach?.User?.lastName}`
          : `${createdBooking.Facility?.name} with ${createdBooking.Coach?.User?.firstName} ${createdBooking.Coach?.User?.lastName}`;

        const startDate = new Date(createdBooking.startTime);
        const durationMs = new Date(createdBooking.endTime) - startDate;
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const durationStr = `${durationHours}h ${durationMinutes}m`;

        await emailService.sendBookingConfirmationEmail(
          createdBooking.User.email,
          {
            firstName: createdBooking.User.firstName,
            lastName: createdBooking.User.lastName
          },
          {
            id: createdBooking.id,
            name: bookingName,
            type: createdBooking.bookingType,
            date: startDate,
            time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            duration: durationStr,
            subtotal: createdBooking.subtotal,
            serviceFee: createdBooking.serviceFee,
            amount: createdBooking.totalAmount,
            currency: 'NGN'
          }
        );
        console.log('📧 Booking confirmation email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send booking confirmation email:', emailError);
        // Don't fail the booking if email fails
      }

      // Create conversation for chat when booking is auto-confirmed
      try {
        const conversation = await ChatController.createConversationForBooking(createdBooking.id);
        console.log('💬 Chat conversation created successfully:', conversation.id);
      } catch (chatError) {
        console.error('❌ Failed to create chat conversation:', chatError);
        // Don't fail the booking if chat creation fails
      }
    }

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

      // Send booking confirmation email if status changed to 'confirmed'
      if (status === 'confirmed') {
        try {
          const user = await User.findByPk(booking.userId);
          if (user) {
            const bookingName = booking.bookingType === 'facility'
              ? booking.Facility?.name
              : booking.bookingType === 'coach'
              ? `${booking.Coach?.User?.firstName} ${booking.Coach?.User?.lastName}`
              : `${booking.Facility?.name} with Coach`;

            const startDate = new Date(booking.startTime);
            const durationMs = new Date(booking.endTime) - startDate;
            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            const durationStr = `${durationHours}h ${durationMinutes}m`;

            await emailService.sendBookingConfirmationEmail(
              user.email,
              { firstName: user.firstName, lastName: user.lastName },
              {
                id: booking.id,
                name: bookingName,
                type: booking.bookingType,
                date: startDate,
                time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                duration: durationStr,
                subtotal: booking.subtotal,
                serviceFee: booking.serviceFee,
                amount: booking.totalAmount,
                currency: 'NGN'
              }
            );
            console.log('📧 Booking confirmation email sent successfully');
          }
        } catch (emailError) {
          console.error('❌ Failed to send booking confirmation email:', emailError);
          // Don't fail the status update if email fails
        }

        // Create conversation for chat when booking is confirmed
        try {
          const conversation = await ChatController.createConversationForBooking(booking.id);
          console.log('💬 Chat conversation created successfully:', conversation.id);
        } catch (chatError) {
          console.error('❌ Failed to create chat conversation:', chatError);
          // Don't fail the status update if chat creation fails
        }
      }

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


// Check availability for multiple dates (for calendar view)
  static async getAvailabilityCalendar(req, res) {
    try {
      const { facilityId, coachId, startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return ResponseUtil.error(res, 'Start date and end date are required', 400);
      }

      if (!facilityId && !coachId) {
        return ResponseUtil.error(res, 'Either facilityId or coachId is required', 400);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Build where clause for bookings
      let whereClause = {
        status: { [Op.in]: ['pending', 'confirmed'] },
        startTime: { [Op.between]: [start, end] }
      };

      if (facilityId) {
        whereClause.facilityId = facilityId;
      }
      if (coachId) {
        whereClause.coachId = coachId;
      }

      // Get all confirmed/pending bookings in the date range
      const bookings = await Booking.findAll({
        where: whereClause,
        attributes: ['startTime', 'endTime'],
        order: [['startTime', 'ASC']]
      });

      // Create array of unavailable dates
      const unavailableDates = [];
      const processedDates = new Set();

      bookings.forEach(booking => {
        const bookingDate = new Date(booking.startTime).toISOString().split('T')[0];
        if (!processedDates.has(bookingDate)) {
          unavailableDates.push(bookingDate);
          processedDates.add(bookingDate);
        }
      });

      return ResponseUtil.success(res, {
        unavailableDates,
        dateRange: { startDate, endDate }
      }, 'Availability calendar retrieved successfully');

    } catch (error) {
      console.error('Get availability calendar error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve availability calendar', 500);
    }
  }

  // Check specific date availability with time slots
  static async getDateAvailability(req, res) {
    try {
      const { facilityId, coachId, date } = req.query;

      if (!date) {
        return ResponseUtil.error(res, 'Date is required', 400);
      }

      if (!facilityId && !coachId) {
        return ResponseUtil.error(res, 'Either facilityId or coachId is required', 400);
      }

      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Build where clause
      let whereClause = {
        status: { [Op.in]: ['pending', 'confirmed'] },
        startTime: { [Op.between]: [startOfDay, endOfDay] }
      };

      if (facilityId) {
        whereClause.facilityId = facilityId;
      }
      if (coachId) {
        whereClause.coachId = coachId;
      }

      // Get all bookings for this specific date
      const bookings = await Booking.findAll({
        where: whereClause,
        attributes: ['startTime', 'endTime'],
        order: [['startTime', 'ASC']]
      });

      // Convert bookings to unavailable time slots
      const unavailableSlots = bookings.map(booking => ({
        start: booking.startTime,
        end: booking.endTime
      }));

      return ResponseUtil.success(res, {
        date,
        unavailableSlots,
        isFullyBooked: bookings.length > 0
      }, 'Date availability retrieved successfully');

    } catch (error) {
      console.error('Get date availability error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve date availability', 500);
    }
  }



}

module.exports = BookingController;