// scripts/fix-booking-schema.js
// Run this script to fix the booking schema on Railway
// Usage: node scripts/fix-booking-schema.js

require('dotenv').config();
const { sequelize } = require('../models');

const fixBookingSchema = async () => {
  try {
    console.log('🔧 Starting booking schema fix...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${sequelize.config.database}`);

    // Check if columns exist
    const [columns] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      AND column_name IN ('subtotal', 'serviceFee')
      ORDER BY column_name;
    `);

    console.log('\n📊 Current column state:');
    console.table(columns);

    const hasSubtotal = columns.some(col => col.column_name === 'subtotal');
    const hasServiceFee = columns.some(col => col.column_name === 'serviceFee');

    // Step 1: Add columns if they don't exist
    if (!hasSubtotal) {
      console.log('\n➕ Adding subtotal column...');
      await sequelize.query(`
        ALTER TABLE bookings
        ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0.00;
      `);
    }

    if (!hasServiceFee) {
      console.log('➕ Adding serviceFee column...');
      await sequelize.query(`
        ALTER TABLE bookings
        ADD COLUMN "serviceFee" DECIMAL(10, 2) DEFAULT 0.00;
      `);
    }

    // Step 2: Update existing bookings
    console.log('\n🔄 Updating existing bookings...');
    const [updateResult] = await sequelize.query(`
      UPDATE bookings
      SET subtotal = "totalAmount",
          "serviceFee" = 0.00
      WHERE subtotal IS NULL OR subtotal = 0.00;
    `);
    console.log(`✅ Updated ${updateResult.rowCount || 0} bookings`);

    // Step 3: Make columns NOT NULL
    console.log('\n🔒 Setting NOT NULL constraints...');
    await sequelize.query(`
      ALTER TABLE bookings
      ALTER COLUMN subtotal SET NOT NULL;
    `);
    console.log('✅ subtotal is now NOT NULL');

    await sequelize.query(`
      ALTER TABLE bookings
      ALTER COLUMN "serviceFee" SET NOT NULL;
    `);
    console.log('✅ serviceFee is now NOT NULL');

    // Step 4: Add column comments
    console.log('\n📝 Adding column comments...');
    await sequelize.query(`
      COMMENT ON COLUMN bookings.subtotal
      IS 'Amount before service fee (facility + coach fees)';
    `);
    await sequelize.query(`
      COMMENT ON COLUMN bookings."serviceFee"
      IS '7.5% service fee on subtotal';
    `);

    // Step 5: Mark migration as complete
    console.log('\n📋 Recording migration...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY
      );
    `);
    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name)
      VALUES ('20250119-add-booking-service-fee.js')
      ON CONFLICT DO NOTHING;
    `);

    // Verify the fix
    console.log('\n✅ Verifying schema...');
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      AND column_name IN ('subtotal', 'serviceFee')
      ORDER BY column_name;
    `);
    console.table(finalColumns);

    const [bookingCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM bookings;'
    );
    console.log(`\n📊 Total bookings: ${bookingCount[0].count}`);

    console.log('\n✅ Schema fix completed successfully!');
    console.log('🚀 You can now deploy your application.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing schema:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
};

// Run the fix
fixBookingSchema();
