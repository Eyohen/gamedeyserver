
// controllers/AuthController.js
const { User, Admin, Coach, Facility } = require('../models');
const ResponseUtil = require('../utils/response');
const JWTUtil = require('../utils/jwt');
const { validationResult } = require('express-validator');
const emailService = require('../utils/emailService');
const crypto = require('crypto');

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

    // Check if user already exists with this email
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('❌ User already exists with this email');
      return ResponseUtil.error(res, 'User already exists with this email', 409);
    }

    // Check if phone number already exists (if phone is provided)
    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        console.log('❌ Phone number already registered');
        return ResponseUtil.error(res, 'This phone number is already registered', 409);
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours from now

    // Create user
    console.log('👤 Creating user...');
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: verificationExpiry,
      emailVerified: false
    });

    console.log('✅ User created successfully:', user.id);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        user.email,
        { firstName: user.firstName, lastName: user.lastName },
        verificationToken
      );
      console.log('📧 Verification email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Continue registration even if email fails
    }

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
      }, 'User registered successfully. Please check your email to verify your account.', 201);
    }

    // Prepare response data
    const responseData = {
      user,
      token,
      refreshToken,
      message: 'Please check your email to verify your account.'
    };

    console.log('📤 Sending success response');
    return ResponseUtil.success(res, responseData, 'User registered successfully. Please check your email to verify your account.', 201);

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

      // Find user with Coach and Facility associations to detect role
      const user = await User.findOne({
        where: { email },
        include: [
          {
            model: Coach,
            as: 'Coach',
            required: false
          },
          {
            model: Facility,
            as: 'ownedFacilities',
            required: false
          }
        ]
      });

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

      // Determine user type for token
      let userType = 'user';
      if (user.Coach) {
        userType = 'coach';
      } else if (user.ownedFacilities && user.ownedFacilities.length > 0) {
        userType = 'facility';
      }

      // Generate tokens with appropriate type
      const token = JWTUtil.generateToken({ id: user.id, type: userType });
      const refreshToken = JWTUtil.generateRefreshToken({ id: user.id, type: userType });

      // Add role to user object for frontend
      const userData = user.toJSON();
      userData.role = userType;

      console.log(`✅ Login successful for ${userType}:`, email);

      return ResponseUtil.success(res, {
        user: userData,
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

      // Check if phone number already exists (if phone is provided)
      if (phone) {
        const existingPhone = await User.findOne({ where: { phone } });
        if (existingPhone) {
          console.log('❌ Phone number already registered');
          return ResponseUtil.error(res, 'This phone number is already registered', 409);
        }
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
      const verificationExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours from now

      // Create user first
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        emailVerificationToken: verificationTokenHash,
        emailVerificationExpires: verificationExpiry,
        emailVerified: false
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

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          user.email,
          { firstName: user.firstName, lastName: user.lastName },
          verificationToken
        );
        console.log('📧 Coach verification email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send coach verification email:', emailError);
      }

      // Generate tokens
      const token = JWTUtil.generateToken({ id: user.id, type: 'user', role: 'coach' });
      const refreshToken = JWTUtil.generateRefreshToken({ id: user.id, type: 'user', role: 'coach' });

      return ResponseUtil.success(res, {
        user,
        coach,
        token,
        refreshToken,
        message: 'Please check your email to verify your account.'
      }, 'Coach registered successfully. Please check your email to verify your account.', 201);

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

      // Check if phone number already exists (if phone is provided)
      if (phone) {
        const existingPhone = await User.findOne({ where: { phone } });
        if (existingPhone) {
          console.log('❌ Phone number already registered');
          return ResponseUtil.error(res, 'This phone number is already registered', 409);
        }
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
      const verificationExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours from now

      // Create user first
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        emailVerificationToken: verificationTokenHash,
        emailVerificationExpires: verificationExpiry,
        emailVerified: false
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

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          user.email,
          { firstName: user.firstName, lastName: user.lastName },
          verificationToken
        );
        console.log('📧 Facility owner verification email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send facility owner verification email:', emailError);
      }

      // Generate tokens
      const token = JWTUtil.generateToken({ id: user.id, type: 'user', role: 'facility_owner' });
      const refreshToken = JWTUtil.generateRefreshToken({ id: user.id, type: 'user', role: 'facility_owner' });

      return ResponseUtil.success(res, {
        user,
        facility,
        token,
        refreshToken,
        message: 'Please check your email to verify your account.'
      }, 'Facility owner registered successfully. Please check your email to verify your account.', 201);

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

// Forgot Password - Request password reset
static async forgotPassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not for security
      return ResponseUtil.success(res, null, 'If an account exists with this email, a password reset link has been sent');
    }

    // Generate reset token and OTP
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 600000); // 10 minutes from now

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Save reset token and OTP to user
    await user.update({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: resetTokenExpiry,
      resetPasswordOTP: otpHash
    });

    // Send password reset email with OTP
    try {
      await emailService.sendForgotPasswordEmail(
        user.email,
        { firstName: user.firstName, lastName: user.lastName },
        otp,
        resetToken
      );
      console.log('📧 Password reset email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      return ResponseUtil.error(res, 'Failed to send password reset email. Please try again later.', 500);
    }

    return ResponseUtil.success(res, null, 'If an account exists with this email, a password reset email with OTP has been sent');

  } catch (error) {
    console.error('Forgot password error:', error);
    return ResponseUtil.error(res, 'Failed to process password reset request', 500);
  }
}

// Verify Email - Verify user email with token
static async verifyEmail(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return ResponseUtil.error(res, 'Verification token is required', 400);
    }

    // Hash the token to compare with stored hash
    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        emailVerificationToken: verificationTokenHash,
        emailVerificationExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return ResponseUtil.error(res, 'Invalid or expired verification token', 400);
    }

    // Update user as verified
    await user.update({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });

    console.log(`✅ Email verified for user: ${user.email}`);

    // Determine user type
    let userType = 'user';
    const coach = await Coach.findOne({ where: { userId: user.id } });
    const facility = await Facility.findOne({ where: { ownerId: user.id } });

    if (coach) {
      userType = 'coach';
    } else if (facility) {
      userType = 'facility';
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(
        user.email,
        { firstName: user.firstName, lastName: user.lastName },
        userType
      );
      console.log('📧 Welcome email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
    }

    return ResponseUtil.success(res, {
      emailVerified: true,
      userType: userType,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    }, 'Email verified successfully! Welcome to GameDey.');

  } catch (error) {
    console.error('Email verification error:', error);
    return ResponseUtil.error(res, 'Failed to verify email', 500);
  }
}

// Resend Verification Email
static async resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return ResponseUtil.error(res, 'Email is required', 400);
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return ResponseUtil.error(res, 'User not found', 404);
    }

    if (user.emailVerified) {
      return ResponseUtil.error(res, 'Email is already verified', 400);
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours from now

    // Update user with new token
    await user.update({
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: verificationExpiry
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        user.email,
        { firstName: user.firstName, lastName: user.lastName },
        verificationToken
      );
      console.log('📧 Verification email resent successfully');
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError);
      return ResponseUtil.error(res, 'Failed to send verification email', 500);
    }

    return ResponseUtil.success(res, null, 'Verification email has been resent. Please check your inbox.');

  } catch (error) {
    console.error('Resend verification email error:', error);
    return ResponseUtil.error(res, 'Failed to resend verification email', 500);
  }
}

// Verify OTP for password reset
static async verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return ResponseUtil.error(res, 'Email and OTP are required', 400);
    }

    // Hash the OTP to compare with stored hash
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with valid OTP
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        email,
        resetPasswordOTP: otpHash,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return ResponseUtil.error(res, 'Invalid or expired OTP', 400);
    }

    console.log(`✅ OTP verified for user: ${user.email}`);

    return ResponseUtil.success(res, { otpVerified: true }, 'OTP verified successfully. You can now reset your password.');

  } catch (error) {
    console.error('OTP verification error:', error);
    return ResponseUtil.error(res, 'Failed to verify OTP', 500);
  }
}

// Reset Password - Change password using reset token or OTP
static async resetPassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
    }

    const { token, email, otp, newPassword } = req.body;

    if (!newPassword) {
      return ResponseUtil.error(res, 'New password is required', 400);
    }

    let user;
    const { Op } = require('sequelize');

    // Check if using token or OTP
    if (token) {
      // Hash the token from URL to compare with stored hash
      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      user = await User.findOne({
        where: {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpires: {
            [Op.gt]: new Date()
          }
        }
      });
    } else if (email && otp) {
      // Hash the OTP to compare with stored hash
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      // Find user with valid OTP
      user = await User.findOne({
        where: {
          email,
          resetPasswordOTP: otpHash,
          resetPasswordExpires: {
            [Op.gt]: new Date()
          }
        }
      });
    } else {
      return ResponseUtil.error(res, 'Either token or email with OTP is required', 400);
    }

    if (!user) {
      return ResponseUtil.error(res, 'Invalid or expired reset token/OTP', 400);
    }

    // Update password and clear reset tokens
    await user.update({
      password: newPassword, // Will be hashed by the model hook
      resetPasswordToken: null,
      resetPasswordExpires: null,
      resetPasswordOTP: null
    });

    console.log(`✅ Password reset successful for user: ${user.email}`);

    return ResponseUtil.success(res, null, 'Password has been reset successfully. You can now login with your new password');

  } catch (error) {
    console.error('Reset password error:', error);
    return ResponseUtil.error(res, 'Failed to reset password', 500);
  }
}



}





module.exports = AuthController;