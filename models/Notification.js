// models/Notification.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    markAsRead() {
      return this.update({
        isRead: true,
        readAt: new Date()
      });
    }

    isUnread() {
      return !this.isRead;
    }
  }

  Notification.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'booking_confirmed',
        'booking_cancelled',
        'booking_completed',
        'payment_successful',
        'payment_failed',
        'review_received',
        'coach_approved',
        'facility_approved',
        'system_announcement',
        'booking_reminder'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 500]
      }
    },
    data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    expiresAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    indexes: [
      {
        fields: ['userId', 'isRead']
      },
      {
        fields: ['userId', 'createdAt']
      },
      {
        fields: ['type']
      }
    ]
  });

  return Notification;
};