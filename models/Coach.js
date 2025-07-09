
// models/Coach.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Coach extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    calculateAverageRating() {
      // This would be implemented with a database query
      return this.averageRating || 0;
    }

    isVerified() {
      return this.verificationStatus === 'verified';
    }

    isAvailable() {
      return this.status === 'active' && this.availability;
    }
  }

  Coach.init({
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
    bio: {
      type: DataTypes.TEXT
    },
    experience: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 50
      }
    },
    certifications: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    specialties: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(8, 2),
      validate: {
        min: 0
      }
    },
    availability: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
    },
    verificationDocuments: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalBookings: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    profileImage: {
      type: DataTypes.TEXT
    },
    galleryImages: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'Coach',
    tableName: 'coaches'
  });

  return Coach;
};