# دليل الأحداث المزدوجة لـ TikTok Purchase Events

## 🎯 النظام الجديد - أحداث مزدوجة

تم تحديث النظام ليرسل **جميع أحداث الشراء** لضمان أقصى تغطية وتوافق.

## 📊 الأحداث المرسلة

### **Client-Side (Browser Pixel)**
عند حدوث شراء، يتم إرسال:
1. **PlaceAnOrder** (الحدث الأساسي)
2. **Purchase** (الحدث الجديد المُوصى به)

### **Server-Side (Events API)**  
عند حدوث شراء، يتم إرسال:
1. **PlaceAnOrder** (الحدث الأساسي)
2. **Purchase** (الحدث الجديد)
3. **CompletePayment** (للتوافق مع الأنظمة القديمة)

## 🔄 تدفق الأحداث

```mermaid
graph TD
    A[صفحة الشكر: eventType='purchase'] --> B[PixelTracker]
    
    B --> C[Client-Side Events]
    C --> C1[ttq.track('PlaceAnOrder')]
    C --> C2[ttq.track('Purchase')]
    
    B --> D[Server-Side Events]  
    D --> D1[API: 'PlaceAnOrder']
    D --> D2[API: 'Purchase']
    D --> D3[API: 'CompletePayment']
    
    C1 --> E[TikTok Platform]
    C2 --> E
    D1 --> E
    D2 --> E
    D3 --> E
    
    E --> F[Deduplication بـ event_id مختلف]
```

## 🆔 Event IDs المختلفة

لتجنب deduplication غير المرغوب فيه:

### Client-Side:
```javascript
// PlaceAnOrder
event_id: "purchase_PROD123_12345678"

// Purchase  
event_id: "purchase_PROD123_12345678_purchase"
```

### Server-Side:
```javascript
// PlaceAnOrder
event_id: "purchase_PROD123_12345678"

// Purchase
event_id: "purchase_PROD123_12345678_purchase_server"

// CompletePayment
event_id: "purchase_PROD123_12345678_completepayment_server"
```

## 📝 Logs المتوقعة

### Browser Console:
```javascript
🎵 TikTok track event: PlaceAnOrder {content_id: "PROD123", event_id: "purchase_PROD123_12345678"}
🎵 TikTok track additional Purchase event: {content_id: "PROD123", event_id: "purchase_PROD123_12345678_purchase"}
🎵 TikTok Server: Sent PlaceAnOrder + Purchase + CompletePayment events
```

### Server Logs:
```javascript
🎬 TikTok Events API: Sending event {eventName: "PlaceAnOrder"}
🎬 TikTok Events API: Sending event {eventName: "Purchase"}  
🎬 TikTok Events API: Sending event {eventName: "CompletePayment"}
```

## ✅ الفوائد

### 1. **تغطية شاملة**
- ✅ PlaceAnOrder (يعمل حتى 2027)
- ✅ Purchase (الحدث الجديد المُوصى به)
- ✅ CompletePayment (للتوافق القديم)

### 2. **مقاومة التغييرات**
- إذا تم إيقاف PlaceAnOrder → Purchase سيعمل
- إذا تغيرت المعايير → لدينا جميع الخيارات

### 3. **بيانات أغنى**
- تتبع متعدد الأحداث
- إحصائيات أكثر دقة
- تحليل أفضل للأداء

## 🔍 التحقق من العمل

### في TikTok Events Manager:
ستجد **5 أحداث** لكل عملية شراء:
- 2 من Client-Side
- 3 من Server-Side

### في Browser Network Tab:
- طلبات لـ `analytics.tiktok.com` (2 أحداث)
- طلبات لـ `/api/tiktok/events` (3 أحداث)

## ⚠️ ملاحظات مهمة

### Event IDs مختلفة
- كل حدث له event_id فريد
- لا يحدث deduplication بينها
- هذا مقصود للحصول على تتبع شامل

### استهلاك API
- سيزيد عدد الطلبات لـ TikTok API
- لكن يضمن تتبع أفضل وأكثر دقة

## 🎯 الخلاصة

**النظام الآن يرسل 5 أحداث شراء:**
- Client: PlaceAnOrder + Purchase
- Server: PlaceAnOrder + Purchase + CompletePayment

**النتيجة:** تتبع شامل ومقاوم للتغييرات المستقبلية! 🚀
