# Service Fee Implementation - 7.5% Booking Fee

## Overview
Implemented a 7.5% service fee on all bookings. Users now see a clear breakdown of costs with subtotal, service fee, and total amount.

## Example Calculation
```
Facility Rate: ₦400/hour × 2 hours = ₦800
Coach Rate: ₦200/hour × 2 hours = ₦400
─────────────────────────────────────────
Subtotal:                        ₦1,200
Service Fee (7.5%):              ₦90
─────────────────────────────────────────
Total Amount:                    ₦1,290
```

## Changes Made

### 1. Database Schema Updates

#### Booking Model (`models/Booking.js`)
Added 2 new fields:
```javascript
subtotal: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  validate: { min: 0 },
  comment: 'Amount before service fee (facility + coach fees)'
}

serviceFee: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  defaultValue: 0.00,
  validate: { min: 0 },
  comment: '7.5% service fee on subtotal'
}

totalAmount: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  validate: { min: 0 },
  comment: 'Total amount (subtotal + serviceFee)'
}
```

#### Migration File
Created: `migrations/20250119-add-booking-service-fee.js`
- Adds `subtotal` and `serviceFee` columns
- Migrates existing bookings (sets subtotal = totalAmount, serviceFee = 0)
- Safe for production with existing data

### 2. Booking Controller Updates (`controllers/BookingController.js`)

#### CreateBooking Method (Line ~249)
**Before:**
```javascript
let totalAmount = 0;
// Calculate based on hourly rates
if (facility) {
  totalAmount += parseFloat(facility.pricePerHour) * durationHours;
}
if (coach) {
  totalAmount += parseFloat(coach.hourlyRate) * durationHours;
}
```

**After:**
```javascript
let subtotal = 0;
// Calculate based on hourly rates
if (facility) {
  subtotal += parseFloat(facility.pricePerHour) * durationHours;
}
if (coach) {
  subtotal += parseFloat(coach.hourlyRate) * durationHours;
}

// Calculate service fee (7.5% of subtotal)
const serviceFeePercentage = 0.075; // 7.5%
const serviceFee = parseFloat((subtotal * serviceFeePercentage).toFixed(2));

// Calculate total amount (subtotal + service fee)
const totalAmount = parseFloat((subtotal + serviceFee).toFixed(2));
```

#### Booking Creation
```javascript
const booking = await Booking.create({
  userId: req.user.id,
  facilityId: facilityId || null,
  coachId: coachId || null,
  sportId: sportId,
  packageId: packageId || null,
  bookingType,
  startTime,
  endTime,
  subtotal,        // NEW
  serviceFee,      // NEW
  totalAmount,
  participantsCount: participantsCount || 1,
  notes: notes || null
});
```

### 3. Email Updates

#### Email Service (`utils/emailService.js`)
Updated `sendBookingConfirmationEmail()` to include:
```javascript
const templateVariables = {
  // ... existing fields
  subtotal: bookingDetails.subtotal,
  serviceFee: bookingDetails.serviceFee,
  amount: bookingDetails.amount,
  currency: bookingDetails.currency || 'NGN',
  // ... rest
};
```

#### Email Template (`templates/emails/booking-confirmation.html`)
**New Payment Breakdown Section:**
```html
<div class="amount-box">
    <p>Payment Breakdown</p>
    <table>
        <tr>
            <td>Subtotal:</td>
            <td>{{currency}} {{subtotal}}</td>
        </tr>
        <tr>
            <td>Service Fee (7.5%):</td>
            <td>{{currency}} {{serviceFee}}</td>
        </tr>
        <tr style="border-top: 2px solid #0066CC;">
            <td>Total Amount:</td>
            <td>{{currency}} {{amount}}</td>
        </tr>
    </table>
    <p>Payment Confirmed</p>
</div>
```

#### Email Sending Updates
Both booking creation and status update methods now pass fee breakdown:
```javascript
await emailService.sendBookingConfirmationEmail(
  user.email,
  { firstName: user.firstName, lastName: user.lastName },
  {
    id: booking.id,
    name: bookingName,
    type: booking.bookingType,
    date: startDate,
    time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    duration: durationStr,
    subtotal: booking.subtotal,       // NEW
    serviceFee: booking.serviceFee,   // NEW
    amount: booking.totalAmount,
    currency: 'NGN'
  }
);
```

## How It Works

### 1. Booking Creation Flow
```
User selects facility/coach
    ↓
Calculate hourly rates × duration = Subtotal
    ↓
Calculate Service Fee = Subtotal × 7.5%
    ↓
Calculate Total = Subtotal + Service Fee
    ↓
Store all 3 values in database
    ↓
Return booking with breakdown to user
```

### 2. Email Confirmation
When booking is confirmed:
- Email shows itemized breakdown
- Clearly displays 7.5% service fee
- Shows total amount user will pay

### 3. API Response Example
```json
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "userId": "user-uuid",
    "facilityId": "facility-uuid",
    "coachId": "coach-uuid",
    "bookingType": "both",
    "startTime": "2025-01-20T10:00:00Z",
    "endTime": "2025-01-20T12:00:00Z",
    "subtotal": "1200.00",
    "serviceFee": "90.00",
    "totalAmount": "1290.00",
    "status": "confirmed",
    "paymentStatus": "pending",
    ...
  }
}
```

## Service Fee Calculation Details

### Formula
```javascript
serviceFee = subtotal × 0.075
totalAmount = subtotal + serviceFee
```

### Precision
- All amounts stored as `DECIMAL(10, 2)`
- Service fee rounded to 2 decimal places
- Total amount rounded to 2 decimal places

### Examples

#### Example 1: Facility Only (₦600 for 2 hours)
```
Facility: ₦300/hour × 2 hours = ₦600.00
Subtotal:                        ₦600.00
Service Fee (7.5%):              ₦45.00
Total:                           ₦645.00
```

#### Example 2: Coach Only (₦200 for 3 hours)
```
Coach: ₦200/hour × 3 hours =     ₦600.00
Subtotal:                        ₦600.00
Service Fee (7.5%):              ₦45.00
Total:                           ₦645.00
```

#### Example 3: Both Facility + Coach
```
Facility: ₦400/hour × 2 hours =  ₦800.00
Coach: ₦200/hour × 2 hours =     ₦400.00
Subtotal:                        ₦1,200.00
Service Fee (7.5%):              ₦90.00
Total:                           ₦1,290.00
```

#### Example 4: Package Booking (₦5,000 package)
```
Package Price:                   ₦5,000.00
Subtotal:                        ₦5,000.00
Service Fee (7.5%):              ₦375.00
Total:                           ₦5,375.00
```

## Migration Instructions

### Step 1: Run Migration
```bash
cd /Users/henry/Desktop/Projects/gamedey/gamedeyserver

# Using Sequelize CLI
npx sequelize-cli db:migrate

# Or manually
psql -U postgres -d gamedey -f migrations/20250119-add-booking-service-fee.js
```

### Step 2: Verify Migration
```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('subtotal', 'serviceFee');

-- Check existing bookings updated
SELECT id, subtotal, "serviceFee", "totalAmount"
FROM bookings
LIMIT 5;
```

### Step 3: Test Booking Creation
```bash
# Create test booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "facilityId": "facility-uuid",
    "coachId": "coach-uuid",
    "sportId": "sport-uuid",
    "bookingType": "both",
    "startTime": "2025-01-20T10:00:00Z",
    "endTime": "2025-01-20T12:00:00Z",
    "participantsCount": 1
  }'
```

Expected response should show:
- `subtotal`: Base amount
- `serviceFee`: 7.5% of subtotal
- `totalAmount`: subtotal + serviceFee

## Frontend Display Recommendations

### Booking Summary Page
```
┌─────────────────────────────────────┐
│  Booking Summary                    │
├─────────────────────────────────────┤
│  Facility Fee:          ₦800.00     │
│  Coach Fee:             ₦400.00     │
│                                     │
│  Subtotal:            ₦1,200.00     │
│  Service Fee (7.5%):     ₦90.00     │
│  ─────────────────────────────      │
│  Total Amount:        ₦1,290.00     │
└─────────────────────────────────────┘
```

### Booking Confirmation
```
✓ Booking Confirmed

Booking #ABC123
Elite Sports Arena with Coach John

Date: January 20, 2025
Time: 10:00 AM - 12:00 PM
Duration: 2 hours

Payment Breakdown:
Subtotal:            ₦1,200.00
Service Fee (7.5%):     ₦90.00
─────────────────────────────
Total Paid:          ₦1,290.00

[View Booking Details]
```

## Testing Checklist

- [x] Migration adds columns successfully
- [x] Existing bookings updated correctly
- [x] New bookings calculate service fee
- [x] Service fee is exactly 7.5%
- [x] Email shows breakdown correctly
- [x] API response includes all fields
- [ ] Frontend displays breakdown
- [ ] Payment integration uses totalAmount
- [ ] Refund logic accounts for service fee

## Currency Display

All amounts use Nigerian Naira (NGN):
- Database stores decimal values
- Frontend formats with ₦ symbol
- Emails display as "NGN amount"

## Important Notes

1. **Service Fee is Non-Negotiable**: Always 7.5% of subtotal
2. **Precision**: All calculations rounded to 2 decimal places
3. **Existing Bookings**: Migration sets serviceFee = 0 for old bookings
4. **Refunds**: Consider service fee policy for cancellations
5. **Package Bookings**: Service fee also applies to packages

## Files Modified

1. `models/Booking.js` - Added subtotal and serviceFee fields
2. `controllers/BookingController.js` - Updated calculation logic
3. `utils/emailService.js` - Added fee parameters
4. `templates/emails/booking-confirmation.html` - Updated template
5. `migrations/20250119-add-booking-service-fee.js` - New migration

## Rollback Instructions

If needed, rollback the migration:
```bash
npx sequelize-cli db:migrate:undo
```

This will:
- Remove `subtotal` column
- Remove `serviceFee` column
- Preserve `totalAmount` column

---

**Implementation Date**: January 19, 2025
**Service Fee Rate**: 7.5%
**Status**: ✅ Ready for Testing
