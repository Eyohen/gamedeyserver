
// routes/booking.js
const express = require('express');
const { body, query, param } = require('express-validator');
const BookingController = require('../controllers/BookingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken('user'));

// Create booking
router.post('/', [
  body('bookingType').isIn(['facility', 'coach', 'both']).withMessage('Invalid booking type'),
  body('facilityId').optional().isUUID().withMessage('Facility ID must be a valid UUID'),
  body('coachId').optional().isUUID().withMessage('Coach ID must be a valid UUID'),
  body('startTime').isISO8601().withMessage('Start time must be a valid ISO date'),
  body('endTime').isISO8601().withMessage('End time must be a valid ISO date'),
  body('participantsCount').optional().isInt({ min: 1 }).withMessage('Participants count must be at least 1'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], BookingController.createBooking);

// Get booking by ID
router.get('/:bookingId', [
  param('bookingId').isUUID().withMessage('Booking ID must be a valid UUID')
], BookingController.getBookingById);

// Update booking status
router.patch('/:bookingId/status', [
  param('bookingId').isUUID().withMessage('Booking ID must be a valid UUID'),
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).withMessage('Invalid status'),
  body('cancellationReason').optional().isString().withMessage('Cancellation reason must be a string')
], BookingController.updateBookingStatus);

// Cancel booking
router.patch('/:bookingId/cancel', [
  param('bookingId').isUUID().withMessage('Booking ID must be a valid UUID'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], BookingController.cancelBooking);

// Get available time slots
router.get('/availability/slots', [
  query('facilityId').optional().isUUID().withMessage('Facility ID must be a valid UUID'),
  query('coachId').optional().isUUID().withMessage('Coach ID must be a valid UUID'),
  query('date').notEmpty().isISO8601().withMessage('Date is required and must be valid ISO date')
], BookingController.getAvailableTimeSlots);

module.exports = router;