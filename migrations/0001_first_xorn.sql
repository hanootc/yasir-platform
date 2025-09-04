ALTER TYPE "public"."order_status" ADD VALUE 'returned';--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" varchar NOT NULL,
	"setting_value" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "system_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_id" varchar NOT NULL,
	"phone_number" varchar NOT NULL,
	"is_connected" boolean DEFAULT false NOT NULL,
	"qr_code" text,
	"session_data" text,
	"last_activity" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "business_type" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "contact_email" varchar;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "contact_phone" varchar;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "password" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "low_stock_threshold" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;