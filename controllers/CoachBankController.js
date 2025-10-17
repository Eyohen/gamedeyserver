

//controllers/CoachBankController.js
const { BankAccount, CoachEarning, Coach, Booking } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const axios = require('axios');

class CoachBankController {

  // Get all bank accounts for a coach
  static async getBankAccounts(req, res) {
    try {
        console.log('User ID:', req.user.id); 
      // Try to find coach by userId first
      const coach = await Coach.findOne({ where: { userId: req.user.id } });

   if (!coach) {
      console.log('No coach found, creating one...'); // Debug log
      // Create a basic coach profile
      coach = await Coach.create({
        userId: req.user.id,
        // Add other required fields based on your Coach model
        specialization: 'General',
        experience: 0,
        verificationStatus: 'pending'
      });
    }

      const coachId = coach?.id;

        console.log('Coach ID:', coachId);

      if (!coachId) {
        return ResponseUtil.error(res, 'Coach profile not found', 404);
      }

      const bankAccounts = await BankAccount.findAll({
        where: {
          coachId,
          isActive: true
        },
        order: [['isPreferred', 'DESC'], ['createdAt', 'DESC']]
      });

      return ResponseUtil.success(res, bankAccounts, 'Bank accounts retrieved successfully');
    } catch (error) {
      console.error('Get bank accounts error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve bank accounts', 500);
    }
  }

  // Add new bank account
  static async addBankAccount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const coachId = req.user.coachProfile?.id;
      if (!coachId) {
        return ResponseUtil.error(res, 'Coach profile not found', 404);
      }

      const { bankCode, accountNumber, accountName, bankName, isPreferred } = req.body;

      // Check if account already exists
      const existingAccount = await BankAccount.findOne({
        where: { coachId, accountNumber, isActive: true }
      });

      if (existingAccount) {
        return ResponseUtil.error(res, 'Account already exists', 409);
      }

      // If this is set as preferred, unset others
      if (isPreferred) {
        await BankAccount.update(
          { isPreferred: false },
          { where: { coachId, isActive: true } }
        );
      }

      // Verify account with Paystack (optional - implement if needed)
      const verificationStatus = await CoachBankController.verifyBankAccount(bankCode, accountNumber);

      // Create Paystack transfer recipient
      let paystackRecipientCode = null;
      try {
        const recipientResponse = await CoachBankController.createTransferRecipient({
          name: accountName,
          account_number: accountNumber,
          bank_code: bankCode
        });
        paystackRecipientCode = recipientResponse.recipient_code;
      } catch (error) {
        console.error('Failed to create Paystack recipient:', error);
      }

      const bankAccount = await BankAccount.create({
        coachId,
        bankName: bankName || CoachBankController.getBankName(bankCode),
        bankCode,
        accountNumber,
        accountName,
        isPreferred: isPreferred || false,
        verificationStatus: verificationStatus ? 'verified' : 'pending',
        paystackRecipientCode
      });

      return ResponseUtil.success(res, bankAccount, 'Bank account added successfully', 201);
    } catch (error) {
      console.error('Add bank account error:', error);
      return ResponseUtil.error(res, 'Failed to add bank account', 500);
    }
  }

  // Delete bank account
  static async deleteBankAccount(req, res) {
    try {
      const { accountId } = req.params;
      const coachId = req.user.coachProfile?.id;

      const bankAccount = await BankAccount.findOne({
        where: { id: accountId, coachId, isActive: true }
      });

      if (!bankAccount) {
        return ResponseUtil.error(res, 'Bank account not found', 404);
      }

      // Soft delete
      await bankAccount.update({ isActive: false });

      return ResponseUtil.success(res, null, 'Bank account deleted successfully');
    } catch (error) {
      console.error('Delete bank account error:', error);
      return ResponseUtil.error(res, 'Failed to delete bank account', 500);
    }
  }

  // Set preferred account
  static async setPreferredAccount(req, res) {
    try {
      const { accountId } = req.params;
      const coachId = req.user.coachProfile?.id;

      const bankAccount = await BankAccount.findOne({
        where: { id: accountId, coachId, isActive: true }
      });

      if (!bankAccount) {
        return ResponseUtil.error(res, 'Bank account not found', 404);
      }

      // Unset all other preferred accounts
      await BankAccount.update(
        { isPreferred: false },
        { where: { coachId, isActive: true } }
      );

      // Set this as preferred
      await bankAccount.update({ isPreferred: true });

      return ResponseUtil.success(res, bankAccount, 'Preferred account updated successfully');
    } catch (error) {
      console.error('Set preferred account error:', error);
      return ResponseUtil.error(res, 'Failed to update preferred account', 500);
    }
  }

  // Get coach earnings
  static async getEarnings(req, res) {
    try {
      const coachId = req.user.coachProfile?.id;

      if (!coachId) {
        return ResponseUtil.error(res, 'Coach profile not found', 404);
      }

      const earnings = await CoachEarning.findAll({
        where: { coachId },
        attributes: [
          'status',
          [sequelize.fn('SUM', sequelize.col('netAmount')), 'totalAmount'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const summary = {
        pending: 0,
        available: 0,
        total: 0
      };

      earnings.forEach(earning => {
        const amount = parseFloat(earning.totalAmount) || 0;
        summary.total += amount;

        if (earning.status === 'pending') {
          summary.available += amount; // Pending earnings are available for payout
        } else if (earning.status === 'paid') {
          // Already paid out
        }
      });

      summary.pending = summary.total - summary.available;

      return ResponseUtil.success(res, summary, 'Earnings retrieved successfully');
    } catch (error) {
      console.error('Get earnings error:', error);
      return ResponseUtil.error(res, 'Failed to retrieve earnings', 500);
    }
  }

  // Request immediate payout
  static async requestPayout(req, res) {
    try {
      const coachId = req.user.coachProfile?.id;
      const { amount } = req.body;

      // Get preferred account
      const preferredAccount = await BankAccount.findOne({
        where: { coachId, isPreferred: true, isActive: true }
      });

      if (!preferredAccount) {
        return ResponseUtil.error(res, 'No preferred account found', 400);
      }

      // Get pending earnings
      const pendingEarnings = await CoachEarning.findAll({
        where: { coachId, status: 'pending' },
        order: [['createdAt', 'ASC']]
      });

      const totalAvailable = pendingEarnings.reduce((sum, earning) =>
        sum + parseFloat(earning.netAmount), 0
      );

      if (amount > totalAvailable) {
        return ResponseUtil.error(res, 'Insufficient balance', 400);
      }

      // Process payout via Paystack
      try {
        const transferResponse = await CoachBankController.initiateTransfer({
          recipient: preferredAccount.paystackRecipientCode,
          amount: Math.round(amount * 100), // Convert to kobo
          reason: `Payout to ${preferredAccount.accountName}`
        });

        // Update earnings status
        let remainingAmount = amount;
        for (const earning of pendingEarnings) {
          if (remainingAmount <= 0) break;

          const earningAmount = parseFloat(earning.netAmount);
          if (remainingAmount >= earningAmount) {
            await earning.update({
              status: 'processing',
              payoutDate: new Date(),
              paystackTransferCode: transferResponse.transfer_code
            });
            remainingAmount -= earningAmount;
          }
        }

        return ResponseUtil.success(res, {
          transferCode: transferResponse.transfer_code,
          amount,
          recipient: preferredAccount.accountName
        }, 'Payout initiated successfully');

      } catch (transferError) {
        console.error('Transfer failed:', transferError);
        return ResponseUtil.error(res, 'Failed to initiate transfer', 500);
      }

    } catch (error) {
      console.error('Request payout error:', error);
      return ResponseUtil.error(res, 'Failed to process payout request', 500);
    }
  }

  // Helper: Verify bank account with Paystack
  static async verifyBankAccount(bankCode, accountNumber) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );
      return response.data.data.account_name;
    } catch (error) {
      console.error('Bank verification failed:', error);
      return null;
    }
  }

  // Helper: Create Paystack transfer recipient
  static async createTransferRecipient({ name, account_number, bank_code }) {
    const response = await axios.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'nuban',
        name,
        account_number,
        bank_code,
        currency: 'NGN'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data;
  }

  // Helper: Initiate Paystack transfer
  static async initiateTransfer({ recipient, amount, reason }) {
    const response = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        recipient,
        amount,
        reason
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data;
  }

  // Helper: Get bank name from code (Updated with correct Paystack codes)
  static getBankName(bankCode) {
    const banks = {
      '044': 'Access Bank',
      '063': 'Access Bank (Diamond)',
      '050': 'Ecobank Nigeria',
      '070': 'Fidelity Bank',
      '011': 'First Bank of Nigeria',
      '214': 'First City Monument Bank',
      '058': 'Guaranty Trust Bank',
      '030': 'Heritage Bank',
      '301': 'Jaiz Bank',
      '082': 'Keystone Bank',
      '014': 'MainStreet Bank',
      '076': 'Polaris Bank',
      '101': 'Providus Bank',
      '221': 'Stanbic IBTC Bank',
      '068': 'Standard Chartered Bank',
      '232': 'Sterling Bank',
      '100': 'Suntrust Bank',
      '032': 'Union Bank of Nigeria',
      '033': 'United Bank For Africa',
      '215': 'Unity Bank',
      '035': 'Wema Bank',
      '057': 'Zenith Bank',
      // Fintech companies (these codes may vary - verify with Paystack)
      '304': 'Stanbic Mobile',
      '50515': 'Moniepoint MFB',
      '120001': 'Opay',
      '999991': 'PalmPay',
      '090405': 'Moniepoint MFB'
    };
    return banks[bankCode] || 'Unknown Bank';
  }



  // Verify bank account
  static async verifyBankAccount(req, res) {
    try {
      const { bankCode, accountNumber } = req.body;

      const response = await axios.get(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      return ResponseUtil.success(res, {
        accountName: response.data.data.account_name
      }, 'Account verified successfully');
    } catch (error) {
      return ResponseUtil.error(res, 'Account verification failed', 400);
    }
  }
}

module.exports = CoachBankController;
