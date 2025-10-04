# إعداد Facebook Conversions API - الدمج المباشر (Direct Integration)

## نظرة عامة

تم تطبيق **الدمج المباشر** لـ Facebook Conversions API في النظام، مما يعني إرسال أحداث التحويل مباشرة من الخادم إلى Meta بدلاً من استخدام Gateway جاهزة.

## المميزات المطبقة

### ✅ 1. إرسال الأحداث المباشر
- إرسال أحداث التحويل من الخادم مباشرة إلى Facebook
- دعم جميع أنواع الأحداث: `Purchase`, `AddToCart`, `ViewContent`, إلخ
- تشفير البيانات الحساسة باستخدام SHA256
- معالجة أخطاء الشبكة والاستجابة

### ✅ 2. Dataset Quality API
- مراقبة معدل مطابقة الأحداث (Event Match Rate)
- تتبع عدد المستخدمين المطابقين مقابل المرسلين
- توصيات تلقائية لتحسين جودة البيانات
- واجهة مستخدم لعرض المقاييس

### ✅ 3. تحسينات الأداء
- دعم IPv6 و IPv4
- معالجة صحيحة لـ `fbc` و `fbp` cookies
- التحقق من صحة البيانات قبل الإرسال
- نظام تشخيص شامل

## كيفية الإعداد

### الخطوة 1: إعداد Facebook Business Manager

1. **إنشاء Pixel:**
   - اذهب إلى Facebook Business Manager
   - Events Manager → Data Sources → Pixels
   - أنشئ Pixel جديد أو استخدم موجود

2. **إنشاء Access Token:**
   - اذهب إلى Facebook Developers
   - أنشئ تطبيق جديد أو استخدم موجود
   - اذهب إلى Tools → Access Token Debugger
   - أنشئ System User Token بالصلاحيات:
     - `ads_management`
     - `business_management`

3. **إعداد Dataset Quality API:**
   - في Events Manager، اذهب إلى Settings
   - فعّل "Conversions API"
   - اختر "Direct Integration"
   - **لا تختر Gateway** - نحن نستخدم الدمج المباشر

### الخطوة 2: إعداد النظام

1. **إضافة إعدادات Facebook:**
   ```javascript
   // في صفحة إعدادات المنصة
   facebookPixelId: "YOUR_PIXEL_ID"
   facebookAccessToken: "YOUR_ACCESS_TOKEN"
   ```

2. **التحقق من الإعداد:**
   - اذهب إلى صفحة إدارة إعلانات Meta
   - تبويب "التحليلات"
   - ستجد قسم "جودة بيانات Facebook Conversions API"

### الخطوة 3: مراقبة الأداء

1. **مقاييس الجودة:**
   - **معدل المطابقة:** يجب أن يكون أعلى من 70%
   - **المستخدمون المطابقون:** عدد المستخدمين الذين تم ربطهم بنجاح
   - **إجمالي المرسل:** عدد الأحداث المرسلة

2. **التوصيات التلقائية:**
   - **معدل أقل من 50%:** توصيات حرجة لتحسين البيانات
   - **معدل 50-70%:** توصيات للتحسين
   - **معدل أعلى من 70%:** أداء ممتاز

## الملفات المطبقة

### Backend Files:
- `server/facebookConversions.ts` - منطق إرسال الأحداث
- `server/routes.ts` - API endpoints للجودة
- `server/pixelDiagnostics.ts` - نظام التشخيص

### Frontend Files:
- `client/src/components/FacebookDatasetQuality.tsx` - واجهة مقاييس الجودة
- `client/src/pages/platform-ads-meta-management.tsx` - دمج المكون

## API Endpoints الجديدة

### 1. جلب مقاييس جودة البيانات
```
GET /api/platform/facebook/dataset-quality?startDate=2024-01-01&endDate=2024-01-07
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matchRate": 75,
    "matchedUsers": 1250,
    "uploadedUsers": 1667,
    "timestamp": 1640995200000
  },
  "recommendations": [
    {
      "type": "success",
      "title": "معدل مطابقة ممتاز",
      "description": "معدل المطابقة أعلى من 70%",
      "actions": ["حافظ على جودة البيانات الحالية"]
    }
  ]
}
```

## استكشاف الأخطاء

### مشكلة: معدل مطابقة منخفض

**الأسباب المحتملة:**
1. بيانات البريد الإلكتروني غير صحيحة
2. تنسيق أرقام الهواتف خاطئ
3. عدم وجود معرفات خارجية

**الحلول:**
1. تحقق من صحة عناوين البريد الإلكتروني
2. استخدم تنسيق دولي للهواتف (+964xxxxxxxxx)
3. أضف معرفات فريدة للمستخدمين

### مشكلة: لا تظهر البيانات

**الأسباب المحتملة:**
1. Access Token منتهي الصلاحية
2. Pixel ID غير صحيح
3. عدم وجود أحداث مرسلة

**الحلول:**
1. تجديد Access Token
2. التحقق من Pixel ID في Facebook Business Manager
3. إرسال أحداث تجريبية للاختبار

## الدعم والمراقبة

### Logs المفيدة:
```bash
# مراقبة إرسال الأحداث
grep "Facebook Conversions API" logs/server.log

# مراقبة مقاييس الجودة
grep "Dataset Quality" logs/server.log
```

### مراقبة الأداء:
- تحقق من معدل المطابقة يومياً
- راقب عدد الأحداث المرسلة
- تابع التوصيات التلقائية

## الخلاصة

✅ **تم تطبيق الدمج المباشر بنجاح**  
✅ **Dataset Quality API مفعل**  
✅ **واجهة مراقبة متاحة**  
✅ **نظام توصيات تلقائي**  

النظام الآن يرسل أحداث التحويل مباشرة إلى Meta ويوفر مراقبة شاملة لجودة البيانات مع توصيات لتحسين الأداء.
