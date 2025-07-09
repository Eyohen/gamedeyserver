
// models/Comment.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Comment extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    isActive() {
      return this.status === 'active';
    }

    isFlagged() {
      return this.status === 'flagged';
    }
  }

  Comment.init({
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
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    parentId: {
      type: DataTypes.UUID,
      references: {
        model: 'comments',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1000]
      }
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    downvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    flagCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'hidden', 'flagged', 'deleted'),
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'Comment',
    tableName: 'comments'
  });

  return Comment;
};