// models/AdminNotification.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class AdminNotification extends Model {
    static associate(models) {
      // No associations needed — admin notifications are global
    }
  }

  AdminNotification.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('new_player', 'new_coach', 'new_facility', 'new_booking', 'coach_verified', 'facility_verified'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'AdminNotification',
    tableName: 'admin_notifications',
    timestamps: true,
    indexes: [
      { fields: ['isRead'] },
      { fields: ['createdAt'] },
      { fields: ['type'] }
    ]
  });

  return AdminNotification;
};
