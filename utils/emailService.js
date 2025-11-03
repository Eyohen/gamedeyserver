// utils/emailService.js
const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Load and process email template
const loadTemplate = async (templateName, variables = {}) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
    let template = await fs.readFile(templatePath, 'utf8');

    // Replace template variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key] || '');
    });

    return template;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Template ${templateName} not found`);
  }
};

// Format date for email display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Send email verification link
const sendVerificationEmail = async (userEmail, userDetails, verificationToken) => {
  try {
    const templateVariables = {
      userName: `${userDetails.firstName} ${userDetails.lastName}`,
      firstName: userDetails.firstName,
      verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
      supportUrl: `${process.env.FRONTEND_URL}/support`,
      privacyUrl: `${process.env.FRONTEND_URL}/privacy`,
      termsUrl: `${process.env.FRONTEND_URL}/terms`,
      currentYear: new Date().getFullYear()
    };

    const htmlContent = await loadTemplate('email-verification', templateVariables);

    const result = await resend.emails.send({
      from: `GameDey <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: userEmail,
      subject: 'Verify Your Email - GameDey',
      html: htmlContent
    });

    console.log('📧 Resend API Response:', JSON.stringify(result, null, 2));
    console.log('Verification email sent successfully to:', userEmail);

    if (result.error) {
      console.error('❌ Resend returned an error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    console.error('Error details:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (userEmail, userDetails, userType = 'user') => {
  try {
    const templateVariables = {
      userName: `${userDetails.firstName} ${userDetails.lastName}`,
      firstName: userDetails.firstName,
      userType: userType.charAt(0).toUpperCase() + userType.slice(1),
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      exploreUrl: `${process.env.FRONTEND_URL}/explore`,
      supportUrl: `${process.env.FRONTEND_URL}/support`,
      privacyUrl: `${process.env.FRONTEND_URL}/privacy`,
      termsUrl: `${process.env.FRONTEND_URL}/terms`,
      currentYear: new Date().getFullYear()
    };

    const htmlContent = await loadTemplate('welcome-email', templateVariables);

    const result = await resend.emails.send({
      from: `GameDey <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: userEmail,
      subject: 'Welcome to GameDey! 🎉',
      html: htmlContent
    });

    console.log('📧 Resend API Response:', JSON.stringify(result, null, 2));
    console.log('Welcome email sent successfully to:', userEmail);

    if (result.error) {
      console.error('❌ Resend returned an error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    console.error('Error details:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Send forgot password email with OTP
const sendForgotPasswordEmail = async (userEmail, userDetails, otp, resetToken) => {
  try {
    const templateVariables = {
      userName: `${userDetails.firstName} ${userDetails.lastName}`,
      firstName: userDetails.firstName,
      otp: otp,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      supportUrl: `${process.env.FRONTEND_URL}/support`,
      privacyUrl: `${process.env.FRONTEND_URL}/privacy`,
      termsUrl: `${process.env.FRONTEND_URL}/terms`,
      currentYear: new Date().getFullYear()
    };

    const htmlContent = await loadTemplate('forgot-password', templateVariables);

    const result = await resend.emails.send({
      from: `GameDey Security <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: userEmail,
      subject: 'Reset Your Password - GameDey',
      html: htmlContent
    });

    console.log('Password reset email sent successfully to:', userEmail);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (userEmail, userDetails, bookingDetails) => {
  try {
    const templateVariables = {
      userName: `${userDetails.firstName} ${userDetails.lastName}`,
      firstName: userDetails.firstName,
      bookingId: bookingDetails.id,
      facilityOrCoachName: bookingDetails.name,
      bookingType: bookingDetails.type, // 'coach' or 'facility'
      bookingDate: formatDate(bookingDetails.date),
      bookingTime: bookingDetails.time,
      duration: bookingDetails.duration,
      subtotal: bookingDetails.subtotal || bookingDetails.amount,
      serviceFee: bookingDetails.serviceFee || 0,
      amount: bookingDetails.amount,
      currency: bookingDetails.currency || 'NGN',
      bookingUrl: `${process.env.FRONTEND_URL}/bookings/${bookingDetails.id}`,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      supportUrl: `${process.env.FRONTEND_URL}/support`,
      currentYear: new Date().getFullYear()
    };

    const htmlContent = await loadTemplate('booking-confirmation', templateVariables);

    const result = await resend.emails.send({
      from: `GameDey <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: userEmail,
      subject: 'Booking Confirmed - GameDey',
      html: htmlContent
    });

    console.log('Booking confirmation email sent successfully to:', userEmail);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConnection = async () => {
  try {
    // Resend doesn't have a verify method like nodemailer
    // We can test by checking if the API key is set
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    console.log('Resend email service configured');
    return { success: true };
  } catch (error) {
    console.error('Email service configuration failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendForgotPasswordEmail,
  sendBookingConfirmationEmail,
  testEmailConnection
};
