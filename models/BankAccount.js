// models/BankAccount.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class BankAccount extends Model {
    static associate(models) {
      // BankAccount belongs to a Coach
      BankAccount.belongsTo(models.Coach, {
        foreignKey: 'coachId',
        as: 'Coach'
      });
    }

    isVerified() {
      return this.verificationStatus === 'verified';
    }

    isPrimary() {
      return this.isPreferred === true;
    }
  }

  BankAccount.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    coachId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'coaches',
        key: 'id'
      }
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bankCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [10, 10] // Nigerian account numbers are 10 digits
      }
    },
    accountName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isPreferred: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'failed'),
      defaultValue: 'pending'
    },
    paystackRecipientCode: {
      type: DataTypes.STRING, // For Paystack transfer recipient
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'BankAccount',
    tableName: 'bank_accounts',
    indexes: [
      {
        unique: true,
        fields: ['coachId', 'accountNumber'] // Prevent duplicate accounts per coach
      }
    ]
  });

  return BankAccount;
};