#!/usr/bin/env node

// إنشاء منصة admin-dashboard في قاعدة البيانات SQLite
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { platforms } from '../shared/schema-sqlite.ts';

const sqlite = new Database('./local-dev.db');
const db = drizzle(sqlite);

async function createAdminPlatform() {
  try {
    console.log('🏗️ Creating admin-dashboard platform...');
    
    await db.insert(platforms).values({
      subdomain: 'admin-dashboard',
      name: 'Admin Dashboard',
      description: 'Platform for admin dashboard and management'
    });
    
    console.log('✅ Admin platform created successfully!');
    console.log('📊 Platform details:');
    console.log('   - Subdomain: admin-dashboard');
    console.log('   - Name: Admin Dashboard');
    console.log('   - Description: Platform for admin dashboard and management');
    
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('⚠️ Admin platform already exists');
    } else {
      console.error('❌ Error creating admin platform:', error.message);
    }
  } finally {
    sqlite.close();
  }
}

createAdminPlatform();
