// models/Team.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Team extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    getTotalGames() {
      return this.wins + this.losses + this.draws;
    }

    getWinRate() {
      const totalGames = this.getTotalGames();
      if (totalGames === 0) return 0;
      return Math.round((this.wins / totalGames) * 100);
    }

    isActive() {
      return this.status === 'active';
    }
  }

  Team.init({
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
      },
      comment: 'The user who created/owns this team'
    },
    sportId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'sports',
        key: 'id'
      },
      comment: 'The sport this team plays'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    formation: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Team formation like 4-4-2, Singles, Doubles, etc.'
    },
    coach: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Coach name for the team'
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Home venue for the team'
    },
    members: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of team member objects: [{id, name, role, avatar}]'
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    draws: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'disbanded'),
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional team information'
    }
  }, {
    sequelize,
    modelName: 'Team',
    tableName: 'teams',
    timestamps: true
  });

  return Team;
};
