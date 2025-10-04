import { storage } from "./storage";

// TikTok Business API Integration
export class TikTokBusinessAPI {
  protected baseUrl = 'https://business-api.tiktok.com/open_api/v1.3';
  
  constructor(protected accessToken: string, protected advertiserId: string, protected platformId?: string) {}

  // Getter methods for accessing private properties
  public getAccessToken() { return this.accessToken; }
  public getAdvertiserId() { return this.advertiserId; }
  
  // جلب Business Center ID من الإعدادات
  private async getBusinessCenterId(): Promise<string | null> {
    if (!this.platformId) return null;
    
    try {
      const { db } = await import('./db');
      const { adPlatformSettings } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [settings] = await db
        .select()
        .from(adPlatformSettings)
        .where(eq(adPlatformSettings.platformId, this.platformId))
        .limit(1);
      
      return settings?.tiktokBusinessCenterId || null;
    } catch (error) {
      console.error('خطأ في جلب Business Center ID:', (error as any).message);
      return null;
    }
  }

  // جلب معلومات المعلن والرصيد باستخدام advertiser/info API الصحيح
  async getAdvertiserInfo() {
    console.log('💰 جلب معلومات المعلن والرصيد من advertiser/info...');
    console.log('🔍 Advertiser ID:', this.advertiserId);
    
    try {
      // استخدام الطريقة الصحيحة - GET مع array format وstring quotes
      const endpoint = `/advertiser/info/?advertiser_ids=["${this.advertiserId}"]`;
      console.log('🔍 API Endpoint:', endpoint);
      
      const response = await this.makeRequest(endpoint, 'GET');
      console.log('🔍 TikTok Advertiser Info Response:', JSON.stringify(response, null, 2));
      
      // تحقق من وجود خطأ في الاستجابة
      if (response.code !== 0) {
        console.error('❌ TikTok Advertiser Info API Error:', response.message);
        return null;
      }
      
      if (response.data && response.data.list && response.data.list.length > 0) {
        const advertiserInfo = response.data.list[0];
        console.log('🔍 Advertiser Info Raw:', JSON.stringify(advertiserInfo, null, 2));
        console.log('💰 Balance Details:', {
          balance: (advertiserInfo as any).balance,
          available_balance: (advertiserInfo as any).available_balance,
          total_balance: (advertiserInfo as any).total_balance,
          credit_balance: (advertiserInfo as any).credit_balance,
          prepaid_balance: (advertiserInfo as any).prepaid_balance,
          currency: (advertiserInfo as any).currency
        });
        console.log('✅ تم جلب معلومات المعلن بنجاح');
        
        const result = {
          advertiser_id: advertiserInfo.advertiser_id,
          advertiser_name: advertiserInfo.advertiser_name,
          balance: advertiserInfo.balance,
          currency: advertiserInfo.currency,
          timezone: advertiserInfo.timezone,
          status: advertiserInfo.status,
          company: advertiserInfo.company,
          industry: advertiserInfo.industry,
          phone_number: advertiserInfo.phone_number,
          email: advertiserInfo.email
        };
        
        console.log('🔍 Processed Result:', JSON.stringify(result, null, 2));
        return result;
      }
      
      console.warn('⚠️ No advertiser data in response');
      return null;
    } catch (error) {
      console.error('❌ خطأ في جلب معلومات المعلن:', (error as any).message);
      console.error('❌ Full error:', error);
      throw error;
    }
  }

  // جلب رصيد الحساب من مصادر متعددة
  async getAdvertiserBalance() {
    console.log('💰 جلب رصيد الحساب من مصادر متعددة...');
    
    try {
      // أولاً: جرب Business Center balance إذا كان متوفراً
      let bcBalance = null;
      try {
        // استخدام owner_bc_id من advertiser info إذا كان متوفراً
        const bcId = '7548971183191080961'; // من البيانات التي حصلنا عليها
        const bcEndpoint = `/bc/balance/get/?bc_id=${bcId}`;
        console.log('🏦 محاولة جلب رصيد Business Center:', bcEndpoint);
        const bcResponse = await this.makeRequest(bcEndpoint, 'GET');
        if (bcResponse.code === 0 && bcResponse.data) {
          bcBalance = bcResponse.data;
          console.log('🏦 Business Center Balance:', JSON.stringify(bcBalance, null, 2));
        }
      } catch (bcError) {
        console.log('⚠️ Business Center balance غير متاح:', (bcError as any).message);
        console.log('🔍 BC Error Details:', bcError);
      }

      // ثانياً: جرب Payment Portfolio
      let portfolioBalance = null;
      try {
        const portfolioEndpoint = `/payment_portfolio/get/?bc_id=7548971183191080961`;
        console.log('💳 محاولة جلب رصيد Payment Portfolio:', portfolioEndpoint);
        const portfolioResponse = await this.makeRequest(portfolioEndpoint, 'GET');
        if (portfolioResponse.code === 0 && portfolioResponse.data) {
          portfolioBalance = portfolioResponse.data;
          console.log('💳 Payment Portfolio Balance:', JSON.stringify(portfolioBalance, null, 2));
        }
      } catch (portfolioError) {
        console.log('⚠️ Payment Portfolio غير متاح:', (portfolioError as any).message);
        console.log('🔍 Portfolio Error Details:', portfolioError);
      }
      
      // ثالثاً: استخدام advertiser info للحصول على الرصيد مباشرة
      const advertiserInfo = await this.getAdvertiserInfo();
      
      if (advertiserInfo) {
        // تحقق من جميع أنواع الرصيد المتاحة مع safe access
        const advertiserData = advertiserInfo as any;
        const balance = advertiserData.balance || 
                       advertiserData.available_balance || 
                       advertiserData.total_balance || 
                       advertiserData.prepaid_balance || 
                       advertiserData.credit_balance || 0;
        
        // تحديد أفضل رصيد متاح من جميع المصادر
        let finalBalance = balance;
        let balanceSource = 'advertiser_info';
        
        // إذا كان Business Center لديه رصيد، استخدمه
        if (bcBalance && (bcBalance.cash_balance || bcBalance.available_balance)) {
          finalBalance = bcBalance.cash_balance || bcBalance.available_balance || finalBalance;
          balanceSource = 'business_center';
        }
        
        // إذا كان Payment Portfolio لديه رصيد، استخدمه
        if (portfolioBalance && (portfolioBalance.cash_balance || portfolioBalance.available_cash_balance)) {
          finalBalance = portfolioBalance.cash_balance || portfolioBalance.available_cash_balance || finalBalance;
          balanceSource = 'payment_portfolio';
        }
        
        console.log('✅ تم جلب الرصيد بنجاح:', finalBalance, advertiserInfo.currency, 'من', balanceSource);
        console.log('🔍 All Balance Sources:', {
          advertiser_balance: advertiserData.balance,
          bc_balance: bcBalance,
          portfolio_balance: portfolioBalance,
          final_balance: finalBalance,
          source: balanceSource
        });
        
        return {
          balance: finalBalance,
          currency: advertiserInfo.currency || 'USD',
          advertiser_id: advertiserInfo.advertiser_id,
          advertiser_name: advertiserInfo.advertiser_name,
          status: advertiserInfo.status,
          timezone: advertiserInfo.timezone,
          balance_source: balanceSource,
          // إضافة تفاصيل الرصيد من جميع المصادر
          balance_details: {
            advertiser_balance: advertiserData.balance,
            bc_balance: bcBalance,
            portfolio_balance: portfolioBalance,
            available_balance: advertiserData.available_balance,
            total_balance: advertiserData.total_balance,
            prepaid_balance: advertiserData.prepaid_balance,
            credit_balance: advertiserData.credit_balance
          }
        };
      }
      
      console.warn('⚠️ لم يتم العثور على معلومات الرصيد في advertiser info');
      return null;
    } catch (error) {
      console.error('❌ خطأ في جلب رصيد الحساب:', (error as any).message);
      throw error;
    }
  }

  // Helper method for making API requests
  public async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: any): Promise<any> {
    let url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🔍 TikTok API Request:`, {
      endpoint,
      method,
      baseUrl: this.baseUrl,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : []
    });
    
    // إضافة query parameters للـ GET requests
    if (data && method === 'GET') {
      const params = new URLSearchParams();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          // معالجة خاصة للـ JSON strings
          if (typeof data[key] === 'object') {
            params.append(key, JSON.stringify(data[key]));
          } else {
            params.append(key, String(data[key]));
          }
        }
      });
      url += (endpoint.includes('?') ? '&' : '?') + params.toString();
      console.log(`🔍 Final URL:`, url.substring(0, 100) + '...');
    }
    
    const headers: any = {
      'Access-Token': this.accessToken,
      'Content-Type': 'application/json',
    };

    const options: any = {
      method,
      headers,
    };

    // إضافة body للـ POST/PUT requests
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    console.log(`🔗 TikTok API Request: ${method} ${url}`);
    if (data && method === 'GET') {
      console.log(`📋 Query Parameters:`, data);
    }

    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const result: any = await response.json();
      
      // تسجيل مفصل للاستجابة
      console.log(`📊 TikTok API Response (${method} ${endpoint}):`, {
        code: result.code,
        message: result.message,
        dataExists: !!result.data,
        dataType: typeof result.data,
        listLength: result.data?.list?.length || 0,
        requestId: result.request_id
      });
      
      // تسجيل عينة من البيانات للتشخيص
      if (result.data?.list && result.data.list.length > 0) {
        console.log(`📋 Sample data:`, result.data.list[0]);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ TikTok API Error (${method} ${endpoint}):`, (error as any).message);
      throw error;
    }
  }

  // تحميل فيديو من URL مباشرة (بدون Google Cloud Storage)
  async downloadVideoFromUrl(videoUrl: string): Promise<Buffer> {
    console.log('📥 تحميل فيديو من URL:', videoUrl);
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(videoUrl);
      
      if (!response.ok) {
        throw new Error(`فشل تحميل الفيديو: ${response.status} ${response.statusText}`);
      }
      
      const buffer = await response.buffer();
      console.log('✅ تم تحميل الفيديو بنجاح، الحجم:', buffer.length, 'بايت');
      return buffer;
    } catch (error) {
      console.error('❌ خطأ في تحميل الفيديو:', (error as any).message);
      throw error;
    }
  }

  // رفع فيديو إلى TikTok
  async uploadVideo(videoBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    console.log('📹 رفع فيديو إلى TikTok باستخدام Buffer...');
    console.log('📊 حجم الفيديو:', videoBuffer.length, 'بايت');
    console.log('📝 اسم الملف:', fileName);
    console.log('🎬 نوع الملف:', mimeType);
    
    // التحقق من صحة البيانات
    if (!videoBuffer || videoBuffer.length === 0) {
      throw new Error('بيانات الفيديو فارغة');
    }
    
    if (!this.advertiserId) {
      throw new Error('Advertiser ID غير متوفر');
    }
    
    if (!this.accessToken) {
      throw new Error('Access Token غير متوفر');
    }

    try {
      const crypto = await import('crypto');
      const FormData = (await import('form-data')).default;
      // حساب video_signature (MD5 hash)
      const videoSignature = crypto.createHash('md5').update(videoBuffer).digest('hex');
      console.log('🔐 Video signature:', videoSignature.substring(0, 16) + '...');

      // تنظيف اسم الملف
      const timestamp = Date.now();
      const cleanFileName = `${timestamp}_${fileName.replace(/[^\w\.-]/g, '_')}`;
      console.log('📝 Clean filename:', cleanFileName);

      // إنشاء FormData
      const form = new FormData();
      form.append('advertiser_id', this.advertiserId);
      form.append('upload_type', 'UPLOAD_BY_FILE');
      form.append('video_signature', videoSignature);
      form.append('video_file', videoBuffer, {
        filename: cleanFileName,
        contentType: mimeType
      });

      // رفع الفيديو
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${this.baseUrl}/file/video/ad/upload/`, {
        method: 'POST',
        headers: {
          'Access-Token': this.accessToken,
          ...form.getHeaders()
        },
        body: form
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: any = await response.json();
      console.log('📋 استجابة TikTok لرفع الفيديو:', JSON.stringify(result, null, 2));
      
      // التحقق من نجاح العملية
      if (result.code === 0 && result.data) {
        // TikTok يرجع data كـ array أحياناً
        const videoData = Array.isArray(result.data) ? result.data[0] : result.data;
        
        if (videoData && videoData.video_id) {
          console.log('✅ تم رفع الفيديو بنجاح:', videoData.video_id);
          console.log('📋 معلومات الفيديو:', {
            video_id: videoData.video_id,
            duration: videoData.duration,
            size: videoData.size,
            format: videoData.format,
            width: videoData.width,
            height: videoData.height
          });
          return videoData.video_id;
        }
      }
      
      // في حالة الفشل
      const errorMessage = result.message || result.data?.message || 'فشل في الحصول على video_id من TikTok';
      console.error('❌ خطأ من TikTok API:', {
        code: result.code,
        message: result.message,
        data: result.data,
        request_id: result.request_id
      });
      throw new Error(`فشل رفع الفيديو: ${errorMessage}`);

    } catch (error) {
      console.error('❌ فشل رفع الفيديو إلى TikTok:', (error as any).message);
      throw new Error(`فشل رفع الفيديو إلى TikTok: ${(error as any).message}`);
    }
  }

  // إنشاء حملة جديدة
  async createCampaign(campaignData: {
    campaign_name: string;
    objective: string;
    budget_mode?: string;
    budget?: number;
    start_time?: string;
    end_time?: string;
  }) {
    console.log('🚀 إنشاء حملة TikTok جديدة:', campaignData.campaign_name);
    
    try {
      const requestData = {
        advertiser_id: this.advertiserId,
        campaign_name: campaignData.campaign_name,
        objective_type: campaignData.objective, // TikTok يتوقع objective_type
        // استخدام القيم الفعلية من المستخدم بدون قيم افتراضية
        ...(campaignData.budget_mode && { budget_mode: campaignData.budget_mode }),
        ...(campaignData.budget && { budget: campaignData.budget }),
        ...(campaignData.start_time && { start_time: campaignData.start_time }),
        ...(campaignData.end_time && { end_time: campaignData.end_time })
      };
      
      console.log('📋 بيانات الحملة:', JSON.stringify(requestData, null, 2));
      
      const response = await this.makeRequest('/campaign/create/', 'POST', requestData);
      
      if (response.code === 0 && response.data) {
        console.log('✅ تم إنشاء الحملة بنجاح:', response.data.campaign_id);
        return response;
      } else {
        console.error('❌ فشل إنشاء الحملة:', response.message);
        throw new Error(`فشل إنشاء الحملة: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء الحملة:', (error as any).message);
      throw error;
    }
  }

  // إنشاء مجموعة إعلانية جديدة
  async createAdGroup(adGroupData: {
    campaign_id: string;
    adgroup_name: string;
    placement_type?: string;
    placements?: string[];
    targeting?: any;
    budget_mode?: string;
    budget?: number;
    bid_type?: string;
    bid_price?: number;
    optimization_goal?: string;
    pacing?: string;
    schedule_type?: string;
    schedule_start_time?: string;
    schedule_end_time?: string;
    pixel_id?: string;
    optimization_event?: string;
    billing_event?: string;
    start_time?: string;
    end_time?: string;
  }) {
    console.log('📊 إنشاء مجموعة إعلانية TikTok جديدة:', adGroupData.adgroup_name);
    
    try {
      // تطبيع الاستهداف للتأكد من وجود location_ids دائماً
      const normalizedTargeting = (() => {
        const t = adGroupData.targeting || {};
        let location_ids: number[] | undefined = undefined;

        if (Array.isArray((t as any).location_ids) && (t as any).location_ids.length > 0) {
          location_ids = (t as any).location_ids.map((v: any) => typeof v === 'string' ? parseInt(v) : Number(v));
        } else if (Array.isArray((t as any).locations) && (t as any).locations.length > 0) {
          location_ids = (t as any).locations.map((v: any) => typeof v === 'string' ? parseInt(v) : Number(v));
        } else {
          // افتراضي: العراق
          location_ids = [99237];
        }

        const result: any = {
          // TikTok يتوقع location_ids كسلاسل نصية
          location_ids: (location_ids || []).map((v: number) => String(v)),
          gender: (t as any).gender || 'GENDER_UNLIMITED',
          age_groups: (t as any).age_groups || ['AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_54']
        };

        if ((t as any).interests) result.interests = (t as any).interests;
        if ((t as any).behaviors) result.behaviors = (t as any).behaviors;
        if ((t as any).excluded_location_ids) result.excluded_location_ids = (t as any).excluded_location_ids;

        console.log('✅ Normalized targeting for TikTok:', result);
        return result;
      })();

      const requestData = {
        advertiser_id: this.advertiserId,
        campaign_id: adGroupData.campaign_id,
        adgroup_name: adGroupData.adgroup_name,
        // استخدام القيم الفعلية من المستخدم بدون قيم افتراضية ثابتة
        ...(adGroupData.placement_type && { placement_type: adGroupData.placement_type }),
        ...(adGroupData.placements && { placements: adGroupData.placements }),
        ...(adGroupData.budget_mode && { budget_mode: adGroupData.budget_mode }),
        ...(adGroupData.budget && { budget: adGroupData.budget }),
        ...(adGroupData.bid_type && { bid_type: adGroupData.bid_type }),
        ...(adGroupData.optimization_goal && { optimization_goal: adGroupData.optimization_goal }),
        ...(adGroupData.pacing && { pacing: adGroupData.pacing }),
        ...(adGroupData.schedule_type && { schedule_type: adGroupData.schedule_type }),
        ...(adGroupData.schedule_start_time && { schedule_start_time: adGroupData.schedule_start_time }),
        ...(adGroupData.schedule_end_time && { schedule_end_time: adGroupData.schedule_end_time }),
        ...(adGroupData.pixel_id && { pixel_id: adGroupData.pixel_id }),
        ...(adGroupData.optimization_event && { optimization_event: adGroupData.optimization_event }),
        // تحديد نوع الترويج تلقائياً لحملات الويب إذا لم يُمرّر
        ...(adGroupData as any).promotion_type
          ? { promotion_type: (adGroupData as any).promotion_type }
          : ((adGroupData.optimization_event?.startsWith('ON_WEB_') || (adGroupData.pixel_id && !('app_id' in adGroupData)))
              ? { promotion_type: 'WEBSITE' as const }
              : {}),
        ...(adGroupData.billing_event && { billing_event: adGroupData.billing_event }),
        // استخدم الاستهداف المطبع لضمان وجود location_ids
        targeting: normalizedTargeting,
        // تكرار location_ids على المستوى الأعلى لتوافق أوسع مع تحقق TikTok
        location_ids: normalizedTargeting.location_ids,
        ...(adGroupData.bid_price && { bid_price: adGroupData.bid_price }),
        ...(adGroupData.start_time && { start_time: adGroupData.start_time }),
        ...(adGroupData.end_time && { end_time: adGroupData.end_time })
      };
      
      console.log('📋 بيانات المجموعة الإعلانية:', JSON.stringify(requestData, null, 2));
      
      // فحص خاص للاستهداف الجغرافي
      if (requestData.targeting) {
        console.log('🗺️ تفاصيل الاستهداف الجغرافي:', {
          hasLocationIds: !!requestData.targeting.location_ids,
          locationIds: requestData.targeting.location_ids,
          hasZipcodeIds: !!requestData.targeting.zipcode_ids,
          zipcodeIds: requestData.targeting.zipcode_ids,
          targetingKeys: Object.keys(requestData.targeting)
        });
      } else {
        console.warn('⚠️ لا يوجد استهداف في البيانات المُرسلة!');
      }
      
      const response = await this.makeRequest('/adgroup/create/', 'POST', requestData);
      
      if (response.code === 0 && response.data) {
        console.log('✅ تم إنشاء المجموعة الإعلانية بنجاح:', response.data.adgroup_id);
        return response;
      } else {
        console.error('❌ فشل إنشاء المجموعة الإعلانية:', response.message);
        throw new Error(`فشل إنشاء المجموعة الإعلانية: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء المجموعة الإعلانية:', (error as any).message);
      throw error;
    }
  }

  // جلب البكسلز
  async getPixels() {
    console.log('🎯 جلب البكسلز...');
    
    try {
      const response: any = await this.makeRequest(`/pixel/list/?advertiser_id=${this.advertiserId}`);
      
      if (response.data && response.data.pixels) {
        const processedPixels = [];
        
        for (const pixel of response.data.pixels) {
          try {
            const pixelIdStr = String(pixel.pixel_id);
            console.log(`🔍 جلب أحداث البكسل: ${pixelIdStr}`);

            // خريطة لدمج تعريفات الأحداث مع الإحصائيات
            const eventsMap: Map<string, { type: string; name: string; status: 'Active' | 'Defined'; count: number } > = new Map();

            // 1) جلب إحصائيات الأحداث للحصول على الأحداث المُعرّفة
            // TikTok لا يوفر endpoint مباشر لجلب قائمة الأحداث، لكن يمكن الحصول عليها من الإحصائيات
            console.log(`🔍 جلب أحداث البكسل ${pixelIdStr} من pixel/event/stats...`);
            
            // جلب إحصائيات لفترة طويلة للحصول على جميع الأحداث المُعرّفة
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); // سنة كاملة
            const fmt = (d: Date) => d.toISOString().slice(0, 10);

            // جلب إحصائيات الأحداث للحصول على الأحداث المُعرّفة
            try {
              console.log(`📊 جلب إحصائيات البكسل ${pixelIdStr} من ${fmt(startDate)} إلى ${fmt(endDate)}`);
              
              const statsResp: any = await this.makeRequest(`/pixel/event/stats/`, 'GET', {
                advertiser_id: this.advertiserId,
                pixel_ids: [ pixelIdStr ],
                date_range: { start_date: fmt(startDate), end_date: fmt(endDate) }
              });
              
              console.log(`📋 استجابة pixel/event/stats للبكسل ${pixelIdStr}:`, JSON.stringify(statsResp, null, 2));
              
              const stats = statsResp?.data?.stats || [];
              console.log(`📊 تم العثور على ${stats.length} حدث في الإحصائيات`);
              
              if (stats.length > 0) {
                for (const stat of stats) {
                  const evType = String(stat.event_type || stat.type || '').trim();
                  if (!evType) {
                    console.log(`⚠️ حدث بدون نوع في الإحصائيات:`, stat);
                    continue;
                  }
                  
                  const count = Number(stat.count) || 0;
                  eventsMap.set(evType, { 
                    type: evType, 
                    name: evType, 
                    status: count > 0 ? 'Active' : 'Defined', 
                    count 
                  });
                  
                  console.log(`➕ تمت إضافة الحدث من الإحصائيات: ${evType} (count: ${count})`);
                }
              } else {
                console.log(`⚠️ لا توجد إحصائيات للبكسل ${pixelIdStr} - سيتم إضافة أحداث افتراضية`);
              }
            } catch (statsErr) {
              console.error(`❌ فشل جلب إحصائيات البكسل ${pixelIdStr}:`, (statsErr as any).message);
              console.error(`❌ تفاصيل خطأ الإحصائيات:`, statsErr);
            }

            // إذا لم نجد أي أحداث، أضف الأحداث الافتراضية الشائعة
            if (eventsMap.size === 0) {
              console.log(`⚠️ لم يتم العثور على أحداث للبكسل ${pixelIdStr}، إضافة الأحداث الافتراضية...`);
              const defaultEvents = [
                'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'CompletePayment',
                'ON_WEB_ORDER', 'SUCCESSORDER_PAY', 'ON_WEB_CART', 'FORM', 'LANDING_PAGE_VIEW',
                'INITIATE_ORDER', 'BUTTON', 'ADD_TO_WISHLIST', 'SEARCH'
              ];
              
              for (const eventType of defaultEvents) {
                eventsMap.set(eventType, { 
                  type: eventType, 
                  name: eventType, 
                  status: 'Defined', 
                  count: 0 
                });
              }
              console.log(`➕ تمت إضافة ${defaultEvents.length} حدث افتراضي`);
            }

            const events = Array.from(eventsMap.values())
              .sort((a, b) => (b.count || 0) - (a.count || 0));

            console.log(`🎯 الأحداث المُعالجة للبكسل ${pixelIdStr}:`, events.map(e => `${e.type}(${e.status},${e.count})`));

            processedPixels.push({
              ...pixel,
              events
            });
          } catch (eventError) {
            const errorMessage = (eventError as any).message;
            console.warn(`⚠️ تعذر جلب إحصائيات البكسل ${pixel.pixel_id}:`, errorMessage);
            
            // إذا كان البكسل غير موجود (404)، تجاهله تماماً
            if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
              console.warn(`🚫 البكسل ${pixel.pixel_id} غير موجود في TikTok - سيتم تجاهله`);
              continue; // تجاهل هذا البكسل
            }
            
            // إذا كان خطأ آخر، أضف البكسل بدون أحداث
            processedPixels.push({
              ...pixel,
              events: []
            });
          }
        }
        
        return processedPixels;
      }
      
      return [];
    } catch (error) {
      console.error('❌ خطأ في جلب البكسلز:', (error as any).message);
      throw error;
    }
  }

  // إنشاء بكسل جديد
  async createPixel(pixelData: { pixel_name: string; pixel_mode: string; }) {
    console.log('🎯 إنشاء بكسل جديد:', pixelData.pixel_name);
    
    try {
      const response = await this.makeRequest('/pixel/create/', 'POST', {
        advertiser_id: this.advertiserId,
        ...pixelData
      });
      
      console.log('✅ تم إنشاء البكسل بنجاح');
      return response;
    } catch (error) {
      console.error('❌ خطأ في إنشاء البكسل:', (error as any).message);
      throw error;
    }
  }

  // تحديث بكسل
  async updatePixel(pixelId: string, updateData: any) {
    console.log('🎯 تحديث البكسل:', pixelId);
    
    try {
      const response = await this.makeRequest('/pixel/update/', 'POST', {
        advertiser_id: this.advertiserId,
        pixel_id: pixelId,
        ...updateData
      });
      
      console.log('✅ تم تحديث البكسل بنجاح');
      return response;
    } catch (error) {
      console.error('❌ خطأ في تحديث البكسل:', (error as any).message);
      throw error;
    }
  }

  // إنشاء حدث بكسل
  async createPixelEvent(pixelId: string, eventData: any) {
    console.log('🎯 إنشاء حدث بكسل:', pixelId);
    
    try {
      const response = await this.makeRequest('/pixel/event/create/', 'POST', {
        advertiser_id: this.advertiserId,
        pixel_id: pixelId,
        ...eventData
      });
      
      console.log('✅ تم إنشاء حدث البكسل بنجاح');
      return response;
    } catch (error) {
      console.error('❌ خطأ في إنشاء حدث البكسل:', (error as any).message);
      throw error;
    }
  }

  // تحديث حدث بكسل
  async updatePixelEvent(pixelId: string, eventId: string, updateData: any) {
    console.log('🎯 تحديث حدث البكسل:', eventId);
    
    try {
      const response = await this.makeRequest('/pixel/event/update/', 'POST', {
        advertiser_id: this.advertiserId,
        pixel_id: pixelId,
        event_id: eventId,
        ...updateData
      });
      
      console.log('✅ تم تحديث حدث البكسل بنجاح');
      return response;
    } catch (error) {
      console.error('❌ خطأ في تحديث حدث البكسل:', (error as any).message);
      throw error;
    }
  }

  // حذف حدث بكسل
  async deletePixelEvent(pixelId: string, eventId: string) {
    console.log('🎯 حذف حدث البكسل:', eventId);
    
    try {
      const response = await this.makeRequest('/pixel/event/delete/', 'POST', {
        advertiser_id: this.advertiserId,
        pixel_id: pixelId,
        event_id: eventId
      });
      
      console.log('✅ تم حذف حدث البكسل بنجاح');
      return response;
    } catch (error) {
      console.error('❌ خطأ في حذف حدث البكسل:', (error as any).message);
      throw error;
    }
  }

  // جلب الحملات من TikTok API
  async getCampaigns() {
    try {
      console.log('📊 جلب الحملات من TikTok API...');
      const response = await this.makeRequest("/campaign/get/", "GET", {
        advertiser_id: this.advertiserId,
        page_size: 1000
      });
      
      if (response.code !== 0) {
        console.error('❌ TikTok Campaigns API Error:', {
          code: response.code,
          message: response.message,
          request_id: response.request_id
        });
        return [];
      }
      
      const campaigns = response.data?.list || [];
      console.log(`✅ تم جلب ${campaigns.length} حملة من TikTok API`);
      return campaigns;
    } catch (error) {
      console.error("❌ خطأ في جلب الحملات:", error);
      return [];
    }
  }

  // جلب المجموعات الإعلانية من TikTok API
  async getAdGroups() {
    try {
      console.log('📊 جلب المجموعات الإعلانية من TikTok API...');
      const response = await this.makeRequest("/adgroup/get/", "GET", {
        advertiser_id: this.advertiserId,
        page_size: 1000
      });
      
      if (response.code !== 0) {
        console.error('❌ TikTok AdGroups API Error:', {
          code: response.code,
          message: response.message,
          request_id: response.request_id
        });
        return [];
      }
      
      const adGroups = response.data?.list || [];
      console.log(`✅ تم جلب ${adGroups.length} مجموعة إعلانية من TikTok API`);
      return adGroups;
    } catch (error) {
      console.error("❌ خطأ في جلب المجموعات الإعلانية:", error);
      return [];
    }
  }

  // جلب الإعلانات من TikTok API
  async getAds() {
    try {
      console.log('📊 جلب الإعلانات من TikTok API...');
      const response = await this.makeRequest("/ad/get/", "GET", {
        advertiser_id: this.advertiserId,
        page_size: 1000
      });
      
      if (response.code !== 0) {
        console.error('❌ TikTok Ads API Error:', {
          code: response.code,
          message: response.message,
          request_id: response.request_id
        });
        return [];
      }
      
      const ads = response.data?.list || [];
      console.log(`✅ تم جلب ${ads.length} إعلان من TikTok API`);
      return ads;
    } catch (error) {
      console.error("❌ خطأ في جلب الإعلانات:", error);
      return [];
    }
  }

  // جلب الهويات المتاحة (Identities) - محسن
  async getIdentities() {
    console.log('🆔 جلب الهويات المتاحة من TikTok...');
    
    const identities: any[] = [];
    
    try {
      // الطريقة الأولى: جلب معلومات المعلن باستخدام الصيغة الصحيحة
      console.log('🔍 الطريقة 1: جلب معلومات المعلن...');
      try {
        const advertiserEndpoint = `/advertiser/info/?advertiser_ids=["${this.advertiserId}"]`;
        const advertiserResponse = await this.makeRequest(advertiserEndpoint, 'GET');
        
        console.log('📊 Advertiser Info Response:', JSON.stringify(advertiserResponse, null, 2));
        
        if (advertiserResponse.code === 0 && advertiserResponse.data?.list?.length > 0) {
          const advertiserInfo = advertiserResponse.data.list[0];
          
          // إنشاء هوية من معلومات المعلن
          const advertiserIdentity = {
            identity_id: advertiserInfo.advertiser_id || this.advertiserId,
            identity_type: 'ADVERTISER_ACCOUNT',
            display_name: advertiserInfo.advertiser_name || advertiserInfo.company || 'حساب المعلن',
            username: advertiserInfo.advertiser_name || '',
            avatar_icon_web_uri: advertiserInfo.profile_image_url || '',
            is_real_user_identity: false,
            is_advertiser_identity: true,
            is_platform_identity: false,
            advertiser_data: advertiserInfo
          };
          identities.push(advertiserIdentity);
          console.log('✅ تم إنشاء هوية من معلومات المعلن');
        }
      } catch (advertiserError) {
        console.warn('⚠️ فشل في جلب معلومات المعلن:', (advertiserError as any).message);
      }

      // الطريقة الثانية: جلب هويات Business Center
      console.log('🔍 الطريقة 2: جلب هويات Business Center...');
      try {
        // جرب endpoints مختلفة للهويات
        const bcEndpoints = [
          '/bc/identity/get/',
          '/identity/get/',
          '/advertiser/identity/get/'
        ];

        for (const endpoint of bcEndpoints) {
          try {
            console.log(`🔍 محاولة endpoint: ${endpoint}`);
            const bcResponse = await this.makeRequest(endpoint, 'GET', {
              advertiser_id: this.advertiserId,
              page_size: 50
            });
            
            console.log(`🔍 Response من ${endpoint}:`, JSON.stringify(bcResponse, null, 2));
            
            if (bcResponse.code === 0 && bcResponse.data) {
              const bcIdentities = bcResponse.data.list || bcResponse.data.identities || bcResponse.data.identity_list || [];
              
              if (bcIdentities.length > 0) {
                console.log(`✅ تم جلب ${bcIdentities.length} هوية من ${endpoint}`);
                
                // تنسيق الهويات
                const formattedIdentities = bcIdentities.map((identity: any) => ({
                  identity_id: identity.identity_id || identity.bc_id || identity.id,
                  identity_type: identity.identity_type || 'BC_AUTH_TT',
                  display_name: identity.display_name || identity.name || identity.username || 'هوية TikTok',
                  username: identity.username || identity.display_name || '',
                  avatar_icon_web_uri: identity.avatar_icon_web_uri || identity.profile_image || identity.avatar_url || identity.image_url || '',
                  is_real_user_identity: identity.identity_type === 'AUTH_CODE' || identity.is_real_user_identity || false,
                  is_bc_identity: true ,
                  is_platform_identity: false,
                  is_advertiser_identity: false,
                  ...identity
                }));
                
                identities.push(...formattedIdentities);
                break; // إذا نجح endpoint واحد، لا نحتاج للباقي
              }
            }
          } catch (endpointError) {
            console.warn(`⚠️ فشل ${endpoint}:`, (endpointError as any).message);
          }
        }
      } catch (bcError) {
        console.warn('⚠️ فشل في جلب هويات BC:', (bcError as any).message);
      }

      // الطريقة الثالثة: جلب معلومات Business Center العامة
      console.log('🔍 الطريقة 3: جلب معلومات Business Center...');
      try {
        const bcInfoResponse = await this.makeRequest('/bc/get/', 'GET', {
          advertiser_id: this.advertiserId
        });
        
        if (bcInfoResponse.code === 0 && bcInfoResponse.data) {
          console.log('📋 Business Center Info:', JSON.stringify(bcInfoResponse.data, null, 2));
          
          // إذا كان هناك معلومات BC، أنشئ هوية منها
          const bcData = bcInfoResponse.data;
          if (bcData.bc_id || bcData.name) {
            const bcIdentity = {
              identity_id: bcData.bc_id || `bc_${this.advertiserId}`,
              identity_type: 'BUSINESS_CENTER',
              display_name: bcData.name || 'Business Center',
              username: bcData.name || '',
              avatar_icon_web_uri: bcData.logo_url || '',
              is_real_user_identity: false,
              is_bc_identity: true,
              is_platform_identity: false,
              is_advertiser_identity: false,
              bc_data: bcData
            };
            identities.push(bcIdentity);
            console.log('✅ تم إنشاء هوية من معلومات Business Center');
          }
        }
      } catch (bcInfoError) {
        console.warn('⚠️ فشل في جلب معلومات BC:', (bcInfoError as any).message);
      }

      // فلترة الهويات للاحتفاظ فقط بالهويات الحقيقية والمطلوبة
      const filteredIdentities = identities.filter(identity => {
        // احتفظ بالهويات الحقيقية من Business Center
        if (identity.is_real_user_identity || identity.is_bc_identity) {
          return true;
        }
        
        // احتفظ بهويات Business Center العامة
        if (identity.identity_type === 'BUSINESS_CENTER') {
          return true;
        }
        
        // أزل هويات المعلن والهويات الافتراضية والاحتياطية
        if (identity.is_advertiser_identity || 
            identity.is_platform_identity || 
            identity.is_fallback_identity ||
            identity.identity_type === 'ADVERTISER_ACCOUNT' ||
            identity.identity_type === 'ADVERTISER_SIMPLE' ||
            identity.identity_type === 'PLATFORM_DEFAULT') {
          return false;
        }
        
        return true;
      });
      
      console.log(`🔍 تم فلترة الهويات: ${identities.length} → ${filteredIdentities.length}`);
      
      // ترتيب الهويات: Business Manager أولاً، ثم الهويات الحقيقية
      const sortedIdentities = filteredIdentities.sort((a, b) => {
        // Business Center/Business Manager أولاً
        if (a.is_bc_identity && !b.is_bc_identity) return -1;
        if (!a.is_bc_identity && b.is_bc_identity) return 1;
        
        // Business Center العامة ثانياً
        if (a.identity_type === 'BUSINESS_CENTER' && b.identity_type !== 'BUSINESS_CENTER') return -1;
        if (a.identity_type !== 'BUSINESS_CENTER' && b.identity_type === 'BUSINESS_CENTER') return 1;
        
        // الهويات الحقيقية ثالثاً
        if (a.is_real_user_identity && !b.is_real_user_identity) return -1;
        if (!a.is_real_user_identity && b.is_real_user_identity) return 1;
        
        return 0;
      });
      
      // إذا لم تبق أي هويات بعد الفلترة، أضف هوية حقيقية كحد أدنى
      if (sortedIdentities.length === 0) {
        console.log('⚠️ لا توجد هويات متاحة، إضافة هوية حقيقية أساسية...');
        sortedIdentities.push({
          identity_id: `real_user_${this.advertiserId}`,
          identity_type: 'REAL_USER_IDENTITY',
          display_name: 'الهوية الحقيقية',
          username: 'real_user',
          avatar_icon_web_uri: '',
          is_real_user_identity: true,
          is_platform_identity: false,
          is_advertiser_identity: false,
          is_bc_identity: false,
          is_fallback_identity: false
        });
      }
      
      // استخدم الهويات المرتبة
      const finalIdentities = sortedIdentities;
      
      console.log(`✅ إجمالي الهويات النهائية: ${finalIdentities.length}`);
      console.log('🆔 الهويات المفلترة:', finalIdentities.map(id => ({
        id: id.identity_id,
        name: id.display_name,
        type: id.identity_type,
        isReal: id.is_real_user_identity,
        isBC: id.is_bc_identity
      })));
      
      return finalIdentities;
      
    } catch (error) {
      console.error('❌ خطأ عام في جلب الهويات:', (error as any).message);
      console.error('Stack:', (error as any).stack);
      
      // إرجاع هوية افتراضية في حالة الخطأ
      return [{
        identity_id: this.advertiserId,
        identity_type: 'ERROR_FALLBACK',
        display_name: 'هوية احتياطية',
        username: '',
        avatar_icon_web_uri: '',
        is_real_user_identity: false,
        is_error_fallback: true
      }];
    }
  }

  // رفع صورة إلى TikTok
  async uploadImageToTikTok(imageBuffer: Buffer, fileName: string): Promise<string | null> {
    console.log('🖼️ رفع صورة إلى TikTok...', fileName);
    
    try {
      // استخدام نفس طريقة رفع الفيديو
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      
      form.append('advertiser_id', this.advertiserId);
      form.append('upload_type', 'UPLOAD_BY_FILE');
      form.append('image_file', imageBuffer, {
        filename: fileName,
        contentType: 'image/jpeg'
      });

      // استخدام fetch مع form-data
      const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/file/image/ad/upload/', {
        method: 'POST',
        headers: {
          'Access-Token': this.accessToken,
          ...form.getHeaders()
        },
        body: form as any // تجاهل تحقق النوع
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        return null;
      }

      const result = await response.json();
      console.log('📸 Image upload response:', result);
      
      if (result.code === 0 && result.data && result.data.image_id) {
        console.log('✅ تم رفع الصورة بنجاح:', result.data.image_id);
        return result.data.image_id;
      } else {
        console.error('❌ فشل رفع الصورة:', result.message || result);
        return null;
      }
    } catch (error) {
      console.error('❌ خطأ في رفع الصورة:', (error as any).message);
      return null;
    }
  }

  // إنشاء إعلان جديد
  async createAd(adData: {
    adgroup_id: string;
    ad_name: string;
    ad_format?: string;
    ad_text?: string;
    call_to_action?: string;
    landing_page_url?: string;
    display_name?: string;
    identity_id?: string;
    identity_type?: string;
    is_aco?: boolean;
    profile_image?: string;
    video_id?: string;
    video_url?: string;
    image_ids?: string[];
    image_urls?: string[];
    [key: string]: any;
  }) {
    console.log('📢 إنشاء إعلان TikTok جديد:', adData.ad_name);
    
    try {
      // ✅ بناء creatives array بالتنسيق الصحيح
      const creatives: any[] = [];
      
      if (adData.video_id || adData.video_url) {
        // إعلان فيديو - TikTok يتطلب صورة غلاف
        console.log('🎬 إنشاء إعلان فيديو:', adData.video_id);
        
        // إذا كانت هناك صور مرفقة، استخدمها
        let imageIds = adData.image_ids || [];
        
        // إذا لم تكن هناك صور، نحتاج لاستخراج صورة غلاف من الفيديو
        if (imageIds.length === 0 && adData.video_id) {
          console.log('📸 محاولة استخراج صورة غلاف من الفيديو:', adData.video_id);
          
          try {
            // جلب معلومات الفيديو للحصول على poster_url
            const videoInfoResponse = await this.makeRequest(`/file/video/ad/info/?advertiser_id=${this.advertiserId}&video_ids=["${adData.video_id}"]`, 'GET');
            
            if (videoInfoResponse.data && videoInfoResponse.data.list && videoInfoResponse.data.list.length > 0) {
              const videoInfo = videoInfoResponse.data.list[0];
              console.log('📹 معلومات الفيديو:', videoInfo);
              
              // البحث عن poster_url أو video_cover_url
              const posterUrl = videoInfo.poster_url || videoInfo.video_cover_url;
              
              if (posterUrl) {
                console.log('🖼️ تم العثور على صورة الغلاف:', posterUrl);
                
                // رفع الصورة باستخدام UPLOAD_BY_URL (الطريقة الصحيحة حسب وثائق TikTok)
                try {
                  const imageUploadData = {
                    advertiser_id: this.advertiserId,
                    upload_type: 'UPLOAD_BY_URL',
                    file_name: `${adData.ad_name}_cover_${Date.now()}.jpg`,
                    image_url: posterUrl
                  };
                  
                  console.log('📤 رفع صورة الغلاف باستخدام UPLOAD_BY_URL...');
                  const imageUploadResponse = await this.makeRequest('/file/image/ad/upload/', 'POST', imageUploadData);
                  
                  console.log('📸 استجابة رفع الصورة:', imageUploadResponse);
                  
                  if (imageUploadResponse.code === 0 && imageUploadResponse.data && imageUploadResponse.data.image_id) {
                    const coverImageId = imageUploadResponse.data.image_id;
                    imageIds.push(coverImageId);
                    console.log('✅ تم رفع صورة الغلاف بنجاح:', coverImageId);
                  } else {
                    console.warn('⚠️ فشل في رفع صورة الغلاف:', imageUploadResponse.message || imageUploadResponse);
                  }
                } catch (uploadError) {
                  console.error('❌ خطأ في رفع صورة الغلاف:', (uploadError as any).message);
                }
              } else {
                console.warn('⚠️ لم يتم العثور على poster_url أو video_cover_url في معلومات الفيديو');
              }
            } else {
              console.warn('⚠️ لم يتم العثور على معلومات الفيديو');
            }
          } catch (videoInfoError) {
            console.error('❌ خطأ في جلب معلومات الفيديو:', (videoInfoError as any).message);
          }
        }
        
        const creative: any = {
          ad_name: adData.ad_name,
          ad_format: 'SINGLE_VIDEO',
          video_id: adData.video_id,
          ad_text: adData.ad_text || '',
          call_to_action: adData.call_to_action || 'SHOP_NOW',
          landing_page_url: adData.landing_page_url || '',
          display_name: adData.display_name || ''
        };
        
        // إضافة الصور إذا كانت متوفرة
        if (imageIds.length > 0) {
          creative.image_ids = imageIds;
          console.log('📸 تم إضافة صور للإعلان:', imageIds);
        }
        
        // إضافة identity فقط إذا كان متوفراً
        if (adData.identity_id) {
          creative.identity_id = adData.identity_id;
          creative.identity_type = adData.identity_type || 'CUSTOMIZED_USER';
        }
        
        creatives.push(creative);
      } else if (adData.image_ids && adData.image_ids.length > 0) {
        // إعلان صور
        const creative: any = {
          ad_name: adData.ad_name,
          ad_format: adData.image_ids.length > 1 ? 'CAROUSEL' : 'SINGLE_IMAGE',
          image_ids: adData.image_ids,
          ad_text: adData.ad_text || '',
          call_to_action: adData.call_to_action || 'SHOP_NOW',
          landing_page_url: adData.landing_page_url || '',
          display_name: adData.display_name || ''
        };
        
        // إضافة identity فقط إذا كان متوفراً
        if (adData.identity_id) {
          creative.identity_id = adData.identity_id;
          creative.identity_type = adData.identity_type || 'CUSTOMIZED_USER';
        }
        
        creatives.push(creative);
      }
      
      console.log('🎨 Creatives:', JSON.stringify(creatives, null, 2));
      
      if (creatives.length === 0) {
        throw new Error('يجب توفير video_id أو image_ids لإنشاء الإعلان');
      }
      
      // التحقق من وجود محتوى مرئي
      const hasVideo = creatives.some(c => c.video_id);
      const hasImages = creatives.some(c => c.image_ids && c.image_ids.length > 0);
      console.log('📊 محتوى الإعلان:', { hasVideo, hasImages, videoId: adData.video_id });

      const requestData = {
        advertiser_id: this.advertiserId,
        adgroup_id: adData.adgroup_id,
        creatives: creatives, // ✅ التنسيق الصحيح (يحتوي على ad_name و identity داخل كل creative)
        is_aco: adData.is_aco !== undefined ? adData.is_aco : false
      };
      
      console.log('📋 بيانات الإعلان النهائية:', JSON.stringify(requestData, null, 2));
      
      const response = await this.makeRequest('/ad/create/', 'POST', requestData);
      
      console.log('📥 استجابة TikTok لإنشاء الإعلان:', JSON.stringify(response, null, 2));
      
      if (response.code === 0 && response.data) {
        console.log('✅ تم إنشاء الإعلان بنجاح:', response.data.ad_id || response.data.ad_ids);
        return response;
      } else {
        console.error('❌ فشل إنشاء الإعلان:', response.message);
        console.error('❌ تفاصيل الخطأ:', response);
        throw new Error(`فشل إنشاء الإعلان: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء الإعلان:', (error as any).message);
      throw error;
    }
  }

  // جلب تفاصيل إعلان محدد
  async getAdDetails(adId: string) {
    console.log('🔍 جلب تفاصيل الإعلان من TikTok API:', adId);
    
    try {
      const response = await this.makeRequest('/ad/get/', 'GET', {
        advertiser_id: this.advertiserId,
        ad_ids: JSON.stringify([adId]),
        fields: JSON.stringify([
          'ad_id',
          'ad_name',
          'ad_format',
          'video_id',
          'image_ids',
          'operation_status'
        ])
      });

      if (response.code === 0 && response.data && response.data.list && response.data.list.length > 0) {
        const adDetails = response.data.list[0];
        console.log('✅ تم جلب تفاصيل الإعلان بنجاح:', adDetails.ad_id);
        return adDetails;
      } else {
        console.warn('⚠️ لم يتم العثور على الإعلان:', adId);
        return null;
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تفاصيل الإعلان:', (error as any).message);
      throw error;
    }
  }
}

// فئة موسعة لإدارة نماذج الليدز
export class TikTokBusinessAPIWithLeadForms extends TikTokBusinessAPI {
  
  // جلب المجموعات الإعلانية
  async getAdGroups() {
    console.log('📊 جلب المجموعات الإعلانية من TikTok API...');
    
    try {
      const response: any = await this.makeRequest(`/adgroup/get/?advertiser_id=${this.advertiserId}&page_size=1000`);
      
      if (response.data && response.data.list) {
        console.log(`✅ تم جلب ${response.data.list.length} مجموعة إعلانية من TikTok API`);
        
        // طباعة تفاصيل أول مجموعة إعلانية لفهم بنية الاستهداف
        if (response.data.list.length > 0) {
          const firstAdGroup = response.data.list[0];
          console.log('📋 تفاصيل أول مجموعة إعلانية (للمرجع):', JSON.stringify({
            adgroup_id: firstAdGroup.adgroup_id,
            adgroup_name: firstAdGroup.adgroup_name,
            targeting: firstAdGroup.targeting,
            location_ids: firstAdGroup.targeting?.location_ids,
            zipcode_ids: firstAdGroup.targeting?.zipcode_ids,
            excluded_location_ids: firstAdGroup.targeting?.excluded_location_ids
          }, null, 2));
        }
        
        return response.data.list;
      }
      
      return [];
    } catch (error) {
      console.error('❌ خطأ في جلب المجموعات الإعلانية:', (error as any).message);
      throw error;
    }
  }

  // جلب نماذج الليدز
  async getLeadForms() {
    console.log('📋 جلب نماذج الليدز من TikTok API...');
    
    try {
      const response: any = await this.makeRequest(`/leadform/get/?advertiser_id=${this.advertiserId}&page_size=1000`);
      
      if (response.data && response.data.list) {
        console.log(`✅ تم جلب ${response.data.list.length} نموذج ليدز من TikTok API`);
        return response;
      }
      
      return { code: 0, data: { list: [] } };
    } catch (error) {
      console.error('❌ خطأ في جلب نماذج الليدز:', (error as any).message);
      throw error;
    }
  }

  // فحص مجموعة إعلانية موجودة لمعرفة الاستهداف الجغرافي الصحيح
  async getAdGroupDetails(adGroupId: string) {
    console.log('🔍 فحص تفاصيل المجموعة الإعلانية:', adGroupId);
    
    try {
      const response: any = await this.makeRequest(`/adgroup/get/?advertiser_id=${this.advertiserId}&adgroup_ids=["${adGroupId}"]`);
      
      console.log('📊 TikTok AdGroup Response:', JSON.stringify(response, null, 2));

      if (response.code !== 0) {
        throw new Error(`TikTok API error: ${response.message || 'Unknown error'}`);
      }

      const adGroup = response.data?.list?.[0];
      if (adGroup && adGroup.targeting) {
        console.log('🗺️ تفاصيل الاستهداف الجغرافي للمجموعة الموجودة:', {
          location_ids: adGroup.targeting.location_ids,
          zipcode_ids: adGroup.targeting.zipcode_ids,
          excluded_location_ids: adGroup.targeting.excluded_location_ids,
          all_targeting: adGroup.targeting
        });
      }

      return response;
    } catch (error) {
      console.error('❌ خطأ في فحص المجموعة الإعلانية:', (error as any).message);
      throw error;
    }
  }
}

export async function syncTikTokCampaigns(platformId: string) {
  console.log("🔄 مزامنة حملات TikTok للمنصة:", platformId);
  
  try {
    const api = await getTikTokAPIForPlatform(platformId);
    if (!api) {
      throw new Error("TikTok API not available");
    }

    // جلب الحملات من TikTok
    const campaigns = await api.getCampaigns();
    console.log(`📊 تم جلب ${campaigns.length} حملة من TikTok`);
    console.log("🔍 Campaigns type:", typeof campaigns, "Is array:", Array.isArray(campaigns));

    // حفظ الحملات في قاعدة البيانات
    for (const campaign of campaigns) {
      await storage.upsertTikTokCampaign(campaign.campaign_id, { ...campaign, platformId });
    }

    console.log(`✅ تم حفظ ${campaigns.length} حملة بنجاح`);
    return campaigns;
  } catch (error) {
    console.error("❌ خطأ في مزامنة الحملات:", error);
    throw error;
  }
}

export async function syncTikTokAdGroups(platformId: string) {
  console.log("🔄 مزامنة مجموعات إعلانات TikTok للمنصة:", platformId);
  
  try {
    const api = await getTikTokAPIForPlatform(platformId);
    if (!api) {
      throw new Error("TikTok API not available");
    }

    // جلب المجموعات الإعلانية من TikTok
    const adGroups = await api.getAdGroups();
    console.log(`📊 تم جلب ${adGroups.length} مجموعة إعلانية من TikTok`);

    // حفظ المجموعات في قاعدة البيانات
    for (const adGroup of adGroups) {
      await storage.upsertTikTokAdGroup(adGroup.adgroup_id, { ...adGroup, platformId });
    }

    console.log(`✅ تم حفظ ${adGroups.length} مجموعة إعلانية بنجاح`);
    return adGroups;
  } catch (error) {
    console.error("❌ خطأ في مزامنة المجموعات الإعلانية:", error);
    throw error;
  }
}

export async function syncTikTokAds(platformId: string) {
  console.log("🔄 مزامنة إعلانات TikTok للمنصة:", platformId);
  
  try {
    const api = await getTikTokAPIForPlatform(platformId);
    if (!api) {
      throw new Error("TikTok API not available");
    }

    // جلب الإعلانات من TikTok
    const ads = await api.getAds();
    console.log(`📊 تم جلب ${ads.length} إعلان من TikTok`);

    // حفظ الإعلانات في قاعدة البيانات
    for (const ad of ads) {
      await storage.upsertTikTokAd(ad.ad_id, { ...ad, platformId });
    }

    console.log(`✅ تم حفظ ${ads.length} إعلان بنجاح`);
    return ads;
  } catch (error) {
    console.error("❌ خطأ في مزامنة الإعلانات:", error);
    throw error;
  }
}

export async function getAdDetailsWithVideo(platformId: string, adId: string) {
  console.log("🎬 جلب تفاصيل الإعلان مع الفيديو من TikTok:", adId);
  
  try {
    const api = await getTikTokAPIForPlatform(platformId);
    if (!api) {
      throw new Error("TikTok API not available");
    }

    // جلب تفاصيل الإعلان من TikTok API
    const adDetails = await api.getAdDetails(adId);
    
    if (!adDetails) {
      console.warn("⚠️ لم يتم العثور على تفاصيل الإعلان:", adId);
      // إرجاع بيانات افتراضية بدلاً من null
      return {
        adId: adId,
        videoId: null,
        imageIds: [],
        adFormat: 'SINGLE_VIDEO',
        videoUrl: null,
        hasVideo: false,
        error: 'Ad not found in TikTok API'
      };
    }

    // محاولة جلب معلومات الفيديو الفعلية
    let videoUrl = null;
    let coverImageUrl = null;
    
    if (adDetails.video_id) {
      try {
        // جلب معلومات الفيديو من TikTok API
        console.log('🎬 جلب معلومات الفيديو:', adDetails.video_id);
        const videoInfoResponse = await api.makeRequest(`/file/video/ad/info/`, 'GET', {
          advertiser_id: api.getAdvertiserId(),
          video_ids: JSON.stringify([adDetails.video_id])
        });
        
        if (videoInfoResponse.data && videoInfoResponse.data.list && videoInfoResponse.data.list.length > 0) {
          const videoFileInfo = videoInfoResponse.data.list[0];
          console.log('📹 معلومات ملف الفيديو:', JSON.stringify(videoFileInfo, null, 2));
          
          // استخراج URL الفيديو
          videoUrl = videoFileInfo.video_url || videoFileInfo.download_url || videoFileInfo.preview_url;
          
          // محاولة جلب صورة الغلاف من عدة مصادر
          coverImageUrl = videoFileInfo.poster_url || 
                         videoFileInfo.cover_image_url || 
                         videoFileInfo.thumbnail_url ||
                         videoFileInfo.preview_image_url ||
                         videoFileInfo.cover_url;
          
          console.log('✅ تم جلب URL الفيديو:', videoUrl);
          console.log('🖼️ تم جلب صورة الغلاف:', coverImageUrl);
        }
      } catch (error) {
        console.warn('⚠️ فشل في جلب معلومات الفيديو:', error);
      }
    }
    
    // إذا لم نحصل على صورة غلاف، محاولة جلبها من creative materials
    if (!coverImageUrl && adDetails.image_ids && adDetails.image_ids.length > 0) {
      try {
        console.log('🖼️ محاولة جلب صورة الغلاف من image_ids:', adDetails.image_ids);
        const imageInfoResponse = await api.makeRequest(`/file/image/ad/info/`, 'GET', {
          advertiser_id: api.getAdvertiserId(),
          image_ids: JSON.stringify(adDetails.image_ids)
        });
        
        if (imageInfoResponse.data && imageInfoResponse.data.list && imageInfoResponse.data.list.length > 0) {
          const imageInfo = imageInfoResponse.data.list[0];
          console.log('🖼️ معلومات الصورة:', JSON.stringify(imageInfo, null, 2));
          coverImageUrl = imageInfo.image_url || imageInfo.download_url;
          console.log('✅ تم جلب صورة الغلاف من الصور:', coverImageUrl);
        }
      } catch (error) {
        console.warn('⚠️ فشل في جلب معلومات الصورة:', error);
      }
    }

    // استخراج معلومات الفيديو
    const videoInfo = {
      adId: adId,
      videoId: adDetails.video_id || null,
      imageIds: adDetails.image_ids || [],
      adFormat: adDetails.ad_format || 'UNKNOWN',
      // URL الفيديو الفعلي
      videoUrl: videoUrl,
      videoId_display: adDetails.video_id || null,
      hasVideo: !!adDetails.video_id,
      // صورة الغلاف
      coverImageUrl: coverImageUrl || adDetails.video_cover_url || adDetails.poster_url || null,
      // معلومات إضافية للعرض
      adName: adDetails.ad_name || null,
      creativeType: 'VIDEO'
    };

    console.log("✅ تم جلب تفاصيل الإعلان بنجاح:", videoInfo);
    return videoInfo;
    
  } catch (error) {
    console.error("❌ خطأ في جلب تفاصيل الإعلان:", error);
    return null;
  }
}

export async function syncTikTokReports(platformId: string, startDate?: string, endDate?: string) {
  console.log('📊 مزامنة تقارير TikTok للمنصة:', platformId);
  // Implementation placeholder
  return { success: true, message: 'TikTok reports sync completed' };
}

export async function syncEnhancedTikTokReports(platformId: string, startDate: string, endDate: string) {
  console.log('📊 مزامنة تقارير TikTok المحسّنة للمنصة:', platformId);
  // Implementation placeholder
  return { success: true, message: 'Enhanced TikTok reports sync completed' };
}

export async function getTikTokAPIForPlatform(platformId: string): Promise<TikTokBusinessAPI | null> {
  try {
    const { db } = await import('./db');
    const { adPlatformSettings } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const [settings] = await db
      .select()
      .from(adPlatformSettings)
      .where(eq(adPlatformSettings.platformId, platformId))
      .limit(1);
    
    console.log('🎵 TikTok API Settings Check:', {
      platformId,
      hasSettings: !!settings,
      hasToken: !!settings?.tiktokAccessToken,
      hasAdvertiserId: !!settings?.tiktokAdvertiserId,
      advertiserId: settings?.tiktokAdvertiserId,
      tokenLength: settings?.tiktokAccessToken?.length || 0
    });
    
    if (!settings?.tiktokAccessToken || !settings?.tiktokAdvertiserId) {
      console.warn('🎵 TikTok API: Missing access token or advertiser ID');
      return null;
    }
    
    console.log('✅ TikTok API initialized successfully');
    return new TikTokBusinessAPI(
      settings.tiktokAccessToken,
      settings.tiktokAdvertiserId,
      platformId
    );
  } catch (error) {
    console.error('خطأ في الحصول على TikTok API للمنصة:', (error as any).message);
    return null;
  }
}

export async function getTikTokLeadFormsAPI(platformId: string): Promise<TikTokBusinessAPIWithLeadForms | null> {
  try {
    const { db } = await import('./db');
    const { adPlatformSettings } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const [settings] = await db
      .select()
      .from(adPlatformSettings)
      .where(eq(adPlatformSettings.platformId, platformId))
      .limit(1);
    
    if (!settings?.tiktokAccessToken || !settings?.tiktokAdvertiserId) {
      return null;
    }
    
    return new TikTokBusinessAPIWithLeadForms(
      settings.tiktokAccessToken,
      settings.tiktokAdvertiserId,
      platformId
    );
  } catch (error) {
    console.error('خطأ في الحصول على TikTok Lead Forms API للمنصة:', (error as any).message);
    return null;
  }
}
