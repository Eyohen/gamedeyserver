'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get users and sports
    const users = await queryInterface.sequelize.query(
      `SELECT id, "firstName", "lastName" FROM users LIMIT 5`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const sports = await queryInterface.sequelize.query(
      `SELECT id, name FROM sports LIMIT 5`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create community posts
    const posts = [];
    const comments = [];
    const votes = [];
    const notifications = [];

    const postTitles = [
      'Looking for football teammates in Lagos!',
      'Best tennis courts in Abuja?',
      'Basketball training tips for beginners',
      'Swimming pool recommendations',
      'Volleyball league forming - join us!',
      'Great coach recommendations needed',
      'Best sports facilities with parking',
      'Weekend football match anyone?',
      'Tennis doubles partner wanted',
      'Gym buddy for strength training'
    ];

    const postContents = [
      'Hey everyone! I\'m looking to form a regular football team for weekend matches. We need about 6 more players. Anyone interested?',
      'Can anyone recommend good tennis courts in Abuja? Looking for something with proper lighting for evening games.',
      'Just started playing basketball and looking for some tips. Any experienced players willing to share advice?',
      'Planning to start swimming for fitness. Which pools in Lagos do you recommend for lap swimming?',
      'Starting a volleyball league! We meet every Saturday. Both beginners and experienced players welcome.',
      'Can anyone recommend a good football coach in the Lekki area? Looking for someone who works with adult beginners.',
      'What are the best sports facilities that have adequate parking? Tired of struggling to find parking spots.',
      'Anyone up for a casual football match this weekend? We have a field booked at Victory Sports Hub.',
      'Looking for a tennis doubles partner. I play at intermediate level and usually available weekday evenings.',
      'Starting a strength training routine and looking for a workout buddy. Anyone interested in morning sessions?'
    ];

    for (let i = 0; i < 10; i++) {
      const postId = uuidv4();
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const sportId = sports[Math.floor(Math.random() * sports.length)].id;
      
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 15)); // Past 15 days

      const post = {
        id: postId,
        userId,
        sportId,
        title: postTitles[i],
        content: postContents[i],
        type: ['discussion', 'question', 'tip'][Math.floor(Math.random() * 3)],
        tags: ['beginner', 'intermediate', 'advanced', 'weekend', 'training'][Math.floor(Math.random() * 5)],
        location: {
          city: ['Lagos', 'Abuja', 'Ibadan'][Math.floor(Math.random() * 3)],
          state: ['Lagos', 'FCT', 'Oyo'][Math.floor(Math.random() * 3)]
        },
        upvotes: Math.floor(Math.random() * 25),
        downvotes: Math.floor(Math.random() * 3),
        commentCount: Math.floor(Math.random() * 8),
        viewCount: Math.floor(Math.random() * 100) + 10,
        status: 'active',
        createdAt: createdDate,
        updatedAt: new Date()
      };

      posts.push(post);

      // Create comments for some posts
      const numComments = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < numComments; j++) {
        const commentUserId = users[Math.floor(Math.random() * users.length)].id;
        const commentDate = new Date(createdDate.getTime() + (j + 1) * 3600000); // 1 hour apart

        const commentTexts = [
          'Great idea! Count me in.',
          'I\'m interested. What time works for everyone?',
          'I know a good place for this. Let me know if you need details.',
          'Been looking for something like this too!',
          'I can help organize if needed.',
          'What skill level are you looking for?',
          'This sounds fun. How do I join?'
        ];

        comments.push({
          id: uuidv4(),
          userId: commentUserId,
          postId,
          content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          upvotes: Math.floor(Math.random() * 10),
          downvotes: Math.floor(Math.random() * 2),
          status: 'active',
          createdAt: commentDate,
          updatedAt: new Date()
        });
      }

      // Create votes for posts
      const votersCount = Math.floor(Math.random() * 8) + 2;
      for (let k = 0; k < votersCount; k++) {
        const voterUserId = users[Math.floor(Math.random() * users.length)].id;
        const voteType = Math.random() > 0.8 ? 'downvote' : 'upvote';

        votes.push({
          id: uuidv4(),
          userId: voterUserId,
          postId,
          type: voteType,
          createdAt: new Date(createdDate.getTime() + Math.random() * 86400000),
          updatedAt: new Date()
        });
      }
    }

    // Create notifications for users
    const notificationTypes = [
      'booking_confirmed',
      'booking_cancelled', 
      'payment_successful',
      'review_received',
      'system_announcement'
    ];

    const notificationTitles = {
      booking_confirmed: 'Booking Confirmed',
      booking_cancelled: 'Booking Cancelled',
      payment_successful: 'Payment Successful',
      review_received: 'New Review',
      system_announcement: 'System Update'
    };

    const notificationMessages = {
      booking_confirmed: 'Your sports facility booking has been confirmed.',
      booking_cancelled: 'Your booking has been cancelled as requested.',
      payment_successful: 'Your payment has been processed successfully.',
      review_received: 'You have received a new review for your service.',
      system_announcement: 'System maintenance scheduled for this weekend.'
    };

    for (let i = 0; i < 20; i++) {
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 7)); // Past week

      notifications.push({
        id: uuidv4(),
        userId,
        type,
        title: notificationTitles[type],
        message: notificationMessages[type],
        data: {
          bookingId: type.includes('booking') ? uuidv4() : null,
          amount: type === 'payment_successful' ? '25000' : null
        },
        isRead: Math.random() > 0.4, // 60% read rate
        readAt: Math.random() > 0.4 ? new Date() : null,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        createdAt: createdDate,
        updatedAt: new Date()
      });
    }

    // Insert all data
    await queryInterface.bulkInsert('posts', posts, {});
    await queryInterface.bulkInsert('comments', comments, {});
    await queryInterface.bulkInsert('votes', votes, {});
    await queryInterface.bulkInsert('notifications', notifications, {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('votes', null, {});
    await queryInterface.bulkDelete('comments', null, {});
    await queryInterface.bulkDelete('posts', null, {});
  }
};