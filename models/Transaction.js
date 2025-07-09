
// models/Transaction.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Transaction extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    isCredit() {
      return this.type === 'credit';
    }

    isDebit() {
      return this.type === 'debit';
    }

    isCompleted() {
      return this.status === 'completed';
    }

    isPending() {
      return this.status === 'pending';
    }

    isFailed() {
      return this.status === 'failed';
    }
  }

  Transaction.init({
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
    type: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    reference: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      defaultValue: 'pending'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions'
  });

  return Transaction;
};