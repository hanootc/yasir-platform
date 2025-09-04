#!/usr/bin/env node

// Production build script that bypasses vite.config.ts Replit dependencies
// This script builds the frontend and backend separately for standalone deployment

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('🏗️ Building Sanadi Pro for standalone deployment...');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  execSync('rm -rf dist client/dist', { stdio: 'inherit' });

  // Create dist directory
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }

  // Build frontend with basic Vite setup (no Replit plugins)
  console.log('🎨 Building frontend...');
  
  // Create minimal vite.config.prod.ts
  const minimalViteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./client/src"),
      "@lib": resolve(__dirname, "./client/src/lib"),
      "@components": resolve(__dirname, "./client/src/components"),
      "@assets": resolve(__dirname, "./attached_assets"),
      "@shared": resolve(__dirname, "./shared"),
    }
  },
  root: './client',
  base: '/'
});
`;

  writeFileSync('vite.config.prod.ts', minimalViteConfig);
  
  // Build with the minimal config
  execSync('npx vite build --config vite.config.prod.ts', { stdio: 'inherit' });
  
  // Remove temporary config
  execSync('rm vite.config.prod.ts', { stdio: 'inherit' });

  // Build backend
  console.log('⚙️ Building backend...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node20', { stdio: 'inherit' });

  // Create production .env file with all defaults
  console.log('🔧 Creating production environment file...');
  const productionEnv = `# Sanadi Pro Production Environment
# Generated on ${new Date().toISOString()}

# Database Configuration
DATABASE_URL="postgresql://app.sanadi.pro:%40yaserxp1992@localhost:5432/sanadi_pro"

# Application Configuration
NODE_ENV="production"
PORT=5000
DOMAIN="https://app.sanadi.pro"
FRONTEND_URL="https://app.sanadi.pro"
BACKEND_URL="https://app.sanadi.pro"

# Session Configuration
SESSION_SECRET="sanadi-pro-super-secret-session-key-2025"

# Payment Gateway Configuration
ZAINCASH_FORCE_SIMULATION=true
ZAINCASH_MSISDN=""
ZAINCASH_SECRET=""
ZAINCASH_MERCHANT_ID=""

# Social Media Platform API Keys (Optional - Add when needed)
TIKTOK_APP_ID=""
TIKTOK_SECRET=""
TIKTOK_ACCESS_TOKEN=""

# Facebook/Meta Configuration (Optional - Add when needed)
META_APP_ID=""
META_APP_SECRET=""
META_ACCESS_TOKEN=""

# OpenAI Configuration (Optional - Add when needed)
OPENAI_API_KEY=""

# Google Cloud Storage Configuration (Optional - Add when needed)
GOOGLE_CLOUD_PROJECT_ID=""
GOOGLE_CLOUD_BUCKET_NAME=""
GOOGLE_CLOUD_KEY_FILE=""

# WhatsApp Configuration
WHATSAPP_SESSION_PATH="./whatsapp-sessions"

# Static File Serving
SERVE_STATIC=true
`;

  writeFileSync('dist/.env', productionEnv);

  // Create proper PM2 ecosystem config
  console.log('⚙️ Creating PM2 configuration...');
  const pm2Config = `module.exports = {
  apps: [{
    name: 'sanadi-pro',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: './.env',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
`;

  writeFileSync('dist/ecosystem.config.cjs', pm2Config);

  // Copy necessary files
  console.log('📋 Copying configuration files...');
  execSync('cp package.json dist/', { stdio: 'inherit' });
  
  // Create startup script
  const startupScript = `#!/bin/bash
# Production startup script for Sanadi Pro on AlmaLinux 9

echo "🚀 Starting Sanadi Pro deployment..."

cd "$(dirname "$0")"

# Create logs directory
mkdir -p logs
mkdir -p whatsapp-sessions

# Install production dependencies only
echo "📦 Installing dependencies..."
npm ci --omit=dev

# Stop any existing instance
echo "🛑 Stopping any existing instance..."
pm2 delete sanadi-pro 2>/dev/null || true

# Start with PM2 using .cjs config
echo "▶️ Starting application..."
pm2 start ecosystem.config.cjs
pm2 save

echo "\n✅ Sanadi Pro deployed successfully!"
echo "🌐 Application running on: http://localhost:5000"
echo "📊 Monitor with: pm2 monit"
echo "📜 Logs: pm2 logs sanadi-pro"
echo "🔄 Restart: pm2 restart sanadi-pro"
echo "🛑 Stop: pm2 stop sanadi-pro"

# Show status
pm2 status
`;

  writeFileSync('dist/start-production.sh', startupScript);
  execSync('chmod +x dist/start-production.sh');

  // Create admin creation script
  console.log('👤 Creating admin setup script...');
  const adminScript = `#!/bin/bash
# Create admin user for Sanadi Pro

echo "👤 Creating admin user..."
node -e "
const bcrypt = require('bcrypt');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { neon } = require('@neondatabase/serverless');
const { adminUsers } = require('./shared/schema.js');

require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.insert(adminUsers).values({
      email: 'admin@sanadi.pro',
      name: 'Administrator',
      password: hashedPassword,
      role: 'super_admin'
    }).onConflictDoNothing();
    console.log('✅ Admin user created: admin@sanadi.pro / admin123');
  } catch (error) {
    console.log('⚠️ Admin user may already exist');
  }
}

createAdmin();
"

echo "✅ Admin setup completed!"
echo "📧 Email: admin@sanadi.pro"
echo "🔑 Password: admin123"
`;

  writeFileSync('dist/create-admin.sh', adminScript);
  execSync('chmod +x dist/create-admin.sh');

  console.log('\n✅ Standalone build completed successfully!');
  console.log('📁 Files ready in ./dist/');
  console.log('\n🚀 DEPLOYMENT INSTRUCTIONS:');
  console.log('1. Copy ./dist/ folder to your AlmaLinux 9 server');
  console.log('2. Run: chmod +x *.sh');
  console.log('3. Run: ./start-production.sh');
  console.log('4. Run: ./create-admin.sh (to create admin user)');
  console.log('5. Visit: http://your-server-ip:5000');
  console.log('\n📝 Login: admin@sanadi.pro / admin123');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}