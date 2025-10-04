import crypto from 'crypto';

// TikTok Events API Configuration
interface TikTokEventPayload {
  pixel_code: string;
  event: string;
  event_id?: string;
  event_time?: number;
  timestamp?: string;
  context?: {
    user_agent?: string;
    ip?: string;
    page?: {
      url?: string;
      referrer?: string;
    };
    user?: {
      external_id?: string;
      email?: string;
      phone_number?: string;
    };
    ad?: {
      callback?: string;
    };
  };
  properties?: {
    content_type?: string;
    content_id?: string;
    content_name?: string;
    content_category?: string;
    currency?: string;
    value?: number;
    quantity?: number;
    price?: number;
    contents?: Array<{
      content_id?: string;
      content_name?: string;
      content_category?: string;
      quantity?: number;
      price?: number;
    }>;
    order_id?: string;
    shop_id?: string;
  };
}

// TikTok Standard Events Mapping
// Reference: https://developers.tiktok.com/doc/events-api
const TIKTOK_EVENT_MAP: Record<string, string> = {
  // Web Events (للحملات على الويب)
  'CompletePayment': 'CompletePayment',
  'Purchase': 'CompletePayment',
  'purchase': 'CompletePayment',
  
  // Pixel Events (للتحسين في TikTok Ads)
  'ON_WEB_ORDER': 'CompletePayment',      // نفس CompletePayment
  'SUCCESSORDER_PAY': 'CompletePayment',  // نفس CompletePayment
  
  // Other Events
  'ViewContent': 'ViewContent',
  'AddToCart': 'AddToCart',
  'InitiateCheckout': 'InitiateCheckout',
  'SubmitForm': 'SubmitForm',
  'ClickButton': 'ClickButton',
};

// Normalize TikTok event name
export function normalizeTikTokEvent(eventName: string): string {
  return TIKTOK_EVENT_MAP[eventName] || eventName;
}

// Hash function for data privacy
function hashData(data: string): string {
  if (!data) return '';
  return crypto.createHash('sha256').update(data.toLowerCase()).digest('hex');
}

// Send event to TikTok Events API
export async function sendTikTokEvent(
  accessToken: string,
  pixelCode: string,
  eventName: string,
  eventData: any
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Normalize event name to TikTok standard
    const normalizedEventName = normalizeTikTokEvent(eventName);
    
    const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare user data (hashed for privacy)
    const user: any = {};
    
    if (eventData.customer_email || eventData.email) {
      user.email = hashData(eventData.customer_email || eventData.email);
    }
    
    if (eventData.customer_phone || eventData.phone_number) {
      // تنظيف رقم الهاتف وتحويله إلى صيغة E.164 العراقية
      let phoneNumber = (eventData.customer_phone || eventData.phone_number).toString().trim();
      
      // إزالة جميع الرموز والمسافات عدا + و الأرقام
      phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      // تحويل الأرقام العراقية إلى صيغة E.164
      if (phoneNumber.startsWith('07')) {
        phoneNumber = '+964' + phoneNumber.substring(1); // 07xxxxxxxx -> +9647xxxxxxxx
      } else if (phoneNumber.startsWith('7')) {
        phoneNumber = '+964' + phoneNumber; // 7xxxxxxxx -> +9647xxxxxxxx
      } else if (phoneNumber.startsWith('9647')) {
        phoneNumber = '+' + phoneNumber; // 9647xxxxxxxx -> +9647xxxxxxxx
      } else if (!phoneNumber.startsWith('+964') && phoneNumber.length >= 10) {
        phoneNumber = '+964' + phoneNumber; // احتياطي
      }
      
      console.log('📞 TikTok API: Phone formatting:', eventData.customer_phone || eventData.phone_number, '->', phoneNumber);
      user.phone_number = hashData(phoneNumber);
    }
    
    if (eventData.external_id) {
      user.external_id = hashData(eventData.external_id);
    }

    // Prepare event properties
    let convertedValue = eventData.value || 0;
    
    // تحويل من الدينار العراقي للدولار الأمريكي إذا كانت العملة IQD
    if (eventData.currency === 'IQD') {
      convertedValue = convertedValue / 1310; // Convert IQD to USD
      console.log('💰 TikTok API: Converting value from IQD to USD:', eventData.value, '->', convertedValue);
    }
    
    const properties: any = {
      content_type: eventData.content_type || 'product',
      currency: 'USD', // دائماً إرسال USD لـ TikTok
      value: convertedValue,
      quantity: eventData.quantity || 1
    };

    if (eventData.content_id) properties.content_id = eventData.content_id;
    if (eventData.content_name) properties.content_name = eventData.content_name;
    if (eventData.content_category) properties.content_category = eventData.content_category;
    if (eventData.order_id || eventData.transaction_id) {
      properties.order_id = eventData.order_id || eventData.transaction_id;
    }

    // Build TikTok payload
    const payload: TikTokEventPayload = {
      pixel_code: pixelCode,
      event: normalizedEventName,  // استخدام الاسم المُطبّع
      event_id: eventId,
      event_time: eventData.timestamp || Math.floor(Date.now() / 1000),
      timestamp: eventData.timestamp || Math.floor(Date.now() / 1000).toString(),
      context: {
        user_agent: eventData.user_agent,
        ip: eventData.ip,
        page: {
          url: eventData.event_source_url,
          referrer: eventData.referrer
        },
        user: Object.keys(user).length > 0 ? user : undefined
      },
      properties: properties
    };

    console.log('🎬 TikTok Events API: Sending event', {
      pixelCode,
      originalEventName: eventName,
      normalizedEventName,
      eventId,
      hasEmail: !!user.email,
      hasPhone: !!user.phone_number,
      value: properties.value
    });

    // Send to TikTok Events API
    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken
      },
      body: JSON.stringify({
        event_source_id: pixelCode,
        event_source: 'web',
        data: [payload]
      })
    });

    const result = await response.json();

    if (response.ok && result.code === 0) {
      console.log('🎬 TikTok Events API: ✅ Success', result);
      return { success: true, data: result };
    } else {
      console.warn('🎬 TikTok Events API: ❌ Error', result);
      return { success: false, error: result.message || 'Unknown error' };
    }

  } catch (error) {
    console.error('🎬 TikTok Events API: ❌ Exception', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Get TikTok pixel configuration by platform ID
export async function getTikTokPixelConfig(platformId: string) {
  try {
    // Import db here to avoid circular dependency
    const { db } = await import('./db');
    const { adPlatformSettings } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    // Query the ad platform settings for this platform
    const [settings] = await db
      .select()
      .from(adPlatformSettings)
      .where(eq(adPlatformSettings.platformId, platformId))
      .limit(1);

    if (settings && settings.tiktokPixelId && settings.tiktokAccessToken) {
      return {
        pixelId: settings.tiktokPixelId,
        accessToken: settings.tiktokAccessToken
      };
    }

    // Fallback to the provided values
    return {
      pixelId: 'D29B0SBC77U5781IQ050',
      accessToken: '30a422a1a758b734543354c17a09d657e97fe9bb'
    };
  } catch (error) {
    console.error('Error getting TikTok config:', error);
    // Fallback to the provided values
    return {
      pixelId: 'D29B0SBC77U5781IQ050',
      accessToken: '30a422a1a758b734543354c17a09d657e97fe9bb'
    };
  }
}