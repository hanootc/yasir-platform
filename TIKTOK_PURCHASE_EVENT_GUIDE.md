# دليل حدث الشراء لـ TikTok في صفحة الشكر

## الوضع الحالي ✅

حدث الشراء لـ TikTok **موجود ومُفعّل** في صفحة الشكر (`thank-you.tsx`).

## التحسينات المطبقة

### 1. بيانات محسنة لـ TikTok
```typescript
const eventData = {
  content_name: productName,
  content_category: productCategory,
  content_ids: [productId],
  content_id: productId,        // ✅ جديد - لضمان وجود content_id
  product_id: productId,        // ✅ جديد - معرف منتج صريح
  sku: productId,              // ✅ جديد - SKU
  item_id: productId,          // ✅ جديد - معرف عنصر
  order_id: order.id,          // ✅ جديد - معرف طلب
  event_source_url: window.location.href,  // ✅ جديد
  user_agent: navigator.userAgent,         // ✅ جديد
  // ... باقي البيانات
};
```

### 2. Event ID ثابت لـ Deduplication
```typescript
const purchaseEventId = `purchase_${productId}_${orderTimestamp.toString().slice(-8)}`;
```

### 3. Logging محسن للمراقبة
```javascript
console.log('🎵 TikTok Purchase Event Data:', {
  eventId: purchaseEventId,
  contentId: productId,
  productName,
  orderValue: orderValueIQD,
  currency: 'IQD',
  quantity,
  orderNumber: order.orderNumber
});
```

## كيفية التحقق من عمل الحدث

### 1. في Browser Console
عند زيارة صفحة الشكر، ستجد:
```javascript
🎵 TikTok Purchase Event Data: {
  eventId: "purchase_PROD123_45678901",
  contentId: "PROD123",
  productName: "اسم المنتج",
  orderValue: 50000,
  currency: "IQD",
  quantity: 1,
  orderNumber: "ORD-12345"
}

🎵 TikTok Event Mapping: {originalEvent: "purchase", tikTokEvent: "PlaceAnOrder"}
🎵 TikTok track event: PlaceAnOrder {content_id: "PROD123", value: 38.02, currency: "USD", ...}
```

### 2. في TikTok Events Manager
1. اذهب إلى TikTok Ads Manager
2. Events Manager → Events
3. ابحث عن أحداث `PlaceAnOrder`
4. تحقق من وجود `content_id` و `value`

### 3. في Server Logs
```bash
🎬 TikTok Events API: Sending event {
  eventId: "purchase_PROD123_45678901",
  contentId: "PROD123",
  normalizedEventName: "CompletePayment"
}
```

## تدفق الحدث

```mermaid
graph TD
    A[عميل يصل لصفحة الشكر] --> B[تحميل بيانات الطلب]
    B --> C[إنشاء بيانات حدث الشراء]
    C --> D[PixelTracker يرسل للـ Browser]
    D --> E[Browser: ttq.track('PlaceAnOrder')]
    D --> F[Server: TikTok Events API]
    E --> G[TikTok Pixel]
    F --> H[TikTok Server-Side API]
    G --> I[Deduplication في TikTok]
    H --> I
```

## البيانات المرسلة لـ TikTok

### Browser-Side (Pixel)
- **Event**: `PlaceAnOrder`
- **content_id**: معرف المنتج
- **value**: القيمة بالدولار (محولة من IQD)
- **currency**: `USD`
- **quantity**: الكمية
- **event_id**: معرف ثابت للـ deduplication

### Server-Side (Events API)
- **Event**: `CompletePayment`
- **content_id**: نفس معرف المنتج
- **value**: نفس القيمة
- **event_id**: نفس المعرف الثابت
- **user data**: مُشفّرة (email, phone)

## استكشاف الأخطاء

### إذا لم يظهر الحدث في TikTok

1. **فحص Console:**
   ```javascript
   // تحقق من وجود هذه الـ logs
   🎵 TikTok Purchase Event Data
   🎵 TikTok track event: PlaceAnOrder
   🎬 TikTok Events API: Sending event
   ```

2. **فحص Network Tab:**
   - ابحث عن طلبات لـ `analytics.tiktok.com`
   - ابحث عن طلبات لـ `/api/tiktok/events`

3. **فحص TikTok Pixel ID:**
   ```javascript
   // في Console
   console.log('TikTok Pixel ID:', pixelSettings?.tiktokPixelId);
   ```

### مشاكل شائعة

1. **Content ID فارغ:**
   - تم حلها بإضافة عدة مصادر للـ content_id
   - fallback إلى `landing_page_id` أو `order.id`

2. **Event ID مختلف:**
   - تم حلها بإنشاء event_id ثابت مبني على timestamp الطلب

3. **قيمة خاطئة:**
   - Browser: يحول IQD إلى USD
   - Server: يحول IQD إلى USD
   - كلاهما يستخدم نفس معدل التحويل

## الخلاصة

✅ **حدث الشراء مُفعّل ومحسن:**
- يرسل لـ TikTok Browser + Server
- يحتوي على content_id صالح
- يستخدم event_id ثابت للـ deduplication
- يتضمن جميع البيانات المطلوبة

**لا حاجة لإضافات أخرى** - النظام يعمل بكفاءة!
