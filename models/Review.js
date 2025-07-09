
// models/Review.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Review extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    isPositive() {
      return this.rating >= 4;
    }

    isNegative() {
      return this.rating <= 2;
    }
  }

  Review.init({
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    title: {
      type: DataTypes.STRING,
      validate: {
        len: [3, 100]
      }
    },
    comment: {
      type: DataTypes.TEXT
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'hidden', 'flagged'),
      defaultValue: 'active'
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    validate: {
      requireFacilityOrCoach() {
        if (!this.facilityId && !this.coachId) {
          throw new Error('Review must be for either a facility or coach');
        }
      }
    }
  });

  return Review;
};