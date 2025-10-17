// models/CoachEarning.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class CoachEarning extends Model {
    static associate(models) {
      CoachEarning.belongsTo(models.Coach, {
        foreignKey: 'coachId',
        as: 'Coach'
      });
      CoachEarning.belongsTo(models.Booking, {
        foreignKey: 'bookingId',
        as: 'Booking'
      });
    }

    isPending() {
      return this.status === 'pending';
    }

    isPaid() {
      return this.status === 'paid';
    }
  }

  CoachEarning.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    coachId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'coaches',
        key: 'id'
      }
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    grossAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    netAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed'),
      defaultValue: 'pending'
    },
    payoutDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paystackTransferCode: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'CoachEarning',
    tableName: 'coach_earnings'
  });

  return CoachEarning;
};
