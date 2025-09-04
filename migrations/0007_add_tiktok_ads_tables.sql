-- Migration: Add TikTok Ads Management Tables
-- Created: 2025-08-15

-- حملات TikTok Ads
CREATE TABLE IF NOT EXISTS "tiktok_campaigns" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform_id" varchar NOT NULL REFERENCES "platforms"("id"),
  "campaign_id" varchar NOT NULL,
  "advertiser_id" varchar NOT NULL,
  "campaign_name" varchar NOT NULL,
  "objective" varchar NOT NULL,
  "status" varchar NOT NULL,
  "budget_mode" varchar NOT NULL,
  "budget" decimal(10,2),
  "start_time" timestamp,
  "end_time" timestamp,
  "impressions" integer DEFAULT 0,
  "clicks" integer DEFAULT 0,
  "spend" decimal(10,2) DEFAULT '0',
  "conversions" integer DEFAULT 0,
  "leads" integer DEFAULT 0,
  "cpm" decimal(10,4) DEFAULT '0',
  "cpc" decimal(10,4) DEFAULT '0',
  "ctr" decimal(5,4) DEFAULT '0',
  "conversion_rate" decimal(5,4) DEFAULT '0',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- مجموعات الإعلانات
CREATE TABLE IF NOT EXISTS "tiktok_ad_groups" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform_id" varchar NOT NULL REFERENCES "platforms"("id"),
  "campaign_id" varchar NOT NULL REFERENCES "tiktok_campaigns"("id"),
  "ad_group_id" varchar NOT NULL,
  "ad_group_name" varchar NOT NULL,
  "status" varchar NOT NULL,
  "budget_mode" varchar,
  "budget" decimal(10,2),
  "bid_type" varchar,
  "bid_price" decimal(10,4),
  "targeting_gender" varchar,
  "targeting_age_groups" text[],
  "targeting_locations" text[],
  "targeting_languages" text[],
  "targeting_interests" text[],
  "targeting_behaviors" text[],
  "impressions" integer DEFAULT 0,
  "clicks" integer DEFAULT 0,
  "spend" decimal(10,2) DEFAULT '0',
  "conversions" integer DEFAULT 0,
  "leads" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- الإعلانات
CREATE TABLE IF NOT EXISTS "tiktok_ads" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform_id" varchar NOT NULL REFERENCES "platforms"("id"),
  "ad_group_id" varchar NOT NULL REFERENCES "tiktok_ad_groups"("id"),
  "ad_id" varchar NOT NULL,
  "ad_name" varchar NOT NULL,
  "status" varchar NOT NULL,
  "ad_format" varchar NOT NULL,
  "landing_page_url" text,
  "display_name" varchar,
  "image_urls" text[],
  "video_url" varchar,
  "ad_text" text,
  "call_to_action" varchar,
  "pixel_id" varchar,
  "impressions" integer DEFAULT 0,
  "clicks" integer DEFAULT 0,
  "spend" decimal(10,2) DEFAULT '0',
  "conversions" integer DEFAULT 0,
  "leads" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Lead Forms لحملات جمع العملاء المحتملين
CREATE TABLE IF NOT EXISTS "tiktok_lead_forms" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform_id" varchar NOT NULL REFERENCES "platforms"("id"),
  "form_id" varchar NOT NULL,
  "form_name" varchar NOT NULL,
  "status" varchar NOT NULL,
  "form_title" varchar NOT NULL,
  "form_description" text,
  "privacy_policy_url" text,
  "form_fields" jsonb NOT NULL,
  "success_message" text,
  "total_leads" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- العملاء المحتملين من TikTok Lead Forms
CREATE TABLE IF NOT EXISTS "tiktok_leads" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform_id" varchar NOT NULL REFERENCES "platforms"("id"),
  "lead_form_id" varchar NOT NULL REFERENCES "tiktok_lead_forms"("id"),
  "ad_id" varchar REFERENCES "tiktok_ads"("id"),
  "lead_id" varchar NOT NULL,
  "customer_name" varchar,
  "customer_phone" varchar,
  "customer_email" varchar,
  "customer_data" jsonb,
  "follow_up_status" varchar DEFAULT 'new',
  "notes" text,
  "assigned_to" varchar,
  "submitted_at" timestamp NOT NULL,
  "last_contact_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- TikTok Pixel لتتبع التحويلات
CREATE TABLE IF NOT EXISTS "tiktok_pixels" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform_id" varchar NOT NULL REFERENCES "platforms"("id"),
  "pixel_id" varchar NOT NULL,
  "pixel_name" varchar NOT NULL,
  "pixel_code" text NOT NULL,
  "status" varchar DEFAULT 'active',
  "page_views" integer DEFAULT 0,
  "add_to_carts" integer DEFAULT 0,
  "purchases" integer DEFAULT 0,
  "leads" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- إنشاء Indexes للأداء
CREATE INDEX IF NOT EXISTS "idx_tiktok_campaigns_platform_id" ON "tiktok_campaigns"("platform_id");
CREATE INDEX IF NOT EXISTS "idx_tiktok_campaigns_campaign_id" ON "tiktok_campaigns"("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_tiktok_ad_groups_platform_id" ON "tiktok_ad_groups"("platform_id");
CREATE INDEX IF NOT EXISTS "idx_tiktok_ad_groups_campaign_id" ON "tiktok_ad_groups"("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_tiktok_ads_platform_id" ON "tiktok_ads"("platform_id");
CREATE INDEX IF NOT EXISTS "idx_tiktok_ads_ad_group_id" ON "tiktok_ads"("ad_group_id");
CREATE INDEX IF NOT EXISTS "idx_tiktok_lead_forms_platform_id" ON "tiktok_lead_forms"("platform_id");
CREATE INDEX IF NOT EXISTS "idx_tiktok_leads_platform_id" ON "tiktok_leads"("platform_id");
CREATE INDEX IF NOT EXISTS "idx_tiktok_leads_form_id" ON "tiktok_leads"("lead_form_id");
CREATE INDEX IF NOT EXISTS "idx_tiktok_pixels_platform_id" ON "tiktok_pixels"("platform_id");

-- إضافة UNIQUE constraints
ALTER TABLE "tiktok_campaigns" ADD CONSTRAINT "unique_tiktok_campaign" UNIQUE ("campaign_id");
ALTER TABLE "tiktok_ad_groups" ADD CONSTRAINT "unique_tiktok_ad_group" UNIQUE ("ad_group_id");
ALTER TABLE "tiktok_ads" ADD CONSTRAINT "unique_tiktok_ad" UNIQUE ("ad_id");
ALTER TABLE "tiktok_lead_forms" ADD CONSTRAINT "unique_tiktok_lead_form" UNIQUE ("form_id");
ALTER TABLE "tiktok_leads" ADD CONSTRAINT "unique_tiktok_lead" UNIQUE ("lead_id");
ALTER TABLE "tiktok_pixels" ADD CONSTRAINT "unique_tiktok_pixel" UNIQUE ("pixel_id");