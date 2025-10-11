-- إعادة ترتيب أرقام الطلبات لمنصة hanootc من 1 إلى آخر طلب
-- منصة hanootc ID: 3dbf0c5c-5076-471c-a114-61a86c20a156

BEGIN;

-- إنشاء جدول مؤقت لحفظ الترتيب الجديد
CREATE TEMP TABLE temp_order_mapping AS
SELECT 
    id,
    order_number as old_order_number,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_order_number
FROM landing_page_orders 
WHERE platform_id = '3dbf0c5c-5076-471c-a114-61a86c20a156'
ORDER BY created_at ASC;

-- عرض الترتيب الجديد للمراجعة
SELECT 
    old_order_number,
    new_order_number,
    id
FROM temp_order_mapping 
ORDER BY new_order_number;

-- تحديث أرقام الطلبات بالترتيب الجديد
-- أولاً: تحديث إلى أرقام مؤقتة لتجنب تضارب unique constraint
UPDATE landing_page_orders 
SET order_number = CONCAT('temp_', temp_order_mapping.new_order_number)
FROM temp_order_mapping
WHERE landing_page_orders.id = temp_order_mapping.id;

-- ثانياً: تحديث إلى الأرقام النهائية
UPDATE landing_page_orders 
SET order_number = CAST(temp_order_mapping.new_order_number AS VARCHAR)
FROM temp_order_mapping
WHERE landing_page_orders.id = temp_order_mapping.id;

-- التحقق من النتيجة النهائية
SELECT 
    order_number,
    customer_name,
    created_at
FROM landing_page_orders 
WHERE platform_id = '3dbf0c5c-5076-471c-a114-61a86c20a156'
ORDER BY CAST(order_number AS INTEGER);

-- عرض إحصائيات
SELECT 
    COUNT(*) as total_orders,
    MIN(CAST(order_number AS INTEGER)) as min_order_number,
    MAX(CAST(order_number AS INTEGER)) as max_order_number
FROM landing_page_orders 
WHERE platform_id = '3dbf0c5c-5076-471c-a114-61a86c20a156';

COMMIT;

-- رسالة تأكيد
SELECT 'تم إعادة ترتيب أرقام الطلبات بنجاح لمنصة hanootc!' as result;
