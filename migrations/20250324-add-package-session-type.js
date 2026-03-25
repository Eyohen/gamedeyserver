'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('session_packages', 'sessionType', {
      type: Sequelize.ENUM('facility', 'home'),
      defaultValue: 'facility'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('session_packages', 'sessionType');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_session_packages_sessionType";');
  }
};
