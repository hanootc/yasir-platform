import 'dotenv/config';
import Database from 'better-sqlite3';
import { Client } from 'pg';

// إعدادات المصادر
const SQLITE_PATH = process.env.SQLITE_PATH || './local-dev.db';
const PG_URL = process.env.DATABASE_URL as string;

if (!PG_URL) {
  console.error('❌ متغير البيئة DATABASE_URL غير موجود. الرجاء ضبطه للاتصال بقاعدة PostgreSQL');
  process.exit(1);
}

async function migratePlatforms(sqlite: Database.Database, pg: Client) {
  console.log('▶️ بدء ترحيل جدول platforms ...');
  const rows = sqlite.prepare(`SELECT * FROM platforms`).all();
  console.log(`🔢 عدد المنصات المراد ترحيلها: ${rows.length}`);

  const insertSql = `
    INSERT INTO platforms (
      id, platform_name, business_type, owner_name, phone_number,
      whatsapp_number, contact_email, contact_phone, logo_url,
      password, subdomain, custom_domain,
      subscription_plan, status,
      primary_color, secondary_color,
      total_orders, total_revenue,
      tiktok_access_token, tiktok_advertiser_id,
      meta_access_token, meta_ad_account_id, meta_business_manager_id, meta_page_id, meta_token_expires_at,
      zaincash_merchant_id, zaincash_merchant_secret, zaincash_msisdn,
      subscription_start_date, subscription_end_date, last_active_at,
      user_id, admin_user_id,
      created_at, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,
      $10,$11,$12,
      $13,$14,
      $15,$16,
      $17,$18,
      $19,$20,
      $21,$22,$23,$24,$25,
      $26,$27,$28,
      $29,$30,$31,
      $32,$33,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      platform_name = EXCLUDED.platform_name,
      business_type = EXCLUDED.business_type,
      owner_name = EXCLUDED.owner_name,
      phone_number = EXCLUDED.phone_number,
      whatsapp_number = EXCLUDED.whatsapp_number,
      contact_email = EXCLUDED.contact_email,
      contact_phone = EXCLUDED.contact_phone,
      logo_url = EXCLUDED.logo_url,
      password = EXCLUDED.password,
      subdomain = EXCLUDED.subdomain,
      custom_domain = COALESCE(EXCLUDED.custom_domain, platforms.custom_domain),
      subscription_plan = EXCLUDED.subscription_plan,
      status = EXCLUDED.status,
      primary_color = EXCLUDED.primary_color,
      secondary_color = EXCLUDED.secondary_color,
      updated_at = NOW();
  `;

  let ok = 0, failed = 0;
  for (const r of rows) {
    // تعيين قيم افتراضية للحقول المطلوبة في PostgreSQL وغير موجودة في SQLite
    const platformName = r.name || r.platform_name || 'My Platform';
    const businessType = r.description || r.business_type || 'General';
    const ownerName = r.owner_name || platformName;
    const phoneNumber = r.phone_number || '964000000000'; // مطلوب not null
    const whatsappNumber = r.whatsapp_number || null;
    const contactEmail = r.contact_email || null;
    const contactPhone = r.contact_phone || null;
    const logoUrl = r.logo || r.logo_url || null;
    const password = r.password; // مفترض موجود
    const subdomain = r.subdomain || null;
    const customDomain = r.custom_domain || null;
    const subscriptionPlan = r.subscription_plan || 'free';
    const status = r.subscription_status || r.status || 'active';
    const primaryColor = r.primary_color || '#10B981';
    const secondaryColor = r.secondary_color || '#F3F4F6';
    const totalOrders = r.total_orders || 0;
    const totalRevenue = r.total_revenue || '0';

    try {
      await pg.query(insertSql, [
        r.id,
        platformName,
        businessType,
        ownerName,
        phoneNumber,
        whatsappNumber,
        contactEmail,
        contactPhone,
        logoUrl,
        password,
        subdomain,
        customDomain,
        subscriptionPlan,
        status,
        primaryColor,
        secondaryColor,
        totalOrders,
        totalRevenue,
        r.tiktok_access_token || null,
        r.tiktok_advertiser_id || null,
        r.meta_access_token || null,
        r.meta_ad_account_id || null,
        r.meta_business_manager_id || null,
        r.meta_page_id || null,
        r.meta_token_expires_at ? new Date(r.meta_token_expires_at * 1000) : null,
        r.zaincash_merchant_id || null,
        r.zaincash_merchant_secret || null,
        r.zaincash_msisdn || null,
        r.subscription_start_date ? new Date(r.subscription_start_date * 1000) : null,
        r.subscription_end_date ? new Date(r.subscription_end_date * 1000) : null,
        r.last_active_at ? new Date(r.last_active_at * 1000) : null,
        r.user_id || null,
        r.admin_user_id || null,
      ]);
      ok++;
    } catch (e:any) {
      failed++;
      console.error('❌ خطأ ترحيل منصة', r.id, e.message);
    }
  }
  console.log(`✅ تم ترحيل المنصات: ${ok}, فشل: ${failed}`);
}

async function main() {
  console.log('🚀 بدء عملية الترحيل من SQLite إلى PostgreSQL');
  const sqlite = new Database(SQLITE_PATH);
  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();

  try {
    await migratePlatforms(sqlite, pg);
  } finally {
    await pg.end();
    sqlite.close();
  }
  console.log('🎉 انتهت عملية الترحيل');
}

main().catch((e) => {
  console.error('❌ فشل الترحيل:', e);
  process.exit(1);
});
