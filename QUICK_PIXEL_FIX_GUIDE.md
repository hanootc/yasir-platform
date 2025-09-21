# دليل سريع لحل مشاكل Facebook Pixel

## ✅ تم حل المشاكل التالية:

### 1. 🔄 مشكلة تكرار الأحداث
- **المشكلة:** أحداث Purchase و ViewContent تُحتسب مرتين
- **السبب:** عدم وجود `event_id` مشترك بين البكسل والخادم
- **الحل:** إنشاء `event_id` ثابت ومشترك

### 2. 🎯 مشكلة مطابقة معرف المحتوى
- **المشكلة:** معدل مطابقة أقل من 50% مع الكتالوج
- **السبب:** معرفات المحتوى غير متطابقة
- **الحل:** تنظيف وتوحيد `content_ids`

## 🚀 الإصلاحات المطبقة:

### في ملف `PixelTracker.tsx`:
```typescript
// ✅ إنشاء event_id مشترك
const createSharedEventId = (type: string, data: any): string => {
  const baseId = data?.transaction_id || data?.order_id || data?.content_ids?.[0];
  if (baseId) {
    return `${type}_${baseId}_${Date.now().toString().slice(-6)}`;
  }
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
};

// ✅ تنظيف content_ids
const normalizeContentIds = (ids: any): string[] => {
  if (!ids) return [];
  if (Array.isArray(ids)) {
    return ids.map(id => String(id).trim()).filter(id => id.length > 0);
  }
  return [String(ids).trim()].filter(id => id.length > 0);
};
```

### في ملف `facebookConversions.ts`:
```typescript
// ✅ استخدام event_id من العميل
const eventId = eventData.event_id;

// ✅ تنظيف content_ids في الخادم
const normalizedIds = Array.isArray(eventData.content_ids) 
  ? eventData.content_ids.map(id => String(id).trim()).filter(id => id.length > 0)
  : [String(eventData.content_ids).trim()].filter(id => id.length > 0);
```

## 🔍 كيفية التحقق من نجاح الإصلاحات:

### 1. في المتصفح (Developer Tools):
```
🆔 Shared Event ID created: Purchase_product123_789456
📘 Facebook Pixel: Event sent successfully
✅ Facebook Conversions API success
```

### 2. في Facebook Events Manager:
- ✅ لا توجد أحداث مكررة
- ✅ معدل المطابقة أعلى من 50%
- ✅ content_ids تطابق الكتالوج

### 3. في Facebook Pixel Helper:
- ✅ أحداث البكسل تحتوي على `event_id`
- ✅ `content_ids` صحيحة ومنظفة
- ✅ لا توجد تحذيرات حول التكرار

## 📋 قائمة التحقق السريعة:

### قبل الاختبار:
- [ ] تأكد من وجود Facebook Pixel ID في الإعدادات
- [ ] تأكد من وجود Facebook Access Token
- [ ] تحقق من أن معرفات المنتجات تطابق الكتالوج

### أثناء الاختبار:
- [ ] افتح Developer Tools
- [ ] نفذ عملية شراء تجريبية
- [ ] راقب رسائل Console
- [ ] تحقق من Facebook Events Manager

### بعد الاختبار:
- [ ] تأكد من عدم وجود أحداث مكررة
- [ ] راجع معدل المطابقة
- [ ] تحقق من صحة البيانات المرسلة

## 🛠️ استكشاف الأخطاء:

### إذا كانت الأحداث لا تزال مكررة:
1. تحقق من وجود `event_id` في Console
2. تأكد من أن نفس `event_id` يُرسل للخادم
3. راجع Facebook Events Manager للتأكد

### إذا كان معدل المطابقة منخفض:
1. تحقق من صحة `content_ids` في الكتالوج
2. تأكد من عدم وجود مسافات أو أحرف خاصة
3. راجع تطابق معرفات المنتجات

### إذا كانت الأحداث لا تظهر:
1. تحقق من Facebook Pixel ID
2. تأكد من صحة Access Token
3. راجع رسائل الخطأ في Console

## 📞 الدعم:
إذا واجهت أي مشاكل، راجع الملف التفصيلي: `FACEBOOK_PIXEL_FIXES.md`
