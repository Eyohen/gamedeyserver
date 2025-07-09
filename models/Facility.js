
// models/Facility.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Facility extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    calculateAverageRating() {
      return this.averageRating || 0;
    }

    isOperational() {
      return this.status === 'active' && this.operatingHours;
    }

    isWithinOperatingHours() {
      const now = new Date();
      const currentHour = now.getHours();
      const dayOfWeek = now.getDay();
      
      if (this.operatingHours && this.operatingHours[dayOfWeek]) {
        const { open, close } = this.operatingHours[dayOfWeek];
        return currentHour >= open && currentHour < close;
      }
      return false;
    }
  }

  Facility.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    amenities: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    capacity: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1
      }
    },
    pricePerHour: {
      type: DataTypes.DECIMAL(8, 2),
      validate: {
        min: 0
      }
    },
    operatingHours: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    contactInfo: {
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
      type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'suspended'),
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
    images: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    rules: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'Facility',
    tableName: 'facilities'
  });

  return Facility;
};
