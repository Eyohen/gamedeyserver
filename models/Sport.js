
// models/Sport.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Sport extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    isPopular() {
      return this.popularityScore >= 80;
    }
  }

  Sport.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    category: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['team', 'individual', 'racquet', 'water', 'combat', 'fitness', 'other']]
      }
    },
    icon: {
      type: DataTypes.STRING
    },
    image: {
      type: DataTypes.TEXT
    },
    popularityScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'Sport',
    tableName: 'sports'
  });

  return Sport;
};