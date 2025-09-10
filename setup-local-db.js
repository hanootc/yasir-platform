#!/usr/bin/env node

// إعداد قاعدة بيانات محلية مبسطة لمنصة سندي برو
// يستخدم SQLite للتطوير السريع

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🗄️ إعداد قاعدة البيانات المحلية...');

// إنشاء ملف .env محلي مع SQLite
const localEnvContent = `# Sanadi Pro - Local Development Environment
# تم إنشاؤه تلقائياً للتطوير المحلي

# Database Configuration - SQLite للتطوير السريع
DATABASE_URL="file:./dev.db"

# Application Configuration
NODE_ENV="development"
PORT=5000
DOMAIN="http://localhost:5000"
FRONTEND_URL="http://localhost:5000"
BACKEND_URL="http://localhost:5000"

# Session Configuration
SESSION_SECRET="sanadi-pro-local-dev-secret-key-${Date.now()}"

# Payment Gateway Configuration
ZAINCASH_FORCE_SIMULATION=true
ZAINCASH_MSISDN=""
ZAINCASH_SECRET=""
ZAINCASH_MERCHANT_ID=""

# Social Media Platform API Keys (Optional)
TIKTOK_APP_ID=""
TIKTOK_SECRET=""
TIKTOK_ACCESS_TOKEN=""

# Facebook/Meta Configuration (Optional)
META_APP_ID=""
META_APP_SECRET=""
META_ACCESS_TOKEN=""

# OpenAI Configuration (Optional)
OPENAI_API_KEY=""

# Google Cloud Storage Configuration (Optional)
GOOGLE_CLOUD_PROJECT_ID=""
GOOGLE_CLOUD_BUCKET_NAME=""
GOOGLE_CLOUD_KEY_FILE=""

# WhatsApp Configuration
WHATSAPP_SESSION_PATH="./whatsapp-sessions"

# Development Settings
SERVE_STATIC=true
DEBUG=true
`;

try {
  // إنشاء ملف .env إذا لم يكن موجود
  if (!existsSync('.env')) {
    writeFileSync('.env', localEnvContent);
    console.log('✅ تم إنشاء ملف .env للتطوير المحلي');
  } else {
    console.log('ℹ️ ملف .env موجود بالفعل');
  }

  // إنشاء ملف drizzle.config.local.ts للـ SQLite
  const drizzleConfigLocal = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./dev.db",
  },
});
`;

  writeFileSync('drizzle.config.local.ts', drizzleConfigLocal);
  console.log('✅ تم إنشاء إعداد Drizzle للتطوير المحلي');

  console.log('\n🎉 تم إعداد قاعدة البيانات المحلية بنجاح!');
  console.log('\n📝 الخطوات التالية:');
  console.log('1. شغل: npm install');
  console.log('2. شغل: npm run db:push');
  console.log('3. شغل: npm run dev');
  console.log('4. افتح: http://localhost:3000');

} catch (error) {
  console.error('❌ خطأ في إعداد قاعدة البيانات:', error.message);
  process.exit(1);
}
