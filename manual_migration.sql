-- Manual migration to add variant columns to landing_page_orders table
-- Add new JSONB columns for multiple variant selections
ALTER TABLE landing_page_orders 
ADD COLUMN IF NOT EXISTS selected_color_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS selected_shape_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS selected_size_ids JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data from single variant columns to arrays
UPDATE landing_page_orders 
SET 
  selected_color_ids = CASE 
    WHEN selected_color_id IS NOT NULL THEN jsonb_build_array(selected_color_id)
    ELSE '[]'::jsonb
  END,
  selected_shape_ids = CASE 
    WHEN selected_shape_id IS NOT NULL THEN jsonb_build_array(selected_shape_id)
    ELSE '[]'::jsonb
  END,
  selected_size_ids = CASE 
    WHEN selected_size_id IS NOT NULL THEN jsonb_build_array(selected_size_id)
    ELSE '[]'::jsonb
  END
WHERE selected_color_ids IS NULL OR selected_shape_ids IS NULL OR selected_size_ids IS NULL;

-- Drop old single variant columns (optional - keep for backward compatibility for now)
-- ALTER TABLE landing_page_orders DROP COLUMN IF EXISTS selected_color_id;
-- ALTER TABLE landing_page_orders DROP COLUMN IF EXISTS selected_shape_id;
-- ALTER TABLE landing_page_orders DROP COLUMN IF EXISTS selected_size_id;
