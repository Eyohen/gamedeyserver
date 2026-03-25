'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('admin_notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      type: {
        type: Sequelize.ENUM('new_player', 'new_coach', 'new_facility', 'new_booking', 'coach_verified', 'facility_verified'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('admin_notifications', ['isRead']);
    await queryInterface.addIndex('admin_notifications', ['createdAt']);
    await queryInterface.addIndex('admin_notifications', ['type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('admin_notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_admin_notifications_type";');
  }
};
