
// models/Vote.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Vote extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    isUpvote() {
      return this.type === 'upvote';
    }

    isDownvote() {
      return this.type === 'downvote';
    }
  }

  Vote.init({
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
    postId: {
      type: DataTypes.UUID,
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    commentId: {
      type: DataTypes.UUID,
      references: {
        model: 'comments',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('upvote', 'downvote'),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Vote',
    tableName: 'votes',
    validate: {
      requirePostOrComment() {
        if (!this.postId && !this.commentId) {
          throw new Error('Vote must be for either a post or comment');
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['userId', 'postId'],
        where: {
          postId: { [sequelize.Sequelize.Op.ne]: null }
        }
      },
      {
        unique: true,
        fields: ['userId', 'commentId'],
        where: {
          commentId: { [sequelize.Sequelize.Op.ne]: null }
        }
      }
    ]
  });

  return Vote;
};