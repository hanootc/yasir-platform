import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { convertIQDToUSD } from '@/lib/utils';

interface PixelTrackerProps {
  platformId: string;
  eventType: 'page_view' | 'add_to_cart' | 'purchase' | 'lead' | 'view_content' | 'initiate_checkout';
  eventData?: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
    quantity?: number;
    landing_page_id?: string;
    product_id?: string;
    external_id?: string;
    transaction_id?: string;
    order_number?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_first_name?: string;
    customer_last_name?: string;
    customer_city?: string;
    customer_state?: string;
    customer_country?: string;
    action_source?: string;
    facebook_login_id?: string;  // معرف تسجيل الدخول لفيسبوك (+19.71% تحسين)
    login_id?: string;           // نفس قيمة facebook_login_id
    content_type?: string;       // نوع المحتوى
  };
}

interface PixelSettings {
  facebookPixelId?: string;
  facebookAccessToken?: string;
  tiktokPixelId?: string;
  tiktokAccessToken?: string;
  snapchatPixelId?: string;
  snapchatAccessToken?: string;
  googleAnalyticsId?: string;
}

declare global {
  interface Window {
    fbq?: any;
    ttq?: any;
    snaptr?: any;
    gtag?: any;
    dataLayer?: any[];
  }
}

export default function PixelTracker({ platformId, eventType, eventData }: PixelTrackerProps) {
  
  // التقاط fbclid من URL عند تحميل المكون وحفظه في localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    
    if (fbclid) {
      // حفظ fbclid في localStorage للاستخدام المستقبلي
      localStorage.setItem('fbclid', fbclid);
      localStorage.setItem('fbclid_timestamp', Date.now().toString());
      
      console.log('🔍 FBCLID captured from URL and stored:', fbclid);
    }
  }, []);

  // جلب إعدادات البكسلات من قاعدة البيانات
  const { data: pixelSettings, isLoading, error } = useQuery<PixelSettings>({
    queryKey: [`/api/platforms/${platformId}/ad-platform-settings`],
    staleTime: 5 * 60 * 1000, // 5 دقائق
    refetchOnWindowFocus: false,
  });

  
  // عرض حالة تحميل الـ Pixel Settings
  if (isLoading) {
  }
  

  // تحويل رقم الهاتف إلى صيغة E.164
  const formatPhoneToE164 = (phone: string): string => {
    if (!phone) return '';
    
    // إزالة جميع الحروف غير الرقمية
    const cleaned = phone.replace(/\D/g, '');
    
    // إذا كان الرقم يبدأ بـ 07 (العراق) أضف كود البلد 964
    if (cleaned.startsWith('07') && cleaned.length === 11) {
      return `+964${cleaned.substring(1)}`; // يزيل الـ 0 ويضيف +964
    }
    
    // إذا كان الرقم يبدأ بـ 964 بالفعل
    if (cleaned.startsWith('964')) {
      return `+${cleaned}`;
    }
    
    // إذا لم يكن يبدأ بـ + أضفه
    if (!phone.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phone;
  };

  // إنشاء معرف فريد للحدث لمنع التكرار
  const createEventKey = (type: string, data: any): string => {
    return `${type}_${data?.transaction_id || data?.content_ids?.[0] || Date.now()}`;
  };

  // إنشاء event_id ثابت ومشترك بين البكسل والخادم
  const createSharedEventId = (type: string, data: any, timestamp?: number): string => {
    // استخدام timestamp ثابت لضمان نفس event_id
    const fixedTimestamp = timestamp || Date.now();
    
    // استخدام transaction_id أو content_id لضمان الثبات
    const baseId = data?.transaction_id || data?.order_id || data?.content_ids?.[0] || data?.product_id;
    if (baseId) {
      return `${type}_${baseId}_${fixedTimestamp.toString().slice(-8)}`;
    }
    // إذا لم يوجد معرف ثابت، استخدم timestamp ثابت
    return `${type}_${fixedTimestamp}_${Math.floor(fixedTimestamp / 1000).toString().slice(-4)}`;
  };

  // إنشاء معرف خارجي ثابت ومستقر للمستخدم
  const createStableExternalId = (data: any): string => {
    // استخدام بيانات ثابتة للمستخدم لإنشاء معرف مستقر
    const phone = data?.customer_phone || data?.phone_number || '';
    const email = data?.customer_email || data?.email || '';
    const productId = data?.product_id || data?.content_ids?.[0] || '';
    
    // إنشاء hash بسيط من البيانات الثابتة
    const stableData = `${phone}_${email}_${productId}`.replace(/[^a-zA-Z0-9]/g, '');
    
    if (stableData.length > 3) {
      // استخدام أول وآخر أحرف + طول النص لإنشاء معرف ثابت
      const hash = stableData.slice(0, 4) + stableData.slice(-4) + stableData.length.toString();
      return `user_${hash}`;
    }
    
    // fallback للمعرف الديناميكي إذا لم تتوفر بيانات كافية
    return `user_${Date.now().toString().slice(-8)}`;
  };

  // تم حذف useEffect القديم نهائياً - الاعتماد فقط على useEffect الجديد مع sessionStorage

  // تم حذف useEffect القديم - الاعتماد فقط على useEffect الجديد مع sessionStorage

  // حذف useEffect القديم نهائياً

  // حذف useEffect القديم نهائياً

  // تحميل Facebook Pixel مع إخفاء التحذيرات
  const loadFacebookPixel = (pixelId: string, initData?: any) => {
    
    // فحص مطلق - إذا كان fbq موجود، لا تحمل أبداً
    if (window.fbq) {
      console.log('🔍 Facebook Pixel already exists - skipping load');
      return;
    }
    
    // فحص إضافي للـ script
    if (document.querySelector('script[src*="fbevents.js"]')) {
      console.log('🔍 Facebook Pixel script already exists - skipping load');
      return;
    }
    
    // فحص global flag
    if ((window as any).__fbPixelLoaded) {
      console.log('🔍 Facebook Pixel flag set - skipping load');
      return;
    }
    
    console.log('🔍 Loading Facebook Pixel for the first time');
    
    
    
    // إنشاء Facebook Pixel Script الأصلي - طريقة Facebook الرسمية
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      }
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    
    // تهيئة الـ pixel (مرة واحدة فقط)
    if (!document.querySelector(`[data-fb-pixel-initialized="${pixelId}"]`)) {
      // تهيئة البكسل مع advanced matching data إذا كانت متوفرة
      if (initData && Object.keys(initData).length > 0) {
        console.log('🔍 Facebook Pixel initialized with Advanced Matching:', Object.keys(initData));
        window.fbq('init', pixelId, initData);
      } else {
        console.log('🔍 Facebook Pixel initialized without Advanced Matching');
        window.fbq('init', pixelId);
      }
      
      // إضافة علامة لمنع تهيئة البكسل مرة أخرى
      const initMarker = document.createElement('div');
      initMarker.setAttribute('data-fb-pixel-initialized', pixelId);
      initMarker.style.display = 'none';
      document.head.appendChild(initMarker);
    } else {
      console.log('🔍 Facebook Pixel already initialized for:', pixelId);
    }
    
    // إضافة علامة لتتبع الـ pixel المحمل
    const marker = document.createElement('div');
    marker.setAttribute('data-fb-pixel-id', pixelId);
    marker.style.display = 'none';
    document.head.appendChild(marker);
    
    
    // إرسال PageView تلقائياً (مرة واحدة فقط)
    if (!document.querySelector(`[data-fb-pageview-sent="${pixelId}"]`)) {
      window.fbq('track', 'PageView');
      // إضافة علامة لمنع إرسال PageView مرة أخرى
      const pageviewMarker = document.createElement('div');
      pageviewMarker.setAttribute('data-fb-pageview-sent', pixelId);
      pageviewMarker.style.display = 'none';
      document.head.appendChild(pageviewMarker);
    }
    
    // إضافة noscript للمتصفحات التي لا تدعم JavaScript
    if (!document.querySelector('noscript img[src*="facebook.com/tr"]')) {
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
      document.head.appendChild(noscript);
    }
    
    // تعيين العلامة global لمنع التحميل المتكرر
    (window as any).__fbPixelLoaded = true;
    
  };

  // تحميل TikTok Pixel بالطريقة الطبيعية الصحيحة
  const loadTikTokPixel = (pixelId: string) => {
    // التحقق من تحميل البكسل سابقاً
    if (document.querySelector(`[data-tiktok-pixel-id="${pixelId}"]`)) {
      return;
    }


    // تهيئة TikTok Pixel
    (function (w: any, d: Document, t: string) {
      w.TiktokAnalyticsObject = t;
      var ttq = w[t] = w[t] || [];
      ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
      ttq.setAndDefer = function (t: any, e: string) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
        }
      };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t: string) {
        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
        return e
      }, ttq.load = function (e: string, n?: any) {
        var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = i, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {};
        var o = d.createElement("script");
        o.type = "text/javascript", o.async = !0, o.src = i + "?sdkid=" + e + "&lib=" + t;
        var a = d.getElementsByTagName("script")[0];
        a.parentNode?.insertBefore(o, a)
      };

      ttq.load(pixelId);
      ttq.page();
    })(window as any, document, 'ttq');

    // إضافة علامة تميز البكسل المحمل
    const marker = document.createElement('div');
    marker.setAttribute('data-tiktok-pixel-id', pixelId);
    marker.style.display = 'none';
    document.head.appendChild(marker);

  };

  // تحميل Snapchat Pixel
  const loadSnapchatPixel = (pixelId: string) => {
    if (window.snaptr) return;

    const script = document.createElement('script');
    script.innerHTML = `
      (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
      {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
      a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
      r.src=n;var u=t.getElementsByTagName(s)[0];
      u.parentNode.insertBefore(r,u);})(window,document,
      'https://sc-static.net/scevent.min.js');
      
      snaptr('init', '${pixelId}', {});
      snaptr('track', 'PAGE_VIEW');
    `;
    document.head.appendChild(script);
  };

  // تحميل Google Analytics
  const loadGoogleAnalytics = (measurementId: string) => {
    if (window.gtag) return;

    // إضافة Google Analytics Script
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(gtagScript);

    const configScript = document.createElement('script');
    configScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(configScript);
  };

  // تتبع أحداث Facebook
  const trackFacebookEvent = (eventType: string, data?: any, sharedEventId?: string, customAdvancedMatching?: any) => {
    
    if (!window.fbq) {
      return;
    }
    
    // منع إرسال نفس الحدث مرتين باستخدام event_id
    if (sharedEventId) {
      const sentEventKey = `fb_event_sent_${sharedEventId}`;
      if ((window as any)[sentEventKey]) {
        console.log('🔍 Facebook Event already sent, skipping:', eventType, sharedEventId);
        return;
      }
      (window as any)[sentEventKey] = true;
    }
    

    const fbEventMap: Record<string, string> = {
      'page_view': 'PageView',
      'view_content': 'ViewContent',
      'ViewContent': 'ViewContent',  // إضافة التطابق المباشر
      'add_to_cart': 'AddToCart',
      'initiate_checkout': 'InitiateCheckout',
      'purchase': 'Purchase',
      'Purchase': 'Purchase',        // إضافة التطابق المباشر
      'lead': 'Lead'
    };

    const fbEvent = fbEventMap[eventType] || eventType; // استخدام eventType مباشرة إذا لم يوجد في الـ mapping
    
    // التحقق من أن الحدث صالح لـ Facebook
    const validFBEvents = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead', 'CompleteRegistration', 'Search'];
    if (!validFBEvents.includes(fbEvent)) {
      return;
    }

    // استخدام event_id المشترك الثابت
    const eventId = sharedEventId;
    
    // استخراج Cookie FBP و FBC مع تحسينات لحل مشكلة FBC الفارغة
    const getFBCookie = (name: string) => {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name && value && value !== 'undefined' && value !== 'null') {
          return decodeURIComponent(value);
        }
      }
      return null;
    };

    // ✅ الطريقة الصحيحة: ترك Facebook Pixel ينشئ _fbc تلقائياً
    // فقط حفظ fbclid في localStorage للاستخدام في Server-Side API
    const captureFBCLIDForServerSide = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const fbclid = urlParams.get('fbclid');
      
      if (fbclid) {
        // حفظ fbclid في localStorage للاستخدام في Server-Side API فقط
        localStorage.setItem('fbclid', fbclid);
        localStorage.setItem('fbclid_timestamp', Date.now().toString());
        
        console.log('✅ FBCLID captured for Server-Side API:', fbclid);
        
        // ✅ ترك Facebook Pixel ينشئ _fbc cookie تلقائياً
        // لا نتدخل في آلية Facebook الطبيعية
        console.log('ℹ️ Facebook Pixel will create _fbc cookie automatically');
      }
    };
    
    // إنشاء FBC للـ Server-Side API فقط (ليس للبكسل)
    const generateFBCForServerSide = () => {
      // محاولة الحصول على _fbc من الكوكي أولاً (الذي أنشأه Facebook Pixel)
      const existingFBC = getFBCookie('_fbc');
      if (existingFBC) {
        console.log('✅ Using existing _fbc cookie from Facebook Pixel:', existingFBC);
        return existingFBC;
      }
      
      // إذا لم يوجد _fbc، إنشاء واحد للـ Server-Side API فقط
      const storedFbclid = localStorage.getItem('fbclid');
      const storedTimestamp = localStorage.getItem('fbclid_timestamp');
      
      if (storedFbclid && storedTimestamp) {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const storedTime = parseInt(storedTimestamp);
        
        if (storedTime > sevenDaysAgo) {
          const hostname = window.location.hostname;
          let subdomainIndex = 1;
          
          if (hostname === 'localhost' || hostname.split('.').length === 1) {
            subdomainIndex = 0;
          } else if (hostname.split('.').length === 2) {
            subdomainIndex = 1;
          } else {
            subdomainIndex = 2;
          }
          
          const fbc = `fb.${subdomainIndex}.${storedTime}.${storedFbclid}`;
          
          console.log('✅ FBC generated for Server-Side API only:', { 
            storedFbclid, 
            fbc, 
            timestamp: storedTime,
            subdomainIndex 
          });
          return fbc;
        }
      }
      
      return null;
    };

    // الحصول على FBC محسن - للـ Server-Side API
    const getEnhancedFBC = () => {
      // أولاً: التقاط fbclid إذا كان موجود في URL
      captureFBCLIDForServerSide();
      
      // ثانياً: الحصول على FBC للـ Server-Side API
      return generateFBCForServerSide();
    };
    
    // إرسال القيمة كما هي بدون تحويل لتطابق الكتالوج
    const originalValue = data?.value;
    
    // تنظيف وتوحيد content_ids لضمان المطابقة مع الكتالوج
    const normalizeContentIds = (ids: any): string[] => {
      if (!ids) return [];
      if (Array.isArray(ids)) {
        return ids.map(id => String(id).trim()).filter(id => id.length > 0);
      }
      return [String(ids).trim()].filter(id => id.length > 0);
    };
    
    // استخدام معرف المنتج الصحيح (رقمي) بدلاً من UUID للكتالوج
    let contentIds = normalizeContentIds(data?.content_ids || data?.product_id || data?.content_id);
    
    // إذا كان المعرف UUID، حاول استخراج المعرف الرقمي من البيانات
    if (contentIds.length > 0 && contentIds[0].includes('-')) {
      // إذا كان لدينا معرف رقمي في البيانات، استخدمه
      if (data?.numeric_product_id) {
        contentIds = [String(data.numeric_product_id)];
      } else if (data?.sku) {
        contentIds = [String(data.sku)];
      }
      // يمكن إضافة المزيد من المحاولات لاستخراج المعرف الصحيح
    }
    
    // تحويل العملة لـ Facebook (يدعم USD فقط للعملات غير المدعومة)
    const fbCurrency = data?.currency === 'IQD' ? 'USD' : (data?.currency || 'USD');
    const fbValue = data?.currency === 'IQD' ? (originalValue / 1320) : originalValue; // تحويل تقريبي IQD إلى USD
    
    // فصل البيانات: event data (آمنة) + advanced matching (شخصية - ستُشفر تلقائياً)
    const eventData = {
      content_name: data?.content_name || data?.product_name,
      content_category: data?.content_category || data?.product_category,
      content_ids: contentIds.length > 0 ? contentIds : undefined,
      content_type: 'product',
      value: fbValue,
      currency: fbCurrency,
      num_items: data?.quantity || 1,
      // إزالة البيانات الشخصية من event data
    };

    // البيانات الشخصية للـ Advanced Matching (ستُشفر تلقائياً بواسطة Facebook)
    const advancedMatchingData: any = customAdvancedMatching || {};
    
    // إذا لم يتم تمرير customAdvancedMatching، استخدم البيانات من data
    if (!customAdvancedMatching) {
      if (data?.customer_email) advancedMatchingData.em = data.customer_email;
      if (data?.customer_phone) advancedMatchingData.ph = data.customer_phone;
      if (data?.customer_first_name) advancedMatchingData.fn = data.customer_first_name;
      if (data?.customer_last_name) advancedMatchingData.ln = data.customer_last_name;
      if (data?.customer_city) advancedMatchingData.ct = data.customer_city;
      if (data?.customer_state) advancedMatchingData.st = data.customer_state;
      if (data?.customer_country) advancedMatchingData.country = data.customer_country || 'iq';
      if (data?.external_id) advancedMatchingData.external_id = data.external_id;
    }

    // إزالة القيم undefined
    const cleanEventData = Object.fromEntries(
      Object.entries(eventData).filter(([_, value]) => value !== undefined && value !== '')
    );

    
    console.log('📤 Sending to Client-Side Pixel:', {
      eventType: fbEvent,
      eventID: sharedEventId,
      content_ids: cleanEventData.content_ids,
      value: cleanEventData.value,
      currency: cleanEventData.currency,
      hasAdvancedMatching: Object.keys(advancedMatchingData).length > 0,
      advancedMatchingFields: Object.keys(advancedMatchingData),
      advancedMatchingData: advancedMatchingData,
      customAdvancedMatching: customAdvancedMatching
    });
    
    // تأكد من تحميل fbq أولاً
    if (typeof window.fbq === 'function') {
      // إرسال الحدث مع Advanced Matching Data منفصلة
      const trackingOptions: any = {
        eventID: sharedEventId
      };
      
      // إضافة Advanced Matching إلى tracking options
      if (Object.keys(advancedMatchingData).length > 0) {
        Object.assign(trackingOptions, advancedMatchingData);
      }
      
      console.log('🚀 Final fbq call - Event:', fbEvent);
      console.log('🚀 Final fbq call - EventData:', cleanEventData);
      console.log('🚀 Final fbq call - TrackingOptions:', trackingOptions);
      
      window.fbq('track', fbEvent, cleanEventData, trackingOptions);
    }
    
    // ملاحظة: تم إزالة الإرسال المكرر لـ Server-Side API هنا
    // سيتم الإرسال عبر sendToServerSideAPI فقط لتجنب التكرار
  };

  // تتبع أحداث TikTok بطريقة طبيعية وصحيحة
  const trackTikTokEvent = (eventType: string, data?: any) => {
    if (!window.ttq) {
      return;
    }

    // خريطة الأحداث المعتمدة من TikTok
    const eventMap: Record<string, string> = {
      'page_view': 'ViewContent',
      'view_content': 'ViewContent',
      'ViewContent': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'initiate_checkout': 'InitiateCheckout',
      'purchase': 'CompletePayment',
      'Purchase': 'CompletePayment',
      'lead': 'SubmitForm',
      'contact': 'Contact'
    };

    const tikTokEvent = eventMap[eventType];
    if (!tikTokEvent) {
      return;
    }

    // تحويل العملة للدولار
    const convertedValue = data?.value ? convertIQDToUSD(data.value) : data?.value;
    
    // تنظيف البيانات وتجهيزها للإرسال
    const email = data?.customer_email || data?.email || '';
    const rawPhone = data?.customer_phone || data?.phone_number || data?.phone || '';
    const phone = formatPhoneToE164(rawPhone); // تحويل الرقم إلى E.164
    
    // إنشاء event_id فريد للحدث
    const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // تكوين بيانات الحدث
    const eventData: any = {
      value: convertedValue,
      currency: 'USD',
      content_type: 'product',
      content_name: data?.content_name || 'Purchase',
      content_category: data?.content_category || '',
      content_id: data?.content_ids?.[0] || data?.content_id || '',
      quantity: data?.quantity || 1,
      event_id: eventId // إضافة event_id للتتبع
    };

    // إضافة بيانات العميل إذا كانت متوفرة
    if (email && email.trim()) eventData.email = email.trim();
    if (phone && phone.trim()) {
      eventData.phone_number = phone.trim();
    }
    
    // محاولة الحصول على email من eventData إذا لم يكن متوفراً
    if (!eventData.email && data?.customer_email && data.customer_email.trim()) {
      eventData.email = data.customer_email.trim();
    }

    // إزالة القيم الفارغة
    const cleanEventData = Object.fromEntries(
      Object.entries(eventData).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );


    try {
      // تجهيز البيانات الشخصية منفصلة لـ TikTok Pixel
      const userProperties: any = {};
      if (email && email.trim()) userProperties.email = email.trim();
      if (phone && phone.trim()) {
        userProperties.phone_number = phone.trim();
      }
      
      // إرسال البيانات الشخصية أولاً (إذا كانت متوفرة)
      if (Object.keys(userProperties).length > 0) {
        window.ttq.identify(userProperties);
      }
      
      // ثم إرسال الحدث
      window.ttq.track(tikTokEvent, cleanEventData);
      
      // إرسال إلى TikTok API أيضاً (server-side)
      sendToTikTokAPI(tikTokEvent, cleanEventData, data);
      
    } catch (error) {
      // خطأ صامت
    }
  };

  // إرسال البيانات إلى TikTok Events API
  const sendToTikTokAPI = async (eventName: string, eventData: any, originalData: any) => {
    try {
      await fetch('/api/tiktok/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformId: platformId,
          eventName: eventName,
          eventData: {
            ...eventData,
            ...originalData,
            timestamp: Math.floor(Date.now() / 1000),
            event_source_url: window.location.href,
            user_agent: navigator.userAgent,
            ip: '',
            // إضافة البيانات الشخصية بشكل صريح
            customer_email: originalData?.customer_email || originalData?.email || eventData?.email || '',
            customer_phone: originalData?.customer_phone || originalData?.phone_number || originalData?.phone || '',
            // إضافة معرف الحدث
            event_id: eventData?.event_id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            // إضافة content_id
            content_id: eventData?.content_id || originalData?.content_ids?.[0] || originalData?.product_id || ''
          }
        })
      });
    } catch (error) {
      // خطأ صامت
    }
  };

  // تتبع أحداث Snapchat
  const trackSnapchatEvent = (eventType: string, data?: any) => {
    if (!window.snaptr) return;

    const snapEventMap: Record<string, string> = {
      'page_view': 'PAGE_VIEW',
      'view_content': 'VIEW_CONTENT',
      'add_to_cart': 'ADD_CART',
      'initiate_checkout': 'START_CHECKOUT',
      'purchase': 'PURCHASE',
      'lead': 'SIGN_UP'
    };

    const snapEvent = snapEventMap[eventType];
    if (!snapEvent) return;

    const eventData = {
      item_category: data?.content_category,
      item_ids: data?.content_ids,
      price: data?.value,
      currency: data?.currency || 'IQD',
      number_items: data?.quantity || 1
    };

    const cleanEventData = Object.fromEntries(
      Object.entries(eventData).filter(([_, value]) => value !== undefined)
    );

    window.snaptr('track', snapEvent, cleanEventData);
  };

  // تتبع أحداث Google Analytics
  const trackGoogleEvent = (eventType: string, data?: any) => {
    if (!window.gtag) return;

    const gaEventMap: Record<string, { action: string; category: string }> = {
      'page_view': { action: 'page_view', category: 'engagement' },
      'view_content': { action: 'view_item', category: 'ecommerce' },
      'add_to_cart': { action: 'add_to_cart', category: 'ecommerce' },
      'initiate_checkout': { action: 'begin_checkout', category: 'ecommerce' },
      'purchase': { action: 'purchase', category: 'ecommerce' },
      'lead': { action: 'generate_lead', category: 'conversion' }
    };

    const gaEvent = gaEventMap[eventType];
    if (!gaEvent) return;

    const eventData: any = {
      event_category: gaEvent.category,
      event_label: data?.content_name,
      value: data?.value
    };

    // إضافة بيانات ecommerce للأحداث التجارية
    if (['view_content', 'add_to_cart', 'initiate_checkout', 'purchase'].includes(eventType)) {
      eventData.currency = data?.currency || 'IQD';
      eventData.items = [{
        item_id: data?.content_ids?.[0],
        item_name: data?.content_name,
        item_category: data?.content_category,
        quantity: data?.quantity || 1,
        price: data?.value
      }];
    }

    window.gtag('event', gaEvent.action, eventData);
  };

  // إرسال الحدث إلى Server-Side API لتحسين تغطية API التحويلات
  const sendToServerSideAPI = async (platformId: string, eventType: string, eventData: any, eventId: string) => {
    try {
      // تحويل أسماء الأحداث إلى Facebook Standard Events
      const fbEventMap: Record<string, string> = {
        'page_view': 'PageView',
        'view_content': 'ViewContent', 
        'add_to_cart': 'AddToCart',
        'initiate_checkout': 'InitiateCheckout',
        'purchase': 'Purchase',
        'lead': 'Lead'
      };
      
      const standardEventType = fbEventMap[eventType] || eventType;
      
      
      // ✅ إضافة fbc و fbp إلى بيانات الخادم
      // استخراج fbc من الكوكي أو إنشاؤه من fbclid
      const getFBCookieLocal = (name: string) => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const [key, value] = cookie.trim().split('=');
          if (key === name && value && value !== 'undefined' && value !== 'null') {
            return decodeURIComponent(value);
          }
        }
        return null;
      };
      
      const generateFBCFromURLLocal = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const fbclid = urlParams.get('fbclid');
        
        if (fbclid) {
          const timestamp = Date.now();
          const hostname = window.location.hostname;
          let subdomainIndex = 1;
          
          if (hostname === 'localhost' || hostname.split('.').length === 1) {
            subdomainIndex = 0;
          } else if (hostname.split('.').length === 2) {
            subdomainIndex = 1;
          } else {
            subdomainIndex = 2;
          }
          
          return `fb.${subdomainIndex}.${timestamp}.${fbclid}`;
        }
        
        const storedFbclid = localStorage.getItem('fbclid');
        const storedTimestamp = localStorage.getItem('fbclid_timestamp');
        
        if (storedFbclid && storedTimestamp) {
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          const storedTime = parseInt(storedTimestamp);
          
          if (storedTime > sevenDaysAgo) {
            const hostname = window.location.hostname;
            let subdomainIndex = 1;
            
            if (hostname === 'localhost' || hostname.split('.').length === 1) {
              subdomainIndex = 0;
            } else if (hostname.split('.').length === 2) {
              subdomainIndex = 1;
            } else {
              subdomainIndex = 2;
            }
            
            return `fb.${subdomainIndex}.${storedTime}.${storedFbclid}`;
          }
        }
        
        return null;
      };
      
      let fbc = getFBCookieLocal('_fbc');
      if (!fbc) {
        // إنشاء fbc للـ Server-Side API إذا لم يوجد
        const storedFbclid = localStorage.getItem('fbclid');
        const storedTimestamp = localStorage.getItem('fbclid_timestamp');
        
        if (storedFbclid && storedTimestamp) {
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          const storedTime = parseInt(storedTimestamp);
          
          if (storedTime > sevenDaysAgo) {
            const hostname = window.location.hostname;
            let subdomainIndex = 1;
            
            if (hostname === 'localhost' || hostname.split('.').length === 1) {
              subdomainIndex = 0;
            } else if (hostname.split('.').length === 2) {
              subdomainIndex = 1;
            } else {
              subdomainIndex = 2;
            }
            
            fbc = `fb.${subdomainIndex}.${storedTime}.${storedFbclid}`;
          }
        }
      }
      
      const fbp = getFBCookieLocal('_fbp');
      
      const serverEventData = {
        ...eventData,
        event_id: eventId,
        event_source_url: window.location.href,
        fbc: fbc, // ✅ إرسال fbc للخادم
        fbp: fbp  // ✅ إرسال fbp للخادم
      };
      
      console.log('🔄 Sending to Server-Side API:', {
        eventType: standardEventType,
        eventId,
        external_id: serverEventData.external_id,
        content_ids: serverEventData.content_ids,
        value: serverEventData.value,
        currency: serverEventData.currency,
        customer_phone: serverEventData.customer_phone ? '[REDACTED]' : undefined,
        customer_email: serverEventData.customer_email ? '[REDACTED]' : undefined,
        fbc: fbc ? 'PRESENT' : 'MISSING', // ✅ إظهار حالة fbc
        fbp: fbp ? 'PRESENT' : 'MISSING'  // ✅ إظهار حالة fbp
      });
      
      const response = await fetch('/api/facebook-conversions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformId,
          eventType: standardEventType,
          eventData: serverEventData,
          userAgent: navigator.userAgent,
          clientIP: undefined // سيتم استخراجه في الخادم
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // نجح الإرسال
      } else {
        // فشل الإرسال
      }
    } catch (error) {
      // خطأ في الإرسال
    }
  };

  // تنفيذ الأحداث عند تغيير eventType أو eventData
  useEffect(() => {
    if (!pixelSettings || isLoading || !eventType) return;
    
    // منع تشغيل useEffect المتعدد للبكسل نفسه
    const pixelId = pixelSettings.facebookPixelId;
    const effectKey = `pixeltracker_${eventType}_${pixelId}_${Date.now()}`;
    
    // فحص إذا كان هذا البكسل يعمل بالفعل
    if (pixelId && window.fbq && document.querySelector(`[data-fb-pixel-initialized="${pixelId}"]`)) {
      // البكسل محمل ومهيأ، لكن تحقق من وجود بيانات عميل جديدة
      const hasCustomerData = eventData?.customer_email || eventData?.customer_phone || 
                             eventData?.customer_first_name || eventData?.customer_last_name;
      
      if (hasCustomerData && !document.querySelector(`[data-fb-customer-data-sent="${pixelId}"]`)) {
        // إعادة تهيئة البكسل مع بيانات العميل الجديدة
        const customerAdvancedMatching: any = {};
        if (eventData?.external_id) customerAdvancedMatching.external_id = eventData.external_id;
        if (eventData?.customer_email) customerAdvancedMatching.em = eventData.customer_email;
        if (eventData?.customer_phone) customerAdvancedMatching.ph = eventData.customer_phone;
        if (eventData?.customer_first_name) customerAdvancedMatching.fn = eventData.customer_first_name;
        if (eventData?.customer_last_name) customerAdvancedMatching.ln = eventData.customer_last_name;
        if (eventData?.customer_city) customerAdvancedMatching.ct = eventData.customer_city;
        if (eventData?.customer_state) customerAdvancedMatching.st = eventData.customer_state;
        if (eventData?.customer_country) customerAdvancedMatching.country = eventData.customer_country || 'iq';
        
        console.log('🔄 Updating Facebook Pixel with Customer Data:', Object.keys(customerAdvancedMatching));
        // إرسال حدث خاص لتحديث Advanced Matching
        window.fbq('track', 'PageView', {}, customerAdvancedMatching);
        
        // إضافة علامة لمنع إعادة الإرسال
        const customerDataMarker = document.createElement('div');
        customerDataMarker.setAttribute('data-fb-customer-data-sent', pixelId);
        customerDataMarker.style.display = 'none';
        document.head.appendChild(customerDataMarker);
      }
      
      console.log('🔍 Pixel already loaded, sending event only:', eventType);
      
      // إنشاء event_id مرة واحدة فقط
      const contentId = eventData?.content_ids?.[0] || eventData?.product_id || 'unknown';
      const presetEventId = (eventData as any)?._eventId;
      const timestamp = (eventData as any)?._timestamp || Date.now();
      const eventId = presetEventId || `${eventType}_${contentId}_${timestamp.toString().slice(-8)}`;
      
      // منع إرسال نفس الحدث مرتين
      const sentEventKey = `useeffect_event_sent_${eventId}`;
      if ((window as any)[sentEventKey]) {
        console.log('🔍 UseEffect Event already processed, skipping:', eventType, eventId);
        return;
      }
      (window as any)[sentEventKey] = true;
      
      console.log('🔍 Processing Event (Pixel Already Loaded):', {
        eventType,
        eventId,
        contentId,
        timestamp,
        external_id: eventData?.external_id,
        note: 'external_id will be sent via Server-Side API only (pixel already initialized)'
      });
      
      setTimeout(() => {
        // استخراج Cookie FBP و FBC مع تحسينات لحل مشكلة FBC الفارغة
        const getFBCookieLocal = (name: string) => {
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [key, value] = cookie.trim().split('=');
            if (key === name && value && value !== 'undefined' && value !== 'null') {
              return decodeURIComponent(value);
            }
          }
          return null;
        };

        // إنشاء FBC من fbclid إذا لم يكن موجود
        const generateFBCFromURLLocal = () => {
          const urlParams = new URLSearchParams(window.location.search);
          const fbclid = urlParams.get('fbclid');
          
          if (fbclid) {
            const timestamp = Math.floor(Date.now() / 1000);
            const fbc = `fb.1.${timestamp}.${fbclid}`;
            
            // حفظ في cookie لاستخدامات مستقبلية
            const expiryDate = new Date();
            expiryDate.setTime(expiryDate.getTime() + (90 * 24 * 60 * 60 * 1000));
            document.cookie = `_fbc=${fbc}; expires=${expiryDate.toUTCString()}; path=/; domain=${window.location.hostname}`;
            
            console.log('🔍 FBC generated from fbclid (useEffect):', { fbclid, fbc });
            return fbc;
          }
          
          // محاولة استخراج من localStorage
          const storedFbclid = localStorage.getItem('fbclid');
          const storedTimestamp = localStorage.getItem('fbclid_timestamp');
          
          if (storedFbclid && storedTimestamp) {
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (parseInt(storedTimestamp) > sevenDaysAgo) {
              const timestamp = Math.floor(parseInt(storedTimestamp) / 1000);
              const fbc = `fb.1.${timestamp}.${storedFbclid}`;
              
              const expiryDate = new Date();
              expiryDate.setTime(expiryDate.getTime() + (90 * 24 * 60 * 60 * 1000));
              document.cookie = `_fbc=${fbc}; expires=${expiryDate.toUTCString()}; path=/; domain=${window.location.hostname}`;
              
              console.log('🔍 FBC generated from stored fbclid (useEffect):', { storedFbclid, fbc });
              return fbc;
            }
          }
          
          return null;
        };

        // الحصول على FBC محسن
        const getEnhancedFBCLocal = () => {
          let fbc = getFBCookieLocal('_fbc');
          if (!fbc) {
            fbc = generateFBCFromURLLocal();
          }
          return fbc;
        };

        const enrichedEventData = {
          ...eventData,
          fbp: getFBCookieLocal('_fbp'),
          fbc: getEnhancedFBCLocal()
        };

        console.log('🔍 Enhanced Event Data (useEffect):', {
          eventType,
          fbp: enrichedEventData.fbp ? 'Present' : 'Missing',
          fbc: enrichedEventData.fbc ? 'Present' : 'Missing',
          fbclid_in_url: new URLSearchParams(window.location.search).get('fbclid') ? 'Present' : 'Missing',
          fbclid_in_storage: localStorage.getItem('fbclid') ? 'Present' : 'Missing'
        });

        // إضافة Advanced Matching للحدث إذا كانت بيانات العميل متوفرة
        const eventAdvancedMatching: any = {};
        if (eventData?.external_id) eventAdvancedMatching.external_id = eventData.external_id;
        if (eventData?.customer_email) eventAdvancedMatching.em = eventData.customer_email;
        if (eventData?.customer_phone) eventAdvancedMatching.ph = eventData.customer_phone;
        if (eventData?.customer_first_name) eventAdvancedMatching.fn = eventData.customer_first_name;
        if (eventData?.customer_last_name) eventAdvancedMatching.ln = eventData.customer_last_name;
        if (eventData?.customer_city) eventAdvancedMatching.ct = eventData.customer_city;
        if (eventData?.customer_state) eventAdvancedMatching.st = eventData.customer_state;
        if (eventData?.customer_country) eventAdvancedMatching.country = eventData.customer_country || 'iq';
        
        console.log('🔍 Event Advanced Matching Data:');
        console.log(eventAdvancedMatching);
        
        // إرسال الحدث مع Advanced Matching محدث
        trackFacebookEvent(eventType, enrichedEventData, eventId, eventAdvancedMatching);
        sendToServerSideAPI(platformId, eventType, enrichedEventData, eventId);
      }, 100);
      
      return;
    }
    
    // تشخيص خاص لحدث Lead
    if (eventType === 'lead') {
      console.log('🎯 PixelTracker: Processing Lead Event', {
        eventType,
        eventData,
        platformId,
        hasPixelSettings: !!pixelSettings,
        facebookPixelId: pixelSettings.facebookPixelId
      });
    }
    
    // تشخيص لمشكلة التكرار
    console.log('🔍 PixelTracker Loading:', {
      eventType,
      platformId,
      fbqExists: !!window.fbq,
      fbPixelLoaded: !!(window as any).__fbPixelLoaded,
      pixelId: pixelSettings.facebookPixelId
    });
    
    // إنشاء مفتاح فريد باستخدام بيانات مستقرة
    const contentId = eventData?.content_ids?.[0] || eventData?.product_id || 'unknown';
    
    // إنشاء event_id متطابق - استخدام _eventId إذا كان متوفراً (للـ Purchase) أو إنشاء جديد
    const presetEventId = (eventData as any)?._eventId;
    const timestamp = (eventData as any)?._timestamp || Date.now();
    const eventId = presetEventId || `${eventType}_${contentId}_${timestamp.toString().slice(-8)}`;
    
    
    // تحميل وتنفيذ Facebook Pixel (مرة واحدة فقط)
    if (pixelSettings.facebookPixelId) {
      // إعداد Advanced Matching data للتهيئة (جميع البيانات المتاحة لأفضل مطابقة)
      const initAdvancedMatching: any = {};
      if (eventData?.external_id) initAdvancedMatching.external_id = eventData.external_id;
      if (eventData?.customer_email) initAdvancedMatching.em = eventData.customer_email;
      if (eventData?.customer_phone) initAdvancedMatching.ph = eventData.customer_phone;
      if (eventData?.customer_first_name) initAdvancedMatching.fn = eventData.customer_first_name;
      if (eventData?.customer_last_name) initAdvancedMatching.ln = eventData.customer_last_name;
      if (eventData?.customer_city) initAdvancedMatching.ct = eventData.customer_city;
      if (eventData?.customer_state) initAdvancedMatching.st = eventData.customer_state;
      if (eventData?.customer_country) initAdvancedMatching.country = eventData.customer_country || 'iq';
      
      console.log('🔍 Available eventData for Advanced Matching:', {
        external_id: eventData?.external_id,
        customer_email: eventData?.customer_email ? '[PRESENT]' : '[MISSING]',
        customer_phone: eventData?.customer_phone ? '[PRESENT]' : '[MISSING]',
        customer_first_name: eventData?.customer_first_name ? '[PRESENT]' : '[MISSING]',
        customer_last_name: eventData?.customer_last_name ? '[PRESENT]' : '[MISSING]',
        customer_city: eventData?.customer_city ? '[PRESENT]' : '[MISSING]',
        customer_state: eventData?.customer_state ? '[PRESENT]' : '[MISSING]',
        customer_country: eventData?.customer_country ? '[PRESENT]' : '[MISSING]'
      });
      
      console.log('🔍 Final initAdvancedMatching object:', initAdvancedMatching);
      
      // تحميل البكسل مع Advanced Matching data
      loadFacebookPixel(pixelSettings.facebookPixelId, initAdvancedMatching);
      
      setTimeout(() => {
        // استخراج Cookie FBP و FBC مع تحسينات لحل مشكلة FBC الفارغة
        const getFBCookieLocal2 = (name: string) => {
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [key, value] = cookie.trim().split('=');
            if (key === name && value && value !== 'undefined' && value !== 'null') {
              return decodeURIComponent(value);
            }
          }
          return null;
        };

        // إنشاء FBC من fbclid إذا لم يكن موجود
        const generateFBCFromURLLocal2 = () => {
          const urlParams = new URLSearchParams(window.location.search);
          const fbclid = urlParams.get('fbclid');
          
          if (fbclid) {
            const timestamp = Math.floor(Date.now() / 1000);
            const fbc = `fb.1.${timestamp}.${fbclid}`;
            
            // حفظ في cookie لاستخدامات مستقبلية
            const expiryDate = new Date();
            expiryDate.setTime(expiryDate.getTime() + (90 * 24 * 60 * 60 * 1000));
            document.cookie = `_fbc=${fbc}; expires=${expiryDate.toUTCString()}; path=/; domain=${window.location.hostname}`;
            
            console.log('🔍 FBC generated from fbclid (init):', { fbclid, fbc });
            return fbc;
          }
          
          // محاولة استخراج من localStorage
          const storedFbclid = localStorage.getItem('fbclid');
          const storedTimestamp = localStorage.getItem('fbclid_timestamp');
          
          if (storedFbclid && storedTimestamp) {
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (parseInt(storedTimestamp) > sevenDaysAgo) {
              const timestamp = Math.floor(parseInt(storedTimestamp) / 1000);
              const fbc = `fb.1.${timestamp}.${storedFbclid}`;
              
              const expiryDate = new Date();
              expiryDate.setTime(expiryDate.getTime() + (90 * 24 * 60 * 60 * 1000));
              document.cookie = `_fbc=${fbc}; expires=${expiryDate.toUTCString()}; path=/; domain=${window.location.hostname}`;
              
              console.log('🔍 FBC generated from stored fbclid (init):', { storedFbclid, fbc });
              return fbc;
            }
          }
          
          return null;
        };

        // الحصول على FBC محسن
        const getEnhancedFBCLocal2 = () => {
          let fbc = getFBCookieLocal2('_fbc');
          if (!fbc) {
            fbc = generateFBCFromURLLocal2();
          }
          return fbc;
        };

        const enrichedEventData = {
          ...eventData,
          fbp: getFBCookieLocal2('_fbp'),
          fbc: getEnhancedFBCLocal2()
        };

        console.log('🔍 Enhanced Event Data (init):', {
          eventType,
          fbp: enrichedEventData.fbp ? 'Present' : 'Missing',
          fbc: enrichedEventData.fbc ? 'Present' : 'Missing',
          fbclid_in_url: new URLSearchParams(window.location.search).get('fbclid') ? 'Present' : 'Missing',
          fbclid_in_storage: localStorage.getItem('fbclid') ? 'Present' : 'Missing'
        });

        trackFacebookEvent(eventType, enrichedEventData, eventId);
        // إرسال إلى Server-Side API مع البيانات المحسنة
        sendToServerSideAPI(platformId, eventType, enrichedEventData, eventId);
      }, 100);
    }
    
    // تحميل وتنفيذ TikTok Pixel
    if (pixelSettings.tiktokPixelId) {
      loadTikTokPixel(pixelSettings.tiktokPixelId);
      setTimeout(() => {
        trackTikTokEvent(eventType, eventData);
      }, 200);
    }
    
    // تنفيذ Snapchat Pixel
    if (pixelSettings.snapchatPixelId) {
      trackSnapchatEvent(eventType, eventData);
    }
    
    // تنفيذ Google Analytics
    if (pixelSettings.googleAnalyticsId) {
      trackGoogleEvent(eventType, eventData);
    }
    
  }, [eventType, eventData, pixelSettings, isLoading, platformId]);

  return null; // هذا المكون لا يعرض أي محتوى مرئي
}