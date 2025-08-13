
// // models/Post.js
// const { DataTypes, Model } = require('sequelize');

// module.exports = (sequelize) => {
//   class Post extends Model {
//     static associate(models) {
//       // Associations defined in index.js
//     }

//     isActive() {
//       return this.status === 'active';
//     }

//     isFlagged() {
//       return this.status === 'flagged';
//     }

//     getVoteScore() {
//       return this.upvotes - this.downvotes;
//     }

//     shouldBeAutoHidden() {
//       return this.flagCount >= 3;
//     }
//   }

//   Post.init({
//     id: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true
//     },
//     userId: {
//       type: DataTypes.UUID,
//       allowNull: false,
//       references: {
//         model: 'users',
//         key: 'id'
//       }
//     },
//     sportId: {
//       type: DataTypes.UUID,
//       references: {
//         model: 'sports',
//         key: 'id'
//       }
//     },
//     title: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       validate: {
//         notEmpty: true,
//         len: [5, 200]
//       }
//     },
//     content: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//       validate: {
//         notEmpty: true,
//         len: [10, 5000]
//       }
//     },
//     type: {
//       type: DataTypes.ENUM('discussion', 'question', 'tip', 'event', 'review'),
//       defaultValue: 'discussion'
//     },
//     tags: {
//       type: DataTypes.JSONB,
//       defaultValue: []
//     },
//     location: {
//       type: DataTypes.JSONB
//     },
//     images: {
//       type: DataTypes.JSONB,
//       defaultValue: []
//     },
//     upvotes: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0
//     },
//     downvotes: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0
//     },
//     commentCount: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0
//     },
//     viewCount: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0
//     },
//     flagCount: {
//       type: DataTypes.INTEGER,
//       defaultValue: 0
//     },
//     status: {
//       type: DataTypes.ENUM('active', 'hidden', 'flagged', 'deleted'),
//       defaultValue: 'active'
//     },
//     isSticky: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false
//     },
//     isFeatured: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false
//     }
//   }, {
//     sequelize,
//     modelName: 'Post',
//     tableName: 'posts'
//   });

//   return Post;
// };




// models/Post.js - FIXED with 'pending' status
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Post extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    isActive() {
      return this.status === 'active';
    }

    isFlagged() {
      return this.status === 'flagged';
    }

    isPending() {
      return this.status === 'pending';
    }

    isRejected() {
      return this.status === 'rejected';
    }

    getVoteScore() {
      return this.upvotes - this.downvotes;
    }

    shouldBeAutoHidden() {
      return this.flagCount >= 3;
    }
  }

  Post.init({
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
    sportId: {
      type: DataTypes.UUID,
      references: {
        model: 'sports',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200] // ✅ Also fixed validation to match routes
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 5000] // ✅ Also fixed validation to match routes
      }
    },
    type: {
      type: DataTypes.ENUM('discussion', 'question', 'tip', 'event', 'review'),
      defaultValue: 'discussion'
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    location: {
      type: DataTypes.JSONB
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    downvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    commentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    flagCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // ✅ FIXED: Added 'pending' and 'rejected' to the enum
    status: {
      type: DataTypes.ENUM('pending', 'active', 'hidden', 'flagged', 'deleted', 'rejected'),
      defaultValue: 'pending' // ✅ Changed default to 'pending' for moderation workflow
    },
    isSticky: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // ✅ ADDED: Moderation fields
    moderationStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    moderationReason: {
      type: DataTypes.TEXT
    },
    moderatedAt: {
      type: DataTypes.DATE
    },
    moderatedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Post',
    tableName: 'posts'
  });

  return Post;
};