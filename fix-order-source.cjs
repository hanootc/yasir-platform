#!/usr/bin/env node

// ملف إصلاح سريع لمشكلة عرض مصدر الطلب
console.log('🔧 بدء إصلاح مشكلة مصدر الطلب...');

// التحقق من أن قاعدة البيانات تحتوي على البيانات الصحيحة
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://sanad:yaserxp1992@127.0.0.1:5432/sanadi_db'
});

async function checkOrderSources() {
  try {
    console.log('📊 فحص مصادر الطلبات في قاعدة البيانات...');
    
    const result = await pool.query(`
      SELECT order_number, customer_name, order_source, source_details 
      FROM landing_page_orders 
      WHERE order_source != 'landing_page' AND order_source IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`✅ تم العثور على ${result.rows.length} طلبات مع مصادر مخصصة:`);
    
    result.rows.forEach(row => {
      console.log(`  📦 طلب #${row.order_number}: ${row.customer_name}`);
      console.log(`     📍 المصدر: ${row.order_source}`);
      console.log(`     📝 التفاصيل: ${row.source_details || 'لا توجد'}`);
      console.log('');
    });
    
    console.log('🎯 المشكلة: API لا يرجع هذه البيانات بسبب عدم تحديث الخادم');
    console.log('💡 الحل: إعادة تشغيل الخادم الرئيسي بالكود المحدث');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrderSources();
