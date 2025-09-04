CREATE TYPE "public"."landing_page_template" AS ENUM('modern_minimal', 'bold_hero', 'product_showcase', 'testimonial_focus', 'feature_highlight', 'countdown_urgency', 'video_intro', 'comparison_table', 'benefits_grid', 'story_driven');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."platform_status" AS ENUM('active', 'suspended', 'pending_verification', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'basic', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'platform_owner', 'platform_admin', 'platform_staff');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar NOT NULL,
	"description" text NOT NULL,
	"user_id" varchar,
	"platform_id" varchar,
	"entity_type" varchar,
	"entity_id" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"icon" varchar(50),
	"platform_id" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "landing_page_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar NOT NULL,
	"landing_page_id" varchar,
	"product_id" varchar,
	"platform_id" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_phone" varchar NOT NULL,
	"customer_governorate" varchar NOT NULL,
	"customer_address" text NOT NULL,
	"offer" varchar NOT NULL,
	"notes" text,
	"status" varchar DEFAULT 'pending',
	"total_amount" numeric(10, 2),
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "landing_page_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "landing_pages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar,
	"platform_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text,
	"custom_url" varchar,
	"template" "landing_page_template" DEFAULT 'modern_minimal',
	"is_active" boolean DEFAULT true,
	"views" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "landing_pages_custom_url_unique" UNIQUE("custom_url")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"product_id" varchar,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"offer" varchar
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_email" varchar,
	"customer_phone" varchar,
	"customer_address" text,
	"customer_governorate" varchar,
	"status" "order_status" DEFAULT 'pending',
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0',
	"shipping" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"landing_page_id" varchar,
	"platform_id" varchar NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_name" varchar NOT NULL,
	"owner_name" varchar NOT NULL,
	"phone_number" varchar NOT NULL,
	"whatsapp_number" varchar NOT NULL,
	"logo_url" varchar,
	"subdomain" varchar NOT NULL,
	"custom_domain" varchar,
	"subscription_plan" "subscription_plan" DEFAULT 'free',
	"status" "platform_status" DEFAULT 'pending_verification',
	"primary_color" varchar DEFAULT '#10B981',
	"secondary_color" varchar DEFAULT '#F3F4F6',
	"total_orders" integer DEFAULT 0,
	"total_revenue" numeric(12, 2) DEFAULT '0',
	"subscription_start_date" timestamp DEFAULT now(),
	"subscription_end_date" timestamp,
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "platforms_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "platforms_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"cost" numeric(10, 2),
	"stock" integer DEFAULT 0,
	"sku" varchar,
	"category_id" varchar,
	"platform_id" varchar NOT NULL,
	"image_urls" text[],
	"offers" text[],
	"two_item_price" numeric(10, 2),
	"three_item_price" numeric(10, 2),
	"bulk_price" numeric(10, 2),
	"bulk_min_quantity" integer DEFAULT 4,
	"default_landing_template" "landing_page_template" DEFAULT 'modern_minimal',
	"is_active" boolean DEFAULT true,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'platform_staff',
	"platform_id" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_orders" ADD CONSTRAINT "landing_page_orders_landing_page_id_landing_pages_id_fk" FOREIGN KEY ("landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_orders" ADD CONSTRAINT "landing_page_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_orders" ADD CONSTRAINT "landing_page_orders_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_landing_page_id_landing_pages_id_fk" FOREIGN KEY ("landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");