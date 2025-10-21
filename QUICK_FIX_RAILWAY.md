# Quick Fix for Railway Deployment

## The Problem
Your Railway deployment is failing with:
```
column "subtotal" of relation "bookings" contains null values
```

## The Solution (Choose One)

### ✅ EASIEST: One-Time Migration Deploy

1. **In your Railway dashboard**, go to your service settings
2. **Find "Start Command"** (or "Custom Start Command")
3. **Temporarily change it to**:
   ```
   npm run migrate && npm start
   ```
4. **Save and redeploy**
5. **Wait for deployment to succeed** (check logs to see "Schema fix completed successfully!")
6. **Change the start command back to**:
   ```
   npm start
   ```
7. **Done!** Your server should now work

### 🔧 Alternative: Using Railway CLI

If you have Railway CLI installed:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Run the migration script
railway run npm run migrate

# Redeploy
railway up
```

### 📝 Make Sure Railway Has These Environment Variables

In your Railway dashboard, ensure you have:

- `NODE_ENV` = `production` (IMPORTANT!)
- `DB_HOST` = (your Railway Postgres host)
- `DB_NAME` = (your database name)
- `DB_USER` = (your database user)
- `DB_PASSWORD` = (your database password)
- `JWT_SECRET` = (your JWT secret)
- `JWT_REFRESH_SECRET` = (your JWT refresh secret)
- `CLOUDINARY_CLOUD_NAME` = (your Cloudinary name)
- `CLOUDINARY_API_KEY` = (your Cloudinary key)
- `CLOUDINARY_API_SECRET` = (your Cloudinary secret)
- `FRONTEND_URL` = (your frontend URL)
- `SENDGRID_API_KEY` = (your SendGrid key)
- `SENDGRID_FROM_EMAIL` = (your sender email)
- `PAYSTACK_SECRET_KEY` = (your Paystack key)

**CRITICAL**: `NODE_ENV` MUST be set to `production` on Railway!

## What Changed in Your Code

The code has been updated to:
1. ✅ Only use `alter: true` sync in development
2. ✅ Added a `migrate` script to fix the database schema
3. ✅ Added a `start` script for production

## After the Fix

Once successful:
- ✅ Railway will start without errors
- ✅ Login will work on production
- ✅ All booking features will work correctly
- ✅ Future deployments will work smoothly

## Troubleshooting

If you still see errors:
1. Check Railway logs to confirm `NODE_ENV=production`
2. Verify the migration script ran successfully
3. Check that all environment variables are set
4. Try redeploying after the migration completes
