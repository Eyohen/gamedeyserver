// models/User.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    async validatePassword(password) {
      return bcrypt.compare(password, this.password);
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }

    getFullName() {
      return `${this.firstName} ${this.lastName}`;
    }

    isActive() {
      return this.status === 'active';
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    phone: {
      type: DataTypes.STRING,
      validate: {
        is: /^[+]?[\d\s\-()]+$/
      }
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString()
      }
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      defaultValue: 'other'
    },
    profileImage: {
      type: DataTypes.TEXT
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLoginAt: {
      type: DataTypes.DATE
    },
    walletBalance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetPasswordOTP: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  return User;
};