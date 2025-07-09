
// models/Booking.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Booking extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    isPending() {
      return this.status === 'pending';
    }

    isConfirmed() {
      return this.status === 'confirmed';
    }

    isCancelled() {
      return this.status === 'cancelled';
    }

    isCompleted() {
      return this.status === 'completed';
    }

    canBeCancelled() {
      const now = new Date();
      const bookingDate = new Date(this.startTime);
      const hoursDifference = (bookingDate - now) / (1000 * 60 * 60);
      return hoursDifference >= 24 && !this.isCancelled() && !this.isCompleted();
    }

    calculateDuration() {
      const start = new Date(this.startTime);
      const end = new Date(this.endTime);
      return (end - start) / (1000 * 60 * 60); // Duration in hours
    }
  }

  Booking.init({
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
    facilityId: {
      type: DataTypes.UUID,
      references: {
        model: 'facilities',
        key: 'id'
      }
    },
    coachId: {
      type: DataTypes.UUID,
      references: {
        model: 'coaches',
        key: 'id'
      }
    },
    bookingType: {
      type: DataTypes.ENUM('facility', 'coach', 'both'),
      allowNull: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString()
      }
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    },
    participantsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    cancellationReason: {
      type: DataTypes.TEXT
    },
    cancelledBy: {
      type: DataTypes.ENUM('user', 'coach', 'facility', 'admin')
    },
    cancelledAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    validate: {
      endTimeAfterStartTime() {
        if (this.endTime <= this.startTime) {
          throw new Error('End time must be after start time');
        }
      },
      requireFacilityOrCoach() {
        if (!this.facilityId && !this.coachId) {
          throw new Error('Booking must have either a facility or coach');
        }
      }
    }
  });

  return Booking;
};