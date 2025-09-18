const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const crypto = require('crypto');

async function createAdmin() {
  try {
    const db = new Database('/home/sanadi.pro/public_html/local-dev.db');
    
    // Generate a unique ID using crypto
    const adminId = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO admin_users 
      (id, email, password, first_name, last_name, role, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(adminId, 'admin@sanadi.pro', hashedPassword, 'مدير', 'النظام', 'super_admin', 1);
    
    console.log('✅ تم إنشاء حساب المدير بنجاح');
    console.log('📧 البريد الإلكتروني: admin@sanadi.pro');
    console.log('🔑 كلمة المرور: admin123');
    console.log('🆔 معرف المدير:', adminId);
    
    // Check if admin was created
    const checkStmt = db.prepare('SELECT * FROM admin_users WHERE email = ?');
    const admin = checkStmt.get('admin@sanadi.pro');
    
    if (admin) {
      console.log('✅ تم التحقق من إنشاء الحساب بنجاح');
    } else {
      console.log('❌ فشل في إنشاء الحساب');
    }
    
    db.close();
  } catch (error) {
    console.error('❌ خطأ في إنشاء حساب المدير:', error.message);
    console.error('تفاصيل الخطأ:', error);
  }
}

createAdmin();
