'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get users
    const users = await queryInterface.sequelize.query(
      `SELECT id, "firstName", "lastName" FROM users LIMIT 6`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const notifications = [];
    const notificationTypes = [
      'booking_confirmed',
      'booking_cancelled',
      'booking_completed',
      'payment_successful',
      'payment_failed',
      'review_received',
      'coach_approved',
      'facility_approved',
      'system_announcement',
      'booking_reminder'
    ];

    const notificationTemplates = {
      booking_confirmed: {
        title: 'Booking Confirmed!',
        message: 'Your sports facility booking has been confirmed. Get ready for your session!'
      },
      booking_cancelled: {
        title: 'Booking Cancelled',
        message: 'Your booking has been cancelled. If you didn\'t request this, please contact support.'
      },
      booking_completed: {
        title: 'Session Completed',
        message: 'Hope you had a great session! Don\'t forget to leave a review.'
      },
      payment_successful: {
        title: 'Payment Successful',
        message: 'Your payment has been processed successfully. Enjoy your booking!'
      },
      payment_failed: {
        title: 'Payment Failed',
        message: 'We couldn\'t process your payment. Please try again or contact support.'
      },
      review_received: {
        title: 'New Review Received',
        message: 'Someone left a review for your facility. Check it out!'
      },
      coach_approved: {
        title: 'Coach Application Approved',
        message: 'Congratulations! Your coach application has been approved.'
      },
      facility_approved: {
        title: 'Facility Approved',
        message: 'Your facility has been approved and is now live on GameDey!'
      },
      system_announcement: {
        title: 'System Update',
        message: 'We\'ve made some improvements to enhance your experience.'
      },
      booking_reminder: {
        title: 'Booking Reminder',
        message: 'Don\'t forget about your upcoming sports session tomorrow!'
      }
    };

    // Create 30 notifications
    for (let i = 0; i < 30; i++) {
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const template = notificationTemplates[type];
      const isRead = Math.random() > 0.4;
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000);

      const notification = {
        id: uuidv4(),
        userId,
        type,
        title: template.title,
        message: template.message,
        data: JSON.stringify({
          bookingId: uuidv4(),
          amount: Math.floor(Math.random() * 50000) + 10000,
          facilityName: 'Elite Sports Complex'
        }),
        isRead,
        readAt: isRead ? new Date(createdAt.getTime() + Math.floor(Math.random() * 86400000)) : null,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        expiresAt: type === 'booking_reminder' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
        createdAt,
        updatedAt: new Date()
      };

      notifications.push(notification);
    }

    await queryInterface.bulkInsert('notifications', notifications, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('notifications', null, {});
  }
};