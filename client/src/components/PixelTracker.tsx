import { useEffect, useImperativeHandle, forwardRef, useState, useRef } from 'react';
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
  console.log('🔥🔥🔥 PIXELTRACKER COMPONENT LOADED - NEW VERSION 2025! 🔥🔥🔥');
  console.log('🔥 Platform ID:', platformId);
  console.log('🔥 Event Type:', eventType);
  console.log('🔥 Event Data:', eventData);
  console.log('🔥🔥🔥 هذا هو الكود الجديد بدون منع تكرار! 🔥🔥🔥');
  
  // نظام منع الإرسال المتكرر باستخدام localStorage
  const [hasExecuted, setHasExecuted] = useState(false);
  
  // جلب إعدادات البكسلات من قاعدة البيانات
  const { data: pixelSettings, isLoading, error } = useQuery<PixelSettings>({
    queryKey: [`/api/platforms/${platformId}/ad-platform-settings`],
    staleTime: 5 * 60 * 1000, // 5 دقائق
    refetchOnWindowFocus: false,
  });

  console.log('🔍 PixelTracker Query Status:', {
    platformId,
    isLoading,
    error,
    pixelSettings,
    url: `/api/platforms/${platformId}/ad-platform-settings`
  });
  
  // عرض حالة تحميل الـ Pixel Settings
  if (isLoading) {
    console.log('⏳ PixelTracker: جاري تحميل إعدادات الـ Pixels...');
  }
  
  if (error) {
    console.error('❌ PixelTracker: خطأ في تحميل إعدادات الـ Pixels:', error);
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

  // تم حذف useEffect القديم نهائياً - الاعتماد فقط على useEffect الجديد مع sessionStorage

  // تم حذف useEffect القديم - الاعتماد فقط على useEffect الجديد مع sessionStorage

  // حذف useEffect القديم نهائياً

  // حذف useEffect القديم نهائياً

  // تحميل Facebook Pixel
  const loadFacebookPixel = (pixelId: string) => {
    console.log('📘 Facebook Pixel: Loading with ID', pixelId);
    
    // التحقق من وجود script فيسبوك مسبقاً
    const existingScript = document.querySelector('script[src*="fbevents.js"]');
    const existingPixelData = document.querySelector(`[data-fb-pixel-id="${pixelId}"]`);
    
    if (existingScript && existingPixelData) {
      console.log('📘 Facebook Pixel: ✅ Already loaded for this pixel ID, skipping duplicate load');
      return;
    }
    
    // إذا كان fbq موجود، أضف الـ pixel ID الجديد فقط
    if (window.fbq && existingScript) {
      console.log('📘 Facebook Pixel: ✅ FBQ exists, adding new pixel ID:', pixelId);
      window.fbq('init', pixelId);
      // إضافة علامة لتتبع الـ pixel المحمل
      const marker = document.createElement('div');
      marker.setAttribute('data-fb-pixel-id', pixelId);
      marker.style.display = 'none';
      document.head.appendChild(marker);
      console.log('📘 Facebook Pixel: ✅ NEW PIXEL ID ADDED:', pixelId);
      return;
    }
    
    console.log('📘 Facebook Pixel: Starting fresh load with ID', pixelId);
    console.log('📘 Facebook Pixel: 🚀 PIXEL LOADING STARTED - ID:', pixelId);
    
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
    
    // تهيئة الـ pixel
    console.log('📘 Facebook Pixel: ✅ INITIALIZING WITH ID:', pixelId);
    window.fbq('init', pixelId);
    
    // إضافة علامة لتتبع الـ pixel المحمل
    const marker = document.createElement('div');
    marker.setAttribute('data-fb-pixel-id', pixelId);
    marker.style.display = 'none';
    document.head.appendChild(marker);
    
    console.log('📘 Facebook Pixel: ✅ INIT COMMAND EXECUTED');
    
    // إرسال PageView تلقائياً
    window.fbq('track', 'PageView');
    console.log('📘 Facebook Pixel: ✅ PAGEVIEW TRACKED AUTOMATICALLY');
    
    // إضافة noscript للمتصفحات التي لا تدعم JavaScript
    if (!document.querySelector('noscript img[src*="facebook.com/tr"]')) {
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
      document.head.appendChild(noscript);
    }
    
    // تأكيد التحميل
    setTimeout(() => {
      console.log('📘 Facebook Pixel: Load verification', {
        fbqExists: typeof window.fbq,
        scriptsCount: document.querySelectorAll('script[src*="fbevents"]').length,
        pixelMarkers: document.querySelectorAll('[data-fb-pixel-id]').length,
        pixelId: pixelId
      });
    }, 1000);
  };

  // تحميل TikTok Pixel بالطريقة الطبيعية الصحيحة
  const loadTikTokPixel = (pixelId: string) => {
    // التحقق من تحميل البكسل سابقاً
    if (document.querySelector(`[data-tiktok-pixel-id="${pixelId}"]`)) {
      console.log('🎬 TikTok Pixel: ✅ Already loaded for this pixel ID, skipping duplicate load');
      return;
    }

    console.log('🎬 TikTok Pixel: Loading with ID', pixelId);

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

    console.log('🎬 TikTok Pixel: ✅ Successfully initialized and tracking PageView');
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
  const trackFacebookEvent = (eventType: string, data?: any, sharedEventId?: string) => {
    console.log('📘 Facebook Pixel: ✅ ATTEMPTING TO TRACK EVENT:', eventType, data);
    
    if (!window.fbq) {
      console.error('📘 Facebook Pixel: ❌ FBQ NOT AVAILABLE - PIXEL NOT LOADED');
      return;
    }
    
    console.log('📘 Facebook Pixel: ✅ FBQ AVAILABLE - PROCEEDING WITH EVENT');

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
      console.warn('📘 Facebook Pixel: Unknown event type', eventType);
      return;
    }

    // استخدام event_id المشترك الثابت
    const eventId = sharedEventId;
    
    // استخراج Cookie FBP و FBC
    const getFBCookie = (name: string) => {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return decodeURIComponent(value);
      }
      return null;
    };
    
    // تحويل المبلغ من الدينار العراقي إلى الدولار إذا كانت القيمة موجودة
    const convertedValue = data?.value ? convertIQDToUSD(data.value) : data?.value;
    
    // تنظيف وتوحيد content_ids لضمان المطابقة مع الكتالوج
    const normalizeContentIds = (ids: any): string[] => {
      if (!ids) return [];
      if (Array.isArray(ids)) {
        return ids.map(id => String(id).trim()).filter(id => id.length > 0);
      }
      return [String(ids).trim()].filter(id => id.length > 0);
    };
    
    const contentIds = normalizeContentIds(data?.content_ids || data?.product_id || data?.content_id);
    
    const eventData = {
      content_name: data?.content_name || data?.product_name,
      content_category: data?.content_category || data?.product_category,
      content_ids: contentIds.length > 0 ? contentIds : undefined,
      content_type: 'product', // إضافة content_type لتحسين المطابقة
      value: convertedValue,
      currency: 'USD', // دائماً USD بعد التحويل
      num_items: data?.quantity || 1,
      email: data?.customer_email,
      phone_number: data?.customer_phone,
      first_name: data?.customer_first_name,
      last_name: data?.customer_last_name,
      city: data?.customer_city,
      state: data?.customer_state,
      country: data?.customer_country || 'IQ',
      external_id: data?.external_id,
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: window.location.href,
      user_agent: navigator.userAgent,
      fbp: getFBCookie('_fbp'),
      fbc: getFBCookie('_fbc')
    };

    // إزالة القيم undefined
    const cleanEventData = Object.fromEntries(
      Object.entries(eventData).filter(([_, value]) => value !== undefined && value !== '')
    );

    console.log('📘 Facebook Event:', fbEvent, cleanEventData);
    
    // تأكد من تحميل fbq أولاً
    if (typeof window.fbq === 'function') {
      window.fbq('track', fbEvent, cleanEventData);
      console.log('📘 Facebook Pixel: Event sent successfully');
    } else {
      console.error('📘 Facebook Pixel: fbq is not a function');
    }
    
    // ملاحظة: تم إزالة الإرسال المكرر لـ Server-Side API هنا
    // سيتم الإرسال عبر sendToServerSideAPI فقط لتجنب التكرار
    console.log('✅ Facebook Pixel: تم إرسال الحدث عبر Client-Side فقط');
  };

  // تتبع أحداث TikTok بطريقة طبيعية وصحيحة
  const trackTikTokEvent = (eventType: string, data?: any) => {
    if (!window.ttq) {
      console.warn('🎬 TikTok Pixel: ttq not available');
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
      console.warn(`🎬 TikTok Pixel: Unsupported event type: ${eventType}`);
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
      console.log('📞 TikTok Event Data Phone formatted:', rawPhone, '->', phone);
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

    console.log('🎬 TikTok Event:', tikTokEvent, cleanEventData);

    try {
      // تجهيز البيانات الشخصية منفصلة لـ TikTok Pixel
      const userProperties: any = {};
      if (email && email.trim()) userProperties.email = email.trim();
      if (phone && phone.trim()) {
        userProperties.phone_number = phone.trim();
        console.log('📞 TikTok Phone formatted:', rawPhone, '->', phone);
      }
      
      // إرسال البيانات الشخصية أولاً (إذا كانت متوفرة)
      if (Object.keys(userProperties).length > 0) {
        window.ttq.identify(userProperties);
        console.log('🎬 TikTok Pixel: User data identified:', userProperties);
      }
      
      // ثم إرسال الحدث
      window.ttq.track(tikTokEvent, cleanEventData);
      
      // إرسال إلى TikTok API أيضاً (server-side)
      sendToTikTokAPI(tikTokEvent, cleanEventData, data);
      
    } catch (error) {
      console.error('🎬 TikTok Pixel: Error tracking event:', error);
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
      console.log('🎬 TikTok API: Event sent successfully');
    } catch (error) {
      console.warn('🎬 TikTok API: Failed to send event:', error);
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
      
      console.log('📤 إرسال إلى Server-Side API:', {
        platformId,
        originalEventType: eventType,
        standardEventType,
        eventId,
        url: window.location.href
      });
      
      const response = await fetch('/api/facebook-conversions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformId,
          eventType: standardEventType,
          eventData: {
            ...eventData,
            event_id: eventId,
            event_source_url: window.location.href
          },
          userAgent: navigator.userAgent,
          clientIP: undefined // سيتم استخراجه في الخادم
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Server-Side API: تم إرسال الحدث بنجاح');
      } else {
        console.error('❌ Server-Side API: فشل في إرسال الحدث:', result);
      }
    } catch (error) {
      console.error('💥 Server-Side API: خطأ في الإرسال:', error);
    }
  };

  // تنفيذ الأحداث عند تغيير eventType أو eventData
  useEffect(() => {
    if (!pixelSettings || isLoading || !eventType || hasExecuted) return;
    
    // إنشاء مفتاح فريد باستخدام بيانات مستقرة
    const contentId = eventData?.content_ids?.[0] || eventData?.product_id || 'unknown';
    const eventKey = `pixel_${eventType}_${contentId}_${platformId}`;
    
    // تعطيل نظام منع التكرار مؤقتاً للاختبار
    // const sessionKey = `session_${eventKey}`;
    // if (sessionStorage.getItem(sessionKey)) {
    //   console.log('⚠️ تم تجاهل الحدث المكرر في هذه الجلسة:', eventType, 'للمنتج:', contentId);
    //   setHasExecuted(true);
    //   return;
    // }
    
    // تسجيل الحدث في sessionStorage (فقط للجلسة الحالية)
    // sessionStorage.setItem(sessionKey, Date.now().toString());
    // setHasExecuted(true); // تعطيل مؤقت للاختبار
    
    // إنشاء event_id متطابق - استخدام _eventId إذا كان متوفراً (للـ Purchase) أو إنشاء جديد
    const presetEventId = (eventData as any)?._eventId;
    const timestamp = (eventData as any)?._timestamp || Date.now();
    const eventId = presetEventId || `${eventType}_${contentId}_${timestamp.toString().slice(-8)}`;
    
    console.log('🎆🎆🎆 تنفيذ حدث مع معرفات متطابقة:', eventType, 'للمنتج:', contentId, 'بمعرف:', eventId, 'external_id:', (eventData as any)?.external_id, 'preset:', !!presetEventId, '🎆🎆🎆');
    
    // تحميل وتنفيذ Facebook Pixel
    if (pixelSettings.facebookPixelId) {
      loadFacebookPixel(pixelSettings.facebookPixelId);
      setTimeout(() => {
        trackFacebookEvent(eventType, eventData, eventId);
        // إرسال إلى Server-Side API بعد تأخير قصير
        sendToServerSideAPI(platformId, eventType, eventData, eventId);
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