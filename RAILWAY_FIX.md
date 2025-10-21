# Fix Railway Database Schema

Your Railway deployment is failing because the production database needs a schema update. Here's how to fix it:

## Option 1: Using Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```

4. **Run the fix script on Railway**:
   ```bash
   railway run node scripts/fix-booking-schema.js
   ```

This will connect to your Railway database and fix the schema.

## Option 2: Using Railway Shell

1. Go to your Railway dashboard
2. Select your project
3. Click on your service
4. Go to the "Settings" tab
5. Scroll down and click "Open Shell"
6. Run:
   ```bash
   node scripts/fix-booking-schema.js
   ```

## Option 3: Temporary Deployment Script

1. **Update your `package.json`** to add a migration script:
   ```json
   "scripts": {
     "dev": "nodemon index.js",
     "migrate": "node scripts/fix-booking-schema.js",
     "test": "echo \"Error: no test specified\" && exit 1"
   }
   ```

2. **In Railway dashboard**:
   - Go to your service settings
   - Find "Deploy Command" or "Start Command"
   - Temporarily change it to: `npm run migrate && npm run dev`
   - Trigger a new deployment
   - After successful deployment, change the command back to just `npm run dev`

## Option 4: Connect to Railway Database Locally

1. **Get your Railway database credentials**:
   - Go to Railway dashboard
   - Click on your Postgres service
   - Copy the connection string from "Variables" tab

2. **Create a temporary `.env.production` file**:
   ```bash
   DATABASE_URL=your_railway_postgres_connection_string
   NODE_ENV=production
   ```

3. **Run the fix script locally** (connecting to Railway DB):
   ```bash
   node -r dotenv/config scripts/fix-booking-schema.js dotenv_config_path=.env.production
   ```

4. **Delete the `.env.production` file** after running (for security)

## What This Fix Does

The script will:
- ✅ Add `subtotal` and `serviceFee` columns if they don't exist
- ✅ Update existing bookings to have proper values
- ✅ Set NOT NULL constraints on the columns
- ✅ Add column comments
- ✅ Mark the migration as complete

## After the Fix

Once the schema is fixed:
1. Your Railway deployment should start successfully
2. The server will use `NODE_ENV=production` and skip the `alter: true` sync
3. Future deployments will work without issues

## Important Notes

- ⚠️ The code has been updated to NOT use `alter: true` in production
- ⚠️ Always use migrations for production schema changes
- ⚠️ The local database was already fixed
- ⚠️ This is a one-time fix for the Railway database
