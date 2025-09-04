#!/usr/bin/env node

// Simple Node.js script to setup admin user for production
const bcrypt = require('bcrypt');

const adminCredentials = {
  email: 'admin@sanadi.pro',
  password: 'yaserxp1992',
  firstName: 'System',
  lastName: 'Administrator'
};

console.log('✅ Admin credentials configured:');
console.log(`📧 Email: ${adminCredentials.email}`);
console.log(`🔑 Password: ${adminCredentials.password}`);
console.log(`👤 Name: ${adminCredentials.firstName} ${adminCredentials.lastName}`);
console.log('\n🌐 Admin login page: https://sanadi.pro/admin-login');
console.log('\nℹ️ Use these credentials when setting up the production database');