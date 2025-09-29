import crypto from 'crypto';
import fetch from 'node-fetch';
import { logServerPixelEvent } from './pixelDiagnostics';

interface FacebookConversionEvent {
  event_name: string;
  event_time: number;
  user_data: {
    em?: string; // email (hashed)
    ph?: string; // phone (hashed)
    fn?: string; // first name (hashed)
    ln?: string; // last name (hashed)
    ct?: string; // city (hashed)
    st?: string; // state (hashed)
    country?: string; // country code (hashed)
    external_id?: string; // external ID (hashed)
    client_ip_address?: string; // عنوان IP (غير مشفر)
    client_user_agent?: string; // معلومات المتصفح (غير مشفر)
    fbc?: string; // معرف النقر على Facebook (غير مشفر)
    fbp?: string; // معرف متصفح Facebook (غير مشفر)
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_name?: string;
    content_category?: string;
    num_items?: number;
    order_id?: string;
    facebook_login_id?: string; // معرف تسجيل الدخول لفيسبوك
    user_external_id?: string;  // المعرف الخارجي
  };
  event_source_url?: string;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  event_id?: string;
}

// دالة تشفير البيانات الحساسة باستخدام SHA256
function hashData(data: string): string {
  if (!data || data.trim() === '') return '';
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// دالة تنظيف وتشفير رقم الهاتف
function hashPhoneNumber(phone: string): string {
  if (!phone) return '';
  // إزالة جميع الرموز والمسافات والاحتفاظ بالأرقام فقط
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  // التأكد من وجود رمز البلد
  const phoneWithCountry = cleanPhone.startsWith('+') ? cleanPhone : `+964${cleanPhone.replace(/^0/, '')}`;
  return hashData(phoneWithCountry);
}

// دالة إرسال الأحداث لـ Facebook Conversions API
export async function sendFacebookConversion(
  pixelId: string,
  accessToken: string,
  events: FacebookConversionEvent[]
): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/v23.0/${pixelId}/events`;
    
    const payload = {
      data: events,
      test_event_code: process.env.NODE_ENV === 'development' ? 'TEST12345' : undefined
    };

    console.log('🔗 Sending Facebook Conversions API request:', {
      url,
      eventCount: events.length,
      pixelId,
      testMode: process.env.NODE_ENV === 'development',
      events: events.map(event => ({
        event_name: event.event_name,
        event_id: event.event_id,
        has_user_data: !!event.user_data && Object.keys(event.user_data).length > 0,
        has_custom_data: !!event.custom_data && Object.keys(event.custom_data).length > 0,
        user_data_fields: event.user_data ? Object.keys(event.user_data) : [],
        custom_data_fields: event.custom_data ? Object.keys(event.custom_data) : []
      }))
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json() as any;
    
    if (!response.ok) {
      console.error('❌ Facebook Conversions API error:', {
        status: response.status,
        statusText: response.statusText,
        error: result,
        pixelId,
        eventCount: events.length
      });
      
      // تسجيل الأحداث الفاشلة في نظام التشخيص
      events.forEach(event => {
        logServerPixelEvent(
          event.event_name,
          event.event_id,
          event.user_data?.external_id,
          pixelId,
          false, // فشل الإرسال
          `HTTP ${response.status}: ${response.statusText}`
        );
      });
      
      return false;
    }

    // تحليل النتيجة لفهم معدل النجاح
    const eventsReceived = result?.events_received || 0;
    const messagesReceived = result?.messages || [];
    
    console.log('✅ Facebook Conversions API success:', {
      events_received: eventsReceived,
      events_sent: events.length,
      success_rate: `${eventsReceived}/${events.length}`,
      messages: messagesReceived,
      fbtrace_id: result?.fbtrace_id
    });
    
    // تحذير إذا لم يتم استلام جميع الأحداث
    if (eventsReceived < events.length) {
      console.warn('⚠️ Facebook Conversions API: Not all events were received', {
        sent: events.length,
        received: eventsReceived,
        messages: messagesReceived
      });
    }
    
    // تسجيل الأحداث في نظام التشخيص
    events.forEach(event => {
      logServerPixelEvent(
        event.event_name,
        event.event_id,
        event.user_data?.external_id,
        pixelId,
        true, // نجح الإرسال
        undefined
      );
    });
    
    return true;

  } catch (error) {
    console.error('💥 Facebook Conversions API request failed:', error);
    
    // تسجيل الأحداث الفاشلة بسبب خطأ في الشبكة
    events.forEach(event => {
      logServerPixelEvent(
        event.event_name,
        event.event_id,
        event.user_data?.external_id,
        pixelId,
        false, // فشل الإرسال
        `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    });
    
    return false;
  }
}

// دالة مساعدة لإنشاء حدث التحويل
export function createFacebookConversionEvent(
  eventType: string,
  eventData: any,
  userAgent?: string,
  clientIP?: string
): FacebookConversionEvent {
  // استخدام event_id من العميل (مطلوب لمنع التكرار)
  const eventId = eventData.event_id;
  
  console.log('🔧 Creating Facebook Conversion Event:', {
    eventType,
    eventId,
    hasEventId: !!eventId,
    hasExternalId: !!eventData.external_id,
    hasCustomerData: !!(eventData.customer_email || eventData.customer_phone),
    hasValue: eventData.value !== undefined,
    currency: eventData.currency
  });
  
  if (!eventId) {
    console.warn('⚠️ Facebook Conversions API: Missing event_id - this may cause duplicate events');
  }
  
  // تشفير البيانات الحساسة
  const hashedUserData: any = {};
  
  if (eventData.customer_email) {
    hashedUserData.em = hashData(eventData.customer_email);
  }
  
  if (eventData.customer_phone) {
    hashedUserData.ph = hashPhoneNumber(eventData.customer_phone);
  }
  
  if (eventData.customer_first_name) {
    hashedUserData.fn = hashData(eventData.customer_first_name);
  }
  
  if (eventData.customer_last_name) {
    hashedUserData.ln = hashData(eventData.customer_last_name);
  }
  
  if (eventData.customer_city) {
    hashedUserData.ct = hashData(eventData.customer_city);
  }
  
  if (eventData.customer_state) {
    hashedUserData.st = hashData(eventData.customer_state);
  }
  
  if (eventData.customer_country) {
    hashedUserData.country = hashData(eventData.customer_country);
  }
  
  if (eventData.external_id) {
    hashedUserData.external_id = hashData(eventData.external_id);
  }
  
  if (clientIP) {
    // دعم IPv6 - تفضيل IPv6 على IPv4
    hashedUserData.client_ip_address = clientIP;
  }
  
  if (userAgent) {
    hashedUserData.client_user_agent = userAgent;
  }
  
  if (eventData.fbc) {
    // ✅ التحقق من صحة تنسيق fbc قبل الإرسال
    const fbcParts = eventData.fbc.split('.');
    if (fbcParts.length === 4 && fbcParts[0] === 'fb') {
      const version = fbcParts[0]; // يجب أن يكون 'fb'
      const subdomainIndex = fbcParts[1]; // 0, 1, أو 2
      const creationTime = fbcParts[2]; // timestamp بالميلي ثانية
      const fbclid = fbcParts[3]; // fbclid الأصلي بدون تعديل
      
      // التحقق من صحة creationTime
      const creationTimeMs = parseInt(creationTime);
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      if (creationTimeMs > now) {
        console.warn('⚠️ FBC creationTime في المستقبل، سيتم تصحيحه');
        // إنشاء fbc جديد بوقت صحيح
        const correctedTime = now - (60 * 60 * 1000); // قبل ساعة من الآن
        hashedUserData.fbc = `${version}.${subdomainIndex}.${correctedTime}.${fbclid}`;
        console.log('✅ FBC CORRECTED:', hashedUserData.fbc);
      } else if (creationTimeMs < sevenDaysAgo) {
        console.warn('⚠️ FBC creationTime أقدم من 7 أيام، سيتم تصحيحه');
        // إنشاء fbc جديد بوقت صحيح
        const correctedTime = sevenDaysAgo + (60 * 60 * 1000); // بعد ساعة من الحد الأدنى
        hashedUserData.fbc = `${version}.${subdomainIndex}.${correctedTime}.${fbclid}`;
        console.log('✅ FBC CORRECTED:', hashedUserData.fbc);
      } else {
        // fbc صحيح
        hashedUserData.fbc = eventData.fbc;
        console.log('✅ FBC VALUE VALID:', eventData.fbc);
      }
    } else {
      console.error('❌ FBC FORMAT INVALID:', eventData.fbc);
      // لا نرسل fbc غير صحيح
    }
  } else {
    console.log('❌ FBC VALUE MISSING');
  }
  
  if (eventData.fbp) {
    hashedUserData.fbp = eventData.fbp;
    console.log('🔍 FBP VALUE FOUND:', eventData.fbp);
  } else {
    console.log('❌ FBP VALUE MISSING');
  }

  // معرف تسجيل الدخول لفيسبوك - سيتم إضافته إلى custom_data لاحقاً
  // المعرف الخارجي - سيتم إضافته إلى custom_data لاحقاً

  // إعداد البيانات المخصصة
  const customData: any = {};
  
  if (eventData.value !== undefined) {
    // إرسال القيمة كما هي بدون تحويل لتطابق الكتالوج
    customData.value = eventData.value;
    console.log('💰 Facebook API: Sending original value to match catalog:', eventData.value, eventData.currency);
  }
  
  // إرسال العملة الأصلية لتطابق الكتالوج
  customData.currency = eventData.currency || 'IQD';
  
  // تنظيف وتوحيد content_ids لضمان المطابقة مع الكتالوج
  if (eventData.content_ids) {
    const normalizedIds = Array.isArray(eventData.content_ids) 
      ? eventData.content_ids.map((id: any) => String(id).trim()).filter((id: string) => id.length > 0)
      : [String(eventData.content_ids).trim()].filter((id: string) => id.length > 0);
    
    if (normalizedIds.length > 0) {
      customData.content_ids = normalizedIds;
    }
  }
  
  // إضافة content_type لتحسين المطابقة
  if (eventData.content_type) {
    customData.content_type = eventData.content_type;
  }
  
  if (eventData.content_name) {
    customData.content_name = eventData.content_name;
  }
  
  if (eventData.content_category) {
    customData.content_category = eventData.content_category;
  }
  
  if (eventData.quantity || eventData.num_items) {
    customData.num_items = eventData.quantity || eventData.num_items;
  }
  
  if (eventData.transaction_id || eventData.order_number) {
    customData.order_id = eventData.transaction_id || eventData.order_number;
  }
  
  // إضافة معرفات المستخدم لتحسين تسجيل التحويلات
  if (eventData.facebook_login_id) {
    customData.facebook_login_id = eventData.facebook_login_id; // +19.71% تحسين
  }
  
  if (eventData.external_id) {
    customData.user_external_id = eventData.external_id; // +14.5% تحسين
  }

  // ✅ حساب event_time صحيح يتوافق مع fbc creationTime
  let eventTime = Math.floor(Date.now() / 1000);
  
  // إذا كان لدينا fbc صالح، تأكد من أن event_time لا يسبق creationTime
  if (hashedUserData.fbc) {
    const fbcParts = hashedUserData.fbc.split('.');
    if (fbcParts.length === 4) {
      const fbcCreationTimeMs = parseInt(fbcParts[2]);
      const fbcCreationTimeSeconds = Math.floor(fbcCreationTimeMs / 1000);
      
      // تأكد من أن event_time لا يسبق fbc creationTime
      if (eventTime < fbcCreationTimeSeconds) {
        eventTime = fbcCreationTimeSeconds + 60; // بعد دقيقة من fbc creationTime
        console.log('✅ EVENT_TIME adjusted to be after FBC creationTime:', eventTime);
      }
    }
  }
  
  // التأكد من أن event_time ليس أقدم من 7 أيام
  const sevenDaysAgoSeconds = Math.floor((Date.now() - (7 * 24 * 60 * 60 * 1000)) / 1000);
  if (eventTime < sevenDaysAgoSeconds) {
    eventTime = sevenDaysAgoSeconds + 3600; // بعد ساعة من الحد الأدنى
    console.log('✅ EVENT_TIME adjusted to be within 7 days:', eventTime);
  }

  const finalEvent: FacebookConversionEvent = {
    event_name: eventType,
    event_time: eventTime,
    user_data: hashedUserData,
    custom_data: Object.keys(customData).length > 0 ? customData : undefined,
    event_source_url: eventData.event_source_url,
    action_source: 'website' as const,
    event_id: eventId
  };

  console.log('📋 Facebook Conversion Event Summary:', {
    event_name: finalEvent.event_name,
    event_id: finalEvent.event_id,
    user_data_count: Object.keys(hashedUserData).length,
    custom_data_count: Object.keys(customData).length,
    has_external_id: !!hashedUserData.external_id,
    has_fbp: !!hashedUserData.fbp,
    has_fbc: !!hashedUserData.fbc,
    has_email: !!hashedUserData.em,
    has_phone: !!hashedUserData.ph,
    value: customData.value,
    currency: customData.currency
  });

  return finalEvent;
}