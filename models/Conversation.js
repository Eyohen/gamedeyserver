// models/Conversation.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Conversation extends Model {
    static associate(models) {
      // Association with Booking
      Conversation.belongsTo(models.Booking, {
        foreignKey: 'bookingId',
        as: 'booking'
      });

      // Association with User (the user who made the booking)
      Conversation.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      // Association with Coach (if booking includes coach)
      Conversation.belongsTo(models.Coach, {
        foreignKey: 'coachId',
        as: 'coach'
      });

      // Association with Facility (if booking includes facility)
      Conversation.belongsTo(models.Facility, {
        foreignKey: 'facilityId',
        as: 'facility'
      });
    }

    /**
     * Check if conversation is active
     */
    isActive() {
      return this.status === 'active';
    }

    /**
     * Check if user is a participant
     */
    isParticipant(userId) {
      return this.participants.some(p => p.userId === userId);
    }

    /**
     * Get the other participant (for user perspective)
     */
    getOtherParticipant(currentUserId) {
      if (this.conversationType === 'user_coach') {
        return currentUserId === this.userId ? 'coach' : 'user';
      } else if (this.conversationType === 'user_facility') {
        return currentUserId === this.userId ? 'facility' : 'user';
      }
      return null;
    }
  }

  Conversation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    papersignalRoomId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    conversationType: {
      type: DataTypes.ENUM('user_coach', 'user_facility', 'user_both'),
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    coachId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'coaches',
        key: 'id'
      }
    },
    facilityId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'facilities',
        key: 'id'
      }
    },
    participants: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    lastMessageAt: {
      type: DataTypes.DATE
    },
    lastMessagePreview: {
      type: DataTypes.TEXT
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'closed'),
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'conversations',
    indexes: [
      {
        fields: ['bookingId']
      },
      {
        unique: true,
        fields: ['papersignalRoomId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['coachId']
      },
      {
        fields: ['facilityId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['lastMessageAt']
      }
    ]
  });

  return Conversation;
};
