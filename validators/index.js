// validators/index.js
const { validationResult } = require('express-validator');
const ResponseUtil = require('../utils/response');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
  }
  next();
};

module.exports = {
  handleValidationErrors
};