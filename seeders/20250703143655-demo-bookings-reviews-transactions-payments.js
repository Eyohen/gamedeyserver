'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user, facility, and coach IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, "firstName", "lastName", email FROM users LIMIT 4`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const facilities = await queryInterface.sequelize.query(
      `SELECT id, name FROM facilities LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const coaches = await queryInterface.sequelize.query(
      `SELECT id FROM coaches LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create bookings
    const bookings = [];
    const reviews = [];
    const transactions = [];

    // Generate bookings for the past month
    for (let i = 0; i < 15; i++) {
      const bookingId = uuidv4();
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const isCoachBooking = Math.random() > 0.6;
      const isBothBooking = Math.random() > 0.8;
      
      let facilityId = null;
      let coachId = null;
      let bookingType = 'facility';
      let basePrice = 15000;

      if (isBothBooking) {
        facilityId = facilities[Math.floor(Math.random() * facilities.length)].id;
        coachId = coaches[Math.floor(Math.random() * coaches.length)].id;
        bookingType = 'both';
        basePrice = 30000;
      } else if (isCoachBooking) {
        coachId = coaches[Math.floor(Math.random() * coaches.length)].id;
        bookingType = 'coach';
        basePrice = 15000;
      } else {
        facilityId = facilities[Math.floor(Math.random() * facilities.length)].id;
        bookingType = 'facility';
        basePrice = 20000;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1); // Future dates
      startDate.setHours(8 + Math.floor(Math.random() * 10), 0, 0, 0); // 8 AM to 6 PM

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1 + Math.floor(Math.random() * 2)); // 1-3 hour sessions

      const duration = (endDate - startDate) / (1000 * 60 * 60);
      const totalAmount = basePrice * duration;

      const statuses = ['completed', 'confirmed', 'cancelled', 'pending'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentStatus = status === 'completed' || status === 'confirmed' ? 'paid' : 'pending';

      const booking = {
        id: bookingId,
        userId,
        facilityId,
        coachId,
        bookingType,
        startTime: startDate,
        endTime: endDate,
        totalAmount: totalAmount.toFixed(2),
        status,
        paymentStatus,
        participantsCount: 1 + Math.floor(Math.random() * 4),
        notes: `${bookingType} booking for sports training`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      bookings.push(booking);

      // Create transaction for paid bookings
      if (paymentStatus === 'paid') {
        transactions.push({
          id: uuidv4(),
          userId,
          type: 'debit',
          amount: totalAmount.toFixed(2),
          description: `Payment for ${bookingType} booking`,
          reference: `gamedey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'completed',
          metadata: JSON.stringify({ bookingId }),
          balanceBefore: 100000.00,
          balanceAfter: 100000.00 - totalAmount,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Create reviews for completed bookings
      if (status === 'completed' && Math.random() > 0.3) {
        const rating = 3 + Math.floor(Math.random() * 3); // 3-5 stars
        const reviewComments = [
          'Great experience! Highly recommend.',
          'Very professional service and clean facilities.',
          'Good value for money. Will book again.',
          'Excellent coaching and guidance throughout.',
          'Facilities were well-maintained and modern.',
          'Staff was helpful and accommodating.',
          'Perfect for training and practice sessions.'
        ];

        const review = {
          id: uuidv4(),
          userId,
          facilityId: facilityId,
          coachId: coachId,
          rating,
          title: rating >= 4 ? 'Excellent service!' : 'Good experience',
          comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
          images: JSON.stringify([]),
          status: 'active',
          helpfulCount: Math.floor(Math.random() * 10),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        reviews.push(review);
      }
    }

    // Insert bookings
    await queryInterface.bulkInsert('bookings', bookings, {});

    // Insert transactions
    await queryInterface.bulkInsert('transactions', transactions, {});

    // Insert reviews
    await queryInterface.bulkInsert('reviews', reviews, {});

    // Create some payments for completed bookings
    const completedBookings = bookings.filter(b => b.paymentStatus === 'paid');
    const payments = completedBookings.slice(0, 10).map(booking => ({
      id: uuidv4(),
      bookingId: booking.id,
      userId: booking.userId,
      amount: booking.totalAmount,
      paymentMethod: 'card',
      paymentGateway: 'paystack',
      transactionId: `gamedey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gatewayReference: `ref_${Math.random().toString(36).substr(2, 15)}`,
      status: 'success',
      currency: 'NGN',
      metadata: JSON.stringify({
        bookingType: booking.bookingType,
        paymentFor: 'Sports booking'
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('payments', payments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('payments', null, {});
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('bookings', null, {});
  }
};