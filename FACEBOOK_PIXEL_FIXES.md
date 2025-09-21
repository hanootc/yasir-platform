# حل مشاكل Facebook Pixel

## المشاكل التي تم حلها:

### 1. مشكلة تكرار الأحداث (Event Deduplication)
**المشكلة:** يتم إرسال أحداث Purchase و ViewContent من خلال البكسل والخادم بدون `event_id` مما يسبب احتساب مضاعف.

**الحل المطبق:**
- إنشاء `event_id` مشترك وثابت بين البكسل (client-side) والخادم (server-side)
- استخدام معرفات ثابتة مثل `transaction_id` أو `product_id` لضمان الثبات
- تمرير نفس `event_id` للـ Facebook Conversions API

```typescript
// إنشاء event_id ثابت ومشترك
const createSharedEventId = (type: string, data: any): string => {
  const baseId = data?.transaction_id || data?.order_id || data?.content_ids?.[0] || data?.product_id;
  if (baseId) {
    return `${type}_${baseId}_${Date.now().toString().slice(-6)}`;
  }
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
};
```

### 2. مشكلة مطابقة معرف المحتوى (Content ID Matching)
**المشكلة:** معرفات المحتوى المرسلة لا تطابق معرفات الكتالوج مما يقلل معدل المطابقة.

**الحل المطبق:**
- تنظيف وتوحيد `content_ids` قبل الإرسال
- إضافة `content_type: 'product'` لتحسين المطابقة
- دعم مصادر متعددة لمعرف المنتج (`product_id`, `content_id`, `content_ids`)

```typescript
// تنظيف وتوحيد content_ids
const normalizeContentIds = (ids: any): string[] => {
  if (!ids) return [];
  if (Array.isArray(ids)) {
    return ids.map(id => String(id).trim()).filter(id => id.length > 0);
  }
  return [String(ids).trim()].filter(id => id.length > 0);
};

const contentIds = normalizeContentIds(data?.content_ids || data?.product_id || data?.content_id);
```

### 3. تحسينات إضافية
- تحويل العملة من الدينار العراقي إلى الدولار الأمريكي
- إضافة `num_items` لتحديد كمية المنتجات
- تحسين تشفير البيانات الشخصية للـ Conversions API
- إضافة معلومات إضافية مثل `content_type` و `content_category`

## كيفية استخدام الإصلاحات:

### 1. للأحداث العادية:
```typescript
// استخدام PixelTracker مع البيانات المطلوبة
<PixelTracker 
  platformId="your-platform-id"
  eventType="purchase"
  eventData={{
    content_ids: ["product_123"], // معرف المنتج من الكتالوج
    content_name: "اسم المنتج",
    content_category: "فئة المنتج",
    value: 25000, // بالدينار العراقي
    currency: "IQD",
    quantity: 1,
    transaction_id: "order_456", // مهم لمنع التكرار
    customer_email: "customer@example.com",
    customer_phone: "07901234567"
  }}
/>
```

### 2. للتأكد من عمل الإصلاحات:
1. افتح Developer Tools في المتصفح
2. تابع Console للرسائل التالية:
   - `🆔 Shared Event ID created: [event_id]`
   - `✅ Facebook Conversions API success`
   - `📘 Facebook Pixel: Event sent successfully`

### 3. فحص Facebook Events Manager:
1. اذهب إلى Facebook Events Manager
2. تحقق من أن الأحداث تظهر مرة واحدة فقط
3. تأكد من أن `content_ids` تطابق معرفات الكتالوج
4. تحقق من معدل المطابقة (يجب أن يكون أعلى من 50%)

## نصائح مهمة:

### 1. معرفات المنتجات:
- استخدم نفس معرفات المنتجات في الكتالوج والأحداث
- تأكد من عدم وجود مسافات أو أحرف خاصة في المعرفات
- استخدم معرفات ثابتة لا تتغير

### 2. بيانات العملاء:
- تأكد من صحة عناوين البريد الإلكتروني
- استخدم أرقام الهواتف بالصيغة الدولية (+964...)
- أضف بيانات العميل كلما أمكن لتحسين المطابقة

### 3. مراقبة الأداء:
- راقب معدل المطابقة في Events Manager
- تحقق من عدم وجود أحداث مكررة
- راجع تقارير الأداء بانتظام

## الملفات المحدثة:
- `/client/src/components/PixelTracker.tsx` - إصلاح البكسل
- `/server/facebookConversions.ts` - إصلاح الخادم
- `/server/routes.ts` - تحديث API endpoint

## اختبار الإصلاحات:
1. قم بتشغيل الموقع في وضع التطوير
2. نفذ عملية شراء تجريبية
3. تحقق من Console للرسائل
4. راجع Facebook Events Manager للتأكد من عدم التكرار
