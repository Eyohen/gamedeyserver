// utils/emailService.js
const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

    const mailOptions = {
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'info@gamedey.com',
        name: 'GameDey'
      },
      to: userEmail,
      subject: 'Verify Your Email - GameDey',
      html: htmlContent
    };

    const result = await sgMail.send(mailOptions);
    console.log('Verification email sent successfully to:', userEmail);
    return { success: true, messageId: result[0].headers['x-message-id'] };

  } catch (error) {
    console.error('Error sending verification email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
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

    const mailOptions = {
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'info@gamedey.com',
        name: 'GameDey'
      },
      to: userEmail,
      subject: 'Welcome to GameDey! 🎉',
      html: htmlContent
    };

    const result = await sgMail.send(mailOptions);
    console.log('Welcome email sent successfully to:', userEmail);
    return { success: true, messageId: result[0].headers['x-message-id'] };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
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

    const mailOptions = {
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'info@gamedey.com',
        name: 'GameDey Security'
      },
      to: userEmail,
      subject: 'Reset Your Password - GameDey',
      html: htmlContent
    };

    const result = await sgMail.send(mailOptions);
    console.log('Password reset email sent successfully to:', userEmail);
    return { success: true, messageId: result[0].headers['x-message-id'] };

  } catch (error) {
    console.error('Error sending password reset email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
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

    const mailOptions = {
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'info@gamedey.com',
        name: 'GameDey'
      },
      to: userEmail,
      subject: 'Booking Confirmed - GameDey',
      html: htmlContent
    };

    const result = await sgMail.send(mailOptions);
    console.log('Booking confirmation email sent successfully to:', userEmail);
    return { success: true, messageId: result[0].headers['x-message-id'] };

  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConnection = async () => {
  try {
    // SendGrid doesn't have a verify method like nodemailer
    // We can test by checking if the API key is set
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not set');
    }
    console.log('SendGrid email service configured');
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
