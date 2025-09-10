import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the SQLite database
const dbPath = path.join(__dirname, 'local-dev.db');
const db = new Database(dbPath);

console.log('🔧 تطبيق migration لجدول platform_themes...');

try {
  // Create platform_themes table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS platform_themes (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      platform_id TEXT NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
      theme_id TEXT NOT NULL DEFAULT 'ocean-breeze',
      dark_mode INTEGER DEFAULT 0,
      custom_primary TEXT,
      custom_secondary TEXT,
      custom_accent TEXT,
      custom_gradient TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )
  `;
  
  db.exec(createTableSQL);
  console.log('✅ تم إنشاء جدول platform_themes بنجاح');
  
  // Check if Admin Platform exists and create default theme
  const adminPlatform = db.prepare('SELECT id FROM platforms WHERE name = ?').get('Admin Platform');
  
  if (adminPlatform) {
    console.log('🎨 إنشاء ثيم افتراضي للمنصة الإدارية...');
    
    // Check if theme already exists
    const existingTheme = db.prepare('SELECT id FROM platform_themes WHERE platform_id = ?').get(adminPlatform.id);
    
    if (!existingTheme) {
      const insertTheme = db.prepare(`
        INSERT INTO platform_themes (platform_id, theme_id, dark_mode)
        VALUES (?, ?, ?)
      `);
      
      insertTheme.run(adminPlatform.id, 'ocean-breeze', 0);
      console.log('✅ تم إنشاء الثيم الافتراضي للمنصة الإدارية');
    } else {
      console.log('ℹ️ الثيم موجود بالفعل للمنصة الإدارية');
    }
  } else {
    console.log('⚠️ لم يتم العثور على المنصة الإدارية');
  }
  
  console.log('🎉 تم تطبيق migration بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ في تطبيق migration:', error);
  process.exit(1);
} finally {
  db.close();
}
