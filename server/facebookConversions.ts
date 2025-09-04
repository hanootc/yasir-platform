import crypto from 'crypto';
import fetch from 'node-fetch';

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
    login_id?: string; // معرف تسجيل الدخول (مشفر)
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_name?: string;
    content_category?: string;
    num_items?: number;
    order_id?: string;
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
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events`;
    
    const payload = {
      data: events,
      test_event_code: process.env.NODE_ENV === 'development' ? 'TEST12345' : undefined
    };

    console.log('🔗 Sending Facebook Conversions API request:', {
      url,
      eventCount: events.length,
      pixelId,
      testMode: process.env.NODE_ENV === 'development'
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
      console.error('❌ Facebook Conversions API error:', result);
      return false;
    }

    console.log('✅ Facebook Conversions API success:', result);
    return true;

  } catch (error) {
    console.error('💥 Facebook Conversions API request failed:', error);
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
  // استخدام event_id من العميل إذا كان موجوداً، وإلا إنشاء واحد جديد
  const eventId = eventData.event_id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
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
    hashedUserData.client_ip_address = clientIP;
  }
  
  if (userAgent) {
    hashedUserData.client_user_agent = userAgent;
  }
  
  if (eventData.fbc) {
    hashedUserData.fbc = eventData.fbc;
  }
  
  if (eventData.fbp) {
    hashedUserData.fbp = eventData.fbp;
  }

  // معرف تسجيل الدخول لفيسبوك (إذا كان متوفراً)
  if (eventData.login_id) {
    hashedUserData.login_id = hashData(eventData.login_id);
  }

  // إعداد البيانات المخصصة
  const customData: any = {};
  
  if (eventData.value !== undefined) {
    // تحويل من الدينار العراقي للدولار الأمريكي إذا كانت العملة IQD
    let convertedValue = eventData.value;
    if (eventData.currency === 'IQD') {
      convertedValue = convertedValue / 1310; // Convert IQD to USD
      console.log('💰 Facebook API: Converting value from IQD to USD:', eventData.value, '->', convertedValue);
    }
    customData.value = convertedValue;
  }
  
  // دائماً إرسال USD لـ Facebook API
  customData.currency = 'USD';
  
  if (eventData.content_ids) {
    customData.content_ids = eventData.content_ids;
  }
  
  if (eventData.content_name) {
    customData.content_name = eventData.content_name;
  }
  
  if (eventData.content_category) {
    customData.content_category = eventData.content_category;
  }
  
  if (eventData.quantity) {
    customData.num_items = eventData.quantity;
  }
  
  if (eventData.transaction_id || eventData.order_number) {
    customData.order_id = eventData.transaction_id || eventData.order_number;
  }

  return {
    event_name: eventType,
    event_time: Math.floor(Date.now() / 1000),
    user_data: hashedUserData,
    custom_data: Object.keys(customData).length > 0 ? customData : undefined,
    event_source_url: eventData.event_source_url,
    action_source: 'website',
    event_id: eventId
  };
}