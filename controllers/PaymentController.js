// controllers/PaymentController.js - Updated for Frontend Integration
const { Payment, Booking, User, Transaction } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const axios = require('axios');
const crypto = require('crypto');

class PaymentController {
  // Create payment record (called before Paystack popup)
  static async createPaymentRecord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { bookingId, reference, amount } = req.body;

      // Find the booking
      const booking = await Booking.findByPk(bookingId, {
        include: [
          { model: User, as: 'User' },
          { model: require('../models').Facility, as: 'Facility' },
          { model: require('../models').Coach, as: 'Coach' }
        ]
      });

      if (!booking) {
        return ResponseUtil.error(res, 'Booking not found', 404);
      }

      // Check if user owns the booking
      if (booking.userId !== req.user.id) {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      // Check if booking is already paid
      const existingPayment = await Payment.findOne({
        where: { bookingId, status: 'success' }
      });

      if (existingPayment) {
        return ResponseUtil.error(res, 'Booking already paid for', 400);
      }

      // Create payment record
      const payment = await Payment.create({
        bookingId: booking.id,
        userId: req.user.id,
        amount: amount,
        paymentMethod: 'card',
        paymentGateway: 'paystack',
        transactionId: reference,
        status: 'pending',
        metadata: {
          bookingType: booking.bookingType,
          facilityName: booking.Facility?.name || null,
          coachName: booking.Coach?.User ? `${booking.Coach.User.firstName} ${booking.Coach.User.lastName}` : null
        }
      });

      return ResponseUtil.success(res, {
        payment,
        reference: reference
      }, 'Payment record created successfully', 201);

    } catch (error) {
      console.error('Create payment record error:', error);
      return ResponseUtil.error(res, 'Failed to create payment record', 500);
    }
  }

  // Verify payment (called after successful Paystack popup)
  static async verifyPayment(req, res) {
    try {
      const { reference, bookingId } = req.body;

      // Verify with Paystack
      const paystackResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      if (!paystackResponse.data.status) {
        return ResponseUtil.error(res, 'Payment verification failed', 400);
      }

      const paymentData = paystackResponse.data.data;

      // Find the payment record
      const payment = await Payment.findOne({
        where: { 
          transactionId: reference,
          bookingId: bookingId 
        },
        include: [
          { 
            model: Booking, 
            as: 'Booking',
            include: [
              { model: User, as: 'User' },
              { model: require('../models').Facility, as: 'Facility' },
              { model: require('../models').Coach, as: 'Coach' }
            ]
          }
        ]
      });

      if (!payment) {
        return ResponseUtil.error(res, 'Payment record not found', 404);
      }

      // Check if user owns this payment
      if (payment.userId !== req.user.id) {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      // Update payment status based on Paystack response
      if (paymentData.status === 'success') {
        await payment.update({
          status: 'success',
          gatewayReference: paymentData.reference,
          metadata: {
            ...payment.metadata,
            paystackData: paymentData
          }
        });

        // Update booking payment status
        await payment.Booking.update({
          paymentStatus: 'paid',
          status: 'confirmed'
        });

        // Create transaction record
        await Transaction.create({
          userId: payment.userId,
          type: 'debit',
          amount: payment.amount,
          description: `Payment for ${payment.Booking.bookingType} booking`,
          reference: reference,
          status: 'completed',
          metadata: { paymentId: payment.id, bookingId: payment.bookingId },
          balanceBefore: req.user.walletBalance || 0,
          balanceAfter: req.user.walletBalance || 0
        });

        return ResponseUtil.success(res, {
          payment,
          booking: payment.Booking,
          paymentData
        }, 'Payment verified successfully');

      } else {
        await payment.update({
          status: 'failed',
          failureReason: paymentData.gateway_response || 'Payment failed'
        });

        return ResponseUtil.error(res, 'Payment failed', 400);
      }

    } catch (error) {
      console.error('Verify payment error:', error);
      return ResponseUtil.error(res, 'Failed to verify payment', 500);
    }
  }

  // Handle Paystack webhook (optional, for additional verification)
  static async handleWebhook(req, res) {
    try {
      // Verify webhook signature
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash !== req.headers['x-paystack-signature']) {
        console.log('Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      console.log('Webhook event received:', event.event);

      if (event.event === 'charge.success') {
        const paymentData = event.data;
        console.log('Processing successful charge:', paymentData.reference);
        
        // Find payment record using the reference
        const payment = await Payment.findOne({
          where: { 
            transactionId: paymentData.reference
          },
          include: [{ model: Booking, as: 'Booking' }]
        });

        if (payment && payment.status === 'pending') {
          console.log('Updating payment status to success via webhook');
          
          // Update payment status
          await payment.update({
            status: 'success',
            gatewayReference: paymentData.reference,
            metadata: {
              ...payment.metadata,
              webhookData: paymentData
            }
          });

          // Update booking
          if (payment.Booking) {
            await payment.Booking.update({
              paymentStatus: 'paid',
              status: 'confirmed'
            });
          }

          console.log(`Payment confirmed via webhook: ${paymentData.reference}`);
        }
      }

      // Always return 200 OK to acknowledge receipt
      return res.status(200).json({ status: 'success' });

    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Get payment by booking ID
  static async getPaymentByBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const payment = await Payment.findOne({
        where: { bookingId },
        include: [
          {
            model: Booking,
            as: 'Booking',
            include: [
              { model: require('../models').Facility, as: 'Facility' },
              { model: require('../models').Coach, as: 'Coach' }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (!payment) {
        return ResponseUtil.error(res, 'Payment not found', 404);
      }

      // Check if user has access to this payment
      if (payment.userId !== req.user.id) {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      return ResponseUtil.success(res, payment, 'Payment retrieved successfully');

    } catch (error) {
      console.error('Get payment by booking error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve payment', 500);
    }
  }

  // Get user payments
  static async getUserPayments(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = { userId: req.user.id };
      if (status) {
        whereClause.status = status;
      }

      const { count, rows: payments } = await Payment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Booking,
            as: 'Booking',
            include: [
              { model: require('../models').Facility, as: 'Facility' },
              { model: require('../models').Coach, as: 'Coach' }
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

      return ResponseUtil.paginated(res, payments, pagination, 'Payments retrieved successfully');

    } catch (error) {
      console.error('Get user payments error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve payments', 500);
    }
  }

  // Get payment status by reference
  static async getPaymentStatus(req, res) {
    try {
      const { reference } = req.params;

      const payment = await Payment.findOne({
        where: { transactionId: reference },
        include: [
          {
            model: Booking,
            as: 'Booking'
          }
        ]
      });

      if (!payment) {
        return ResponseUtil.error(res, 'Payment not found', 404);
      }

      // Check if user has access to this payment
      if (payment.userId !== req.user.id) {
        return ResponseUtil.error(res, 'Access denied', 403);
      }

      return ResponseUtil.success(res, {
        status: payment.status,
        reference: payment.transactionId,
        amount: payment.amount,
        bookingId: payment.bookingId
      }, 'Payment status retrieved successfully');

    } catch (error) {
      console.error('Get payment status error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve payment status', 500);
    }
  }
}

module.exports = PaymentController;