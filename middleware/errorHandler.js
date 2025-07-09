/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
  
    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map((e) => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors
      });
    }
  
    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
      const errors = err.errors.map((e) => ({
        field: e.path,
        message: e.message
      }));
      return res.status(409).json({
        status: 'error',
        message: 'Duplicate entry',
        errors
      });
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }
  
    // Custom API error with status code
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message
      });
    }
  
    // Default to 500 server error
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  };
  
  module.exports = errorHandler;