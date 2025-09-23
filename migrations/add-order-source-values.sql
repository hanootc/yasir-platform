-- إضافة قيم جديدة لـ order_source enum
ALTER TYPE order_source ADD VALUE IF NOT EXISTS 'facebook_comment';
ALTER TYPE order_source ADD VALUE IF NOT EXISTS 'instagram_comment';
ALTER TYPE order_source ADD VALUE IF NOT EXISTS 'facebook_messenger';
ALTER TYPE order_source ADD VALUE IF NOT EXISTS 'instagram_messenger';

-- إضافة عمود sourceDetails إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'source_details') THEN
        ALTER TABLE orders ADD COLUMN source_details TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'landing_page_orders' AND column_name = 'source_details') THEN
        ALTER TABLE landing_page_orders ADD COLUMN source_details TEXT;
    END IF;
END $$;
