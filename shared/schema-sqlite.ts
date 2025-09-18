import { sql } from "drizzle-orm";
import {
  index,
  text,
  sqliteTable,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for SQLite
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  })
);

// Admin users table - SQLite version
export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").default("super_admin"), // 'super_admin', 'admin', 'employee'
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Platforms table - SQLite version
export const platforms = sqliteTable("platforms", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  subdomain: text("subdomain").unique().notNull(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  description: text("description"),
  logo: text("logo"),
  ownerName: text("owner_name"),
  phoneNumber: text("phone_number"),
  whatsappNumber: text("whatsapp_number"),
  businessType: text("business_type"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#3B82F6"),
  secondaryColor: text("secondary_color").default("#10B981"),
  accentColor: text("accent_color").default("#F59E0B"),
  subscriptionPlan: text("subscription_plan").default("free"), // 'free', 'basic', 'premium', 'enterprise'
  subscriptionStatus: text("subscription_status").default("active"), // 'active', 'suspended', 'pending_verification', 'pending_payment', 'cancelled', 'expired'
  subscriptionStartDate: integer("subscription_start_date", { mode: "timestamp" }),
  subscriptionEndDate: integer("subscription_end_date", { mode: "timestamp" }),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  userId: text("user_id"),
  adminUserId: text("admin_user_id").references(() => adminUsers.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Products table - SQLite version
export const products = sqliteTable("products", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  compareAtPrice: real("compare_at_price"),
  costPerItem: real("cost_per_item"),
  sku: text("sku"),
  barcode: text("barcode"),
  trackQuantity: integer("track_quantity", { mode: "boolean" }).default(true),
  quantity: integer("quantity").default(0),
  allowBackorder: integer("allow_backorder", { mode: "boolean" }).default(false),
  weight: real("weight"),
  weightUnit: text("weight_unit").default("kg"),
  requiresShipping: integer("requires_shipping", { mode: "boolean" }).default(true),
  taxable: integer("taxable", { mode: "boolean" }).default(true),
  status: text("status").default("draft"), // 'draft', 'active', 'archived'
  vendor: text("vendor"),
  productType: text("product_type"),
  tags: text("tags"),
  images: text("images"), // JSON string
  additionalImages: text("additional_images"), // JSON string for additional images
  priceOffers: text("price_offers"), // JSON string for price offers
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  handle: text("handle").unique(),
  platformId: text("platform_id").references(() => platforms.id),
  categoryId: text("category_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Categories table - SQLite version
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").unique().notNull(),
  image: text("image"),
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  platformId: text("platform_id").references(() => platforms.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Orders table - SQLite version
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  orderNumber: text("order_number").unique().notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  customerCity: text("customer_city"),
  customerGovernorate: text("customer_governorate"),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount").default(0),
  shippingAmount: real("shipping_amount").default(0),
  discountAmount: real("discount_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  paymentMethod: text("payment_method"),
  shippingMethod: text("shipping_method"),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  trackingNumber: text("tracking_number"),
  platformId: text("platform_id").references(() => platforms.id),
  landingPageId: text("landing_page_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Insert schemas
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type SelectAdminUser = typeof adminUsers.$inferSelect;

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type SelectPlatform = typeof platforms.$inferSelect;

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type SelectProduct = typeof products.$inferSelect;

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type SelectCategory = typeof categories.$inferSelect;

// Landing Page Orders table - SQLite version
export const landingPageOrders = sqliteTable("landing_page_orders", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  productId: text("product_id"),
  quantity: integer("quantity").default(1),
  unitPrice: real("unit_price").notNull(),
  discountAmount: real("discount_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  paymentMethod: text("payment_method"),
  shippingMethod: text("shipping_method"),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  trackingNumber: text("tracking_number"),
  platformId: text("platform_id").references(() => platforms.id),
  landingPageId: text("landing_page_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const insertOrderSchema = createInsertSchema(landingPageOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type SelectOrder = typeof landingPageOrders.$inferSelect;

// ZainCash Payments Table - SQLite version
export const zainCashPayments = sqliteTable("zain_cash_payments", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").references(() => platforms.id),
  orderId: text("order_id").unique().notNull(),
  amount: real("amount").notNull(),
  subscriptionPlan: text("subscription_plan").notNull(), // 'basic', 'premium', 'enterprise'
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'success', 'failed', 'cancelled'
  transactionId: text("transaction_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const insertZainCashPaymentSchema = createInsertSchema(zainCashPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertZainCashPayment = z.infer<typeof insertZainCashPaymentSchema>;
export type ZainCashPayment = typeof zainCashPayments.$inferSelect;

// Platform themes table - SQLite version
export const platformThemes = sqliteTable("platform_themes", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  themeId: text("theme_id").notNull().default("ocean-breeze"),
  darkMode: integer("dark_mode", { mode: "boolean" }).default(false),
  customPrimary: text("custom_primary"),
  customSecondary: text("custom_secondary"),
  customAccent: text("custom_accent"),
  customGradient: text("custom_gradient"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

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

// Users table - SQLite version
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  profileImageUrl: text("profile_image_url"),
  address: text("address"),
  bio: text("bio"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Landing pages table - SQLite version
export const landingPages = sqliteTable("landing_pages", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Order items table - SQLite version
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  orderId: text("order_id").notNull().references(() => landingPageOrders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  price: real("price").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Activities table - SQLite version
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'login', 'order', 'product_view', etc.
  description: text("description"),
  metadata: text("metadata"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// System settings table - SQLite version
export const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  key: text("key").unique().notNull(),
  value: text("value"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// TikTok campaigns table - SQLite version
export const tiktokCampaigns = sqliteTable("tiktok_campaigns", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").default("active"), // 'active', 'paused', 'completed'
  budget: real("budget"),
  spent: real("spent").default(0),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// TikTok ad groups table - SQLite version
export const tiktokAdGroups = sqliteTable("tiktok_ad_groups", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  campaignId: text("campaign_id").notNull().references(() => tiktokCampaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").default("active"),
  budget: real("budget"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// TikTok ads table - SQLite version
export const tiktokAds = sqliteTable("tiktok_ads", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  adGroupId: text("ad_group_id").notNull().references(() => tiktokAdGroups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").default("active"),
  creativeUrl: text("creative_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// TikTok lead forms table - SQLite version
export const tiktokLeadForms = sqliteTable("tiktok_lead_forms", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fields: text("fields"), // JSON string
  status: text("status").default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// TikTok leads table - SQLite version
export const tiktokLeads = sqliteTable("tiktok_leads", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  formId: text("form_id").notNull().references(() => tiktokLeadForms.id, { onDelete: "cascade" }),
  data: text("data"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// TikTok pixels table - SQLite version
export const tiktokPixels = sqliteTable("tiktok_pixels", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  pixelId: text("pixel_id").unique().notNull(),
  name: text("name").notNull(),
  status: text("status").default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Chart of accounts table - SQLite version
export const chartOfAccounts = sqliteTable("chart_of_accounts", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'asset', 'liability', 'equity', 'revenue', 'expense'
  parentId: text("parent_id"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Transactions table - SQLite version
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  reference: text("reference").notNull(),
  description: text("description"),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // 'debit', 'credit'
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Transaction entries table - SQLite version
export const transactionEntries = sqliteTable("transaction_entries", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  transactionId: text("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references(() => chartOfAccounts.id),
  debit: real("debit").default(0),
  credit: real("credit").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Cash accounts table - SQLite version
export const cashAccounts = sqliteTable("cash_accounts", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  balance: real("balance").default(0),
  currency: text("currency").default("IQD"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Export types
export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectLandingPage = typeof landingPages.$inferSelect;
export type InsertLandingPage = typeof landingPages.$inferInsert;
export type SelectOrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type SelectActivity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
export type SelectSystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type SelectTiktokCampaign = typeof tiktokCampaigns.$inferSelect;
export type InsertTiktokCampaign = typeof tiktokCampaigns.$inferInsert;
export type SelectTiktokAdGroup = typeof tiktokAdGroups.$inferSelect;
export type InsertTiktokAdGroup = typeof tiktokAdGroups.$inferInsert;
export type SelectTiktokAd = typeof tiktokAds.$inferSelect;
export type InsertTiktokAd = typeof tiktokAds.$inferInsert;
export type SelectTiktokLeadForm = typeof tiktokLeadForms.$inferSelect;
export type InsertTiktokLeadForm = typeof tiktokLeadForms.$inferInsert;
export type SelectTiktokLead = typeof tiktokLeads.$inferSelect;
export type InsertTiktokLead = typeof tiktokLeads.$inferInsert;
export type SelectTiktokPixel = typeof tiktokPixels.$inferSelect;
export type InsertTiktokPixel = typeof tiktokPixels.$inferInsert;
export type SelectChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type InsertChartOfAccount = typeof chartOfAccounts.$inferInsert;
export type SelectTransaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type SelectTransactionEntry = typeof transactionEntries.$inferSelect;
export type InsertTransactionEntry = typeof transactionEntries.$inferInsert;
export type SelectCashAccount = typeof cashAccounts.$inferSelect;
export type InsertCashAccount = typeof cashAccounts.$inferInsert;

// Cash transactions table - SQLite version
export const cashTransactions = sqliteTable("cash_transactions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  accountId: text("account_id").notNull().references(() => cashAccounts.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // 'deposit', 'withdrawal'
  description: text("description"),
  reference: text("reference"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Expense categories table - SQLite version
export const expenseCategories = sqliteTable("expense_categories", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Expenses table - SQLite version
export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => expenseCategories.id),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  receipt: text("receipt"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export type SelectCashTransaction = typeof cashTransactions.$inferSelect;
export type InsertCashTransaction = typeof cashTransactions.$inferInsert;
export type SelectExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;
export type SelectExpense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// Budgets table - SQLite version
export const budgets = sqliteTable("budgets", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  period: text("period").default("monthly"), // 'monthly', 'yearly'
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Product colors table - SQLite version
export const productColors = sqliteTable("product_colors", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hexCode: text("hex_code").notNull(),
  colorImageUrl: text("color_image_url"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Product shapes table - SQLite version
export const productShapes = sqliteTable("product_shapes", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shapeImageUrl: text("shape_image_url"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export type SelectBudget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
export type SelectProductColor = typeof productColors.$inferSelect;
export type InsertProductColor = typeof productColors.$inferInsert;
export type SelectProductShape = typeof productShapes.$inferSelect;
export type InsertProductShape = typeof productShapes.$inferInsert;

// Product sizes table - SQLite version
export const productSizes = sqliteTable("product_sizes", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sizeValue: text("size_value"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Product variants table - SQLite version
export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  colorId: text("color_id").references(() => productColors.id),
  sizeId: text("size_id").references(() => productSizes.id),
  shapeId: text("shape_id").references(() => productShapes.id),
  variantName: text("variant_name"),
  sku: text("sku"),
  price: real("price"),
  cost: real("cost"),
  stockQuantity: integer("stock_quantity").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  imageUrls: text("image_urls"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Daily ad spend table - SQLite version
export const dailyAdSpend = sqliteTable("daily_ad_spend", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  amount: real("amount").notNull(),
  source: text("source").notNull(), // 'tiktok', 'facebook', 'google', etc.
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export type SelectProductSize = typeof productSizes.$inferSelect;
export type InsertProductSize = typeof productSizes.$inferInsert;
export type SelectProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;
export type SelectDailyAdSpend = typeof dailyAdSpend.$inferSelect;
export type InsertDailyAdSpend = typeof dailyAdSpend.$inferInsert;

// Ad platform settings table - SQLite version
export const adPlatformSettings = sqliteTable("ad_platform_settings", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  adPlatform: text("ad_platform").notNull(), // 'tiktok', 'facebook', 'google'
  settings: text("settings"), // JSON string
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Ad accounts table - SQLite version
export const adAccounts = sqliteTable("ad_accounts", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  platform: text("platform").notNull(), // 'tiktok', 'facebook', 'google'
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Platform ad accounts table - SQLite version
export const platformAdAccounts = sqliteTable("platform_ad_accounts", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  adAccountId: text("ad_account_id").notNull().references(() => adAccounts.id, { onDelete: "cascade" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export type SelectAdPlatformSetting = typeof adPlatformSettings.$inferSelect;
export type InsertAdPlatformSetting = typeof adPlatformSettings.$inferInsert;
export type SelectAdAccount = typeof adAccounts.$inferSelect;
export type InsertAdAccount = typeof adAccounts.$inferInsert;
export type SelectPlatformAdAccount = typeof platformAdAccounts.$inferSelect;
export type InsertPlatformAdAccount = typeof platformAdAccounts.$inferInsert;

// Delivery settings table - SQLite version
export const deliverySettings = sqliteTable("delivery_settings", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  deliveryFee: real("delivery_fee").default(0),
  freeDeliveryThreshold: real("free_delivery_threshold"),
  estimatedDeliveryTime: text("estimated_delivery_time"),
  deliveryAreas: text("delivery_areas"), // JSON string
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Employees table - SQLite version
export const employees = sqliteTable("employees", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").default("employee"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Employee permissions table - SQLite version
export const employeePermissions = sqliteTable("employee_permissions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  permission: text("permission").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export type SelectDeliverySetting = typeof deliverySettings.$inferSelect;
export type InsertDeliverySetting = typeof deliverySettings.$inferInsert;
export type SelectEmployee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type SelectEmployeePermission = typeof employeePermissions.$inferSelect;
export type InsertEmployeePermission = typeof employeePermissions.$inferInsert;

// Employee sessions table - SQLite version
export const employeeSessions = sqliteTable("employee_sessions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Employee activities table - SQLite version
export const employeeActivities = sqliteTable("employee_activities", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Employee departments table - SQLite version
export const employeeDepartments = sqliteTable("employee_departments", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  description: text("description"),
  platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
  managerId: text("manager_id").references(() => employees.id),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export type SelectEmployeeSession = typeof employeeSessions.$inferSelect;
export type InsertEmployeeSession = typeof employeeSessions.$inferInsert;
export type SelectEmployeeActivity = typeof employeeActivities.$inferSelect;
export type InsertEmployeeActivity = typeof employeeActivities.$inferInsert;
export type SelectEmployeeDepartment = typeof employeeDepartments.$inferSelect;
export type InsertEmployeeDepartment = typeof employeeDepartments.$inferInsert;

// Employee positions table - SQLite version
export const employeePositions = sqliteTable("employee_positions", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  departmentId: text("department_id").notNull().references(() => employeeDepartments.id, { onDelete: "cascade" }),
  position: text("position").notNull(),
  salary: real("salary"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export type SelectEmployeePosition = typeof employeePositions.$inferSelect;
export type InsertEmployeePosition = typeof employeePositions.$inferInsert;

// Schema validation types for inserts
export const insertLandingPageSchema = createInsertSchema(landingPages);
export const insertProductColorSchema = createInsertSchema(productColors);
export const insertProductShapeSchema = createInsertSchema(productShapes);
export const insertProductSizeSchema = createInsertSchema(productSizes);
export const insertProductVariantSchema = createInsertSchema(productVariants);

// Subscription features table - SQLite version
export const subscriptionFeatures = sqliteTable("subscription_features", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Admin actions log table - SQLite version
export const adminActionsLog = sqliteTable("admin_actions_log", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  adminUserId: text("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetType: text("target_type"), // 'platform', 'user', 'product', etc.
  targetId: text("target_id"),
  description: text("description"),
  metadata: text("metadata"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export type SelectSubscriptionFeature = typeof subscriptionFeatures.$inferSelect;
export type InsertSubscriptionFeature = typeof subscriptionFeatures.$inferInsert;
export type SelectAdminActionLog = typeof adminActionsLog.$inferSelect;
export type InsertAdminActionLog = typeof adminActionsLog.$inferInsert;

export const insertSubscriptionFeatureSchema = createInsertSchema(subscriptionFeatures);
