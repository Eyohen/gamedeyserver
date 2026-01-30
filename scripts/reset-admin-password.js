/**
 * Script to reset admin password
 * Run: node scripts/reset-admin-password.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

async function resetAdminPassword() {
  const email = 'admin@gamedey.com';
  const newPassword = 'Admin123!';  // Change this to your desired password

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the admin's password (case-insensitive email match)
    const [results, metadata] = await sequelize.query(
      `UPDATE admins SET password = :password, "updatedAt" = NOW() WHERE LOWER(email) = LOWER(:email)`,
      {
        replacements: { password: hashedPassword, email: email }
      }
    );
    const updatedRows = metadata?.rowCount || metadata;

    if (updatedRows > 0) {
      console.log('✅ Password reset successfully!');
      console.log(`   Email: ${email}`);
      console.log(`   New Password: ${newPassword}`);
    } else {
      console.log('❌ Admin not found with email:', email);

      // Check if admin exists
      const [admins] = await sequelize.query(
        `SELECT id, email, "firstName", "lastName" FROM admins LIMIT 5`
      );

      if (admins.length > 0) {
        console.log('\nExisting admins:');
        admins.forEach(admin => {
          console.log(`  - ${admin.email} (${admin.firstName} ${admin.lastName})`);
        });
      } else {
        console.log('\nNo admin accounts found. Creating one...');

        // Create new admin
        await sequelize.query(
          `INSERT INTO admins (id, "firstName", "lastName", email, password, role, permissions, status, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), 'Admin', 'User', :email, :password, 'super_admin', '[]', 'active', NOW(), NOW())`,
          {
            replacements: { email: email, password: hashedPassword }
          }
        );
        console.log('✅ Admin account created!');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${newPassword}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

resetAdminPassword();
