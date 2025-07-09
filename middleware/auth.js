
// // middleware/auth.js
// const jwt = require('jsonwebtoken');
// const { User, Admin, Coach, Facility } = require('../models');

// const authenticateToken = (userType = 'user') => {
//   return async (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (!token) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Access token required' 
//       });
//     }

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
//       let user;
//       switch (userType) {
//         case 'admin':
//           user = await Admin.findByPk(decoded.id);
//           break;
//         case 'user':
//         default:
//           user = await User.findByPk(decoded.id);
//           break;
//       }

//       if (!user) {
//         return res.status(401).json({ 
//           success: false, 
//           message: 'Invalid token' 
//         });
//       }

//       if (userType === 'user' && !user.isActive()) {
//         return res.status(401).json({ 
//           success: false, 
//           message: 'Account suspended' 
//         });
//       }

//       req.user = user;
//       next();
//     } catch (error) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Invalid or expired token' 
//       });
//     }
//   };
// };

// const requirePermission = (permission) => {
//   return (req, res, next) => {
//     if (!req.user.hasPermission || !req.user.hasPermission(permission)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Insufficient permissions'
//       });
//     }
//     next();
//   };
// };

// module.exports = {
//   authenticateToken,
//   requirePermission
// };




// middleware/auth.js - Enhanced version
const jwt = require('jsonwebtoken');
const { User, Admin, Coach, Facility } = require('../models');

const authenticateToken = (userType = 'user') => {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let user;
      switch (userType) {
        case 'admin':
          // For admin routes, ensure the token is for an admin
          if (decoded.type !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Admin access required'
            });
          }
          
          user = await Admin.findByPk(decoded.id);
          
          // Check admin status
          if (user && user.status !== 'active') {
            return res.status(401).json({
              success: false,
              message: 'Admin account is inactive or suspended'
            });
          }
          break;
          
        case 'user':
        default:
          // For user routes, ensure the token is for a user (optional check)
          // Uncomment if you want strict separation
          // if (decoded.type && decoded.type !== 'user') {
          //   return res.status(403).json({
          //     success: false,
          //     message: 'User access required'
          //   });
          // }
          
          user = await User.findByPk(decoded.id);
          
          // Check user status
          if (user && !user.isActive()) {
            return res.status(401).json({ 
              success: false, 
              message: 'Account suspended' 
            });
          }
          break;
      }

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token - user not found' 
        });
      }

      // Add user type to request for easy access
      req.user = user;
      req.userType = userType;
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      // More specific error messages
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token format' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has expired' 
        });
      }
      
      return res.status(403).json({ 
        success: false, 
        message: 'Token verification failed' 
      });
    }
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has permission method (for admins)
    if (!req.user.hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions - not an admin account'
      });
    }

    // Check specific permission
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions - ${permission} required`
      });
    }
    
    next();
  };
};

// Additional middleware for role-based access
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // For admin users, check role
    if (req.userType === 'admin') {
      if (!req.user.role || req.user.role !== role) {
        return res.status(403).json({
          success: false,
          message: `${role} role required`
        });
      }
    }
    
    next();
  };
};

// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.isSuperAdmin || !req.user.isSuperAdmin()) {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  requireSuperAdmin
};