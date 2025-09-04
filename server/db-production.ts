import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// إعداد قاعدة البيانات للإنتاج
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Example: postgresql://username:password@localhost:5432/database_name",
  );
}

// إنشاء pool اتصال PostgreSQL
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // الحد الأقصى لعدد الاتصالات
  idleTimeoutMillis: 30000, // إغلاق الاتصالات غير المستخدمة بعد 30 ثانية
  connectionTimeoutMillis: 2000, // مهلة انتظار الاتصال
});

export const db = drizzle(pool, { schema });