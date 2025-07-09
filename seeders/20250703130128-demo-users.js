'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      // Regular users
      {
        id: uuidv4(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        phone: '+2348012345671',
        dateOfBirth: new Date('1995-06-15'),
        gender: 'male',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        location: JSON.stringify({
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          coordinates: { lat: 6.5244, lng: 3.3792 }
        }),
        preferences: JSON.stringify({
          sports: ['Football', 'Basketball'],
          notifications: true
        }),
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        walletBalance: 50000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: hashedPassword,
        phone: '+2348012345672',
        dateOfBirth: new Date('1992-08-22'),
        gender: 'female',
        profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b105?w=150',
        location: JSON.stringify({
          city: 'Abuja',
          state: 'FCT',
          country: 'Nigeria',
          coordinates: { lat: 9.0579, lng: 7.4951 }
        }),
        preferences: JSON.stringify({
          sports: ['Tennis', 'Swimming'],
          notifications: true
        }),
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        walletBalance: 75000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'michael.johnson@example.com',
        password: hashedPassword,
        phone: '+2348012345673',
        dateOfBirth: new Date('1988-12-10'),
        gender: 'male',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        location: JSON.stringify({
          city: 'Port Harcourt',
          state: 'Rivers',
          country: 'Nigeria',
          coordinates: { lat: 4.8156, lng: 7.0498 }
        }),
        preferences: JSON.stringify({
          sports: ['Football', 'Volleyball'],
          notifications: false
        }),
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
        walletBalance: 25000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Facility owners
      {
        id: uuidv4(),
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@example.com',
        password: hashedPassword,
        phone: '+2348012345674',
        dateOfBirth: new Date('1985-03-18'),
        gender: 'male',
        profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        location: JSON.stringify({
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          coordinates: { lat: 6.5244, lng: 3.3792 }
        }),
        preferences: JSON.stringify({
          sports: ['Football'],
          notifications: true
        }),
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        walletBalance: 100000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'Sarah',
        lastName: 'Davis',
        email: 'sarah.davis@example.com',
        password: hashedPassword,
        phone: '+2348012345675',
        dateOfBirth: new Date('1990-07-25'),
        gender: 'female',
        profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        location: JSON.stringify({
          city: 'Ibadan',
          state: 'Oyo',
          country: 'Nigeria',
          coordinates: { lat: 7.3775, lng: 3.9470 }
        }),
        preferences: JSON.stringify({
          sports: ['Tennis', 'Swimming'],
          notifications: true
        }),
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        walletBalance: 80000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Coach users
      {
        id: uuidv4(),
        firstName: 'Robert',
        lastName: 'Brown',
        email: 'robert.brown@example.com',
        password: hashedPassword,
        phone: '+2348012345676',
        dateOfBirth: new Date('1982-11-08'),
        gender: 'male',
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        location: JSON.stringify({
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          coordinates: { lat: 6.5244, lng: 3.3792 }
        }),
        preferences: JSON.stringify({
          sports: ['Football'],
          notifications: true
        }),
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        walletBalance: 60000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson@example.com',
        password: hashedPassword,
        phone: '+2348012345677',
        dateOfBirth: new Date('1987-04-12'),
        gender: 'female',
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        location: JSON.stringify({
          city: 'Abuja',
          state: 'FCT',
          country: 'Nigeria',
          coordinates: { lat: 9.0579, lng: 7.4951 }
        }),
        preferences: JSON.stringify({
          sports: ['Tennis', 'Fitness'],
          notifications: true
        }),
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        walletBalance: 45000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'Chris',
        lastName: 'Taylor',
        email: 'chris.taylor@example.com',
        password: hashedPassword,
        phone: '+2348012345678',
        dateOfBirth: new Date('1984-09-30'),
        gender: 'male',
        profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        location: JSON.stringify({
          city: 'Kano',
          state: 'Kano',
          country: 'Nigeria',
          coordinates: { lat: 12.0022, lng: 8.5920 }
        }),
        preferences: JSON.stringify({
          sports: ['Basketball', 'Volleyball'],
          notifications: true
        }),
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        walletBalance: 55000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};