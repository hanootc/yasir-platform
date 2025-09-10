import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the SQLite database
const dbPath = path.join(__dirname, 'local-dev.db');
const db = new Database(dbPath);

console.log('🏢 إنشاء المنصة الإدارية...');

try {
  // Check if Admin Platform already exists
  const existingPlatform = db.prepare('SELECT id FROM platforms WHERE name = ?').get('Admin Platform');
  
  if (existingPlatform) {
    console.log('ℹ️ المنصة الإدارية موجودة بالفعل:', existingPlatform.id);
    
    // Create default theme for existing platform
    const existingTheme = db.prepare('SELECT id FROM platform_themes WHERE platform_id = ?').get(existingPlatform.id);
    
    if (!existingTheme) {
      const insertTheme = db.prepare(`
        INSERT INTO platform_themes (platform_id, theme_id, dark_mode)
        VALUES (?, ?, ?)
      `);
      
      insertTheme.run(existingPlatform.id, 'ocean-breeze', 0);
      console.log('✅ تم إنشاء الثيم الافتراضي للمنصة الإدارية');
    } else {
      console.log('ℹ️ الثيم موجود بالفعل للمنصة الإدارية');
    }
  } else {
    // Create new Admin Platform
    const insertPlatform = db.prepare(`
      INSERT INTO platforms (
        subdomain, 
        name, 
        description, 
        primary_color, 
        secondary_color, 
        accent_color,
        subscription_plan,
        subscription_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertPlatform.run(
      'admin',
      'Admin Platform',
      'منصة إدارة سندي برو',
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      'enterprise',
      'active'
    );
    
    console.log('✅ تم إنشاء المنصة الإدارية بنجاح:', result.lastInsertRowid);
    
    // Create default theme for new platform
    const insertTheme = db.prepare(`
      INSERT INTO platform_themes (platform_id, theme_id, dark_mode)
      VALUES (?, ?, ?)
    `);
    
    insertTheme.run(String(result.lastInsertRowid), 'ocean-breeze', 0);
    console.log('✅ تم إنشاء الثيم الافتراضي للمنصة الجديدة');
  }
  
  console.log('🎉 تم إعداد المنصة الإدارية والثيم بنجاح!');
  
} catch (error) {
  console.error('❌ خطأ في إنشاء المنصة الإدارية:', error);
  process.exit(1);
} finally {
  db.close();
}
