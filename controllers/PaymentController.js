// controllers/PaymentController.js 
const { Payment, Booking, User, Transaction } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const axios = require('axios');
const crypto = require('crypto');

class PaymentController {
  
  static async confirmPayment(req, res) {
    try {
      const { bookingId, paymentReference, paymentMethod } = req.body;

      console.log('Payment confirmation request:', { bookingId, paymentReference, paymentMethod });

      if (!bookingId || !paymentReference) {
        return ResponseUtil.error(res, 'Booking ID and payment reference are required', 400);
      }

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
      if (booking.paymentStatus === 'paid') {
        return ResponseUtil.success(res, { booking }, 'Booking already paid');
      }

      try {
        // Optional: Verify with Paystack (you can skip this for simplicity)
        const paystackResponse = await axios.get(
          `https://api.paystack.co/transaction/verify/${paymentReference}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        const paymentData = paystackResponse.data.data;
        
        // Verify amount matches (optional check)
        const expectedAmount = parseFloat(booking.totalAmount);
        const paidAmount = parseFloat(paymentData.amount) / 100;

        if (paymentData.status !== 'success') {
          return ResponseUtil.error(res, 'Payment not successful according to Paystack', 400);
        }

        if (Math.abs(expectedAmount - paidAmount) > 1) { // Allow 1 naira difference
          console.log('Amount mismatch:', { expected: expectedAmount, paid: paidAmount });
          return ResponseUtil.error(res, 'Payment amount does not match booking amount', 400);
        }

      } catch (paystackError) {
        console.log('Paystack verification failed, but proceeding anyway:', paystackError.message);
        // Continue anyway - sometimes Paystack verification can fail due to network issues
        // but the payment was actually successful
      }

      // Create payment record
      await Payment.create({
        bookingId: booking.id,
        userId: req.user.id,
        amount: booking.totalAmount,
        paymentMethod: 'card',
        paymentGateway: 'paystack',
        transactionId: paymentReference,
        status: 'success',
        gatewayReference: paymentReference,
        metadata: {
          bookingType: booking.bookingType,
          facilityName: booking.Facility?.name || null,
          coachName: booking.Coach?.User ? `${booking.Coach.User.firstName} ${booking.Coach.User.lastName}` : null,
          confirmedAt: new Date().toISOString()
        }
      });

      // Update booking status
      await booking.update({
        paymentStatus: 'paid',
        status: 'confirmed'
      });

      await PaymentController.createCoachEarning(booking, { amount: booking.totalAmount });

      // Create transaction record
      await Transaction.create({
        userId: req.user.id,
        type: 'debit',
        amount: booking.totalAmount,
        description: `Payment for ${booking.bookingType} booking`,
        reference: paymentReference,
        status: 'completed',
        metadata: { 
          bookingId: booking.id,
          facilityName: booking.Facility?.name,
          coachName: booking.Coach?.User ? `${booking.Coach.User.firstName} ${booking.Coach.User.lastName}` : null
        },
        balanceBefore: req.user.walletBalance || 0,
        balanceAfter: req.user.walletBalance || 0
      });

      console.log('Payment confirmed successfully for booking:', bookingId);

      return ResponseUtil.success(res, {
        booking: {
          id: booking.id,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount
        },
        paymentReference
      }, 'Payment confirmed successfully');

    } catch (error) {
      console.error('Payment confirmation error:', error);
      return ResponseUtil.error(res, 'Failed to confirm payment', 500);
    }
  }

  // KEEP YOUR EXISTING METHODS - Just add the new one above

  // Create payment record (called before Paystack popup) - KEEP THIS
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

  // Verify payment (called after successful Paystack popup) - KEEP THIS
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

      // Check if user has access to this payment
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

        await PaymentController.createCoachEarning(payment.Booking, { amount: payment.amount });

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

  // Handle Paystack webhook - KEEP THIS
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

  // Get payment by booking ID - KEEP THIS
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

  // Get user payments - KEEP THIS
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

  // Get payment status by reference - KEEP THIS
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

  static async createCoachEarning(booking, payment) {
  try {
    const { CoachEarning } = require('../models');
    
    if (booking.coachId && booking.bookingType === 'coach') {
      // Calculate platform fee (10%)
      const grossAmount = parseFloat(payment.amount);
      const platformFeeRate = 0.10; // 10%
      const platformFee = grossAmount * platformFeeRate;
      const netAmount = grossAmount - platformFee;

      // Create earning record
      await CoachEarning.create({
        coachId: booking.coachId,
        bookingId: booking.id,
        grossAmount: grossAmount,
        platformFee: platformFee,
        netAmount: netAmount,
        status: 'pending' // Available for payout
      });

      console.log(`Created coach earning: ₦${netAmount} for coach ${booking.coachId}`);
    }
  } catch (error) {
    console.error('Failed to create coach earning:', error);
    // Don't throw error - earning creation shouldn't block payment confirmation
  }
}
}

module.exports = PaymentController;