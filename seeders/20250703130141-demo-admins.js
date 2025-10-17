'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 12);

    await queryInterface.bulkInsert('admins', [
      {
        id: uuidv4(),
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@gamedey.com',
        password: hashedPassword,
        role: 'super_admin',
        permissions: JSON.stringify(['all']),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'Admin',
        lastName: 'User',
        email: 'moderator@gamedey.com',
        password: hashedPassword,
        role: 'admin',
        permissions: JSON.stringify(['manage_users', 'manage_bookings', 'manage_facilities']),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('admins', null, {});
  }
};
