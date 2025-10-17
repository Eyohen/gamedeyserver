
//routes/coach-bank.js
const express = require('express');
const { body, param } = require('express-validator');
const CoachBankController = require('../controllers/CoachBankController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require coach authentication
router.use(authenticateToken('coach'));

// Get bank accounts
router.get('/bank-accounts', CoachBankController.getBankAccounts);

// Add bank account
router.post('/bank-accounts', [
  body('bankCode').notEmpty().withMessage('Bank code is required'),
  body('accountNumber').isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits'),
  body('accountName').notEmpty().withMessage('Account name is required'),
  body('isPreferred').optional().isBoolean().withMessage('isPreferred must be boolean')
], CoachBankController.addBankAccount);

// Delete bank account
router.delete('/bank-accounts/:accountId', [
  param('accountId').isUUID().withMessage('Invalid account ID')
], CoachBankController.deleteBankAccount);

// Set preferred account
router.patch('/bank-accounts/:accountId/preferred', [
  param('accountId').isUUID().withMessage('Invalid account ID')
], CoachBankController.setPreferredAccount);

// Get earnings
router.get('/earnings', CoachBankController.getEarnings);

// Request payout
router.post('/request-payout', [
  body('amount').isNumeric().withMessage('Amount must be a number')
], CoachBankController.requestPayout);

router.post('/verify-account', CoachBankController.verifyBankAccount);

module.exports = router;


