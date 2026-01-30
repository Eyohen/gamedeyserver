'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to coaches table for certificate image, location, and profile visibility
    await queryInterface.addColumn('coaches', 'certificateImage', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('coaches', 'country', {
      type: Sequelize.STRING,
      defaultValue: 'Nigeria'
    });

    await queryInterface.addColumn('coaches', 'state', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('coaches', 'profileVisible', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns if we need to rollback
    await queryInterface.removeColumn('coaches', 'certificateImage');
    await queryInterface.removeColumn('coaches', 'country');
    await queryInterface.removeColumn('coaches', 'state');
    await queryInterface.removeColumn('coaches', 'profileVisible');
  }
};
