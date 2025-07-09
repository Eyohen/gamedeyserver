
// utils/jwt.js
const jwt = require('jsonwebtoken');

class JWTUtil {
  static generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  }
}

module.exports = JWTUtil;