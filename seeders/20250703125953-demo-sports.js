'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const sports = [
      {
        id: uuidv4(),
        name: 'Football',
        description: 'The beautiful game played with feet and a round ball',
        category: 'team',
        icon: '⚽',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500',
        popularityScore: 95,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Basketball',
        description: 'Fast-paced game played with hands and an orange ball',
        category: 'team',
        icon: '🏀',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
        popularityScore: 90,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Tennis',
        description: 'Racquet sport played on a court with a net',
        category: 'racquet',
        icon: '🎾',
        image: 'https://images.unsplash.com/photo-1544717684-8e9a532ea0f1?w=500',
        popularityScore: 85,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Volleyball',
        description: 'Team sport with a high net and no hands allowed',
        category: 'team',
        icon: '🏐',
        image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=500',
        popularityScore: 80,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Swimming',
        description: 'Water sport focusing on speed and technique',
        category: 'water',
        icon: '🏊‍♂️',
        image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=500',
        popularityScore: 75,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Badminton',
        description: 'Racquet sport played with a shuttlecock',
        category: 'racquet',
        icon: '🏸',
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
        popularityScore: 70,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Table Tennis',
        description: 'Fast indoor racquet sport on a table',
        category: 'racquet',
        icon: '🏓',
        image: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=500',
        popularityScore: 65,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Fitness Training',
        description: 'General fitness and strength training',
        category: 'fitness',
        icon: '💪',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
        popularityScore: 88,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('sports', sports, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sports', null, {});
  }
};