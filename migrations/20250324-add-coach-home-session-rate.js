'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('coaches', 'homeSessionRate', {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('coaches', 'homeSessionRate');
  }
};
