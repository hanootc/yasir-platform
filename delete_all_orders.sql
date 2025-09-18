-- حذف جميع الطلبات وكل البيانات المرتبطة بها
-- تحذير: هذا السكريبت سيحذف جميع الطلبات نهائياً!

-- بدء المعاملة للتأكد من سلامة العملية
BEGIN;

-- حذف العناصر المالية المرتبطة بالطلبات (إذا وجدت)
DELETE FROM transaction_entries 
WHERE transaction_id IN (
  SELECT id FROM transactions 
  WHERE related_order_id IS NOT NULL
);

DELETE FROM cash_transactions 
WHERE related_order_id IS NOT NULL;

DELETE FROM transactions 
WHERE related_order_id IS NOT NULL;

-- حذف عناصر الطلبات أولاً (بسبب foreign key constraints)
DELETE FROM order_items;

-- حذف طلبات صفحات الهبوط
DELETE FROM landing_page_orders;

-- حذف الطلبات الرئيسية
DELETE FROM orders;

-- إعادة تعيين عداد الطلبات في المنصات
UPDATE platforms SET total_orders = 0, total_revenue = 0;

-- إنهاء المعاملة
COMMIT;

-- التحقق من النتائج
SELECT 
  'orders' as table_name, 
  COUNT(*) as remaining_count 
FROM orders
UNION ALL
SELECT 
  'order_items' as table_name, 
  COUNT(*) as remaining_count 
FROM order_items
UNION ALL
SELECT 
  'landing_page_orders' as table_name, 
  COUNT(*) as remaining_count 
FROM landing_page_orders;
