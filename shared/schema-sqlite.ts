import { sql } from "drizzle-orm";
import {
  index,
  text,
  sqliteTable,
  integer,
  real,
  blob,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
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
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// Platforms table - SQLite version
export const platforms = sqliteTable("platforms", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  subdomain: text("subdomain").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#3B82F6"),
  secondaryColor: text("secondary_color").default("#10B981"),
  accentColor: text("accent_color").default("#F59E0B"),
  subscriptionPlan: text("subscription_plan").default("free"), // 'free', 'basic', 'premium', 'enterprise'
  subscriptionStatus: text("subscription_status").default("active"), // 'active', 'suspended', 'pending_verification', 'pending_payment', 'cancelled', 'expired'
  subscriptionStartDate: integer("subscription_start_date", { mode: "timestamp" }),
  subscriptionEndDate: integer("subscription_end_date", { mode: "timestamp" }),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  userId: text("user_id"),
  adminUserId: text("admin_user_id").references(() => adminUsers.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
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
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  handle: text("handle").unique(),
  platformId: text("platform_id").references(() => platforms.id),
  categoryId: text("category_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
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
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
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
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
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
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
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
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
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
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
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
