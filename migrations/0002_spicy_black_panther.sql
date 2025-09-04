ALTER TYPE "public"."landing_page_template" ADD VALUE 'colorful_vibrant';--> statement-breakpoint
CREATE TABLE "tiktok_ad_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_id" varchar NOT NULL,
	"campaign_id" varchar NOT NULL,
	"ad_group_id" varchar NOT NULL,
	"ad_group_name" varchar NOT NULL,
	"status" varchar NOT NULL,
	"budget_mode" varchar,
	"budget" numeric(10, 2),
	"bid_type" varchar,
	"bid_price" numeric(10, 4),
	"targeting_gender" varchar,
	"targeting_age_groups" text[],
	"targeting_locations" text[],
	"targeting_languages" text[],
	"targeting_interests" text[],
	"targeting_behaviors" text[],
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"spend" numeric(10, 2) DEFAULT '0',
	"conversions" integer DEFAULT 0,
	"leads" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tiktok_ads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_id" varchar NOT NULL,
	"ad_group_id" varchar NOT NULL,
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
	"spend" numeric(10, 2) DEFAULT '0',
	"conversions" integer DEFAULT 0,
	"leads" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tiktok_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_id" varchar NOT NULL,
	"campaign_id" varchar NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"campaign_name" varchar NOT NULL,
	"objective" varchar NOT NULL,
	"status" varchar NOT NULL,
	"budget_mode" varchar NOT NULL,
	"budget" numeric(10, 2),
	"start_time" timestamp,
	"end_time" timestamp,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"spend" numeric(10, 2) DEFAULT '0',
	"conversions" integer DEFAULT 0,
	"leads" integer DEFAULT 0,
	"cpm" numeric(10, 4) DEFAULT '0',
	"cpc" numeric(10, 4) DEFAULT '0',
	"ctr" numeric(5, 4) DEFAULT '0',
	"conversion_rate" numeric(5, 4) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tiktok_lead_forms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_id" varchar NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "tiktok_leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_id" varchar NOT NULL,
	"lead_form_id" varchar NOT NULL,
	"ad_id" varchar,
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
--> statement-breakpoint
CREATE TABLE "tiktok_pixels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_id" varchar NOT NULL,
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
--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "tiktok_access_token" varchar;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "tiktok_advertiser_id" varchar;--> statement-breakpoint
ALTER TABLE "tiktok_ad_groups" ADD CONSTRAINT "tiktok_ad_groups_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_ad_groups" ADD CONSTRAINT "tiktok_ad_groups_campaign_id_tiktok_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."tiktok_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_ads" ADD CONSTRAINT "tiktok_ads_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_ads" ADD CONSTRAINT "tiktok_ads_ad_group_id_tiktok_ad_groups_id_fk" FOREIGN KEY ("ad_group_id") REFERENCES "public"."tiktok_ad_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_campaigns" ADD CONSTRAINT "tiktok_campaigns_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_lead_forms" ADD CONSTRAINT "tiktok_lead_forms_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_leads" ADD CONSTRAINT "tiktok_leads_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_leads" ADD CONSTRAINT "tiktok_leads_lead_form_id_tiktok_lead_forms_id_fk" FOREIGN KEY ("lead_form_id") REFERENCES "public"."tiktok_lead_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_leads" ADD CONSTRAINT "tiktok_leads_ad_id_tiktok_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."tiktok_ads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiktok_pixels" ADD CONSTRAINT "tiktok_pixels_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;