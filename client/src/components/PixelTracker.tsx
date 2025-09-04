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
  console.log('🎯🎯🎯 PIXELTRACKER COMPONENT LOADED! 🎯🎯🎯');
  console.log('🎯 Platform ID:', platformId);
  console.log('🎯 Event Type:', eventType);
  console.log('🎯 Event Data:', eventData);
  
  // نظام منع الإرسال المتكرر
  const [sentEvents, setSentEvents] = useState<Set<string>>(new Set());
  const lastEventRef = useRef<string>('');
  
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

  useEffect(() => {
    if (!pixelSettings) return;

    console.log('🎯 PixelTracker: Settings loaded', pixelSettings);
    console.log('🎯 PixelTracker: Event type', eventType, 'Data:', eventData);
    
    // إنشاء معرف للحدث
    const eventKey = createEventKey(eventType, eventData);
    
    // التحقق من عدم إرسال الحدث مسبقاً
    if (sentEvents.has(eventKey)) {
      console.log('🚫 PixelTracker: Event already sent, skipping:', eventKey);
      return;
    }
    
    // إضافة الحدث للقائمة المرسلة
    setSentEvents(prev => new Set([...prev, eventKey]));

    // تحميل وتفعيل Facebook Pixel - يحتاج فقط Pixel ID للعمل client-side
    if (pixelSettings.facebookPixelId && pixelSettings.facebookPixelId !== '') {
      console.log('📘 Facebook Pixel: Loading with ID', pixelSettings.facebookPixelId);
      loadFacebookPixel(pixelSettings.facebookPixelId);
      trackFacebookEvent(eventType, eventData);
    } else {
      console.log('📘 Facebook Pixel: Not loaded - Missing Pixel ID', {
        pixelId: pixelSettings.facebookPixelId
      });
    }

    // تحميل وتفعيل TikTok Pixel - يحتاج فقط Pixel ID للعمل client-side
    if (pixelSettings.tiktokPixelId && pixelSettings.tiktokPixelId !== '') {
      console.log('🎬 TikTok Pixel: Loading with ID', pixelSettings.tiktokPixelId);
      loadTikTokPixel(pixelSettings.tiktokPixelId);
      trackTikTokEvent(eventType, eventData);
    } else {
      console.log('🎬 TikTok Pixel: Not loaded - Missing Pixel ID', {
        pixelId: pixelSettings.tiktokPixelId
      });
    }

    // تحميل وتفعيل Snapchat Pixel
    if (pixelSettings.snapchatPixelId && pixelSettings.snapchatAccessToken) {
      loadSnapchatPixel(pixelSettings.snapchatPixelId);
      trackSnapchatEvent(eventType, eventData);
    }

    // تحميل وتفعيل Google Analytics
    if (pixelSettings.googleAnalyticsId) {
      loadGoogleAnalytics(pixelSettings.googleAnalyticsId);
      trackGoogleEvent(eventType, eventData);
    }
  }, [pixelSettings, eventType, eventData]);

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
    !function(f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
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
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    
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
  const trackFacebookEvent = (eventType: string, data?: any) => {
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

    // إنشاء event_id فريد لكل حدث
    const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
    
    const eventData = {
      content_name: data?.content_name,
      content_category: data?.content_category,
      content_ids: data?.content_ids,
      value: convertedValue,
      currency: data?.currency || 'USD',
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
    
    // إرسال الحدث لـ Facebook Conversions API (Server-Side) - بدون await لعدم إبطاء الصفحة
    fetch('/api/facebook/conversions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platformId: platformId,
        eventType: fbEvent,
        eventData: {
          ...data,
          value: convertedValue, // استخدام القيمة المحوّلة لـ Conversions API أيضاً
          event_source_url: window.location.href,
          fbp: getFBCookie('_fbp'),
          fbc: getFBCookie('_fbc'),
          action_source: 'website',
          event_id: eventId // تمرير نفس event_id للخادم لمنع التكرار
        }
      })
    }).then(async response => {
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Facebook Conversions API success:', result);
      } else {
        const error = await response.text();
        console.warn('⚠️ Facebook Conversions API error:', error);
      }
    }).catch(error => {
      console.warn('⚠️ Failed to send to Facebook Conversions API:', error);
    });
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

  return null; // هذا المكون لا يعرض أي محتوى مرئي
}