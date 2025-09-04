#!/usr/bin/env tsx

// Script to create initial admin user for Sanadi Pro platform
// Usage: tsx scripts/create-admin.ts [email] [password] [name]

import bcrypt from 'bcrypt';
import { storage } from '../server/storage.js';

async function createAdmin() {
  try {
    // Get arguments or use defaults
    const email = process.argv[2] || 'admin@sanadi.pro';
    const password = process.argv[3] || 'SanadiAdmin2025!';
    const name = process.argv[4] || 'Administrator';

    console.log('🔐 Creating admin user...');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if admin already exists
    try {
      const existing = await storage.getAdminUserByEmail(email);
      if (existing) {
        console.log('⚠️ Admin user already exists with this email!');
        console.log('⚠️ Admin user already exists! Exiting...');
        return;
      }
    } catch (error) {
      // Admin doesn't exist, continue with creation
    }

    // Create new admin user
    const adminData = {
      email,
      password: hashedPassword,
      firstName: name.split(' ')[0] || 'Admin',
      lastName: name.split(' ')[1] || 'User',
      role: 'super_admin' as const,
      isActive: true
    };

    await storage.createAdminUser(adminData);

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('🌐 You can now login at: https://sanadi.pro/admin-login');
    console.log('');
    console.log('⚠️ SECURITY NOTE: Change the default password after first login!');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
createAdmin();