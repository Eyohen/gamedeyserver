
// controllers/AuthController.js
const { User, Admin, Coach, Facility } = require('../models');
const ResponseUtil = require('../utils/response');
const JWTUtil = require('../utils/jwt');
const { validationResult } = require('express-validator');

class AuthController {
  // User Registration

static async registerUser(req, res) {
  console.log('📥 Registration request received:', req.body);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
    }

    const { firstName, lastName, email, password, phone, dateOfBirth, gender } = req.body;

    // Check if user already exists
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('❌ User already exists');
      return ResponseUtil.error(res, 'User already exists with this email', 409);
    }

    // Create user
    console.log('👤 Creating user...');
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender
    });

    console.log('✅ User created successfully:', user.id);

    // Generate tokens - ADD ERROR HANDLING HERE
    console.log('🔑 Generating tokens...');
    let token, refreshToken;
    
    try {
      token = JWTUtil.generateToken({ id: user.id, type: 'user' });
      refreshToken = JWTUtil.generateRefreshToken({ id: user.id, type: 'user' });
      console.log('✅ Tokens generated successfully');
    } catch (tokenError) {
      console.error('❌ Token generation failed:', tokenError);
      // If token generation fails, still return success but without tokens
      return ResponseUtil.success(res, {
        user,
        token: null,
        refreshToken: null,
        message: 'User created but token generation failed. Please try logging in.'
      }, 'User registered successfully', 201);
    }

    // Prepare response data
    const responseData = {
      user,
      token,
      refreshToken
    };

    console.log('📤 Sending success response');
    return ResponseUtil.success(res, responseData, 'User registered successfully', 201);

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('Error stack:', error.stack);
    
    // Return a more detailed error message
    return ResponseUtil.error(res, `Registration failed: ${error.message}`, 500);
  }
}




  // User Login
  static async loginUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return ResponseUtil.error(res, 'Invalid credentials', 401);
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return ResponseUtil.error(res, 'Invalid credentials', 401);
      }

      // Check if user is active
      if (!user.isActive()) {
        return ResponseUtil.error(res, 'Account is suspended', 401);
      }

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      // Generate tokens
      const token = JWTUtil.generateToken({ id: user.id, type: 'user' });
      const refreshToken = JWTUtil.generateRefreshToken({ id: user.id, type: 'user' });

      return ResponseUtil.success(res, {
        user,
        token,
        refreshToken
      }, 'Login successful');

    } catch (error) {
      console.error('Login error:', error);
      return ResponseUtil.error(res, 'Login failed', 500);
    }
  }

  // Coach Registration
  static async registerCoach(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { 
        firstName, lastName, email, password, phone, 
        bio, experience, hourlyRate, specialties, certifications 
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ResponseUtil.error(res, 'User already exists with this email', 409);
      }

      // Create user first
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone
      });

      // Create coach profile
      const coach = await Coach.create({
        userId: user.id,
        bio,
        experience,
        hourlyRate,
        specialties: specialties || [],
        certifications: certifications || []
      });

      // Generate tokens
      const token = JWTUtil.generateToken({ id: user.id, type: 'user', role: 'coach' });
      const refreshToken = JWTUtil.generateRefreshToken({ id: user.id, type: 'user', role: 'coach' });

      return ResponseUtil.success(res, {
        user,
        coach,
        token,
        refreshToken
      }, 'Coach registered successfully', 201);

    } catch (error) {
      console.error('Coach registration error:', error);
      return ResponseUtil.error(res, 'Coach registration failed', 500);
    }
  }

  // Facility Owner Registration
  static async registerFacilityOwner(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { 
        firstName, lastName, email, password, phone,
        facilityName, facilityAddress, facilityDescription, 
        pricePerHour, amenities, capacity 
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ResponseUtil.error(res, 'User already exists with this email', 409);
      }

      // Create user first
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone
      });

      // Create facility
      const facility = await Facility.create({
        ownerId: user.id,
        name: facilityName,
        description: facilityDescription,
        address: facilityAddress,
        location: req.body.location || {},
        pricePerHour,
        amenities: amenities || [],
        capacity
      });

      // Generate tokens
      const token = JWTUtil.generateToken({ id: user.id, type: 'user', role: 'facility_owner' });
      const refreshToken = JWTUtil.generateRefreshToken({ id: user.id, type: 'user', role: 'facility_owner' });

      return ResponseUtil.success(res, {
        user,
        facility,
        token,
        refreshToken
      }, 'Facility owner registered successfully', 201);

    } catch (error) {
      console.error('Facility owner registration error:', error);
      return ResponseUtil.error(res, 'Facility owner registration failed', 500);
    }
  }

  // Admin Login
  static async loginAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { email, password } = req.body;

      // Find admin
      const admin = await Admin.findOne({ where: { email } });
      if (!admin) {
        return ResponseUtil.error(res, 'Invalid credentials', 401);
      }

      // Validate password
      const isValidPassword = await admin.validatePassword(password);
      if (!isValidPassword) {
        return ResponseUtil.error(res, 'Invalid credentials', 401);
      }

      // Check if admin is active
      if (admin.status !== 'active') {
        return ResponseUtil.error(res, 'Account is suspended', 401);
      }

      // Update last login
      await admin.update({ lastLoginAt: new Date() });

      // Generate tokens
      const token = JWTUtil.generateToken({ id: admin.id, type: 'admin' });
      const refreshToken = JWTUtil.generateRefreshToken({ id: admin.id, type: 'admin' });

      return ResponseUtil.success(res, {
        admin,
        token,
        refreshToken
      }, 'Admin login successful');

    } catch (error) {
      console.error('Admin login error:', error);
      return ResponseUtil.error(res, 'Admin login failed', 500);
    }
  }

  // Refresh Token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ResponseUtil.error(res, 'Refresh token required', 401);
      }

      const decoded = JWTUtil.verifyRefreshToken(refreshToken);
      
      let user;
      if (decoded.type === 'admin') {
        user = await Admin.findByPk(decoded.id);
      } else {
        user = await User.findByPk(decoded.id);
      }

      if (!user) {
        return ResponseUtil.error(res, 'Invalid refresh token', 401);
      }

      // Generate new tokens
      const token = JWTUtil.generateToken({ 
        id: user.id, 
        type: decoded.type,
        role: decoded.role 
      });
      const newRefreshToken = JWTUtil.generateRefreshToken({ 
        id: user.id, 
        type: decoded.type,
        role: decoded.role 
      });

      return ResponseUtil.success(res, {
        token,
        refreshToken: newRefreshToken
      }, 'Token refreshed successfully');

    } catch (error) {
      console.error('Token refresh error:', error);
      return ResponseUtil.error(res, 'Token refresh failed', 401);
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      // In a production app, you might want to blacklist the token
      return ResponseUtil.success(res, null, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      return ResponseUtil.error(res, 'Logout failed', 500);
    }
  }



// Get admin profile
static async getAdminProfile(req, res) {
  try {
    const admin = await Admin.findByPk(req.user.id);
    
    if (!admin) {
      return ResponseUtil.error(res, 'Admin not found', 404);
    }

    return ResponseUtil.success(res, admin.toJSON(), 'Profile retrieved successfully');
  } catch (error) {
    console.error('Get admin profile error:', error);
    return ResponseUtil.error(res, 'Failed to retrieve profile', 500);
  }
}

// Update admin profile
static async updateAdminProfile(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
    }

    const { firstName, lastName, email, currentPassword, newPassword } = req.body;
    
    const admin = await Admin.findByPk(req.user.id);
    if (!admin) {
      return ResponseUtil.error(res, 'Admin not found', 404);
    }

    // If password change is requested, validate current password
    if (newPassword) {
      if (!currentPassword) {
        return ResponseUtil.error(res, 'Current password is required', 400);
      }

      const isValidPassword = await admin.validatePassword(currentPassword);
      if (!isValidPassword) {
        return ResponseUtil.error(res, 'Current password is incorrect', 400);
      }
    }

    // Check if email is already taken by another admin
    if (email !== admin.email) {
      const existingAdmin = await Admin.findOne({ 
        where: { 
          email: email.toLowerCase(),
          id: { [require('sequelize').Op.ne]: admin.id }
        } 
      });
      
      if (existingAdmin) {
        return ResponseUtil.error(res, 'Email already in use', 409);
      }
    }

    // Update admin data
    const updateData = {
      firstName,
      lastName,
      email: email.toLowerCase()
    };

    if (newPassword) {
      updateData.password = newPassword; // Will be hashed by the model hook
    }

    await admin.update(updateData);

    return ResponseUtil.success(res, admin.toJSON(), 'Profile updated successfully');

  } catch (error) {
    console.error('Update admin profile error:', error);
    return ResponseUtil.error(res, 'Failed to update profile', 500);
  }
}

// Admin logout
static async adminLogout(req, res) {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return success and let the frontend handle token removal
    
    return ResponseUtil.success(res, null, 'Logout successful');
  } catch (error) {
    console.error('Admin logout error:', error);
    return ResponseUtil.error(res, 'Logout failed', 500);
  }
}



}





module.exports = AuthController;