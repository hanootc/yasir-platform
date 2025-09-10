#!/usr/bin/env node

// Create admin user for SQLite database
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createAdmin() {
  try {
    // Get database path from environment
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './local-dev.db';
    const fullPath = path.resolve(dbPath);
    
    console.log(`🗄️ Connecting to database: ${fullPath}`);
    
    // Connect to SQLite database
    const db = new Database(fullPath);
    
    // Check if admin_users table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='admin_users'
    `).get();
    
    if (!tableExists) {
      console.log('❌ Table admin_users does not exist. Run npm run db:push first.');
      process.exit(1);
    }
    
    // Check if admin already exists
    const existingAdmin = db.prepare(`
      SELECT * FROM admin_users WHERE email = ?
    `).get('admin@sanadi.pro');
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists with email: admin@sanadi.pro');
      console.log('📧 Email: admin@sanadi.pro');
      console.log('🔑 Password: admin123');
      db.close();
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Generate UUID-like ID
    const adminId = crypto.randomBytes(16).toString('hex');
    
    // Insert admin user
    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (
        id, email, password, first_name, last_name, role, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = Math.floor(Date.now() / 1000); // Unix timestamp
    
    insertAdmin.run(
      adminId,
      'admin@sanadi.pro',
      hashedPassword,
      'مدير',
      'النظام',
      'super_admin',
      1, // true
      now,
      now
    );
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@sanadi.pro');
    console.log('🔑 Password: admin123');
    console.log('⚠️ Make sure to change the password after first login!');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
