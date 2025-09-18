/*
  Comprehensive migration from SQLite (local-dev.db) to PostgreSQL.
  - Reads from SQLite using better-sqlite3
  - Writes to Postgres using pg Pool
  - Migrates core tables with field mapping:
    platforms, categories, products, landing_pages, landing_page_orders,
    orders, order_items, product_colors, product_shapes, product_sizes, product_variants,
    system_settings, admin_users (basic)

  Usage:
    DATABASE_URL=postgres://user:pass@host:5432/db SQLITE_PATH=/path/to/local-dev.db npx tsx scripts/migrate-all-sqlite-to-postgres.ts
*/
import 'dotenv/config';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

function logTable(title: string) { console.log(`\n==================== ${title} ====================`); }

const SQLITE_PATH = process.env.SQLITE_PATH || '/home/sanadi.pro/public_html/local-dev.db';
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL) {
  console.error('❌ DATABASE_URL is required');
  process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pool = new Pool({ connectionString: PG_URL });

async function migrateTable({
  source,
  target,
  columns,
  mapRow,
  afterInsert,
}: {
  source: string;
  target: string;
  columns: string[]; // target columns in PG
  mapRow: (row: any) => any | null; // returns object with target columns or null to skip
  afterInsert?: () => Promise<void>;
}) {
  logTable(`Migrating ${source} -> ${target}`);
  const rows = sqlite.prepare(`SELECT * FROM ${source}`).all();
  console.log(`🔢 Found ${rows.length} rows in ${source}`);

  if (rows.length === 0) return { inserted: 0, skipped: 0 };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Build INSERT statement with ON CONFLICT on id if present
    const hasId = columns.includes('id');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');
    const insertSql = `INSERT INTO ${target} (${columns.join(',')}) VALUES (${placeholders})` +
      (hasId ? ' ON CONFLICT (id) DO NOTHING' : '');

    let inserted = 0, skipped = 0;

    for (const r of rows) {
      const obj = mapRow(r);
      if (!obj) { skipped++; continue; }
      const values = columns.map((c) => (obj as any)[c] ?? null);
      try {
        // per-row savepoint to avoid aborting whole transaction
        await client.query('SAVEPOINT row_sp');
        await client.query(insertSql, values);
        inserted++;
      } catch (e) {
        await client.query('ROLLBACK TO SAVEPOINT row_sp');
        skipped++;
        console.warn(`⚠️ Skip row due to error:`, e instanceof Error ? e.message : e);
      }
    }

    if (afterInsert) {
      await afterInsert();
    }

    await client.query('COMMIT');
    console.log(`✅ Inserted: ${inserted}, Skipped: ${skipped} into ${target}`);
    return { inserted, skipped };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration failed for ${source}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

function asDate(val: any): Date | null {
  if (!val && val !== 0) return null;
  if (val instanceof Date) return val;
  // SQLite might store timestamps as seconds; convert if it looks like an int
  if (typeof val === 'number') {
    if (val > 1_000_000_000 && val < 3_000_000_000) {
      return new Date(val * 1000);
    }
    return new Date(val);
  }
  if (typeof val === 'string') {
    const n = Number(val);
    if (!Number.isNaN(n) && n > 1_000_000_000 && n < 3_000_000_000) return new Date(n * 1000);
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function asNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function asJson(val: any): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val; // assume JSON stored as string
  try { return JSON.stringify(val); } catch { return null; }
}

async function main() {
  console.log('🚀 بدء الترحيل الكامل من SQLite إلى PostgreSQL');

  // Build platform mapping between SQLite and PostgreSQL using subdomain
  // Detect if 'platform_name' exists in SQLite; fallback to 'name'
  const pragmaCols = sqlite.prepare("PRAGMA table_info(platforms)").all() as { name: string }[];
  const hasPlatformName = pragmaCols.some(c => c.name === 'platform_name');
  const hasName = pragmaCols.some(c => c.name === 'name');
  let selectSql = "SELECT id, subdomain, ";
  if (hasPlatformName) selectSql += "platform_name AS platform_name ";
  else if (hasName) selectSql += "name AS platform_name ";
  else selectSql += "id AS platform_name "; // extreme fallback
  selectSql += "FROM platforms";
  const sqlitePlatforms: { id: string; subdomain?: string; platform_name?: string }[] = sqlite
    .prepare(selectSql)
    .all();
  const sqliteIdToSub: Record<string, string> = {};
  const sqliteIdToName: Record<string, string> = {};
  for (const p of sqlitePlatforms) {
    if (p.id && p.subdomain) sqliteIdToSub[p.id] = p.subdomain;
    const nm = p.platform_name;
    if (p.id && nm) sqliteIdToName[p.id] = nm;
  }

  const pgClient0 = await pool.connect();
  const pgPlatRows = await pgClient0.query<{ id: string; subdomain: string; platform_name: string }>(
    'SELECT id, subdomain, platform_name FROM platforms'
  );
  pgClient0.release();
  const subToPgId: Record<string, string> = {};
  const nameToPgId: Record<string, string> = {};
  const pgIds = new Set<string>();
  for (const r of pgPlatRows.rows) {
    if (r.subdomain) subToPgId[r.subdomain] = r.id;
    if (r.platform_name) nameToPgId[r.platform_name] = r.id;
    if (r.id) pgIds.add(r.id);
  }

  function mapPlatformIdForPG(srcPlatformId: any): string | null {
    if (!srcPlatformId) return null;
    const val = String(srcPlatformId);
    // If already equals a PG platform id
    if (pgIds.has(val)) return val;
    // If it looks like a subdomain, map directly
    if (subToPgId[val]) return subToPgId[val];
    // If it is a SQLite platform id, map via its subdomain
    const sub = sqliteIdToSub[val];
    if (sub && subToPgId[sub]) return subToPgId[sub];
    // Heuristic: handle synthetic IDs like '<subdomain>-platform-001'
    const m = val.match(/^([a-z0-9\-]+)-platform-/i);
    if (m && subToPgId[m[1]]) return subToPgId[m[1]];
    const nm = sqliteIdToName[val];
    if (nm && nameToPgId[nm]) return nameToPgId[nm];
    return null;
  }

  // 1) platforms
  await migrateTable({
    source: 'platforms',
    target: 'platforms',
    columns: [
      'id','platform_name','business_type','owner_name','phone_number','whatsapp_number','contact_email','contact_phone',
      'logo_url','password','subdomain','custom_domain','subscription_plan','status','primary_color','secondary_color',
      'total_orders','total_revenue','store_template','tiktok_access_token','tiktok_advertiser_id','meta_access_token',
      'meta_ad_account_id','meta_business_manager_id','meta_page_id','meta_token_expires_at','zaincash_merchant_id',
      'zaincash_merchant_secret','zaincash_msisdn','subscription_start_date','subscription_end_date','last_active_at',
      'user_id','admin_user_id','created_at','updated_at'
    ],
    mapRow: (r) => {
      const platform_name = r.platform_name ?? r.name;
      const business_type = r.business_type ?? r.description ?? 'general';
      const owner_name = r.owner_name ?? 'Owner';
      const phone_number = r.phone_number ?? r.contact_phone ?? '00000000000';
      const password = r.password ?? '$2b$10$kH0Zr0i9d1u0M4m4lQ6o0eQmYQ7B4cI2E8TQGQeIYf0xXfTn1Qk.m'; // placeholder hash
      if (!platform_name || !business_type || !owner_name || !phone_number || !password) return null;
      return {
        id: r.id,
        platform_name,
        business_type,
        owner_name,
        phone_number,
        whatsapp_number: r.whatsapp_number ?? null,
        contact_email: r.contact_email ?? null,
        contact_phone: r.contact_phone ?? r.phoneNumber ?? null,
        logo_url: r.logo_url ?? r.logo ?? null,
        password,
        subdomain: r.subdomain,
        custom_domain: r.custom_domain ?? null,
        subscription_plan: r.subscription_plan ?? 'free',
        status: r.status ?? 'active',
        primary_color: r.primary_color ?? '#10B981',
        secondary_color: r.secondary_color ?? '#F3F4F6',
        total_orders: asNumber(r.total_orders) ?? 0,
        total_revenue: asNumber(r.total_revenue) ?? 0,
        store_template: r.store_template ?? 'grid',
        tiktok_access_token: r.tiktok_access_token ?? null,
        tiktok_advertiser_id: r.tiktok_advertiser_id ?? null,
        meta_access_token: r.meta_access_token ?? null,
        meta_ad_account_id: r.meta_ad_account_id ?? null,
        meta_business_manager_id: r.meta_business_manager_id ?? null,
        meta_page_id: r.meta_page_id ?? null,
        meta_token_expires_at: asDate(r.meta_token_expires_at),
        zaincash_merchant_id: r.zaincash_merchant_id ?? '5ffacf6612b5777c6d44266f',
        zaincash_merchant_secret: r.zaincash_merchant_secret ?? '$2y$10$hBbAZo2GfSSvyqAyV2SaqOfYewgYpfR1O19gIh4SqyGWdmySZYPuS',
        zaincash_msisdn: r.zaincash_msisdn ?? '964770000000',
        subscription_start_date: asDate(r.subscription_start_date) ?? asDate(r.created_at) ?? new Date(),
        subscription_end_date: asDate(r.subscription_end_date),
        last_active_at: asDate(r.last_active_at),
        user_id: r.user_id ?? null,
        admin_user_id: r.admin_user_id ?? null,
        created_at: asDate(r.created_at) ?? new Date(),
        updated_at: asDate(r.updated_at) ?? new Date(),
      };
    },
  });

  // Rebuild PG platforms mapping after migration in case new rows were inserted
  {
    const pgClient1 = await pool.connect();
    const pgPlatRows2 = await pgClient1.query<{ id: string; subdomain: string; platform_name: string }>(
      'SELECT id, subdomain, platform_name FROM platforms'
    );
    pgClient1.release();
    // reset and rebuild
    for (const k in subToPgId) delete subToPgId[k];
    for (const k in nameToPgId) delete nameToPgId[k];
    pgIds.clear();
    for (const r of pgPlatRows2.rows) {
      if (r.subdomain) subToPgId[r.subdomain] = r.id;
      if (r.platform_name) nameToPgId[r.platform_name] = r.id;
      if (r.id) pgIds.add(r.id);
    }
  }

  // 2) categories
  await migrateTable({
    source: 'categories',
    target: 'categories',
    columns: ['id','name','description','icon','platform_id','is_active','created_at','updated_at'],
    mapRow: (r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? null,
      icon: r.icon ?? null,
      platform_id: r.platform_id,
      is_active: r.is_active ?? 1,
      created_at: asDate(r.created_at) ?? new Date(),
      updated_at: asDate(r.updated_at) ?? new Date(),
    }),
  });

  // 3) products
  await migrateTable({
    source: 'products',
    target: 'products',
    columns: [
      'id','name','description','price','cost','stock','low_stock_threshold','sku','category_id','platform_id',
      'image_urls','additional_images','offers','price_offers','two_item_price','three_item_price','bulk_price','bulk_min_quantity',
      'default_landing_template','is_active','created_by','created_at','updated_at'
    ],
    mapRow: (r) => {
      const parseArray = (val: any): string[] | null => {
        if (!val) return null;
        if (Array.isArray(val)) return val.map(String);
        try { const a = JSON.parse(val); return Array.isArray(a) ? a.map(String) : null; } catch { return null; }
      };
      const mappedPlatformId = mapPlatformIdForPG(r.platform_id);
      if (!mappedPlatformId) {
        console.warn(`⚠️ Skip product ${r.id}: cannot resolve platform_id ${r.platform_id}`);
        return null;
      }
      return {
        id: r.id,
        name: r.name,
        description: r.description ?? null,
        price: asNumber(r.price) ?? 0,
        cost: asNumber(r.cost_per_item) ?? null,
        stock: asNumber(r.quantity) ?? 0,
        low_stock_threshold: asNumber(r.low_stock_threshold) ?? 5,
        sku: r.sku ?? null,
        category_id: r.category_id ?? null,
        platform_id: mappedPlatformId,
        image_urls: parseArray(r.image_urls ?? r.images) ?? [],
        additional_images: parseArray(r.additional_images) ?? [],
        offers: parseArray(r.offers) ?? null,
        price_offers: r.price_offers ? JSON.parse(r.price_offers) : null,
        two_item_price: asNumber(r.two_item_price) ?? null,
        three_item_price: asNumber(r.three_item_price) ?? null,
        bulk_price: asNumber(r.bulk_price) ?? null,
        bulk_min_quantity: asNumber(r.bulk_min_quantity) ?? 4,
        default_landing_template: r.default_landing_template ?? 'modern_minimal',
        is_active: r.is_active ?? 1,
        created_by: r.created_by ?? null,
        created_at: asDate(r.created_at) ?? new Date(),
        updated_at: asDate(r.updated_at) ?? new Date(),
      };
    },
  });

  // 4) landing_pages
  await migrateTable({
    source: 'landing_pages',
    target: 'landing_pages',
    columns: ['id','product_id','platform_id','slug','custom_url','title','description','created_at','updated_at'],
    mapRow: (r) => ({
      id: r.id,
      product_id: r.product_id,
      platform_id: r.platform_id,
      slug: r.slug ?? r.id,
      custom_url: r.custom_url ?? null,
      title: r.title ?? null,
      description: r.description ?? null,
      created_at: asDate(r.created_at) ?? new Date(),
      updated_at: asDate(r.updated_at) ?? new Date(),
    }),
  });

  // 5) landing_page_orders
  await migrateTable({
    source: 'landing_page_orders',
    target: 'landing_page_orders',
    columns: [
      'id','order_number','customer_name','customer_phone','customer_governorate','customer_address','total_amount','discount_amount',
      'status','created_at','platform_id','offer','notes','quantity','landing_page_id','selected_color_id','selected_shape_id','selected_size_id'
    ],
    mapRow: (r) => ({
      id: r.id,
      order_number: r.order_number ?? r.id,
      customer_name: r.customer_name ?? null,
      customer_phone: r.customer_phone ?? null,
      customer_governorate: r.customer_governorate ?? null,
      customer_address: r.customer_address ?? null,
      total_amount: asNumber(r.total_amount) ?? 0,
      discount_amount: asNumber(r.discount_amount) ?? 0,
      status: r.status ?? 'pending',
      created_at: asDate(r.created_at) ?? new Date(),
      platform_id: r.platform_id,
      offer: r.offer ?? null,
      notes: r.notes ?? null,
      quantity: asNumber(r.quantity) ?? 1,
      landing_page_id: r.landing_page_id ?? null,
      selected_color_id: r.selected_color_id ?? null,
      selected_shape_id: r.selected_shape_id ?? null,
      selected_size_id: r.selected_size_id ?? null,
    }),
  });

  // 6) orders
  await migrateTable({
    source: 'orders',
    target: 'orders',
    columns: ['id','order_number','customer_name','customer_phone','customer_governorate','customer_address','total','discount_amount','status','created_at','platform_id','notes'],
    mapRow: (r) => ({
      id: r.id,
      order_number: r.order_number ?? r.id,
      customer_name: r.customer_name ?? null,
      customer_phone: r.customer_phone ?? null,
      customer_governorate: r.customer_governorate ?? null,
      customer_address: r.customer_address ?? null,
      total: asNumber(r.total) ?? 0,
      discount_amount: asNumber(r.discount_amount) ?? 0,
      status: r.status ?? 'pending',
      created_at: asDate(r.created_at) ?? new Date(),
      platform_id: r.platform_id,
      notes: r.notes ?? null,
    }),
  });

  // 7) order_items
  await migrateTable({
    source: 'order_items',
    target: 'order_items',
    columns: ['id','order_id','product_id','quantity','price','offer'],
    mapRow: (r) => ({
      id: r.id,
      order_id: r.order_id,
      product_id: r.product_id,
      quantity: asNumber(r.quantity) ?? 1,
      price: asNumber(r.price) ?? 0,
      offer: r.offer ?? null,
    }),
  });

  // 8) product_colors
  // Build PG products map: product_id -> platform_id
  const pgProductsMap: Record<string, string> = {};
  {
    const client = await pool.connect();
    try {
      const r = await client.query<{ id: string; platform_id: string }>(
        'SELECT id, platform_id FROM products'
      );
      for (const row of r.rows) {
        if (row.id && row.platform_id) pgProductsMap[row.id] = row.platform_id;
      }
    } finally {
      client.release();
    }
  }
  await migrateTable({
    source: 'product_colors',
    target: 'product_colors',
    columns: ['id','product_id','platform_id','color_name','color_code','color_image_url','price_adjustment','stock_quantity','is_active','sort_order','created_at','updated_at'],
    mapRow: (r) => {
      // Always derive platform from PG product to guarantee FK
      const mappedPlatformId = r.product_id ? pgProductsMap[r.product_id] : null;
      if (!mappedPlatformId) return null;
      return {
        id: r.id,
        product_id: r.product_id,
        platform_id: mappedPlatformId,
        color_name: r.color_name ?? r.name ?? '',
        color_code: r.color_code ?? r.hex_code ?? null,
        color_image_url: r.color_image_url ?? null,
        price_adjustment: asNumber(r.price_adjustment) ?? 0,
        stock_quantity: asNumber(r.stock_quantity) ?? 0,
        is_active: r.is_active ?? 1,
        sort_order: asNumber(r.sort_order) ?? 0,
        created_at: asDate(r.created_at) ?? new Date(),
        updated_at: asDate(r.updated_at) ?? new Date(),
      };
    },
  });

  // 9) product_shapes
  await migrateTable({
    source: 'product_shapes',
    target: 'product_shapes',
    columns: ['id','product_id','platform_id','shape_name','shape_description','shape_image_url','price_adjustment','stock_quantity','is_active','sort_order','created_at','updated_at'],
    mapRow: (r) => ({
      id: r.id,
      product_id: r.product_id,
      platform_id: r.platform_id,
      shape_name: r.shape_name ?? r.name ?? '',
      shape_description: r.description ?? null,
      shape_image_url: r.shape_image_url ?? null,
      price_adjustment: asNumber(r.price_adjustment) ?? 0,
      stock_quantity: asNumber(r.stock_quantity) ?? 0,
      is_active: r.is_active ?? 1,
      sort_order: asNumber(r.sort_order) ?? 0,
      created_at: asDate(r.created_at) ?? new Date(),
      updated_at: asDate(r.updated_at) ?? new Date(),
    }),
  });

  // 10) product_sizes
  await migrateTable({
    source: 'product_sizes',
    target: 'product_sizes',
    columns: ['id','product_id','platform_id','size_name','size_value','size_description','price_adjustment','stock_quantity','is_active','sort_order','created_at','updated_at'],
    mapRow: (r) => ({
      id: r.id,
      product_id: r.product_id,
      platform_id: r.platform_id,
      size_name: r.size_name ?? r.name ?? '',
      size_value: r.size_value ?? null,
      size_description: r.size_description ?? r.description ?? null,
      price_adjustment: asNumber(r.price_adjustment) ?? 0,
      stock_quantity: asNumber(r.stock_quantity) ?? 0,
      is_active: r.is_active ?? 1,
      sort_order: asNumber(r.sort_order) ?? 0,
      created_at: asDate(r.created_at) ?? new Date(),
      updated_at: asDate(r.updated_at) ?? new Date(),
    }),
  });

  // 11) product_variants
  await migrateTable({
    source: 'product_variants',
    target: 'product_variants',
    columns: ['id','product_id','platform_id','color_id','shape_id','size_id','variant_name','sku','price','cost','stock_quantity','low_stock_threshold','image_urls','is_active','is_default','created_at','updated_at'],
    mapRow: (r) => ({
      id: r.id,
      product_id: r.product_id,
      platform_id: r.platform_id,
      color_id: r.color_id ?? null,
      shape_id: r.shape_id ?? null,
      size_id: r.size_id ?? null,
      variant_name: r.variant_name ?? null,
      sku: r.sku ?? null,
      price: asNumber(r.price) ?? 0,
      cost: asNumber(r.cost) ?? null,
      stock_quantity: asNumber(r.stock_quantity) ?? 0,
      low_stock_threshold: asNumber(r.low_stock_threshold) ?? 5,
      image_urls: asJson(r.image_urls ?? []),
      is_active: r.is_active ?? 1,
      is_default: r.is_default ?? 0,
      created_at: asDate(r.created_at) ?? new Date(),
      updated_at: asDate(r.updated_at) ?? new Date(),
    }),
  });

  // 12) system_settings
  await migrateTable({
    source: 'system_settings',
    target: 'system_settings',
    columns: ['id','setting_key','setting_value','description','created_at','updated_at'],
    mapRow: (r) => ({
      id: r.id,
      setting_key: r.setting_key ?? r.key ?? null,
      setting_value: r.setting_value ?? r.value ?? null,
      description: r.description ?? null,
      created_at: asDate(r.created_at) ?? new Date(),
      updated_at: asDate(r.updated_at) ?? new Date(),
    }),
  });

  // 13) admin_users (basic fields)
  await migrateTable({
    source: 'admin_users',
    target: 'admin_users',
    columns: ['id','email','password','first_name','last_name','role','is_active','last_login_at','created_at','updated_at'],
    mapRow: (r) => ({
      id: r.id,
      email: r.email,
      password: r.password,
      first_name: r.first_name ?? r.firstName ?? null,
      last_name: r.last_name ?? r.lastName ?? null,
      role: r.role ?? 'super_admin',
      is_active: r.is_active ?? 1,
      last_login_at: asDate(r.last_login_at),
      created_at: asDate(r.created_at) ?? new Date(),
      updated_at: asDate(r.updated_at) ?? new Date(),
    }),
  });

  console.log('\n🎉 اكتمل الترحيل الكامل بنجاح');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
