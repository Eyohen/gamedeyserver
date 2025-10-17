// models/SessionPackage.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class SessionPackage extends Model {
    static associate(models) {
      SessionPackage.belongsTo(models.Sport, {
        foreignKey: 'sportId',
        as: 'Sport'
      });
      SessionPackage.belongsTo(models.Coach, {
        foreignKey: 'coachId',
        as: 'Coach',
        required: false
      });
      SessionPackage.belongsTo(models.Facility, {
        foreignKey: 'facilityId',
        as: 'Facility',
        required: false
      });
    }
  }

  SessionPackage.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sportId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sports',
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
    facilityId: {
      type: DataTypes.UUID,
      references: {
        model: 'facilities',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    numberOfSessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    pricePerSession: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    validityDays: {
      type: DataTypes.INTEGER,
      defaultValue: 90
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'SessionPackage',
    tableName: 'session_packages'
  });

  return SessionPackage;
};