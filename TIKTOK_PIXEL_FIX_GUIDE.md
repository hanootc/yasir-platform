# دليل إصلاح مشكلة TikTok Pixel Event ID Mismatch

## المشكلة المحددة
```
Event ID mismatch between server and browser events
- معدل deduplication أقل من 80%
- تأثير على 100% من الأحداث
- الأحداث المتأثرة: Add to Cart, Place an Order, Initiate Checkout
```

## الحلول المطبقة

### 1. إصلاح إنشاء Event ID المتسق

**قبل الإصلاح:**
- Browser-side: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
- Server-side: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
- النتيجة: Event IDs مختلفة تماماً

**بعد الإصلاح:**
- Browser-side: `${eventType}_${baseId}_${timestamp.toString().slice(-8)}`
- Server-side: `${eventName}_${baseId}_${timestamp.toString().slice(-8)}`
- النتيجة: Event IDs متطابقة بين Browser و Server

### 2. تحسين منطق BaseID

```typescript
const baseId = data?.transaction_id 
  || data?.order_number 
  || data?.content_ids?.[0] 
  || data?.product_id 
  || data?.landing_page_id;
```

### 3. نظام مراقبة Deduplication

تم إضافة `TikTokEventMonitor` لمراقبة:
- معدل deduplication في الوقت الفعلي
- تطابق Browser-Server events
- تحليل الأحداث المكررة
- تنبيهات عند انخفاض معدل deduplication

## الملفات المعدلة

### 1. `/client/src/components/PixelTracker.tsx`
- إصلاح إنشاء event_id في السطر 559-563
- إضافة تسجيل الأحداث في نظام المراقبة
- تمرير event_id إلى server-side API

### 2. `/server/tiktokEvents.ts`
- إصلاح إنشاء event_id في السطر 89-94
- استخدام event_id المرسل من browser إذا كان متوفراً
- إضافة logs لمراقبة deduplication

### 3. `/client/src/utils/tiktok-event-monitor.ts` (جديد)
- نظام مراقبة شامل لأحداث TikTok
- تحليل معدل deduplication
- تنبيهات عند وجود مشاكل

## كيفية التحقق من الإصلاح

### 1. مراقبة Console Logs

```javascript
// Browser Console
🎵 TikTok Event Mapping: {originalEvent: "purchase", tikTokEvent: "PlaceAnOrder"}
🎵 TikTok track event: PlaceAnOrder {event_id: "purchase_ORDER_123_45678901", ...}
📊 TikTok Deduplication Analysis: {deduplicationRate: "85.0%", status: "✅ GOOD"}

// Server Console  
🎬 TikTok Events API: Sending event {eventId: "purchase_ORDER_123_45678901", ...}
📊 TikTok Server Event Logged: {eventId: "purchase_ORDER_123_45678901", source: "server"}
```

### 2. فحص Event IDs في TikTok Events Manager

1. اذهب إلى TikTok Ads Manager
2. Events Manager → Events
3. تحقق من أن الأحداث المكررة تظهر كحدث واحد
4. معدل deduplication يجب أن يكون ≥ 80%

### 3. استخدام نظام المراقبة

```javascript
// في Browser Console
import { tiktokEventMonitor } from '@/utils/tiktok-event-monitor';

// فحص إحصائيات
console.log(tiktokEventMonitor.getStats());

// فحص event_id محدد
console.log(tiktokEventMonitor.checkEventId('purchase_ORDER_123_45678901'));
```

## النتائج المتوقعة

### قبل الإصلاح
- ❌ Deduplication rate: < 80%
- ❌ Event IDs مختلفة بين browser و server
- ❌ أحداث مكررة في TikTok
- ❌ قياسات تحويل مبالغ فيها

### بعد الإصلاح
- ✅ Deduplication rate: ≥ 80%
- ✅ Event IDs متطابقة بين browser و server
- ✅ أحداث موحدة في TikTok
- ✅ قياسات تحويل دقيقة

## مراقبة مستمرة

### تنبيهات تلقائية
سيتم إرسال تنبيه إذا:
- معدل deduplication < 80%
- عدم تطابق browser-server events
- مشاكل في event_id generation

### فحص دوري
- مراجعة logs يومياً
- مراقبة TikTok Events Manager أسبوعياً
- تحليل معدل deduplication شهرياً

## استكشاف الأخطاء

### إذا استمرت المشكلة

1. **فحص event_id في logs:**
   ```bash
   grep "TikTok track event" /var/log/application.log
   grep "TikTok Events API" /var/log/application.log
   ```

2. **فحص timestamp consistency:**
   - تأكد من أن browser و server يستخدمان نفس timestamp
   - فحص timezone settings

3. **فحص baseId extraction:**
   - تأكد من وجود transaction_id أو order_number
   - فحص content_ids format

### مشاكل شائعة

1. **Event IDs مختلفة:**
   - السبب: timestamp مختلف بين browser/server
   - الحل: استخدام timestamp ثابت من browser

2. **BaseID فارغ:**
   - السبب: عدم وجود معرفات ثابتة
   - الحل: إضافة fallback IDs

3. **معدل deduplication منخفض:**
   - السبب: تأخير في server-side API
   - الحل: تحسين سرعة الإرسال

## الخلاصة

تم إصلاح مشكلة Event ID mismatch من خلال:
1. توحيد منطق إنشاء event_id
2. استخدام معرفات ثابتة (baseId)
3. إضافة نظام مراقبة شامل
4. تحسين تدفق البيانات بين browser و server

هذا الإصلاح يجب أن يرفع معدل deduplication إلى أكثر من 80% ويحل مشكلة الأحداث المكررة في TikTok Pixel.
