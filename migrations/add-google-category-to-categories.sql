-- إضافة حقل Google Product Category إلى جدول categories
ALTER TABLE categories ADD COLUMN google_category VARCHAR(255);

-- تحديث الفئات الموجودة بـ Google Categories الافتراضية
UPDATE categories SET google_category = 'Home & Garden > Kitchen & Dining > Kitchen Appliances' WHERE name = 'أجهزة منزلية';
UPDATE categories SET google_category = 'Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils' WHERE name = 'أدوات مطبخ';
UPDATE categories SET google_category = 'Home & Garden > Decor' WHERE name = 'ديكور منزلي';
UPDATE categories SET google_category = 'Home & Garden > Household Supplies' WHERE name = 'أدوات تنظيف';
UPDATE categories SET google_category = 'Home & Garden > Linens & Bedding' WHERE name = 'منسوجات منزلية';
UPDATE categories SET google_category = 'Home & Garden > Yard, Garden & Outdoor Living > Gardening' WHERE name = 'أدوات حديقة';
UPDATE categories SET google_category = 'Baby & Toddler' WHERE name = 'الأطفال والأسرة';
UPDATE categories SET google_category = 'Sporting Goods > Exercise & Fitness' WHERE name = 'صحة ورياضة';

-- تحديث أي فئات أخرى بقيمة افتراضية
UPDATE categories SET google_category = 'Home & Garden' WHERE google_category IS NULL;
