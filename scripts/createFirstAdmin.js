// scripts/createFirstAdmin.js
// Run this script to create your first admin account

const { Admin } = require('../models');
const bcrypt = require('bcryptjs');

const createFirstAdmin = async () => {
  try {
    console.log('🔧 Creating first admin account...');

    // Check if any admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('❌ Admin account already exists');
      return;
    }

    // Create the first super admin
    const admin = await Admin.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@gamedey.com',
      password: 'AdminPassword123!', // Will be hashed automatically by the model
      role: 'super_admin',
      permissions: [
        'create_admin',
        'manage_users', 
        'moderate_content',
        'view_analytics',
        'manage_coaches',
        'manage_facilities'
      ],
      status: 'active'
    });

    console.log('✅ First admin created successfully!');
    console.log('📧 Email: admin@gamedey.com');
    console.log('🔑 Password: AdminPassword123!');
    console.log('👑 Role: super_admin');
    
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
};

// Run the script if called directly
if (require.main === module) {
  createFirstAdmin().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = createFirstAdmin;

// =======================================
// HOW TO USE THIS SCRIPT:
// =======================================
// 
// 1. Save this file as scripts/createFirstAdmin.js
// 
// 2. Run from your project root:
//    node scripts/createFirstAdmin.js
//
// 3. Or add to package.json scripts:
//    "scripts": {
//      "create-admin": "node scripts/createFirstAdmin.js"
//    }
//    Then run: npm run create-admin
//
// =======================================

// =======================================
// POSTMAN ALTERNATIVE:
// =======================================
// If you prefer Postman, create a POST request:
//
// URL: http://localhost:3000/admin/admins
// Method: POST
// Headers: 
//   Content-Type: application/json
//   Authorization: Bearer <super_admin_token> (if you have one)
//
// Body (JSON):
// {
//   "firstName": "Super",
//   "lastName": "Admin", 
//   "email": "admin@gamedey.com",
//   "password": "AdminPassword123!",
//   "role": "super_admin",
//   "permissions": [
//     "create_admin",
//     "manage_users",
//     "moderate_content", 
//     "view_analytics"
//   ]
// }
//
// Note: You'll need to temporarily disable authentication 
// for the create admin route, or use the script above instead.
// =======================================