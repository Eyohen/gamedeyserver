'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to users table for email verification and password reset
    await queryInterface.addColumn('users', 'emailVerificationToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'emailVerificationExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'resetPasswordToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'resetPasswordExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'resetPasswordOTP', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns if we need to rollback
    await queryInterface.removeColumn('users', 'emailVerificationToken');
    await queryInterface.removeColumn('users', 'emailVerificationExpires');
    await queryInterface.removeColumn('users', 'resetPasswordToken');
    await queryInterface.removeColumn('users', 'resetPasswordExpires');
    await queryInterface.removeColumn('users', 'resetPasswordOTP');
  }
};
