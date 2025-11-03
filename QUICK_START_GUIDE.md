# GameDey Email System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Verify Resend Configuration
Your `.env` should have Resend configured:
```env
RESEND_API_KEY=re_your-resend-api-key-here
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
```

### Step 2: Run Database Migration
Add the new email verification fields to your database:

```bash
cd /Users/henry/Desktop/Projects/gamedey/gamedeyserver

# If you have sequelize-cli installed globally
npx sequelize-cli db:migrate

# OR run manually with Node
node -e "
const { Sequelize } = require('sequelize');
const config = require('./config/database');
const migration = require('./migrations/20250119-add-email-verification-fields');

const sequelize = new Sequelize(config.development);
migration.up(sequelize.getQueryInterface(), Sequelize)
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
"
```

**Or manually run this SQL:**
```sql
ALTER TABLE users ADD COLUMN "emailVerificationToken" VARCHAR(255);
ALTER TABLE users ADD COLUMN "emailVerificationExpires" TIMESTAMP;
ALTER TABLE users ADD COLUMN "resetPasswordToken" VARCHAR(255);
ALTER TABLE users ADD COLUMN "resetPasswordExpires" TIMESTAMP;
ALTER TABLE users ADD COLUMN "resetPasswordOTP" VARCHAR(255);
```

### Step 3: Test the System
Start your server and test registration:

```bash
npm run dev
```

### Step 4: Test Email Sending
Use Postman or curl to test registration:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "your-test-email@gmail.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

**Expected Result:**
- User created with `emailVerified: false`
- Verification email sent to the provided email
- Response includes tokens and success message

### Step 5: Check Your Email
Look for an email with:
- Subject: "Verify Your Email - GameDey"
- From: onboarding@resend.dev (or your configured email)
- Contains verification link

### Step 6: Test Email Verification
Copy the token from the verification link and test:

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token-from-email-link"
  }'
```

**Expected Result:**
- User's `emailVerified` set to `true`
- Welcome email sent
- Success message returned

## 🧪 Test All Email Features

### 1. Test Password Reset
```bash
# Request password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@gmail.com"
  }'
```

Check your email for:
- 6-digit OTP code
- Password reset link

### 2. Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@gmail.com",
    "otp": "123456"
  }'
```

### 3. Reset Password with OTP
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@gmail.com",
    "otp": "123456",
    "newPassword": "newpassword123"
  }'
```

### 4. Test Coach Registration
```bash
curl -X POST http://localhost:3000/api/auth/register/coach \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Coach",
    "lastName": "Smith",
    "email": "coach-test@gmail.com",
    "password": "password123",
    "bio": "Experienced coach",
    "experience": 5,
    "hourlyRate": 50
  }'
```

### 5. Test Facility Registration
```bash
curl -X POST http://localhost:3000/api/auth/register/facility \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Facility",
    "lastName": "Owner",
    "email": "facility-test@gmail.com",
    "password": "password123",
    "facilityName": "Test Arena",
    "facilityAddress": "123 Main St",
    "pricePerHour": 100
  }'
```

## 📧 Email Templates Location
All email templates are in:
```
/Users/henry/Desktop/Projects/gamedey/gamedeyserver/templates/emails/
```

Templates:
- `email-verification.html` - Email verification
- `welcome-email.html` - Welcome after verification
- `forgot-password.html` - Password reset with OTP
- `booking-confirmation.html` - Booking confirmations

## 🔍 Troubleshooting

### Email Not Received?
1. Check spam/junk folder
2. Verify Resend API key is valid (starts with `re_`)
3. Check Resend dashboard logs for activity
4. Ensure sender email is verified in Resend (or use onboarding@resend.dev)
5. Check server logs for errors

### Server Logs Location
Check console output for:
- `✅ User created successfully`
- `📧 Verification email sent successfully`
- `❌ Failed to send verification email` (if error)

### Database Connection Issues?
Verify `.env` database settings:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamedey
DB_USER=postgres
DB_PASSWORD=5040
```

### Token Expired Error?
- Verification tokens: 24 hours validity
- Reset tokens/OTP: 10 minutes validity
- Use resend verification endpoint for new token

## 📱 Frontend Integration

Your frontend should handle these routes:
```
/verify-email?token=xxx        # Email verification page
/reset-password?token=xxx      # Password reset page
```

Example frontend code (React):
```javascript
// Email Verification Page
import { useSearchParams } from 'react-router-dom';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      fetch('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Email verified successfully!');
          navigate('/login');
        }
      });
    }
  }, [token]);

  return <div>Verifying your email...</div>;
}
```

## 🎨 Customizing Email Templates

To update email branding:

1. Open template files in `templates/emails/`
2. Update colors (search for `#0066CC`)
3. Add your logo image URL
4. Update footer links
5. Save and test

Example color change:
```html
<!-- Change from -->
<h1 style="color: #0066CC;">GameDey</h1>

<!-- To your brand color -->
<h1 style="color: #FF6B35;">GameDey</h1>
```

## 📊 Monitoring Email Delivery

### Check Resend Dashboard
1. Go to https://resend.com/emails
2. Navigate to Logs section
3. View sent, delivered, bounced, and spam reports
4. Real-time monitoring of email delivery

### Add Webhook for Events (Optional)
In Resend:
1. Settings → Webhooks
2. Add your webhook URL: `https://yourdomain.com/api/webhooks/resend`
3. Select events: email.sent, email.delivered, email.bounced, email.complained

## 🔐 Security Checklist

- [x] All tokens are SHA-256 hashed
- [x] Tokens have expiry times
- [x] Passwords hashed with bcrypt (12 rounds)
- [x] Email doesn't reveal user existence
- [x] Tokens cleared after use
- [x] HTTPS required in production
- [ ] Add rate limiting (recommended)
- [ ] Implement CAPTCHA on registration (recommended)

## 🚢 Production Deployment Checklist

Before going live:

1. **Environment Variables**
   - [ ] Update `FRONTEND_URL` to production domain
   - [ ] Verify `RESEND_API_KEY` is production key
   - [ ] Update `RESEND_FROM_EMAIL` to your domain

2. **Resend**
   - [ ] Verify sender domain in Resend
   - [ ] Check email delivery rates
   - [ ] Test spam scores
   - [ ] Set up domain authentication (SPF/DKIM records automatically provided)

3. **Database**
   - [ ] Run migration on production database
   - [ ] Verify indexes on token fields
   - [ ] Backup database before migration

4. **Testing**
   - [ ] Test all email types
   - [ ] Test on multiple email providers
   - [ ] Verify links work on production domain
   - [ ] Test mobile email rendering

5. **Monitoring**
   - [ ] Set up Resend activity monitoring
   - [ ] Add error logging/alerting
   - [ ] Monitor email delivery rates
   - [ ] Track verification completion rates

## 📚 Documentation Links

- **Full Documentation**: `EMAIL_SYSTEM_DOCUMENTATION.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Resend Docs**: https://resend.com/docs

## 🆘 Support

If you encounter issues:

1. Check server console logs
2. Review Resend dashboard logs
3. Verify database migration completed
4. Ensure all environment variables are set
5. Check email template variables match

## ✅ Success Indicators

Your system is working correctly when:

- ✅ Registration sends verification email
- ✅ Verification link validates and sends welcome email
- ✅ Forgot password sends OTP email
- ✅ Password reset works with both OTP and link
- ✅ Booking confirmation emails are sent
- ✅ All emails arrive in inbox (not spam)
- ✅ Links in emails work correctly
- ✅ Email templates look good on desktop and mobile

---

**Ready to test?** Start with Step 1 above and work through each step.

**Need help?** Check the detailed documentation in `EMAIL_SYSTEM_DOCUMENTATION.md`
