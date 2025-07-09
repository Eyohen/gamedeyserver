'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get users and sports
    const users = await queryInterface.sequelize.query(
      `SELECT id, "firstName", "lastName" FROM users LIMIT 6`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const sports = await queryInterface.sequelize.query(
      `SELECT id, name FROM sports LIMIT 5`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const posts = [];
    const comments = [];
    const votes = [];

    // Create posts
    const postTitles = [
      'Best football training tips for beginners',
      'Looking for tennis partners in Lagos',
      'Review: Elite Sports Complex experience',
      'How to improve your basketball shooting',
      'Swimming techniques for better performance',
      'Volleyball team formation strategies',
      'Equipment recommendations for new players',
      'Local sports events this weekend',
      'Fitness training schedule advice',
      'Coach recommendations needed'
    ];

    const postContents = [
      'I\'ve been training for a few months now and wanted to share some tips that really helped me improve my game. Focus on the basics first...',
      'Anyone interested in playing tennis regularly? I\'m looking for partners around my skill level for weekend games...',
      'Just had an amazing session at Elite Sports Complex. The facilities are top-notch and the staff is very professional...',
      'Struggling with my shooting consistency. Any coaches or experienced players have advice on proper form and practice routines?',
      'Been working on my swimming technique lately. Here are some drills that have helped me improve my speed and endurance...',
      'Our team has been experimenting with different formations. What works best for your team in competitive matches?',
      'New to the sport and overwhelmed by equipment choices. What are the must-have items for someone just starting out?',
      'There are several sports events happening this weekend around Lagos. Here\'s what I found and my recommendations...',
      'Looking to create a balanced training schedule that covers strength, cardio, and skill development. Any suggestions?',
      'Can anyone recommend a good coach in the Abuja area? Preferably someone with experience in competitive training...'
    ];

    // Create 10 posts
    for (let i = 0; i < 10; i++) {
      const postId = uuidv4();
      const userId = users[Math.floor(Math.random() * users.length)].id;
      const sportId = sports[Math.floor(Math.random() * sports.length)].id;
      const types = ['discussion', 'question', 'tip', 'event', 'review'];
      const postType = types[Math.floor(Math.random() * types.length)];

      const post = {
        id: postId,
        userId,
        sportId,
        title: postTitles[i],
        content: postContents[i],
        type: postType,
        tags: JSON.stringify(['sports', 'training', 'community']),
        location: JSON.stringify({
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria'
        }),
        images: JSON.stringify([]),
        upvotes: Math.floor(Math.random() * 20),
        downvotes: Math.floor(Math.random() * 5),
        commentCount: Math.floor(Math.random() * 8),
        viewCount: Math.floor(Math.random() * 100) + 10,
        flagCount: 0,
        status: 'active',
        isSticky: Math.random() > 0.9,
        isFeatured: Math.random() > 0.8,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };

      posts.push(post);

      // Create comments for each post
      const commentCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < commentCount; j++) {
        const commentId = uuidv4();
        const commentUserId = users[Math.floor(Math.random() * users.length)].id;
        
        const commentTexts = [
          'Great post! Really helpful information.',
          'I agree with your points. Thanks for sharing.',
          'This is exactly what I was looking for.',
          'Has anyone else tried this approach?',
          'Would love to hear more about your experience.',
          'I had a similar experience at that facility.',
          'Thanks for the detailed explanation.',
          'Any updates on this situation?'
        ];

        const comment = {
          id: commentId,
          userId: commentUserId,
          postId: postId,
          parentId: null,
          content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          upvotes: Math.floor(Math.random() * 10),
          downvotes: Math.floor(Math.random() * 3),
          flagCount: 0,
          status: 'active',
          createdAt: new Date(post.createdAt.getTime() + Math.floor(Math.random() * 86400000)),
          updatedAt: new Date()
        };

        comments.push(comment);
      }
    }

    // Create some votes (avoiding duplicates by using different users for different posts)
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const voteType = Math.random() > 0.2 ? 'upvote' : 'downvote';
      const voteUserId = users[i % users.length].id; // Different user for each post
      
      // Vote on post
      votes.push({
        id: uuidv4(),
        userId: voteUserId,
        postId: post.id,
        commentId: null,
        type: voteType,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Insert all data
    await queryInterface.bulkInsert('posts', posts, {});
    await queryInterface.bulkInsert('comments', comments, {});
    await queryInterface.bulkInsert('votes', votes, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('votes', null, {});
    await queryInterface.bulkDelete('comments', null, {});
    await queryInterface.bulkDelete('posts', null, {});
  }
};