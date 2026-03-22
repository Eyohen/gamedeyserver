'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sports', 'homeSessionPrice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('sports', 'homeSessionPrice');
  }
};
