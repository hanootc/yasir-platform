import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Subscription plans enum
export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "basic", 
  "premium",
  "enterprise"
]);

// Platform status enum
export const platformStatusEnum = pgEnum("platform_status", [
  "active",
  "suspended", 
  "pending_verification",
  "pending_payment",
  "cancelled",
  "expired"
]);

// Payment status enum
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success", 
  "completed",
  "failed",
  "cancelled"
]);

// Platform themes enum
export const platformThemeEnum = pgEnum("platform_theme", [
  "ocean-breeze",
  "ocean-blue", 
  "pink-coral",
  "sunset-orange",
  "royal-purple",
  "emerald-green",
  "ruby-red",
  "golden-amber",
  "sapphire-blue",
  "forest-green"
]);

// Platform themes table - Independent theme system for each platform
export const platformThemes = pgTable("platform_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  themeId: platformThemeEnum("theme_id").notNull().default("ocean-breeze"),
  darkMode: boolean("dark_mode").default(false),
  // Custom theme variables (optional)
  customPrimary: varchar("custom_primary"), // HSL format: "168 91% 44%"
  customSecondary: varchar("custom_secondary"),
  customAccent: varchar("custom_accent"),
  customGradient: text("custom_gradient"), // Full gradient CSS
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_platform_theme").on(table.platformId), // Each platform has one theme
]);

// Platforms table - Multi-tenant support
export const platforms = pgTable("platforms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformName: varchar("platform_name").notNull(),
  businessType: varchar("business_type").notNull(),
  ownerName: varchar("owner_name").notNull(),
  phoneNumber: varchar("phone_number").notNull(),
  whatsappNumber: varchar("whatsapp_number"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  logoUrl: varchar("logo_url"),
  password: varchar("password").notNull(),
  subdomain: varchar("subdomain").unique(), // ahmed.platform.com
  customDomain: varchar("custom_domain").unique(), // ahmed-shop.com (مستقبلاً)
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").default("free"),
  status: platformStatusEnum("status").default("pending_verification"),
  // إعدادات العلامة التجارية
  primaryColor: varchar("primary_color").default("#10B981"), // أخضر افتراضي
  secondaryColor: varchar("secondary_color").default("#F3F4F6"),
  // إحصائيات
  totalOrders: integer("total_orders").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  // Store template setting
  storeTemplate: varchar("store_template").default("grid"), // grid, list, catalog
  // Store banner image
  storeBannerUrl: varchar("store_banner_url"),
  // إعدادات TikTok Ads
  tiktokAccessToken: varchar("tiktok_access_token"),
  tiktokAdvertiserId: varchar("tiktok_advertiser_id"),
  // إعدادات Meta/Facebook Ads
  metaAccessToken: varchar("meta_access_token"),
  metaAdAccountId: varchar("meta_ad_account_id"),
  metaBusinessManagerId: varchar("meta_business_manager_id"),
  metaPageId: varchar("meta_page_id"),
  metaTokenExpiresAt: timestamp("meta_token_expires_at"),
  // إعدادات زين كاش للدفع
  zaincashMerchantId: varchar("zaincash_merchant_id").default("5ffacf6612b5777c6d44266f"),
  zaincashMerchantSecret: varchar("zaincash_merchant_secret").default("$2y$10$hBbAZo2GfSSvyqAyV2j8Kup\u002ELBbxpGIIlIAmCKxFo0OC1Zr3WeZF2"),
  zaincashMsisdn: varchar("zaincash_msisdn").default("964770000000"),
  // تواريخ مهمة
  subscriptionStartDate: timestamp("subscription_start_date").defaultNow(),
  subscriptionEndDate: timestamp("subscription_end_date"),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  userId: varchar("user_id"), // معرف المستخدم (اختياري للتوافق مع النظام القديم)
  adminUserId: varchar("admin_user_id").references(() => adminUsers.id), // ربط بالنظام الجديد
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User roles enum
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",    // إدارة النظام العامة
  "platform_owner", // مالك المنصة  
  "platform_admin", // مدير المنصة
  "platform_staff"  // موظف في المنصة
]);

// Subscription plan features
export const subscriptionFeatures = pgTable("subscription_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plan: subscriptionPlanEnum("plan").notNull(),
  featureName: varchar("feature_name").notNull(),
  featureKey: varchar("feature_key").notNull(), // للاستخدام البرمجي
  isEnabled: boolean("is_enabled").default(true),
  limitValue: integer("limit_value"), // حد الاستخدام (-1 = لا محدود)
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin actions log
export const adminActionsLog = pgTable("admin_actions_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => adminUsers.id),
  action: varchar("action").notNull(), // extend_subscription, suspend_platform, etc
  targetType: varchar("target_type").notNull(), // platform, user, subscription
  targetId: varchar("target_id").notNull(),
  oldValue: jsonb("oldvalue"),
  newValue: jsonb("newvalue"),
  reason: text("reason"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform permissions
export const platformPermissions = pgTable("platform_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id),
  permission: varchar("permission").notNull(), // custom_domain, api_access, advanced_analytics
  isGranted: boolean("is_granted").default(false),
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users table - Independent admin system
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: userRoleEnum("role").default("super_admin"),
  isActive: boolean("is_active").default(true),
  phone: varchar("phone"),
  address: text("address"),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for the new admin system
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type SelectAdminUser = typeof adminUsers.$inferSelect;

// User storage table for Replit Auth (kept for backward compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("platform_staff"),
  platformId: varchar("platform_id").references(() => platforms.id), // null للمدراء العامين
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Landing page templates enum
export const landingPageTemplateEnum = pgEnum("landing_page_template", [
  "modern_minimal",
  "bold_hero",
  "product_showcase",
  "testimonial_focus",
  "feature_highlight",
  "countdown_urgency",
  "colorful_vibrant",
  "tiktok_style",
]);

// Product categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // الاسم العربي
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  googleCategory: varchar("google_category", { length: 255 }), // Google Product Category الإنجليزي
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertCategory = typeof categories.$inferInsert;
export type SelectCategory = typeof categories.$inferSelect;

// WhatsApp Sessions table
export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id),
  phoneNumber: varchar("phone_number").notNull(),
  isConnected: boolean("is_connected").default(false).notNull(),
  qrCode: text("qr_code"),
  sessionData: text("session_data"), 
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertWhatsAppSession = typeof whatsappSessions.$inferInsert;
export type SelectWhatsAppSession = typeof whatsappSessions.$inferSelect;

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  sku: varchar("sku").unique(),
  slug: varchar("slug").unique(),
  defaultTheme: varchar("default_theme").default("light"),
  categoryId: varchar("category_id").references(() => categories.id),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  imageUrls: text("image_urls").array(),
  additionalImages: text("additional_images").array(), // صور إضافية تظهر أسفل وصف المنتج
  offers: text("offers").array(), // قائمة العروض مثل ["قطعة واحدة", "قطعتين", "ثلاث قطع"]
  // نظام العروض المرن - JSON array يحتوي على: [{quantity: 1, price: 50000, label: "قطعة واحدة"}, {quantity: 20, price: 800000, label: "20 حبة"}]
  priceOffers: jsonb("price_offers"), // نظام العروض الجديد المرن
  // أسعار العروض المختلفة (للتوافق مع النظام القديم)
  twoItemPrice: decimal("two_item_price", { precision: 10, scale: 2 }),
  threeItemPrice: decimal("three_item_price", { precision: 10, scale: 2 }),
  bulkPrice: decimal("bulk_price", { precision: 10, scale: 2 }),
  bulkMinQuantity: integer("bulk_min_quantity").default(4),
  defaultLandingTemplate: landingPageTemplateEnum("default_landing_template").default("modern_minimal"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Landing pages
export const landingPages = pgTable("landing_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  title: varchar("title").notNull(),
  content: text("content"),
  customUrl: varchar("custom_url").unique(),
  template: landingPageTemplateEnum("template").default("modern_minimal"),
  defaultTheme: varchar("default_theme").default("light"),
  isActive: boolean("is_active").default(true),
  views: integer("views").default(0),
  conversions: integer("conversions").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order status enum
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "returned",
]);

// Order source enum - لتتبع مصدر الطلبات
export const orderSourceEnum = pgEnum("order_source", [
  "manual",          // إدخال يدوي من صاحب المنصة
  "landing_page",    // طلب من صفحة هبوط
  "tiktok_ad",       // طلب من حملة TikTok
  "facebook_ad",     // طلب من حملة Facebook
  "instagram_ad",    // طلب من حملة Instagram
  "website_direct",  // طلب مباشر من الموقع
  "whatsapp_message", // طلب عبر رسالة واتساب
  "phone_call",      // طلب عبر مكالمة هاتفية
  "other"           // مصادر أخرى
]);

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").unique().notNull(),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  customerAddress: text("customer_address"),
  customerGovernorate: varchar("customer_governorate"),
  status: orderStatusEnum("status").default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0"),
  // discount field removed - using discountAmount only
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"), // قيمة الخصم
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  // quantity and customPrice columns removed - not in database
  landingPageId: varchar("landing_page_id").references(() => landingPages.id),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  // تتبع مصدر الطلب
  orderSource: orderSourceEnum("order_source").default("manual"),
  adCampaignId: varchar("ad_campaign_id"), // معرف الحملة الإعلانية (اختياري)
  adSetId: varchar("ad_set_id"), // معرف المجموعة الإعلانية (اختياري) 
  adId: varchar("ad_id"), // معرف الإعلان (اختياري)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  offer: varchar("offer"),
  selectedColorId: varchar("selected_color_id").references(() => productColors.id),
  selectedShapeId: varchar("selected_shape_id").references(() => productShapes.id),
  selectedSizeId: varchar("selected_size_id").references(() => productSizes.id),
  selectedColorIds: jsonb("selected_color_ids"),
  selectedShapeIds: jsonb("selected_shape_ids"),
  selectedSizeIds: jsonb("selected_size_ids"),
});

// System activities log
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id").references(() => users.id),
  platformId: varchar("platform_id").references(() => platforms.id), // null للمدراء العامين
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery settings table
export const deliverySettings = pgTable("delivery_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").references(() => platforms.id).notNull().unique(),
  companyName: varchar("company_name").notNull(),
  companyPhone: varchar("company_phone"),
  reportsPhone: varchar("reports_phone"),
  companyLogo: varchar("company_logo"),
  deliveryPriceBaghdad: decimal("delivery_price_baghdad", { precision: 10, scale: 2 }).default("0"),
  deliveryPriceProvinces: decimal("delivery_price_provinces", { precision: 10, scale: 2 }).default("0"),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }).default("0"),
  deliveryTimeMin: integer("delivery_time_min").default(24),
  deliveryTimeMax: integer("delivery_time_max").default(72),
  isActive: boolean("is_active").default(true),
  allowCashOnDelivery: boolean("allow_cash_on_delivery").default(true),
  allowOnlinePayment: boolean("allow_online_payment").default(false),
  deliveryNotes: text("delivery_notes"),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const platformsRelations = relations(platforms, ({ one, many }) => ({
  users: many(users),
  categories: many(categories),
  products: many(products),
  landingPages: many(landingPages),
  orders: many(orders),
  activities: many(activities),
  landingPageOrders: many(landingPageOrders),
  deliverySettings: one(deliverySettings, {
    fields: [platforms.id],
    references: [deliverySettings.platformId],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [users.platformId],
    references: [platforms.id],
  }),
  products: many(products),
  landingPages: many(landingPages),
  activities: many(activities),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [categories.platformId],
    references: [platforms.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [products.platformId],
    references: [platforms.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  creator: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
  landingPages: many(landingPages),
  orderItems: many(orderItems),
}));

export const landingPagesRelations = relations(landingPages, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [landingPages.platformId],
    references: [platforms.id],
  }),
  product: one(products, {
    fields: [landingPages.productId],
    references: [products.id],
  }),
  creator: one(users, {
    fields: [landingPages.createdBy],
    references: [users.id],
  }),
  orders: many(orders),
  landingPageOrders: many(landingPageOrders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [orders.platformId],
    references: [platforms.id],
  }),
  landingPage: one(landingPages, {
    fields: [orders.landingPageId],
    references: [landingPages.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  selectedColor: one(productColors, {
    fields: [orderItems.selectedColorId],
    references: [productColors.id],
  }),
  selectedShape: one(productShapes, {
    fields: [orderItems.selectedShapeId],
    references: [productShapes.id],
  }),
  selectedSize: one(productSizes, {
    fields: [orderItems.selectedSizeId],
    references: [productSizes.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  platform: one(platforms, {
    fields: [activities.platformId],
    references: [platforms.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));



// Insert schemas
export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalOrders: true,
  totalRevenue: true,
  lastActiveAt: true,
}).extend({
  platformName: z.string().min(2, "اسم المنصة يجب أن يحتوي على حرفين على الأقل"),
  businessType: z.string().min(2, "نوع النشاط التجاري مطلوب"),
  ownerName: z.string().min(2, "اسم المالك يجب أن يحتوي على حرفين على الأقل"),
  phoneNumber: z.string().min(11, "رقم الهاتف يجب أن يحتوي على 11 رقم على الأقل"),
  whatsappNumber: z.string().min(11, "رقم الواتساب يجب أن يحتوي على 11 رقم على الأقل"),
  subdomain: z.string().min(3, "النطاق الفرعي يجب أن يحتوي على 3 أحرف على الأقل").regex(/^[a-z0-9-]+$/, "النطاق الفرعي يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => String(val)),
  cost: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  stock: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : 0),
});

export const insertLandingPageSchema = createInsertSchema(landingPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Employee schema would go here when employees table is added

// Types
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Platform = typeof platforms.$inferSelect;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// البروفايل الشخصي للمدير سيتم تطبيقه لاحقاً عندما نحتاج جدول منفصل
// حالياً يستخدم البروفايل معلومات المدير من جدول المستخدمين فقط

// Category types (corrected)
export type InsertCategoryZod = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Product schemas
// نوع بيانات العروض المرنة
export const priceOfferSchema = z.object({
  quantity: z.number().min(1, "الكمية يجب أن تكون أكبر من 0"),
  price: z.number().min(0, "السعر يجب أن يكون أكبر من أو يساوي 0"),
  label: z.string().min(1, "تسمية العرض مطلوبة"),
  isDefault: z.boolean().default(false), // العرض الافتراضي
});

export type PriceOffer = z.infer<typeof priceOfferSchema>;

export type InsertProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertLandingPage = typeof landingPages.$inferInsert;
export type LandingPage = typeof landingPages.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
// Employee types will be added when employees table is created
export type InsertActivity = typeof activities.$inferInsert;
export type Activity = typeof activities.$inferSelect;

// Landing page template type
export type LandingPageTemplate = 
  | "modern_minimal"
  | "bold_hero"
  | "product_showcase"
  | "testimonial_focus"
  | "feature_highlight"
  | "countdown_urgency"
  | "colorful_vibrant"
  | "tiktok_style";

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// طلبات صفحات الهبوط
export const landingPageOrders = pgTable("landing_page_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  landingPageId: varchar("landing_page_id").references(() => landingPages.id),
  productId: varchar("product_id").references(() => products.id),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  
  // بيانات العميل
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  customerGovernorate: varchar("customer_governorate").notNull(),
  customerAddress: text("customer_address").notNull(),
  
  // تفاصيل الطلب
  offer: varchar("offer").notNull(), // قطعة واحدة، قطعتين، إلخ
  quantity: integer("quantity").notNull().default(1), // الكمية المطلوبة
  notes: text("notes"),
  
  // خيارات المنتج المحددة (متعددة)
  selectedColorIds: jsonb("selected_color_ids").default([]),
  selectedShapeIds: jsonb("selected_shape_ids").default([]),
  selectedSizeIds: jsonb("selected_size_ids").default([]),
  
  // معلومات الطلب
  status: varchar("status").default("pending"), // pending, confirmed, shipped, delivered, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"), // قيمة الخصم
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"), // رسوم التوصيل
  
  // تتبع مصدر الطلب
  orderSource: orderSourceEnum("order_source").default("landing_page"),
  adCampaignId: varchar("ad_campaign_id"), // معرف الحملة الإعلانية (اختياري)
  adSetId: varchar("ad_set_id"), // معرف المجموعة الإعلانية (اختياري)
  adId: varchar("ad_id"), // معرف الإعلان (اختياري)
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLandingPageOrderSchema = createInsertSchema(landingPageOrders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLandingPageOrder = z.infer<typeof insertLandingPageOrderSchema>;
export type LandingPageOrder = typeof landingPageOrders.$inferSelect;

export const landingPageOrdersRelations = relations(landingPageOrders, ({ one }) => ({
  platform: one(platforms, {
    fields: [landingPageOrders.platformId],
    references: [platforms.id],
  }),
  landingPage: one(landingPages, {
    fields: [landingPageOrders.landingPageId],
    references: [landingPages.id],
  }),
  product: one(products, {
    fields: [landingPageOrders.productId],
    references: [products.id],
  }),
  // Relations removed for JSONB arrays - variants will be resolved separately
}));

// إعدادات النظام الرئيسي
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key").unique().notNull(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;

// Delivery settings schema
export const insertDeliverySettingsSchema = createInsertSchema(deliverySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDeliverySettings = z.infer<typeof insertDeliverySettingsSchema>;
export type DeliverySettings = typeof deliverySettings.$inferSelect;

// ==================== TIKTOK ADS SCHEMA ====================

// حملات TikTok Ads
export const tiktokCampaigns = pgTable("tiktok_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  campaignId: varchar("campaign_id").notNull().unique(), // TikTok Campaign ID - unique constraint
  advertiserId: varchar("advertiser_id").notNull(), // TikTok Advertiser ID
  campaignName: varchar("campaign_name").notNull(),
  objective: varchar("objective").notNull(), // REACH, TRAFFIC, CONVERSIONS, LEAD_GENERATION, etc.
  status: varchar("status").notNull(), // ENABLE, DISABLE, DELETE
  budgetMode: varchar("budget_mode").notNull(), // BUDGET_MODE_DAY, BUDGET_MODE_TOTAL
  budget: decimal("budget", { precision: 10, scale: 2 }),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  // إحصائيات
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0"),
  conversions: integer("conversions").default(0),
  leads: integer("leads").default(0),
  cpm: decimal("cpm", { precision: 10, scale: 4 }).default("0"), // Cost per 1000 impressions
  cpc: decimal("cpc", { precision: 10, scale: 4 }).default("0"), // Cost per click
  ctr: decimal("ctr", { precision: 5, scale: 4 }).default("0"), // Click through rate
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// مجموعات الإعلانات
export const tiktokAdGroups = pgTable("tiktok_ad_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  campaignId: varchar("campaign_id").references(() => tiktokCampaigns.id).notNull(),
  adGroupId: varchar("ad_group_id").unique().notNull(), // TikTok Ad Group ID
  adGroupName: varchar("ad_group_name").notNull(),
  status: varchar("status").notNull(),
  budgetMode: varchar("budget_mode"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  bidType: varchar("bid_type"), // BID_TYPE_NO_BID, BID_TYPE_CUSTOM, BID_TYPE_MAX_CONVERSION
  bidPrice: decimal("bid_price", { precision: 10, scale: 4 }),
  // استهداف الجمهور
  targetingGender: varchar("targeting_gender"), // MALE, FEMALE, UNLIMITED
  targetingAgeGroups: text("targeting_age_groups").array(), // ["AGE_13_17", "AGE_18_24", etc]
  targetingLocations: text("targeting_locations").array(), // مواقع جغرافية
  targetingLanguages: text("targeting_languages").array(),
  targetingInterests: text("targeting_interests").array(),
  targetingBehaviors: text("targeting_behaviors").array(),
  // إحصائيات
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0"),
  conversions: integer("conversions").default(0),
  leads: integer("leads").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// الإعلانات
export const tiktokAds = pgTable("tiktok_ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  adGroupId: varchar("ad_group_id").references(() => tiktokAdGroups.id).notNull(),
  adId: varchar("ad_id").unique().notNull(), // TikTok Ad ID
  adName: varchar("ad_name").notNull(),
  status: varchar("status").notNull(),
  adFormat: varchar("ad_format").notNull(), // SINGLE_IMAGE, SINGLE_VIDEO, CAROUSEL, etc
  landingPageUrl: text("landing_page_url"),
  displayName: varchar("display_name"),
  // محتوى الإعلان
  imageUrls: text("image_urls").array(),
  videoUrl: varchar("video_url"),
  adText: text("ad_text"),
  callToAction: varchar("call_to_action"), // LEARN_MORE, SHOP_NOW, SIGN_UP, etc
  // إعدادات التتبع
  pixelId: varchar("pixel_id"), // TikTok Pixel ID للتتبع
  // إحصائيات
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0"),
  conversions: integer("conversions").default(0),
  leads: integer("leads").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead Forms لحملات جمع العملاء المحتملين
export const tiktokLeadForms = pgTable("tiktok_lead_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  productId: varchar("product_id").references(() => products.id), // ربط النموذج بمنتج
  campaignId: varchar("campaign_id"), // ربط النموذج بحملة
  formId: varchar("form_id"), // TikTok Lead Form ID (اختياري للنماذج المحلية)
  formName: varchar("form_name").notNull(),
  status: varchar("status").default("active"),
  // إعدادات النموذج
  title: varchar("title").notNull(), // العنوان الظاهر في النموذج
  description: text("description"), // الوصف
  privacyPolicyUrl: text("privacy_policy_url"),
  // حقول النموذج المخصصة بناءً على المنتج
  collectName: boolean("collect_name").default(true), // جمع الاسم
  collectPhone: boolean("collect_phone").default(true), // جمع رقم الهاتف

  collectAddress: boolean("collect_address").default(true), // جمع العنوان
  collectGovernorate: boolean("collect_governorate").default(true), // جمع المحافظة
  collectOfferSelection: boolean("collect_offer_selection").default(true), // اختيار العرض
  collectNotes: boolean("collect_notes").default(false), // ملاحظات إضافية
  // رسائل مخصصة
  successMessage: text("success_message").default("شكراً لك! سنتواصل معك قريباً"),
  // حقول إضافية قابلة للتخصيص
  customFields: jsonb("custom_fields"), // حقول إضافية مخصصة
  // إحصائيات
  totalLeads: integer("total_leads").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// العملاء المحتملين من TikTok Lead Forms
export const tiktokLeads = pgTable("tiktok_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  leadFormId: varchar("lead_form_id").references(() => tiktokLeadForms.id).notNull(),
  adId: varchar("ad_id").references(() => tiktokAds.id),
  leadId: varchar("lead_id").notNull(), // TikTok Lead ID
  // بيانات العميل المحتمل
  customerName: varchar("customer_name"),
  customerPhone: varchar("customer_phone"),
  customerEmail: varchar("customer_email"),
  customerData: jsonb("customer_data"), // بيانات إضافية من النموذج
  // حالة المتابعة
  followUpStatus: varchar("follow_up_status").default("new"), // new, contacted, qualified, converted, rejected
  notes: text("notes"),
  assignedTo: varchar("assigned_to"), // معرف الموظف المسؤول
  // تواريخ مهمة
  submittedAt: timestamp("submitted_at").notNull(),
  lastContactAt: timestamp("last_contact_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TikTok Pixel لتتبع التحويلات
export const tiktokPixels = pgTable("tiktok_pixels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  pixelId: varchar("pixel_id").notNull(), // TikTok Pixel ID
  pixelName: varchar("pixel_name").notNull(),
  pixelCode: text("pixel_code").notNull(), // كود Pixel للدمج في الموقع
  status: varchar("status").default("active"), // active, inactive
  // إحصائيات الأحداث
  pageViews: integer("page_views").default(0),
  addToCarts: integer("add_to_carts").default(0),
  purchases: integer("purchases").default(0),
  leads: integer("leads").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for TikTok Ads
export const tiktokCampaignsRelations = relations(tiktokCampaigns, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [tiktokCampaigns.platformId],
    references: [platforms.id],
  }),
  adGroups: many(tiktokAdGroups),
}));

export const tiktokAdGroupsRelations = relations(tiktokAdGroups, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [tiktokAdGroups.platformId],
    references: [platforms.id],
  }),
  campaign: one(tiktokCampaigns, {
    fields: [tiktokAdGroups.campaignId],
    references: [tiktokCampaigns.id],
  }),
  ads: many(tiktokAds),
}));

export const tiktokAdsRelations = relations(tiktokAds, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [tiktokAds.platformId],
    references: [platforms.id],
  }),
  adGroup: one(tiktokAdGroups, {
    fields: [tiktokAds.adGroupId],
    references: [tiktokAdGroups.id],
  }),
  leads: many(tiktokLeads),
}));

export const tiktokLeadFormsRelations = relations(tiktokLeadForms, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [tiktokLeadForms.platformId],
    references: [platforms.id],
  }),
  leads: many(tiktokLeads),
}));

export const tiktokLeadsRelations = relations(tiktokLeads, ({ one }) => ({
  platform: one(platforms, {
    fields: [tiktokLeads.platformId],
    references: [platforms.id],
  }),
  leadForm: one(tiktokLeadForms, {
    fields: [tiktokLeads.leadFormId],
    references: [tiktokLeadForms.id],
  }),
  ad: one(tiktokAds, {
    fields: [tiktokLeads.adId],
    references: [tiktokAds.id],
  }),
}));

export const tiktokPixelsRelations = relations(tiktokPixels, ({ one }) => ({
  platform: one(platforms, {
    fields: [tiktokPixels.platformId],
    references: [platforms.id],
  }),
}));

// Advertising Platforms Pixels and Tokens Table
export const adPlatformSettings = pgTable("ad_platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  
  // Facebook/Meta settings
  facebookPixelId: varchar("facebook_pixel_id"),
  facebookAccessToken: varchar("facebook_access_token"),
  
  // TikTok settings  
  tiktokPixelId: varchar("tiktok_pixel_id"),
  tiktokAccessToken: varchar("tiktok_access_token"),
  tiktokBusinessCenterId: varchar("tiktok_business_center_id"),
  
  // Snapchat settings
  snapchatPixelId: varchar("snapchat_pixel_id"),
  snapchatAccessToken: varchar("snapchat_access_token"),
  
  // Google settings
  googleAnalyticsId: varchar("google_analytics_id"),
  googleAdsCustomerId: varchar("google_ads_customer_id"),
  googleAdsAccessToken: varchar("google_ads_access_token"),
  googleAdsRefreshToken: varchar("google_ads_refresh_token"),
  
  // Status and metadata
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adPlatformSettingsRelations = relations(adPlatformSettings, ({ one }) => ({
  platform: one(platforms, {
    fields: [adPlatformSettings.platformId],
    references: [platforms.id],
  }),
}));

// Ad account status enum
export const adAccountStatusEnum = pgEnum("ad_account_status", [
  "ACTIVE",
  "DISABLE", 
  "PENDING",
  "SUSPENDED"
]);

// Ad platform enum
export const adPlatformEnum = pgEnum("ad_platform", [
  "tiktok",
  "meta",
  "snapchat", 
  "google"
]);

// Ad Accounts table - For managing created ad accounts
export const adAccounts = pgTable("ad_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull(), // The actual advertiser ID from the platform
  name: varchar("name").notNull(),
  platform: adPlatformEnum("platform").notNull(),
  status: adAccountStatusEnum("status").default("PENDING"),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
  currency: varchar("currency").default("USD"),
  businessCenterId: varchar("business_center_id"),
  country: varchar("country").default("IQ"),
  timezone: varchar("timezone").default("Asia/Baghdad"),
  industry: varchar("industry"),
  connectedPlatforms: integer("connected_platforms").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adAccountsRelations = relations(adAccounts, ({ many }) => ({
  // Relations for platforms that can use this ad account
  connectedPlatformAccounts: many(platformAdAccounts),
}));

// Junction table for platforms using ad accounts
export const platformAdAccounts = pgTable("platform_ad_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  adAccountId: varchar("ad_account_id").notNull().references(() => adAccounts.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  connectedAt: timestamp("connected_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => [
  unique().on(table.platformId, table.adAccountId), // Each platform can only connect to an ad account once
]);

export const platformAdAccountsRelations = relations(platformAdAccounts, ({ one }) => ({
  platform: one(platforms, {
    fields: [platformAdAccounts.platformId],
    references: [platforms.id],
  }),
  adAccount: one(adAccounts, {
    fields: [platformAdAccounts.adAccountId],
    references: [adAccounts.id],
  }),
}));

// Insert schemas for TikTok Ads
export const insertTiktokCampaignSchema = createInsertSchema(tiktokCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTiktokAdGroupSchema = createInsertSchema(tiktokAdGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTiktokAdSchema = createInsertSchema(tiktokAds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTiktokLeadFormSchema = createInsertSchema(tiktokLeadForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTiktokLeadSchema = createInsertSchema(tiktokLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTiktokPixelSchema = createInsertSchema(tiktokPixels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for TikTok Ads
export type InsertTiktokCampaign = z.infer<typeof insertTiktokCampaignSchema>;
export type TiktokCampaign = typeof tiktokCampaigns.$inferSelect;

export type InsertTiktokAdGroup = z.infer<typeof insertTiktokAdGroupSchema>;
export type TiktokAdGroup = typeof tiktokAdGroups.$inferSelect;

export type InsertTiktokAd = z.infer<typeof insertTiktokAdSchema>;
export type TiktokAd = typeof tiktokAds.$inferSelect;

export type InsertTiktokLeadForm = z.infer<typeof insertTiktokLeadFormSchema>;
export type TiktokLeadForm = typeof tiktokLeadForms.$inferSelect;

export type InsertTiktokLead = z.infer<typeof insertTiktokLeadSchema>;
export type TiktokLead = typeof tiktokLeads.$inferSelect;

export type InsertTiktokPixel = z.infer<typeof insertTiktokPixelSchema>;
export type TiktokPixel = typeof tiktokPixels.$inferSelect;

// Insert schema for Ad Platform Settings
export const insertAdPlatformSettingsSchema = createInsertSchema(adPlatformSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for Ad Platform Settings
export type InsertAdPlatformSettings = z.infer<typeof insertAdPlatformSettingsSchema>;
export type AdPlatformSettings = typeof adPlatformSettings.$inferSelect;

// ZainCash Payments Table
export const zainCashPayments = pgTable("zain_cash_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").references(() => platforms.id),
  
  // Payment details
  orderId: varchar("order_id").notNull().unique(), // Reference for our system
  amount: integer("amount").notNull(), // Amount in IQD
  serviceType: varchar("service_type").notNull(), // Description of service
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").notNull(),
  
  // ZainCash transaction details
  transactionId: varchar("transaction_id"), // ZainCash transaction ID
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paymentToken: text("payment_token"), // JWT token from ZainCash
  
  // Customer details
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  customerEmail: varchar("customer_email"),
  
  // ZainCash response details
  zainCashResponse: jsonb("zain_cash_response"), // Full response from ZainCash
  paymentUrl: text("payment_url"), // ZainCash payment URL
  redirectUrl: text("redirect_url"), // Our callback URL
  
  // Status tracking
  paidAt: timestamp("paid_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ZainCash Payments Relations
export const zainCashPaymentsRelations = relations(zainCashPayments, ({ one }) => ({
  platform: one(platforms, {
    fields: [zainCashPayments.platformId],
    references: [platforms.id],
  }),
}));

// Insert schema for ZainCash payments
export const insertZainCashPaymentSchema = createInsertSchema(zainCashPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for ZainCash payments
export type InsertZainCashPayment = z.infer<typeof insertZainCashPaymentSchema>;
export type ZainCashPayment = typeof zainCashPayments.$inferSelect;

// Insert schema for Ad Accounts
export const insertAdAccountSchema = createInsertSchema(adAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for Ad Accounts
export type InsertAdAccount = z.infer<typeof insertAdAccountSchema>;
export type AdAccount = typeof adAccounts.$inferSelect;

// Insert schema for Platform Ad Accounts
export const insertPlatformAdAccountSchema = createInsertSchema(platformAdAccounts).omit({
  id: true,
  connectedAt: true,
});

// Types for Platform Ad Accounts
export type InsertPlatformAdAccount = z.infer<typeof insertPlatformAdAccountSchema>;
export type PlatformAdAccount = typeof platformAdAccounts.$inferSelect;

// Insert schemas for admin tables
export const insertSubscriptionFeatureSchema = createInsertSchema(subscriptionFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminActionLogSchema = createInsertSchema(adminActionsLog).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformPermissionSchema = createInsertSchema(platformPermissions).omit({
  id: true,
  createdAt: true,
});

// Types for admin tables
export type SubscriptionFeature = typeof subscriptionFeatures.$inferSelect;
export type InsertSubscriptionFeature = z.infer<typeof insertSubscriptionFeatureSchema>;

export type AdminActionLog = typeof adminActionsLog.$inferSelect;
export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;

export type PlatformPermission = typeof platformPermissions.$inferSelect;
export type InsertPlatformPermission = z.infer<typeof insertPlatformPermissionSchema>;

// Complete TikTok Campaign Creation Schema (Campaign + Ad Group + Ad)
export const completeTiktokCampaignSchema = z.object({
  // Campaign data
  campaignName: z.string().min(1, "اسم الحملة مطلوب"),
  objective: z.enum([
    "CONVERSIONS",
    "LEAD_GENERATION", 
    "REACH",
    "VIDEO_VIEWS",
    "APP_PROMOTION",
    "CATALOG_SALES"
  ]),
  campaignBudgetMode: z.enum(["BUDGET_MODE_DAY", "BUDGET_MODE_TOTAL", "BUDGET_MODE_DYNAMIC_DAILY_BUDGET", "BUDGET_MODE_INFINITE"]),
  campaignBudget: z.string().optional(),
  useCampaignBudgetOptimization: z.boolean().default(false), // استخدام ميزانية الحملة (CBO)
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  
  // Ad Group data
  adGroupName: z.string().min(1, "اسم المجموعة الإعلانية مطلوب"),
  adGroupBudgetMode: z.enum(["BUDGET_MODE_DAY", "BUDGET_MODE_TOTAL", "BUDGET_MODE_DYNAMIC_DAILY_BUDGET", "BUDGET_MODE_INFINITE"]),
  adGroupBudget: z.string().min(1, "ميزانية المجموعة الإعلانية مطلوبة"), // إجباري
  bidType: z.enum(["BID_TYPE_NO_BID", "BID_TYPE_CUSTOM"]).default("BID_TYPE_NO_BID"),
  bidPrice: z.string().optional(),
  placementType: z.enum([
    "PLACEMENT_TYPE_AUTOMATIC",
    "PLACEMENT_TYPE_SELECT"
  ]).default("PLACEMENT_TYPE_AUTOMATIC"),
  
  // Ad data
  adName: z.string().min(1, "اسم الإعلان مطلوب"),
  adFormat: z.enum([
    "SINGLE_IMAGE",
    "SINGLE_VIDEO", 
    "COLLECTION_VIDEO",
    "SPARK_AD",
    "VIDEO_SHOPPING_AD"
  ]).default("SINGLE_VIDEO"),
  landingPageUrl: z.string().url("رابط الصفحة المقصودة غير صحيح").optional(),
  displayName: z.string().min(1, "اسم العرض مطلوب"),
  adText: z.string().min(1, "نص الإعلان مطلوب"),
  callToAction: z.enum([
    "LEARN_MORE",
    "SHOP_NOW", 
    "SIGN_UP",
    "DOWNLOAD",
    "BOOK_NOW",
    "CONTACT_US",
    "APPLY_NOW"
  ]).default("LEARN_MORE"),
  
  // Media files
  videoUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  
  // Pixel tracking (optional)
  pixelId: z.string().optional(),
  optimizationEvent: z.string().optional(), // حدث البكسل للتحسين
  
  // Identity data (optional)
  identityId: z.string().optional(), // هوية الإعلان
  
  // Targeting data (optional)
  targeting: z.object({
    gender: z.enum(["GENDER_MALE", "GENDER_FEMALE", "GENDER_UNLIMITED"]).optional(),
    age_groups: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
  }).optional(),

  // Lead form data (optional - only for LEAD_GENERATION objective)
  leadFormName: z.string().optional(),
  leadFormTitle: z.string().optional(),
  leadFormDescription: z.string().optional(),
  leadFormPrivacyPolicyUrl: z.string().url("يجب أن يكون رابط صحيح").optional().or(z.literal("")),
  leadFormSuccessMessage: z.string().optional(),
  // Product selection for lead form
  productId: z.string().optional(), // اختيار المنتج لنموذج الليدز
  // Lead form field configuration
  collectName: z.boolean().default(true),
  collectPhone: z.boolean().default(true), 

  collectAddress: z.boolean().default(true),
  collectGovernorate: z.boolean().default(true),
  collectOfferSelection: z.boolean().default(true),
  collectNotes: z.boolean().default(false),
}).refine((data) => {
  // التحقق 1: إذا لم تكن الميزانية لا محدودة، فيجب تحديد مبلغ الميزانية
  if (data.campaignBudgetMode !== "BUDGET_MODE_INFINITE" && !data.campaignBudget) {
    return false;
  }
  // التحقق 2: إذا لم يتم استخدام CBO، فيجب أن تكون ميزانية المجموعة الإعلانية مطلوبة
  if (!data.useCampaignBudgetOptimization && !data.adGroupBudget) {
    return false;
  }
  // التحقق 3: إذا كان الهدف "LEAD_GENERATION"، فيجب ملء حقول النموذج الأساسية
  if (data.objective === "LEAD_GENERATION" && (!data.leadFormName || !data.leadFormTitle || !data.leadFormSuccessMessage)) {
    return false;
  }
  // التحقق 4: إذا كان الهدف ليس "LEAD_GENERATION"، يجب أن يكون هناك رابط صفحة مقصودة
  if (data.objective !== "LEAD_GENERATION" && !data.landingPageUrl) {
    return false;
  }
  return true;
}, (data) => {
  // رسائل الخطأ المخصصة
  if (data.campaignBudgetMode !== "BUDGET_MODE_INFINITE" && !data.campaignBudget) {
    return {
      message: "ميزانية الحملة مطلوبة عند اختيار نوع ميزانية محدد",
      path: ["campaignBudget"]
    };
  }
  if (!data.useCampaignBudgetOptimization && !data.adGroupBudget) {
    return {
      message: "ميزانية المجموعة الإعلانية مطلوبة عند عدم استخدام تحسين ميزانية الحملة",
      path: ["adGroupBudget"]
    };
  }
  if (data.objective === "LEAD_GENERATION" && !data.leadFormName) {
    return {
      message: "اسم نموذج الليدز مطلوب عند اختيار هدف توليد العملاء المحتملين",
      path: ["leadFormName"]
    };
  }
  if (data.objective === "LEAD_GENERATION" && !data.leadFormTitle) {
    return {
      message: "عنوان نموذج الليدز مطلوب عند اختيار هدف توليد العملاء المحتملين",
      path: ["leadFormTitle"]
    };
  }
  if (data.objective === "LEAD_GENERATION" && !data.leadFormSuccessMessage) {
    return {
      message: "رسالة نجاح النموذج مطلوبة عند اختيار هدف توليد العملاء المحتملين",
      path: ["leadFormSuccessMessage"]
    };
  }
  if (data.objective !== "LEAD_GENERATION" && !data.landingPageUrl) {
    return {
      message: "رابط الصفحة المقصودة مطلوب",
      path: ["landingPageUrl"]
    };
  }
  return { message: "", path: [] };
});

export type CompleteTiktokCampaign = z.infer<typeof completeTiktokCampaignSchema>;

// Complete Meta Campaign Creation Schema (Campaign + Ad Set + Ad)
export const completeMetaCampaignSchema = z.object({
  // Ad Account Selection
  adAccountId: z.string().min(1, "معرف الحساب الإعلاني مطلوب"),
  
  // Campaign data
  campaignName: z.string().min(1, "اسم الحملة مطلوب"),
  objective: z.enum([
    "OUTCOME_TRAFFIC",    // حملة الرسائل/المحادثات  
    "OUTCOME_SALES"       // حملة التحويلات/المبيعات
  ]),
  campaignBudgetMode: z.enum(["DAILY_BUDGET", "LIFETIME_BUDGET", "UNLIMITED"]).optional(),
  campaignBudget: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  
  // Ad Set data
  adSetName: z.string().min(1, "اسم مجموعة الإعلان مطلوب"),
  adSetBudgetMode: z.enum(["DAILY_BUDGET", "LIFETIME_BUDGET"]),
  adSetBudget: z.string().optional(),
  bidStrategy: z.enum(["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP"]).default("LOWEST_COST_WITHOUT_CAP"),
  bidAmount: z.string().optional(),
  destinationType: z.enum(["WEBSITE", "MESSENGER"]).default("WEBSITE"),
  
  // وجهات الرسائل (للحملات الرسائل فقط)
  messageDestinations: z.array(z.enum(["MESSENGER", "INSTAGRAM", "WHATSAPP"])).optional(),
  
  // Ad data
  adName: z.string().min(1, "اسم الإعلان مطلوب"),
  adFormat: z.enum([
    "SINGLE_IMAGE",
    "SINGLE_VIDEO",
    "CAROUSEL"
  ]).default("SINGLE_VIDEO"),
  landingPageUrl: z.string().url("رابط الصفحة المقصودة غير صحيح").optional(),
  displayName: z.string().min(1, "اسم العرض مطلوب"),
  adText: z.string().min(1, "نص الإعلان مطلوب"),
  adDescription: z.string().optional().refine((val) => {
    if (!val) return true; // اختياري
    const words = val.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length <= 7;
  }, "وصف الإعلان يجب أن يكون 7 كلمات كحد أقصى"), // وصف الإعلان للـ link_description
  callToAction: z.enum([
    "LEARN_MORE",
    "SHOP_NOW",
    "SIGN_UP",
    "DOWNLOAD",
    "BOOK_NOW",
    "BOOK_TRAVEL",
    "CONTACT_US",
    "GET_QUOTE",
    "MESSAGE_PAGE"
  ]).default("BOOK_NOW"),
  
  // Media files
  videoUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  imageHash: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  
  // Pixel tracking (required for CONVERSIONS)
  pixelId: z.string().optional(),
  customEventType: z.string().optional(), // نوع الحدث المخصص للتحسين
  
  // Facebook Page ID (required for MESSAGES)
  pageId: z.string().optional(),
  
  // Targeting data (optional)
  targeting: z.object({
    genders: z.array(z.enum(["1", "2"])).optional(), // 1 = ذكور، 2 = إناث
    ageMin: z.number().min(13).max(65).optional(),
    ageMax: z.number().min(13).max(65).optional(),
    geoLocations: z.object({
      countries: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
      cities: z.array(z.string()).optional(),
    }).optional(),
    interests: z.array(z.string()).optional(),
    behaviors: z.array(z.string()).optional(),
    advantageAudience: z.boolean().optional().default(false), // Advantage+ Audience
    advantageCreative: z.boolean().optional().default(false), // Advantage+ Creative
  }).optional(),
  
  // Placements configuration (مواضع الإعلان)
  placements: z.object({
    devicePlatforms: z.array(z.enum(["mobile", "desktop", "tablet"])).optional().default(["mobile"]),
    publisherPlatforms: z.array(z.enum(["facebook", "instagram", "audience_network", "messenger", "threads"])).optional().default(["facebook", "instagram"]),
    facebookPlacements: z.array(z.enum(["feed", "marketplace", "right_hand_column", "instant_article", "in_stream_video", "search", "story", "reels"])).optional(),
    instagramPlacements: z.array(z.enum(["stream", "explore", "profile_feed", "story", "reels", "search"])).optional(),
    operatingSystems: z.array(z.enum(["iOS", "Android", "Windows", "MacOS", "Linux"])).optional(),
    connectionTypes: z.array(z.enum(["wifi", "cellular", "broadband"])).optional(),
    audienceNetwork: z.array(z.enum(["classic", "instream_video", "rewarded_video"])).optional(),
    advancedOptions: z.array(z.enum(["exclude_threads", "premium_placements", "brand_safety", "block_lists"])).optional(),
  }).optional(),
  
  // Product selection for the ad
  productId: z.string().optional(),
}).refine((data) => {
  // التحقق 1: إما ميزانية الحملة أو ميزانية المجموعة الإعلانية مطلوبة
  const hasCampaignBudget = data.campaignBudgetMode !== "UNLIMITED" && data.campaignBudget;
  const hasAdSetBudget = data.adSetBudget;
  
  // يجب وجود إحدى الميزانيتين على الأقل
  if (!hasCampaignBudget && !hasAdSetBudget) {
    return false;
  }
  // التحقق 2: حملات الرسائل تحتاج pageId
  if (data.objective === "OUTCOME_TRAFFIC" && !data.pageId) {
    return false;
  }
  // التحقق 3: حملات التحويلات تحتاج pixelId
  if (data.objective === "OUTCOME_SALES" && !data.pixelId) {
    return false;
  }
  // التحقق 4: رابط الصفحة مطلوب فقط لحملات التحويلات
  if (data.objective === "OUTCOME_SALES" && !data.landingPageUrl) {
    return false;
  }
  return true;
}, (data) => {
  // رسائل الخطأ المخصصة
  const hasCampaignBudget = data.campaignBudgetMode !== "UNLIMITED" && data.campaignBudget;
  const hasAdSetBudget = data.adSetBudget;
  
  if (!hasCampaignBudget && !hasAdSetBudget) {
    return {
      message: "يجب تحديد ميزانية الحملة أو ميزانية المجموعة الإعلانية",
      path: ["adSetBudget"]
    };
  }
  if (data.objective === "OUTCOME_TRAFFIC" && !data.pageId) {
    return {
      message: "معرف الصفحة مطلوب لحملات الرسائل",
      path: ["pageId"]
    };
  }
  if (data.objective === "OUTCOME_SALES" && !data.pixelId) {
    return {
      message: "معرف البكسل مطلوب لحملات التحويلات",
      path: ["pixelId"]
    };
  }
  if (data.objective === "OUTCOME_SALES" && !data.landingPageUrl) {
    return {
      message: "رابط الصفحة المقصودة مطلوب لحملات التحويلات",
      path: ["landingPageUrl"]
    };
  }
  return { message: "", path: [] };
});

export type CompleteMetaCampaign = z.infer<typeof completeMetaCampaignSchema>;

// ===================== COMPREHENSIVE ACCOUNTING SYSTEM =====================

// Account Types Enum
export const accountTypeEnum = pgEnum("account_type", [
  "assets",       // الأصول
  "liabilities",  // الخصوم  
  "equity",       // حقوق الملكية
  "revenue",      // الإيرادات
  "expenses",     // المصروفات
  "cost_of_goods" // تكلفة البضاعة المباعة
]);

// Account Categories Enum
export const accountCategoryEnum = pgEnum("account_category", [
  // Assets Categories
  "current_assets",      // الأصول المتداولة
  "fixed_assets",        // الأصول الثابتة
  "intangible_assets",   // الأصول غير الملموسة
  
  // Liabilities Categories  
  "current_liabilities", // الخصوم المتداولة
  "long_term_liabilities", // الخصوم طويلة الأجل
  
  // Equity Categories
  "capital",             // رأس المال
  "retained_earnings",   // الأرباح المحتجزة
  "drawings",            // المسحوبات
  
  // Revenue Categories
  "sales_revenue",       // إيرادات المبيعات
  "service_revenue",     // إيرادات الخدمات
  "other_revenue",       // إيرادات أخرى
  
  // Expense Categories
  "operating_expenses",  // مصروفات التشغيل
  "administrative_expenses", // مصروفات إدارية
  "selling_expenses",    // مصروفات البيع
  "financial_expenses",  // مصروفات مالية
  "other_expenses"       // مصروفات أخرى
]);

// Chart of Accounts - دليل الحسابات
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull(),
  accountCode: varchar("account_code").notNull(), // رقم الحساب
  accountNameAr: varchar("account_name_ar").notNull(), // اسم الحساب بالعربية
  accountNameEn: varchar("account_name_en"), // اسم الحساب بالإنجليزية
  accountType: accountTypeEnum("account_type").notNull(),
  accountCategory: accountCategoryEnum("account_category").notNull(),
  parentAccountId: varchar("parent_account_id"), // الحساب الأب للحسابات الفرعية
  level: integer("level").default(1), // مستوى الحساب في الشجرة
  isActive: boolean("is_active").default(true),
  description: text("description"), // وصف الحساب
  // أرصدة الحساب
  debitBalance: decimal("debit_balance", { precision: 15, scale: 2 }).default("0"),
  creditBalance: decimal("credit_balance", { precision: 15, scale: 2 }).default("0"),
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial Transactions - القيود المحاسبية
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull(),
  transactionNumber: varchar("transaction_number").notNull(), // رقم القيد
  transactionDate: timestamp("transaction_date").notNull(),
  description: text("description").notNull(), // وصف القيد
  reference: varchar("reference"), // مرجع (رقم فاتورة، سند، إلخ)
  transactionType: varchar("transaction_type").notNull(), // نوع العملية
  
  // معلومات إضافية
  totalDebit: decimal("total_debit", { precision: 15, scale: 2 }).notNull(),
  totalCredit: decimal("total_credit", { precision: 15, scale: 2 }).notNull(),
  
  // الحالة والموافقة
  status: varchar("status").default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by"), // من قام بالموافقة
  approvedAt: timestamp("approved_at"),
  
  // ربط بعمليات أخرى
  relatedOrderId: varchar("related_order_id"), // ربط بطلب
  relatedExpenseId: varchar("related_expense_id"), // ربط بمصروف
  relatedPaymentId: varchar("related_payment_id"), // ربط بدفعة
  
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction Entries - بنود القيد المحاسبي
export const transactionEntries = pgTable("transaction_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull(),
  accountId: varchar("account_id").notNull(),
  
  // المبالغ
  debitAmount: decimal("debit_amount", { precision: 15, scale: 2 }).default("0"),
  creditAmount: decimal("credit_amount", { precision: 15, scale: 2 }).default("0"),
  
  // تفاصيل البند
  description: text("description"),
  reference: varchar("reference"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Cash Management - إدارة الصندوق
export const cashAccounts = pgTable("cash_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull(),
  accountName: varchar("account_name").notNull(), // اسم الصندوق/الحساب
  accountType: varchar("account_type").notNull(), // cash, bank, digital_wallet
  accountNumber: varchar("account_number"), // رقم الحساب البنكي
  bankName: varchar("bank_name"), // اسم البنك
  branchName: varchar("branch_name"), // اسم الفرع
  
  // الرصيد
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0"),
  initialBalance: decimal("initial_balance", { precision: 15, scale: 2 }).default("0"),
  
  // العملة
  currency: varchar("currency").default("IQD"), // العملة
  
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // الحساب الافتراضي
  
  // ربط بدليل الحسابات
  chartAccountId: varchar("chart_account_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cash Transactions - حركات الصندوق
export const cashTransactions = pgTable("cash_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull(),
  cashAccountId: varchar("cash_account_id").notNull(),
  
  transactionType: varchar("transaction_type").notNull(), // income, expense, transfer
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  reference: varchar("reference"), // مرجع العملية
  
  // التصنيف
  category: varchar("category"), // category of income/expense
  subcategory: varchar("subcategory"),
  
  // الطرف الآخر في العملية
  partyName: varchar("party_name"), // اسم الطرف الآخر
  partyType: varchar("party_type"), // customer, supplier, employee, other
  
  // ربط بعمليات أخرى
  relatedOrderId: varchar("related_order_id"),
  relatedTransactionId: varchar("related_transaction_id"), // ربط بالقيد المحاسبي
  
  // معلومات الموافقة
  status: varchar("status").default("completed"), // pending, completed, cancelled
  
  transactionDate: timestamp("transaction_date").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses Management - إدارة المصروفات
export const expenseCategories = pgTable("expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull(),
  categoryName: varchar("category_name").notNull(),
  description: text("description"),
  parentCategoryId: varchar("parent_category_id"), // للفئات الفرعية
  
  // ربط بدليل الحسابات
  defaultAccountId: varchar("default_account_id"), // الحساب الافتراضي لهذه الفئة
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull(),
  expenseNumber: varchar("expense_number").notNull(), // رقم المصروف
  
  // تفاصيل المصروف
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  expenseDate: timestamp("expense_date").notNull(),
  
  // التصنيف
  categoryId: varchar("category_id"),
  subcategoryId: varchar("subcategory_id"),
  
  // طريقة الدفع
  paymentMethod: varchar("payment_method").notNull(), // cash, bank_transfer, card, etc.
  cashAccountId: varchar("cash_account_id"), // الحساب المدفوع منه
  
  // الطرف المستفيد
  vendorName: varchar("vendor_name"), // اسم المورد
  vendorContact: varchar("vendor_contact"), // تواصل المورد
  
  // المرفقات والوثائق
  receiptUrl: varchar("receipt_url"), // صورة الفاتورة
  attachments: jsonb("attachments"), // مرفقات إضافية
  
  // الحالة والموافقة
  status: varchar("status").default("pending"), // pending, approved, paid, rejected
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  paidBy: varchar("paid_by"),
  paidAt: timestamp("paid_at"),
  
  // ربط بالقيد المحاسبي
  transactionId: varchar("transaction_id"),
  
  // معلومات الإنشاء
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Capital Management - إدارة رأس المال
export const capitalTransactions = pgTable("capital_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull(),
  
  transactionType: varchar("transaction_type").notNull(), // investment, withdrawal, dividend
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  
  // تفاصيل الشريك/المالك
  ownerName: varchar("owner_name").notNull(),
  ownerShare: decimal("owner_share", { precision: 5, scale: 2 }), // نسبة الشراكة
  
  // تفاصيل العملية
  transactionDate: timestamp("transaction_date").notNull(),
  paymentMethod: varchar("payment_method"), // cash, bank_transfer, assets, etc.
  cashAccountId: varchar("cash_account_id"),
  
  // الموافقة
  status: varchar("status").default("approved"), // pending, approved, rejected
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  
  // ربط بالقيد المحاسبي
  transactionId: varchar("transaction_id"),
  
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget Planning - التخطيط والموازنة
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull(),
  
  budgetName: varchar("budget_name").notNull(),
  budgetYear: integer("budget_year").notNull(),
  budgetPeriod: varchar("budget_period").notNull(), // annual, quarterly, monthly
  
  // المبالغ المخططة
  totalBudgetedRevenue: decimal("total_budgeted_revenue", { precision: 15, scale: 2 }).default("0"),
  totalBudgetedExpenses: decimal("total_budgeted_expenses", { precision: 15, scale: 2 }).default("0"),
  expectedProfit: decimal("expected_profit", { precision: 15, scale: 2 }).default("0"),
  
  // الحالة
  status: varchar("status").default("draft"), // draft, active, completed, archived
  
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget Line Items - بنود الموازنة
export const budgetLineItems = pgTable("budget_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  budgetId: varchar("budget_id").notNull(),
  accountId: varchar("account_id").notNull(),
  
  // المبالغ المخططة
  budgetedAmount: decimal("budgeted_amount", { precision: 12, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 12, scale: 2 }).default("0"),
  variance: decimal("variance", { precision: 12, scale: 2 }).default("0"),
  variancePercentage: decimal("variance_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // التوزيع الشهري
  monthlyDistribution: jsonb("monthly_distribution"), // توزيع المبلغ على الأشهر
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===================== ACCOUNTING RELATIONS =====================

// Chart of Accounts Relations
export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [chartOfAccounts.platformId],
    references: [platforms.id],
  }),
  parentAccount: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentAccountId],
    references: [chartOfAccounts.id],
  }),
  subAccounts: many(chartOfAccounts),
  transactionEntries: many(transactionEntries),
  cashAccounts: many(cashAccounts),
  budgetLineItems: many(budgetLineItems),
}));

// Transactions Relations
export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [transactions.platformId],
    references: [platforms.id],
  }),
  entries: many(transactionEntries),
  order: one(orders, {
    fields: [transactions.relatedOrderId],
    references: [orders.id],
  }),
  expense: one(expenses, {
    fields: [transactions.relatedExpenseId],
    references: [expenses.id],
  }),
}));

// Transaction Entries Relations
export const transactionEntriesRelations = relations(transactionEntries, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionEntries.transactionId],
    references: [transactions.id],
  }),
  account: one(chartOfAccounts, {
    fields: [transactionEntries.accountId],
    references: [chartOfAccounts.id],
  }),
}));

// Cash Accounts Relations
export const cashAccountsRelations = relations(cashAccounts, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [cashAccounts.platformId],
    references: [platforms.id],
  }),
  chartAccount: one(chartOfAccounts, {
    fields: [cashAccounts.chartAccountId],
    references: [chartOfAccounts.id],
  }),
  cashTransactions: many(cashTransactions),
  expenses: many(expenses),
}));

// Cash Transactions Relations
export const cashTransactionsRelations = relations(cashTransactions, ({ one }) => ({
  platform: one(platforms, {
    fields: [cashTransactions.platformId],
    references: [platforms.id],
  }),
  cashAccount: one(cashAccounts, {
    fields: [cashTransactions.cashAccountId],
    references: [cashAccounts.id],
  }),
  order: one(orders, {
    fields: [cashTransactions.relatedOrderId],
    references: [orders.id],
  }),
  transaction: one(transactions, {
    fields: [cashTransactions.relatedTransactionId],
    references: [transactions.id],
  }),
}));

// Expense Categories Relations
export const expenseCategoriesRelations = relations(expenseCategories, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [expenseCategories.platformId],
    references: [platforms.id],
  }),
  parentCategory: one(expenseCategories, {
    fields: [expenseCategories.parentCategoryId],
    references: [expenseCategories.id],
  }),
  subCategories: many(expenseCategories),
  expenses: many(expenses),
  defaultAccount: one(chartOfAccounts, {
    fields: [expenseCategories.defaultAccountId],
    references: [chartOfAccounts.id],
  }),
}));

// Expenses Relations
export const expensesRelations = relations(expenses, ({ one }) => ({
  platform: one(platforms, {
    fields: [expenses.platformId],
    references: [platforms.id],
  }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  cashAccount: one(cashAccounts, {
    fields: [expenses.cashAccountId],
    references: [cashAccounts.id],
  }),
  transaction: one(transactions, {
    fields: [expenses.transactionId],
    references: [transactions.id],
  }),
}));

// Capital Transactions Relations
export const capitalTransactionsRelations = relations(capitalTransactions, ({ one }) => ({
  platform: one(platforms, {
    fields: [capitalTransactions.platformId],
    references: [platforms.id],
  }),
  cashAccount: one(cashAccounts, {
    fields: [capitalTransactions.cashAccountId],
    references: [cashAccounts.id],
  }),
  transaction: one(transactions, {
    fields: [capitalTransactions.transactionId],
    references: [transactions.id],
  }),
}));

// Budget Relations
export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [budgets.platformId],
    references: [platforms.id],
  }),
  lineItems: many(budgetLineItems),
}));

export const budgetLineItemsRelations = relations(budgetLineItems, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetLineItems.budgetId],
    references: [budgets.id],
  }),
  account: one(chartOfAccounts, {
    fields: [budgetLineItems.accountId],
    references: [chartOfAccounts.id],
  }),
}));

// ===================== ACCOUNTING ZOD SCHEMAS =====================

// Chart of Accounts Schemas
export const insertChartOfAccountsSchema = createInsertSchema(chartOfAccounts);
export type InsertChartOfAccounts = z.infer<typeof insertChartOfAccountsSchema>;
export type ChartOfAccounts = typeof chartOfAccounts.$inferSelect;

// Transactions Schemas
export const insertTransactionSchema = createInsertSchema(transactions);
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Transaction Entries Schemas
export const insertTransactionEntrySchema = createInsertSchema(transactionEntries);
export type InsertTransactionEntry = z.infer<typeof insertTransactionEntrySchema>;
export type TransactionEntry = typeof transactionEntries.$inferSelect;

// Cash Accounts Schemas
export const insertCashAccountSchema = createInsertSchema(cashAccounts);
export type InsertCashAccount = z.infer<typeof insertCashAccountSchema>;
export type CashAccount = typeof cashAccounts.$inferSelect;

// Cash Transactions Schemas
export const insertCashTransactionSchema = createInsertSchema(cashTransactions);
export type InsertCashTransaction = z.infer<typeof insertCashTransactionSchema>;
export type CashTransaction = typeof cashTransactions.$inferSelect;

// Expense Categories Schemas
export const insertExpenseCategorySchema = createInsertSchema(expenseCategories);
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;

// Expenses Schemas
export const insertExpenseSchema = createInsertSchema(expenses);
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Capital Transactions Schemas
export const insertCapitalTransactionSchema = createInsertSchema(capitalTransactions);
export type InsertCapitalTransaction = z.infer<typeof insertCapitalTransactionSchema>;
export type CapitalTransaction = typeof capitalTransactions.$inferSelect;

// Budget Schemas
export const insertBudgetSchema = createInsertSchema(budgets);
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export const insertBudgetLineItemSchema = createInsertSchema(budgetLineItems);
export type InsertBudgetLineItem = z.infer<typeof insertBudgetLineItemSchema>;
export type BudgetLineItem = typeof budgetLineItems.$inferSelect;

// ===================== ENHANCED LEAD FORMS MANAGEMENT =====================

// Complete Lead Generation Campaign Schema (extends the existing campaign schema)
export const leadGenerationCampaignSchema = z.object({
  // Campaign data
  campaignName: z.string().min(1, "اسم الحملة مطلوب"),
  objective: z.literal("LEAD_GENERATION"),
  campaignBudgetMode: z.enum(["BUDGET_MODE_DAY", "BUDGET_MODE_TOTAL", "BUDGET_MODE_INFINITE"]),
  campaignBudget: z.string().optional(),
  useCampaignBudgetOptimization: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  
  // Ad Group data
  adGroupName: z.string().min(1, "اسم المجموعة الإعلانية مطلوب"),
  adGroupBudgetMode: z.enum(["BUDGET_MODE_DAY", "BUDGET_MODE_TOTAL", "BUDGET_MODE_INFINITE"]),
  adGroupBudget: z.string().optional(),
  bidType: z.enum(["BID_TYPE_NO_BID", "BID_TYPE_CUSTOM"]).default("BID_TYPE_NO_BID"),
  bidPrice: z.string().optional(),
  
  // Ad data
  adName: z.string().min(1, "اسم الإعلان مطلوب"),
  adFormat: z.enum(["SINGLE_VIDEO", "SINGLE_IMAGE"]).default("SINGLE_VIDEO"),
  displayName: z.string().min(1, "اسم العرض مطلوب"),
  adText: z.string().min(1, "نص الإعلان مطلوب"),
  callToAction: z.enum([
    "LEARN_MORE",
    "SIGN_UP", 
    "CONTACT_US",
    "APPLY_NOW"
  ]).default("LEARN_MORE"),
  
  // Media files
  videoUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  
  // Lead Form data (specific to lead generation)
  leadFormName: z.string().min(1, "اسم النموذج مطلوب"),
  formTitle: z.string().min(1, "عنوان النموذج مطلوب"),
  formDescription: z.string().min(1, "وصف النموذج مطلوب"),
  privacyPolicyUrl: z.string().url("رابط سياسة الخصوصية غير صحيح"),
  successMessage: z.string().optional(),
  
  // Product selection for auto-content generation
  selectedProductId: z.string().optional(), // معرف المنتج المختار لتوليد المحتوى
  
  // Identity data
  identityId: z.string().optional(),
  
  // Targeting data
  targeting: z.object({
    gender: z.enum(["GENDER_MALE", "GENDER_FEMALE", "GENDER_UNLIMITED"]).optional(),
    age_groups: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
  }).optional(),
});

export type LeadGenerationCampaign = z.infer<typeof leadGenerationCampaignSchema>;

// ===================== EMPLOYEES AND PERMISSIONS SYSTEM =====================

// Employee Role Enum
export const employeeRoleEnum = pgEnum("employee_role", [
  "admin",           // مدير عام - جميع الصلاحيات
  "manager",         // مدير - معظم الصلاحيات
  "supervisor",      // مشرف - صلاحيات محدودة
  "employee",        // موظف - صلاحيات أساسية
  "viewer"           // مشاهد فقط
]);

// Employee Status Enum
export const employeeStatusEnum = pgEnum("employee_status", [
  "active",
  "inactive", 
  "suspended",
  "terminated"
]);

// Employees Table
// Employee departments table
export const employeeDepartments = pgTable("employee_departments", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  description: varchar("description"),
  platformId: varchar("platform_id").references(() => platforms.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee positions table
export const employeePositions = pgTable("employee_positions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  description: varchar("description"),
  departmentId: varchar("department_id").references(() => employeeDepartments.id, { onDelete: "cascade" }),
  platformId: varchar("platform_id").references(() => platforms.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  role: employeeRoleEnum("role").default("employee"),
  status: employeeStatusEnum("status").default("active"),
  departmentId: varchar("department_id").references(() => employeeDepartments.id), // ربط بجدول الأقسام
  salary: decimal("salary", { precision: 10, scale: 2 }),
  hireDate: timestamp("hire_date").defaultNow(),
  profileImageUrl: varchar("profile_image_url"),
  
  // وثائق الموظف
  nationalIdFrontUrl: varchar("national_id_front_url"),
  nationalIdBackUrl: varchar("national_id_back_url"),
  residenceCardFrontUrl: varchar("residence_card_front_url"),
  residenceCardBackUrl: varchar("residence_card_back_url"),
  
  // إعدادات تسجيل الدخول
  username: varchar("username").unique(),
  password: varchar("password"), // مُشفر
  lastLoginAt: timestamp("last_login_at"),
  
  // معلومات إضافية
  notes: text("notes"),
  emergencyContact: varchar("emergency_contact"),
  address: text("address"),
  
  createdBy: varchar("created_by"), // من أضاف الموظف
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Permissions Enum - صلاحيات محددة
export const permissionEnum = pgEnum("permission", [
  // لوحة التحكم
  "dashboard_view",
  
  // إدارة المنتجات
  "products_view",
  "products_create",
  "products_edit", 
  "products_delete",
  
  // إدارة التصنيفات
  "categories_view",
  "categories_create",
  "categories_edit",
  "categories_delete",
  
  // صفحات الهبوط
  "landing_pages_view",
  "landing_pages_create", 
  "landing_pages_edit",
  "landing_pages_delete",
  
  // إدارة الطلبات
  "orders_view",
  "orders_create",
  "orders_edit",
  "orders_delete",
  "orders_export",
  "orders_status_change",
  
  // واتساب الأعمال
  "whatsapp_view",
  "whatsapp_send",
  "whatsapp_manage",
  
  // الإعلانات
  "ads_view",
  "ads_create",
  "ads_edit",
  "ads_delete",
  "ads_analytics",
  "ads_manage_budget",
  
  // النظام المحاسبي
  "accounting_view",
  "accounting_create",
  "accounting_edit",
  "accounting_delete",
  "accounting_reports",
  
  // حساباتي (My Accounts)
  "accounts_view",
  "accounts_manage",
  "accounts_reports",
  
  // الإعدادات
  "settings_view",
  "settings_edit",
  
  // التصميم
  "design_view",
  "design_edit",
  
  // الكول سنتر
  "call_center_view",
  "call_center_manage",
  
  // التجهيز
  "preparation_view", 
  "preparation_manage",
  "fulfillment_view",
  "fulfillment_manage",
  
  // المخزون
  "inventory_view",
  "inventory_manage",
  "stock_update",
  "stock_reports",
  
  // إدارة الموظفين
  "employees_view",
  "employees_create",
  "employees_edit",
  "employees_delete",
  "employees_permissions"
]);

// Employee Permissions Junction Table
export const employeePermissions = pgTable("employee_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  permission: permissionEnum("permission").notNull(),
  grantedBy: varchar("granted_by"), // من منح الصلاحية
  grantedAt: timestamp("granted_at").defaultNow(),
});

// Employee Sessions for login tracking
export const employeeSessions = pgTable("employee_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  sessionToken: varchar("session_token").unique().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  loginAt: timestamp("login_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Employee Activity Log
export const employeeActivities = pgTable("employee_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  action: varchar("action").notNull(), // الإجراء المتخذ
  entityType: varchar("entity_type"), // نوع الكيان المتأثر
  entityId: varchar("entity_id"), // معرف الكيان
  details: text("details"), // تفاصيل الإجراء
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for Employee System
// Employee Departments Relations
export const employeeDepartmentsRelations = relations(employeeDepartments, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [employeeDepartments.platformId],
    references: [platforms.id],
  }),
  positions: many(employeePositions),
}));

// Employee Positions Relations
export const employeePositionsRelations = relations(employeePositions, ({ one }) => ({
  platform: one(platforms, {
    fields: [employeePositions.platformId],
    references: [platforms.id],
  }),
  department: one(employeeDepartments, {
    fields: [employeePositions.departmentId],
    references: [employeeDepartments.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [employees.platformId],
    references: [platforms.id],
  }),
  permissions: many(employeePermissions),
  sessions: many(employeeSessions),
  activities: many(employeeActivities),
}));

export const employeePermissionsRelations = relations(employeePermissions, ({ one }) => ({
  employee: one(employees, {
    fields: [employeePermissions.employeeId],
    references: [employees.id],
  }),
}));

export const employeeSessionsRelations = relations(employeeSessions, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeSessions.employeeId],
    references: [employees.id],
  }),
}));

export const employeeActivitiesRelations = relations(employeeActivities, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeActivities.employeeId],
    references: [employees.id],
  }),
  platform: one(platforms, {
    fields: [employeeActivities.platformId],
    references: [platforms.id],
  }),
}));

// Employee Schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Employee form schema with validation
export const addEmployeeSchema = insertEmployeeSchema.omit({
  platformId: true, // Will be added by the server
}).extend({
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
  confirmPassword: z.string(),
  hireDate: z.string().optional(), // Keep as string for form handling
  salary: z.string().optional(), // Keep as string for form handling
  departmentId: z.string().min(1, "يجب اختيار قسم"), // إضافة تحقق من القسم
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتان",
  path: ["confirmPassword"],
});

export type AddEmployeeForm = z.infer<typeof addEmployeeSchema>;

// Employee login schema
export const employeeLoginSchema = z.object({
  identifier: z.string().min(1, "يرجى إدخال اسم المستخدم أو رقم الهاتف"),
  password: z.string().min(1, "يرجى إدخال كلمة المرور"),
});

export type EmployeeLoginForm = z.infer<typeof employeeLoginSchema>;

export const insertEmployeePermissionSchema = createInsertSchema(employeePermissions).omit({
  id: true,
  grantedAt: true,
});

export const insertEmployeeSessionSchema = createInsertSchema(employeeSessions).omit({
  id: true,
  loginAt: true,
  lastActivityAt: true,
});

export const insertEmployeeActivitySchema = createInsertSchema(employeeActivities).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type Employee = typeof employees.$inferSelect & {
  permissions?: string[];
};
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type EmployeePermission = typeof employeePermissions.$inferSelect;
export type InsertEmployeePermission = z.infer<typeof insertEmployeePermissionSchema>;
export type EmployeeSession = typeof employeeSessions.$inferSelect;
export type InsertEmployeeSession = z.infer<typeof insertEmployeeSessionSchema>;
export type EmployeeActivity = typeof employeeActivities.$inferSelect;
export type InsertEmployeeActivity = z.infer<typeof insertEmployeeActivitySchema>;

// Department and Position Schemas
export const insertEmployeeDepartmentSchema = createInsertSchema(employeeDepartments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeePositionSchema = createInsertSchema(employeePositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for departments and positions
export type EmployeeDepartment = typeof employeeDepartments.$inferSelect;
export type InsertEmployeeDepartment = z.infer<typeof insertEmployeeDepartmentSchema>;
export type EmployeePosition = typeof employeePositions.$inferSelect;
export type InsertEmployeePosition = z.infer<typeof insertEmployeePositionSchema>;

// ===================== PRODUCT VARIANTS SYSTEM =====================

// Product Colors - ألوان المنتجات
export const productColors = pgTable("product_colors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  colorName: varchar("color_name").notNull(), // اسم اللون بالعربية
  colorCode: varchar("color_code"), // كود اللون hex مثل #FF0000
  colorImageUrl: varchar("color_image_url"), // صورة اللون
  priceAdjustment: decimal("price_adjustment", { precision: 10, scale: 2 }).default("0"), // تعديل السعر
  stockQuantity: integer("stock_quantity").default(0), // المخزون لهذا اللون
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // ترتيب العرض
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Shapes - أشكال المنتجات
export const productShapes = pgTable("product_shapes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  shapeName: varchar("shape_name").notNull(), // اسم الشكل
  shapeDescription: text("shape_description"), // وصف الشكل
  shapeImageUrl: varchar("shape_image_url"), // صورة الشكل (اختيارية)
  priceAdjustment: decimal("price_adjustment", { precision: 10, scale: 2 }).default("0"), // تعديل السعر
  stockQuantity: integer("stock_quantity").default(0), // المخزون لهذا الشكل
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // ترتيب العرض
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Sizes - أقياس المنتجات
export const productSizes = pgTable("product_sizes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  sizeName: varchar("size_name").notNull(), // اسم المقاس (صغير، متوسط، كبير)
  sizeValue: varchar("size_value"), // قيمة المقاس (S, M, L أو أرقام)
  sizeDescription: text("size_description"), // وصف المقاس
  priceAdjustment: decimal("price_adjustment", { precision: 10, scale: 2 }).default("0"), // تعديل السعر
  stockQuantity: integer("stock_quantity").default(0), // المخزون لهذا المقاس
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // ترتيب العرض
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Variant Combinations - تجميعات متغيرات المنتج
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  platformId: varchar("platform_id").references(() => platforms.id).notNull(),
  colorId: varchar("color_id").references(() => productColors.id),
  shapeId: varchar("shape_id").references(() => productShapes.id),
  sizeId: varchar("size_id").references(() => productSizes.id),
  
  // معلومات المتغير
  variantName: varchar("variant_name"), // اسم المتغير المجمع
  sku: varchar("sku").unique(), // كود المنتج للمتغير
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // سعر المتغير النهائي
  cost: decimal("cost", { precision: 10, scale: 2 }), // تكلفة المتغير
  stockQuantity: integer("stock_quantity").default(0), // المخزون للمتغير
  lowStockThreshold: integer("low_stock_threshold").default(5),
  
  // صور المتغير
  imageUrls: text("image_urls").array(), // صور إضافية للمتغير
  
  // حالة المتغير
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // المتغير الافتراضي
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for Product Variants
export const productColorsRelations = relations(productColors, ({ one, many }) => ({
  product: one(products, {
    fields: [productColors.productId],
    references: [products.id],
  }),
  platform: one(platforms, {
    fields: [productColors.platformId],
    references: [platforms.id],
  }),
  variants: many(productVariants),
}));

export const productShapesRelations = relations(productShapes, ({ one, many }) => ({
  product: one(products, {
    fields: [productShapes.productId],
    references: [products.id],
  }),
  platform: one(platforms, {
    fields: [productShapes.platformId],
    references: [platforms.id],
  }),
  variants: many(productVariants),
}));

export const productSizesRelations = relations(productSizes, ({ one, many }) => ({
  product: one(products, {
    fields: [productSizes.productId],
    references: [products.id],
  }),
  platform: one(platforms, {
    fields: [productSizes.platformId],
    references: [platforms.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  platform: one(platforms, {
    fields: [productVariants.platformId],
    references: [platforms.id],
  }),
  color: one(productColors, {
    fields: [productVariants.colorId],
    references: [productColors.id],
  }),
  shape: one(productShapes, {
    fields: [productVariants.shapeId],
    references: [productShapes.id],
  }),
  size: one(productSizes, {
    fields: [productVariants.sizeId],
    references: [productSizes.id],
  }),
}));

// Update existing products relations to include variants
export const productsVariantsRelations = relations(products, ({ many }) => ({
  colors: many(productColors),
  shapes: many(productShapes),
  sizes: many(productSizes),
  variants: many(productVariants),
}));

// Insert Schemas for Product Variants
export const insertProductColorSchema = createInsertSchema(productColors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  colorName: z.string().min(1, "اسم اللون مطلوب"),
  colorCode: z.string().optional(),
  priceAdjustment: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : "0"),
  stockQuantity: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : 0),
});

export const insertProductShapeSchema = createInsertSchema(productShapes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  shapeName: z.string().min(1, "اسم الشكل مطلوب"),
  shapeImageUrl: z.string().optional(),
  priceAdjustment: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : "0"),
  stockQuantity: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : 0),
});

export const insertProductSizeSchema = createInsertSchema(productSizes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sizeName: z.string().min(1, "اسم المقاس مطلوب"),
  priceAdjustment: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : "0"),
  stockQuantity: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : 0),
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform(val => String(val)),
  cost: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  stockQuantity: z.union([z.string(), z.number()]).optional().transform(val => val ? Number(val) : 0),
});

// Types for Product Variants
export type ProductColor = typeof productColors.$inferSelect;
export type InsertProductColor = z.infer<typeof insertProductColorSchema>;
export type ProductShape = typeof productShapes.$inferSelect;
export type InsertProductShape = z.infer<typeof insertProductShapeSchema>;
export type ProductSize = typeof productSizes.$inferSelect;
export type InsertProductSize = z.infer<typeof insertProductSizeSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

// Daily advertising spend tracking table
export const dailyAdSpend = pgTable("daily_ad_spend", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  date: varchar("date").notNull(), // Format: YYYY-MM-DD
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // Amount in IQD
  originalAmount: decimal("original_amount", { precision: 12, scale: 2 }).notNull(), // Original amount entered
  currency: varchar("currency", { length: 3 }).notNull().default("USD"), // USD or IQD
  exchangeRate: decimal("exchange_rate", { precision: 8, scale: 2 }).default("1310.00"), // Rate used for conversion
  notes: text("notes"), // Optional notes about the spend
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_daily_ad_spend_platform_date").on(table.platformId, table.date),
  unique("unique_platform_date").on(table.platformId, table.date),
]);

// Relations for daily ad spend
export const dailyAdSpendRelations = relations(dailyAdSpend, ({ one }) => ({
  platform: one(platforms, {
    fields: [dailyAdSpend.platformId],
    references: [platforms.id],
  }),
}));

// Insert schema for daily ad spend
export const insertDailyAdSpendSchema = createInsertSchema(dailyAdSpend).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for daily ad spend
export type InsertDailyAdSpend = z.infer<typeof insertDailyAdSpendSchema>;
export type DailyAdSpend = typeof dailyAdSpend.$inferSelect;

// Platform themes relations
export const platformThemesRelations = relations(platformThemes, ({ one }) => ({
  platform: one(platforms, {
    fields: [platformThemes.platformId],
    references: [platforms.id],
  }),
}));

// Platform themes schemas
export const insertPlatformThemeSchema = createInsertSchema(platformThemes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePlatformThemeSchema = insertPlatformThemeSchema.partial();

// Platform themes types
export type PlatformTheme = typeof platformThemes.$inferSelect;
export type InsertPlatformTheme = z.infer<typeof insertPlatformThemeSchema>;
export type UpdatePlatformTheme = z.infer<typeof updatePlatformThemeSchema>;
