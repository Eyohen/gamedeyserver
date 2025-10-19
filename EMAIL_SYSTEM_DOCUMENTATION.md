# GameDey Email System Documentation

## Overview
The GameDey platform uses **SendGrid** for sending transactional emails including email verification, password reset with OTP, welcome emails, and booking confirmations.

## Setup Instructions

### 1. SendGrid Configuration
1. Sign up for a SendGrid account at [https://sendgrid.com](https://sendgrid.com)
2. Create an API key from the SendGrid dashboard
3. Verify a sender email address in SendGrid
4. Update the `.env` file with your credentials:

```env
SENDGRID_API_KEY=your-actual-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@gamedey.com
FRONTEND_URL=http://localhost:5173
```

### 2. Database Migration
Run the migration to add email verification and password reset fields to the User table:

```bash
# Using Sequelize CLI
npx sequelize-cli db:migrate

# Or manually run the migration script
node migrations/20250119-add-email-verification-fields.js
```

## Email Templates

The system includes 4 HTML email templates located in `templates/emails/`:

### 1. Email Verification (`email-verification.html`)
- Sent when users register (User/Coach/Facility)
- Contains verification link valid for 24 hours
- Template variables: `firstName`, `verificationUrl`, `supportUrl`, `privacyUrl`, `termsUrl`, `currentYear`

### 2. Welcome Email (`welcome-email.html`)
- Sent after successful email verification
- Includes dashboard and explore links
- Shows features based on user type (User/Coach/Facility)
- Template variables: `firstName`, `userType`, `loginUrl`, `dashboardUrl`, `exploreUrl`, etc.

### 3. Forgot Password (`forgot-password.html`)
- Sent when user requests password reset
- Includes 6-digit OTP code and reset link
- Valid for 10 minutes
- Template variables: `firstName`, `otp`, `resetUrl`, `supportUrl`, etc.

### 4. Booking Confirmation (`booking-confirmation.html`)
- Sent when a booking is confirmed
- Shows booking details, amount, and date/time
- Template variables: `firstName`, `bookingId`, `facilityOrCoachName`, `bookingDate`, etc.

## API Endpoints

### Authentication & Email Verification

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

**Response:**
- User created with `emailVerified: false`
- Verification email sent automatically
- Returns user object, tokens, and message

#### 2. Register Coach
```http
POST /api/auth/register/coach
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "bio": "Experienced coach...",
  "experience": 5,
  "hourlyRate": 50,
  "specialties": ["Basketball", "Soccer"],
  "certifications": ["NASM-CPT"]
}
```

#### 3. Register Facility Owner
```http
POST /api/auth/register/facility
Content-Type: application/json

{
  "firstName": "Bob",
  "lastName": "Johnson",
  "email": "bob@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "facilityName": "Sports Arena",
  "facilityAddress": "123 Main St",
  "facilityDescription": "Modern facility...",
  "pricePerHour": 100,
  "amenities": ["Parking", "Showers"],
  "capacity": 50
}
```

#### 4. Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

**Response:**
- Sets `emailVerified: true`
- Clears verification token
- Sends welcome email
- Returns success message

#### 5. Resend Verification Email
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
- Generates new verification token
- Sends new verification email
- Returns success message

### Password Reset Flow

#### 1. Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
- Generates 6-digit OTP and reset token
- Sends email with both OTP and reset link
- OTP and token valid for 10 minutes

#### 2. Verify OTP (Optional)
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
- Validates OTP
- Returns success if valid

#### 3. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

# Option 1: Using reset token from email link
{
  "token": "reset-token-from-email",
  "newPassword": "newpassword123"
}

# Option 2: Using OTP
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Response:**
- Validates token/OTP and expiry
- Updates password (auto-hashed)
- Clears reset tokens
- Returns success message

## Email Service Functions

Located in `utils/emailService.js`:

### 1. `sendVerificationEmail(userEmail, userDetails, verificationToken)`
Sends email verification link to new users.

```javascript
const emailService = require('./utils/emailService');

await emailService.sendVerificationEmail(
  'user@example.com',
  { firstName: 'John', lastName: 'Doe' },
  'verification-token-here'
);
```

### 2. `sendWelcomeEmail(userEmail, userDetails, userType)`
Sends welcome email after verification.

```javascript
await emailService.sendWelcomeEmail(
  'user@example.com',
  { firstName: 'John', lastName: 'Doe' },
  'coach' // 'user' | 'coach' | 'facility'
);
```

### 3. `sendForgotPasswordEmail(userEmail, userDetails, otp, resetToken)`
Sends password reset email with OTP.

```javascript
await emailService.sendForgotPasswordEmail(
  'user@example.com',
  { firstName: 'John', lastName: 'Doe' },
  '123456',
  'reset-token-here'
);
```

### 4. `sendBookingConfirmationEmail(userEmail, userDetails, bookingDetails)`
Sends booking confirmation.

```javascript
await emailService.sendBookingConfirmationEmail(
  'user@example.com',
  { firstName: 'John', lastName: 'Doe' },
  {
    id: 'booking-123',
    name: 'Sports Arena',
    type: 'facility',
    date: new Date(),
    time: '10:00 AM',
    duration: '2 hours',
    amount: 100,
    currency: 'USD'
  }
);
```

## Database Schema Updates

New fields added to `users` table:

```sql
ALTER TABLE users ADD COLUMN emailVerificationToken VARCHAR(255);
ALTER TABLE users ADD COLUMN emailVerificationExpires TIMESTAMP;
ALTER TABLE users ADD COLUMN resetPasswordToken VARCHAR(255);
ALTER TABLE users ADD COLUMN resetPasswordExpires TIMESTAMP;
ALTER TABLE users ADD COLUMN resetPasswordOTP VARCHAR(255);
```

All tokens are stored as **SHA-256 hashes** for security.

## Security Features

1. **Token Hashing**: All tokens (verification, reset, OTP) are hashed using SHA-256
2. **Token Expiry**:
   - Email verification: 24 hours
   - Password reset: 10 minutes
   - OTP: 10 minutes
3. **One-time Use**: Tokens are cleared after successful use
4. **Password Hashing**: Passwords hashed with bcrypt (12 rounds)
5. **Email Obfuscation**: Doesn't reveal if email exists on forgot password

## Email Flow Diagrams

### Registration Flow
```
User Registration
    ↓
Generate Verification Token
    ↓
Hash & Store Token (24hr expiry)
    ↓
Send Verification Email
    ↓
User Clicks Link
    ↓
Verify Token & Expiry
    ↓
Set emailVerified = true
    ↓
Send Welcome Email
```

### Password Reset Flow
```
Forgot Password Request
    ↓
Generate OTP (6 digits)
    ↓
Generate Reset Token
    ↓
Hash & Store (10min expiry)
    ↓
Send Email with OTP & Link
    ↓
User Enters OTP or Clicks Link
    ↓
Verify OTP/Token & Expiry
    ↓
Update Password
    ↓
Clear All Reset Tokens
```

## Integration with Frontend

### Verification Link Format
```
http://localhost:5173/verify-email?token=<verification-token>
```

### Reset Password Link Format
```
http://localhost:5173/reset-password?token=<reset-token>
```

Frontend should:
1. Extract token from URL query params
2. Call appropriate API endpoint with token
3. Display success/error messages
4. Redirect to login on success

## Testing

### Test Email Sending (Development)
```javascript
// In your route or controller
const emailService = require('./utils/emailService');

// Test configuration
const testResult = await emailService.testEmailConnection();
console.log(testResult);

// Send test verification email
await emailService.sendVerificationEmail(
  'test@example.com',
  { firstName: 'Test', lastName: 'User' },
  'test-token-123'
);
```

### SendGrid Sandbox Mode
For testing without sending real emails, use SendGrid's sandbox mode:
1. Go to SendGrid Settings → Mail Settings
2. Enable "Sandbox Mode"
3. Emails will be validated but not sent

## Troubleshooting

### Common Issues

1. **SendGrid API Key Error**
   - Verify API key is correct in `.env`
   - Check API key permissions in SendGrid dashboard
   - Ensure key has "Mail Send" permission

2. **Email Not Received**
   - Check spam/junk folder
   - Verify sender email is verified in SendGrid
   - Check SendGrid activity log
   - Ensure SENDGRID_FROM_EMAIL matches verified sender

3. **Template Not Found**
   - Ensure all templates exist in `templates/emails/`
   - Check file names match exactly (case-sensitive)
   - Verify file permissions

4. **Token Expired**
   - Verification tokens: 24 hours
   - Reset tokens/OTP: 10 minutes
   - Request new token via resend endpoints

5. **Database Migration Issues**
   - Ensure PostgreSQL is running
   - Check database connection in `.env`
   - Run migration manually if needed

## Environment Variables Reference

```env
# Required for email system
SENDGRID_API_KEY=         # Your SendGrid API key
SENDGRID_FROM_EMAIL=      # Verified sender email
FRONTEND_URL=             # Frontend URL for links in emails

# Database (required for User model)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamedey
DB_USER=postgres
DB_PASSWORD=your-password

# JWT (required for auth)
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

## Next Steps

1. **Get SendGrid API Key**: Sign up and create an API key
2. **Verify Sender Email**: Add and verify your sender email in SendGrid
3. **Update .env**: Add your actual SendGrid credentials
4. **Run Migration**: Execute database migration
5. **Test Registration**: Register a test user and check email
6. **Customize Templates**: Update HTML templates with your branding
7. **Configure Frontend**: Set up verification and reset password pages

## Support

For issues or questions:
- Check SendGrid documentation: https://docs.sendgrid.com
- Review server logs for detailed error messages
- Contact support team

---

**Last Updated**: January 19, 2025
