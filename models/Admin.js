
// models/Admin.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class Admin extends Model {
    static associate(models) {
      // Associations if needed
    }

    async validatePassword(password) {
      return bcrypt.compare(password, this.password);
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }

    isSuperAdmin() {
      return this.role === 'super_admin';
    }

    hasPermission(permission) {
      return this.permissions.includes(permission) || this.isSuperAdmin();
    }
  }

  Admin.init({
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
        len: [8, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'moderator', 'super_admin'),
      defaultValue: 'admin'
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    lastLoginAt: {
      type: DataTypes.DATE
    },
    profileImage: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'Admin',
    tableName: 'admins',
    hooks: {
      beforeCreate: async (admin) => {
        if (admin.password) {
          admin.password = await bcrypt.hash(admin.password, 12);
        }
      },
      beforeUpdate: async (admin) => {
        if (admin.changed('password')) {
          admin.password = await bcrypt.hash(admin.password, 12);
        }
      }
    }
  });

  return Admin;
};