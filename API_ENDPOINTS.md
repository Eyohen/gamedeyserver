# GameDey Email System - API Endpoints Reference

## Authentication & Email Verification Endpoints

### Base URL
```
http://localhost:3000/api/auth
```

---

## 1. User Registration
**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user and send verification email.

**Request Body:**
```json
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

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "emailVerified": false,
      ...
    },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "message": "Please check your email to verify your account."
  }
}
```

**Email Sent:** Verification email with 24-hour expiry link

---

## 2. Coach Registration
**Endpoint:** `POST /api/auth/register/coach`

**Description:** Register a new coach and send verification email.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "bio": "Experienced basketball coach with 10 years of experience",
  "experience": 10,
  "hourlyRate": 75,
  "specialties": ["Basketball", "Fitness"],
  "certifications": ["NASM-CPT", "USA Basketball"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Coach registered successfully. Please check your email to verify your account.",
  "data": {
    "user": { ... },
    "coach": {
      "id": "uuid",
      "userId": "user-uuid",
      "bio": "Experienced basketball coach...",
      "experience": 10,
      "hourlyRate": 75,
      ...
    },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "message": "Please check your email to verify your account."
  }
}
```

**Email Sent:** Verification email with coach-specific messaging

---

## 3. Facility Owner Registration
**Endpoint:** `POST /api/auth/register/facility`

**Description:** Register a facility owner and send verification email.

**Request Body:**
```json
{
  "firstName": "Bob",
  "lastName": "Johnson",
  "email": "bob@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "facilityName": "Elite Sports Arena",
  "facilityAddress": "123 Sports Blvd, City, State 12345",
  "facilityDescription": "State-of-the-art sports facility",
  "pricePerHour": 150,
  "amenities": ["Parking", "Showers", "Lockers"],
  "capacity": 100
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Facility owner registered successfully. Please check your email to verify your account.",
  "data": {
    "user": { ... },
    "facility": {
      "id": "uuid",
      "ownerId": "user-uuid",
      "name": "Elite Sports Arena",
      "address": "123 Sports Blvd...",
      ...
    },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "message": "Please check your email to verify your account."
  }
}
```

**Email Sent:** Verification email with facility-specific messaging

---

## 4. Verify Email
**Endpoint:** `POST /api/auth/verify-email`

**Description:** Verify user's email address using verification token from email.

**Request Body:**
```json
{
  "token": "verification-token-from-email-link"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully! Welcome to GameDey.",
  "data": {
    "emailVerified": true
  }
}
```

**Response (400) - Invalid/Expired Token:**
```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

**Email Sent:** Welcome email with platform features

---

## 5. Resend Verification Email
**Endpoint:** `POST /api/auth/resend-verification`

**Description:** Resend verification email if user didn't receive or token expired.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email has been resent. Please check your inbox."
}
```

**Response (400) - Already Verified:**
```json
{
  "success": false,
  "message": "Email is already verified"
}
```

**Response (404) - User Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Email Sent:** New verification email with new token (24-hour expiry)

---

## 6. Forgot Password
**Endpoint:** `POST /api/auth/forgot-password`

**Description:** Request password reset. Sends email with OTP and reset link.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset email with OTP has been sent"
}
```

**Note:** Always returns success even if email doesn't exist (security).

**Email Sent:** Password reset email with:
- 6-digit OTP code
- Password reset link
- 10-minute expiry

---

## 7. Verify OTP
**Endpoint:** `POST /api/auth/verify-otp`

**Description:** Verify OTP code from password reset email.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password.",
  "data": {
    "otpVerified": true
  }
}
```

**Response (400) - Invalid/Expired OTP:**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

## 8. Reset Password
**Endpoint:** `POST /api/auth/reset-password`

**Description:** Reset password using either token from email link OR OTP.

**Method 1 - Using Token (from email link):**
```json
{
  "token": "reset-token-from-email-link",
  "newPassword": "newpassword123"
}
```

**Method 2 - Using OTP (after verification):**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password"
}
```

**Response (400) - Invalid/Expired:**
```json
{
  "success": false,
  "message": "Invalid or expired reset token/OTP"
}
```

**Response (400) - Missing Parameters:**
```json
{
  "success": false,
  "message": "Either token or email with OTP is required"
}
```

---

## 9. User Login
**Endpoint:** `POST /api/auth/login`

**Description:** Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "emailVerified": true,
      "role": "user",
      ...
    },
    "token": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

**Response (401) - Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Response (401) - Account Suspended:**
```json
{
  "success": false,
  "message": "Account is suspended"
}
```

---

## Common Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Invalid credentials or token |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (duplicate email) |
| 500 | Server Error | Internal server error |

---

## Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

---

## Authentication Headers

For protected endpoints, include JWT token:
```
Authorization: Bearer <jwt-access-token>
```

---

## Email Template Variables

### Verification Email
- `firstName` - User's first name
- `verificationUrl` - Full verification URL with token
- `supportUrl` - Support page URL
- `privacyUrl` - Privacy policy URL
- `termsUrl` - Terms of service URL
- `currentYear` - Current year

### Welcome Email
- `firstName` - User's first name
- `userType` - User type (User/Coach/Facility)
- `loginUrl` - Login page URL
- `dashboardUrl` - Dashboard URL
- `exploreUrl` - Explore page URL
- All footer URLs

### Forgot Password Email
- `firstName` - User's first name
- `otp` - 6-digit OTP code
- `resetUrl` - Password reset URL with token
- All footer URLs

### Booking Confirmation Email
- `firstName` - User's first name
- `bookingId` - Booking ID
- `facilityOrCoachName` - Name of booked facility/coach
- `bookingType` - Type (facility/coach/both)
- `bookingDate` - Formatted date
- `bookingTime` - Formatted time
- `duration` - Duration string
- `amount` - Total amount
- `currency` - Currency code
- `bookingUrl` - Booking details URL
- All footer URLs

---

## Testing with cURL

### Test User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Email Verification
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token-from-email"
  }'
```

### Test Password Reset Request
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### Test OTP Verification
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### Test Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "newPassword": "newpassword123"
  }'
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "GameDey Email System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register User",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "{{baseUrl}}/api/auth/register",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"firstName\": \"Test\",\n  \"lastName\": \"User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
        }
      }
    },
    {
      "name": "Verify Email",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "{{baseUrl}}/api/auth/verify-email",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"token\": \"{{verificationToken}}\"\n}"
        }
      }
    },
    {
      "name": "Forgot Password",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "{{baseUrl}}/api/auth/forgot-password",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\"\n}"
        }
      }
    },
    {
      "name": "Verify OTP",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "{{baseUrl}}/api/auth/verify-otp",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"otp\": \"{{otp}}\"\n}"
        }
      }
    },
    {
      "name": "Reset Password",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "{{baseUrl}}/api/auth/reset-password",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"otp\": \"{{otp}}\",\n  \"newPassword\": \"newpassword123\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

**Documentation Version**: 1.0
**Last Updated**: January 19, 2025
