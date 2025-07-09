
// models/Payment.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Payment extends Model {
    static associate(models) {
      // Associations defined in index.js
    }

    isSuccessful() {
      return this.status === 'success';
    }

    isPending() {
      return this.status === 'pending';
    }

    isFailed() {
      return this.status === 'failed';
    }

    isRefunded() {
      return this.status === 'refunded';
    }
  }

  Payment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'bank_transfer', 'wallet', 'ussd'),
      allowNull: false
    },
    paymentGateway: {
      type: DataTypes.ENUM('paystack', 'flutterwave'),
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING,
      unique: true
    },
    gatewayReference: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'cancelled', 'refunded'),
      defaultValue: 'pending'
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'NGN',
      validate: {
        len: [3, 3]
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    failureReason: {
      type: DataTypes.TEXT
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    refundedAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments'
  });

  return Payment;
};