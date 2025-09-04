// TikTok Business API Integration
export class TikTokBusinessAPI {
  private baseUrl = 'https://business-api.tiktok.com/open_api/v1.3';
  
  constructor(private accessToken: string, private advertiserId: string, private platformId?: string) {}

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
      console.error('خطأ في جلب Business Center ID:', error);
      return null;
    }
  }

  // Helper method for making API requests
  public async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: any = {
      'Access-Token': this.accessToken,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    console.log(`TikTok API Request: ${method} ${url}`);
    if (data && method !== 'GET') {
      console.log('TikTok API Request Body:', JSON.stringify(data, null, 2));
    }
    
    try {
      const response = await fetch(url, options);
      
      // التحقق من status code أولاً
      if (!response.ok) {
        console.error(`TikTok API HTTP Error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // محاولة parsing JSON
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('TikTok API Response is not valid JSON:', parseError);
        const text = await response.text();
        console.error('Raw response:', text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
      }
      
      console.log('TikTok API Response:', JSON.stringify(result, null, 2));
      
      if (result.code !== 0) {
        console.error('TikTok API Error:', result);
        throw new Error(result.message || 'TikTok API request failed');
      }
      
      return result;
    } catch (error) {
      console.error('TikTok API request failed:', error);
      throw error;
    }
  }

  // ==================== ACCOUNT MANAGEMENT ====================

  // جلب رصيد الحساب الإعلاني
  async getAdvertiserBalance() {
    try {
      console.log(`🏦 جلب رصيد الحساب الإعلاني: ${this.advertiserId}`);
      const response = await this.makeRequest(`/bc/advertiser/balance/get/?advertiser_id=${this.advertiserId}`);
      
      // تحويل البيانات للتنسيق المناسب
      if (response && response.data) {
        const balanceData = response.data;
        console.log(`💰 رصيد الحساب:`, balanceData);
        
        return {
          balance: parseFloat(balanceData.balance || '0'),
          currency: balanceData.currency || 'USD',
          status: balanceData.status || 'ACTIVE',
          lastUpdated: new Date().toISOString()
        };
      }
      
      return {
        balance: 0,
        currency: 'USD',
        status: 'UNKNOWN',
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ خطأ في جلب رصيد الحساب:', error);
      throw new Error(`فشل في جلب رصيد الحساب: ${error}`);
    }
  }

  // جلب تفاصيل الحساب الإعلاني
  async getAdvertiserInfo() {
    try {
      console.log(`ℹ️ جلب تفاصيل الحساب الإعلاني: ${this.advertiserId}`);
      const response = await this.makeRequest(`/advertiser/info/?advertiser_ids=["${this.advertiserId}"]`);
      
      if (response && response.data && response.data.list && response.data.list.length > 0) {
        const advertiserInfo = response.data.list[0];
        console.log(`📊 تفاصيل الحساب:`, advertiserInfo);
        
        return {
          id: advertiserInfo.advertiser_id,
          name: advertiserInfo.advertiser_name,
          status: advertiserInfo.status,
          country: advertiserInfo.country,
          currency: advertiserInfo.currency,
          timezone: advertiserInfo.timezone,
          company: advertiserInfo.company,
          phoneNumber: advertiserInfo.phone_number,
          email: advertiserInfo.email,
          address: advertiserInfo.address,
          createdTime: advertiserInfo.create_time
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ خطأ في جلب تفاصيل الحساب:', error);
      throw new Error(`فشل في جلب تفاصيل الحساب: ${error}`);
    }
  }

  // إنشاء حساب إعلاني جديد
  async createAdvertiser(advertiserData: {
    advertiser_name: string;
    promotion_center_province?: string;
    promotion_center_city?: string;
    address?: string;
    industry?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    license?: string;
    qualification_images?: string[];
    business_registration_number?: string;
    tax_map?: any;
  }) {
    try {
      console.log('🏢 إنشاء حساب إعلاني جديد:', advertiserData.advertiser_name);
      
      // جلب Business Center ID من الإعدادات أو استخدام القيمة الافتراضية
      const bcId = await this.getBusinessCenterId() || "7490974252166873089";
      
      const requestData = {
        bc_id: bcId, // Business Center ID من الإعدادات
        customer_info: {
          business_name: "sanadi.pro",
          company: "sanadi.pro",
          country_code: "IQ",
          registered_area: "IQ",
          timezone: "Asia/Baghdad",
          currency: "USD",
          contact_name: "Yasir al zubaidi",
          contact_email: "admin@sanadi.pro",
          contact_phone: "+9647838383837",
          address: "Baghdad, Iraq",
          industry: 6002, // Technology/Digital Marketing
          business_registration_number: "1009283",
          website_url: "https://sanadi.pro"
        },
        advertiser_info: {
          name: advertiserData.advertiser_name,
          advertiser_name: advertiserData.advertiser_name,
          promotion_center_province: "Baghdad",
          promotion_center_city: "Baghdad",
          address: advertiserData.address || "Baghdad, Iraq",
          industry: advertiserData.industry || "E-commerce",
          contact_name: advertiserData.contact_name || "Yasir al zubaidi",
          contact_phone: advertiserData.contact_phone || "+9647838383837",
          contact_email: advertiserData.contact_email || "admin@sanadi.pro",
          currency: "USD",
          timezone: "Asia/Baghdad",
          license: "",
          qualification_images: []
        }
      };

      console.log('🔄 إرسال طلب إنشاء الحساب إلى TikTok...', JSON.stringify(requestData, null, 2));
      
      const response = await this.makeRequest('/bc/advertiser/create/', 'POST', requestData);
      
      if (response && response.data) {
        console.log('✅ تم إنشاء الحساب الإعلاني بنجاح:', response.data);
        return {
          success: true,
          advertiserId: response.data.advertiser_id,
          status: response.data.status || 'PENDING_REVIEW',
          message: 'تم إنشاء الحساب الإعلاني بنجاح وهو قيد المراجعة',
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'لم يتم إرجاع بيانات صحيحة من TikTok'
      };
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء الحساب الإعلاني:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف في إنشاء الحساب'
      };
    }
  }

  // ==================== CAMPAIGN MANAGEMENT ====================

  // جلب جميع الحملات
  async getCampaigns() {
    return this.makeRequest(`/campaign/get/?advertiser_id=${this.advertiserId}`);
  }

  // جلب حملات Smart Plus 
  async getSmartPlusCampaigns() {
    return this.makeRequest(`/smart_plus/campaign/get/?advertiser_id=${this.advertiserId}`);
  }

  // جلب حملات GMV Max
  async getGMVMaxCampaigns() {
    return this.makeRequest(`/gmv_max/campaign/get/?advertiser_id=${this.advertiserId}`);
  }

  // إنشاء حملة جديدة
  async createCampaign(campaignData: {
    campaign_name: string;
    objective: string; // REACH, TRAFFIC, CONVERSIONS, LEAD_GENERATION, etc.
    budget_mode: string; // BUDGET_MODE_DAY, BUDGET_MODE_TOTAL
    budget?: number;
    start_time?: string; // ISO format
    end_time?: string;
  }) {
    // تحويل objective إلى objective_type للـ API
    const { objective, ...otherData } = campaignData;
    return this.makeRequest('/campaign/create/', 'POST', {
      advertiser_id: this.advertiserId,
      objective_type: objective, // استخدام objective_type بدلاً من objective
      ...otherData
    });
  }

  // تحديث حملة
  async updateCampaign(campaignId: string, updateData: {
    campaign_name?: string;
    budget?: number;
    budget_mode?: string;
    start_time?: string;
    end_time?: string;
  }) {
    return this.makeRequest('/campaign/update/', 'POST', {
      advertiser_id: this.advertiserId,
      campaign_id: campaignId,
      ...updateData
    });
  }

  // تحديث حالة الحملة
  async updateCampaignStatus(campaignId: string, status: 'ENABLE' | 'DISABLE' | 'DELETE') {
    return this.makeRequest('/campaign/status/update/', 'POST', {
      advertiser_id: this.advertiserId,
      campaign_ids: [campaignId], // يجب أن تكون مصفوفة
      operation_status: status
    });
  }

  // ==================== AD GROUP MANAGEMENT ====================

  // جلب جميع مجموعات الإعلانات
  async getAdGroups(campaignId?: string) {
    const params = [`advertiser_id=${this.advertiserId}`];
    if (campaignId) {
      params.push(`campaign_id=${campaignId}`);
    }
    return this.makeRequest(`/adgroup/get/?${params.join('&')}`);
  }

  // إنشاء مجموعة إعلانية جديدة
  async createAdGroup(adGroupData: {
    campaign_id: string;
    adgroup_name: string;
    placement_type: string; // PLACEMENT_TYPE_AUTOMATIC, PLACEMENT_TYPE_NORMAL
    schedule_type?: string; // SCHEDULE_FROM_NOW, SCHEDULE_START_END
    schedule_start_time?: string; // تاريخ البداية من النموذج
    budget_mode?: string;
    budget?: number;
    bid_type?: string;
    bid_price?: number;
    optimization_goal?: string; // CONVERSIONS, CLICK, REACH, IMPRESSIONS
    pixel_id?: string; // البكسل المطلوب للتتبع
    optimization_event?: string; // حدث البكسل المطلوب
    targeting?: {
      gender?: string;
      age_groups?: string[];
      locations?: string[];
      languages?: string[];
      interests?: string[];
      behaviors?: string[];
    };
  }) {
    // تحويل إعدادات الاستهداف إلى الصيغة المطلوبة من TikTok API
    const tiktokTargeting: any = {};
    
    if (adGroupData.targeting?.gender) {
      tiktokTargeting.gender = adGroupData.targeting.gender;
    }
    
    if (adGroupData.targeting?.age_groups && adGroupData.targeting.age_groups.length > 0) {
      tiktokTargeting.age = adGroupData.targeting.age_groups;
    }
    
    if (adGroupData.targeting?.locations && adGroupData.targeting.locations.length > 0) {
      // تحويل كود الدولة إلى التنسيق المطلوب من TikTok
      // رمز 99237 يشير إلى العراق في TikTok Ads API
      tiktokTargeting.locations = adGroupData.targeting.locations;
    }
    
    // استخدام تاريخ البداية من النموذج أو التوقيت الحالي كبديل
    const startTime = adGroupData.schedule_start_time || new Date().toISOString().slice(0, 16);
    
    // تحويل BUDGET_MODE_DYNAMIC_DAILY_BUDGET إلى BUDGET_MODE_DAY للتوافق مع TikTok API
    let adjustedBudgetMode = adGroupData.budget_mode === 'BUDGET_MODE_DYNAMIC_DAILY_BUDGET' 
      ? 'BUDGET_MODE_DAY' 
      : adGroupData.budget_mode;
    
    // إذا كانت الميزانية الإجمالية أقل من $100، نحولها إلى ميزانية يومية لتجنب متطلب الحد الأدنى
    if (adjustedBudgetMode === 'BUDGET_MODE_TOTAL' && adGroupData.budget && adGroupData.budget < 100) {
      adjustedBudgetMode = 'BUDGET_MODE_DAY';
      console.log('🔄 تم تحويل الميزانية من إجمالية إلى يومية لتجنب متطلب الحد الأدنى ($600)');
    }
    
    // تحديد نوع الجدولة بناءً على نوع الميزانية
    const scheduleType = adjustedBudgetMode === 'BUDGET_MODE_TOTAL' ? 'SCHEDULE_START_END' : 'SCHEDULE_FROM_NOW';
    
    // استخدام تاريخ النهاية من النموذج فقط - بدون تحديد افتراضي
    const endTime = scheduleType === 'SCHEDULE_START_END' && (adGroupData as any).schedule_end_time ? 
      (adGroupData as any).schedule_end_time : 
      null;
    
    // تحديد placement_type المناسب لحملات الليدز
    const isLeadGeneration = adGroupData.optimization_goal === 'LEAD_GENERATION';
    const placementType = isLeadGeneration ? 'PLACEMENT_TYPE_NORMAL' : (adGroupData.placement_type || 'PLACEMENT_TYPE_AUTOMATIC');
    
    const requestData = {
      advertiser_id: this.advertiserId,
      campaign_id: adGroupData.campaign_id,
      adgroup_name: adGroupData.adgroup_name,
      placement_type: placementType,
      schedule_type: scheduleType,
      schedule_start_time: startTime, // تاريخ البداية من النموذج
      ...(endTime && { schedule_end_time: endTime }), // تاريخ النهاية عند الحاجة
      billing_event: 'OCPM', // معامل مطلوب من TikTok API - Optimized Cost Per Mille (مطلوب للحملات التحويلية)
      location_ids: adGroupData.targeting?.locations || ['99237'], // كود العراق افتراضياً
      promotion_type: adGroupData.optimization_goal === 'LEAD_GENERATION' ? 'LEAD_GENERATION' : 'WEBSITE', // نوع الترويج المناسب
      optimization_goal: adGroupData.optimization_goal || 'CONVERT', // هدف التحسين مطلوب للحملات
      
      // إضافة pacing لحل مشكلة BID_TYPE_MAX_CONVERSION مع accelerated delivery
      pacing: "PACING_MODE_SMOOTH", // التسليم السلس بدلاً من المُسرع
      
      // إضافة placements محددة للحملات العادية (NORMAL)
      ...(placementType === 'PLACEMENT_TYPE_NORMAL' && {
        placements: ["PLACEMENT_TIKTOK"] // فقط TikTok للحملات الليدز
      }),
      ...(adGroupData.pixel_id && { 
        pixel_id: adGroupData.pixel_id,
        ...(adGroupData.optimization_event && { optimization_event: adGroupData.optimization_event })
      }), // إضافة البكسل والحدث عند توفرهما
      ...(adjustedBudgetMode && { budget_mode: adjustedBudgetMode }),
      ...(adGroupData.budget && { budget: adGroupData.budget }),
      ...(adGroupData.bid_type && { bid_type: adGroupData.bid_type }),
      
      // إضافة bid_price افتراضي لـ BID_TYPE_CUSTOM إذا لم يتم تحديده
      ...(adGroupData.bid_type === 'BID_TYPE_CUSTOM' && !adGroupData.bid_price && adGroupData.budget && {
        bid_price: Math.max(0.5, parseFloat(String(adGroupData.budget)) * 0.02) // 2% من الميزانية كحد أدنى $0.5
      }),
      ...(adGroupData.bid_price && { bid_price: adGroupData.bid_price }),
      
      // إضافة cost per conversion المطلوب لـ OCPM
      ...(adGroupData.bid_price && { conversion_bid_price: parseFloat(String(adGroupData.bid_price)) }),
      ...(adGroupData.bid_type === 'BID_TYPE_CUSTOM' && !adGroupData.bid_price && adGroupData.budget && {
        conversion_bid_price: Math.max(0.5, parseFloat(String(adGroupData.budget)) * 0.02)
      }),
      ...(Object.keys(tiktokTargeting).length > 0 && { targeting: tiktokTargeting })
    };
    
    console.log('🎯 إرسال بيانات المجموعة الإعلانية إلى TikTok:', JSON.stringify(requestData, null, 2));
    
    return this.makeRequest('/adgroup/create/', 'POST', requestData);
  }

  // تحديث مجموعة إعلانية
  async updateAdGroup(adGroupId: string, updateData: {
    adgroup_name?: string;
    budget?: number;
    bid_price?: number;
    targeting?: any;
  }) {
    return this.makeRequest('/adgroup/update/', 'POST', {
      advertiser_id: this.advertiserId,
      adgroup_id: adGroupId,
      ...updateData
    });
  }

  // تحديث حالة المجموعة الإعلانية
  async updateAdGroupStatus(adGroupId: string, status: 'ENABLE' | 'DISABLE' | 'DELETE') {
    return this.makeRequest('/adgroup/status/update/', 'POST', {
      advertiser_id: this.advertiserId,
      adgroup_ids: [adGroupId], // يجب أن تكون مصفوفة
      operation_status: status
    });
  }

  // ==================== AD MANAGEMENT ====================

  // جلب جميع الإعلانات
  async getAds(campaignId?: string, adGroupId?: string) {
    const params = [`advertiser_id=${this.advertiserId}`];
    if (campaignId) {
      params.push(`campaign_id=${campaignId}`);
    }
    if (adGroupId) {
      params.push(`adgroup_id=${adGroupId}`);
    }
    return this.makeRequest(`/ad/get/?${params.join('&')}`);
  }

  // تحميل فيديو من URL إلى Buffer
  async downloadVideoFromUrl(videoUrl: string): Promise<Buffer> {
    console.log('📥 تحميل الفيديو من Google Cloud Storage...');
    
    try {
      // إنشاء URL موقع مؤقت إذا كان الملف من Google Cloud Storage
      let downloadUrl = videoUrl;
      
      if (videoUrl.includes('storage.googleapis.com')) {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        
        // استخراج اسم الحاوية والملف من الـ URL
        const urlParts = videoUrl.split('/');
        const bucketName = urlParts[3];
        const fileName = urlParts.slice(4).join('/');
        
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);
        
        // إنشاء URL موقع مؤقت صالح لساعة واحدة
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000,
        });
        
        downloadUrl = signedUrl;
        console.log('✅ تم إنشاء URL موقع للتحميل');
      }
      
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.buffer();
      console.log('✅ تم تحميل الفيديو بنجاح، الحجم:', Math.round(buffer.length / (1024 * 1024) * 100) / 100, 'MB');
      
      return buffer;
      
    } catch (error) {
      console.error('❌ فشل في تحميل الفيديو:', (error as Error).message);
      throw new Error(`فشل في تحميل الفيديو: ${(error as Error).message}`);
    }
  }

  // جلب رصيد الحساب الإعلاني من TikTok Business API (V2)
  async getAdvertiserBalanceV2(): Promise<{
    balance: number;
    currency: string;
    status: string;
    lastUpdated: string;
    isAvailable: boolean;
    error?: string;
  }> {
    console.log('🏦 جلب رصيد الحساب الإعلاني من TikTok...');
    
    try {
      // محاولة 1: جلب معلومات الحساب للحصول على bc_id
      let bcId = null;
      let accountInfo = null;
      
      try {
        accountInfo = await this.makeRequest('/advertiser/info/', 'GET', {
          advertiser_ids: JSON.stringify([this.advertiserId])
        });
        
        if (accountInfo.data && accountInfo.data.list && accountInfo.data.list[0]) {
          const advertiser = accountInfo.data.list[0];
          bcId = advertiser.business_center_id;
          console.log('🏢 معلومات الحساب:', {
            id: advertiser.advertiser_id,
            name: advertiser.name,
            bcId: bcId,
            status: advertiser.status
          });
        }
      } catch (infoError) {
        console.log('⚠️ تعذر جلب معلومات الحساب:', infoError.message);
      }

      // محاولة 2: استخدام BC endpoint مع bc_id إذا كان متوفراً
      if (bcId) {
        try {
          console.log('💰 محاولة جلب الرصيد باستخدام BC endpoint مع bc_id:', bcId);
          const bcResponse = await this.makeRequest('/bc/advertiser/balance/get/', 'GET', {
            advertiser_id: this.advertiserId,
            bc_id: bcId
          });

          if (bcResponse.data && bcResponse.data.advertiser_balance) {
            const balanceData = bcResponse.data.advertiser_balance;
            console.log('✅ تم جلب الرصيد من BC endpoint بنجاح');
            return {
              balance: parseFloat(balanceData.balance || '0'),
              currency: balanceData.currency || 'USD',
              status: balanceData.status || 'ACTIVE',
              lastUpdated: new Date().toISOString(),
              isAvailable: true
            };
          }
        } catch (bcError) {
          console.log('⚠️ فشل BC endpoint:', bcError.message);
        }
      }

      // محاولة 3: استخدام endpoint بديل للحسابات التي لا تدعم BC
      try {
        console.log('💰 محاولة جلب الرصيد باستخدام advertiser endpoint');
        const advertiserResponse = await this.makeRequest('/advertiser/balance/get/', 'GET', {
          advertiser_id: this.advertiserId
        });

        if (advertiserResponse.data && advertiserResponse.data.balance_info) {
          const balanceData = advertiserResponse.data.balance_info;
          console.log('✅ تم جلب الرصيد من advertiser endpoint بنجاح');
          return {
            balance: parseFloat(balanceData.balance || '0'),
            currency: balanceData.currency || 'USD', 
            status: 'ACTIVE',
            lastUpdated: new Date().toISOString(),
            isAvailable: true
          };
        }
      } catch (advertiserError) {
        console.log('⚠️ فشل advertiser endpoint:', advertiserError.message);
      }

      // محاولة 4: إرجاع معلومات أساسية عن الحساب بدون رصيد
      console.log('⚠️ لم يتم العثور على رصيد، عرض معلومات الحساب فقط');
      return {
        balance: 0,
        currency: 'USD',
        status: 'UNKNOWN',
        lastUpdated: new Date().toISOString(),
        isAvailable: false,
        error: 'هذا النوع من الحسابات لا يدعم عرض الرصيد عبر API أو يحتاج صلاحيات إضافية'
      };

    } catch (error) {
      console.error('❌ خطأ عام في جلب رصيد الحساب:', (error as Error).message);
      
      return {
        balance: 0,
        currency: 'USD',
        status: 'ERROR',
        lastUpdated: new Date().toISOString(),
        isAvailable: false,
        error: `غير متاح: ${(error as Error).message.includes('bc_id') ? 'هذا الحساب يحتاج إعداد Business Center' : (error as Error).message}`
      };
    }
  }

  // جلب معلومات الحساب الإعلاني من TikTok Business API
  async getAdvertiserInfoV2(): Promise<{
    id: string;
    name: string;
    status: string;
    country: string;
    currency: string;
    timezone: string;
    company?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    createdTime?: string;
  }> {
    console.log('🏢 جلب معلومات الحساب الإعلاني من TikTok...');
    
    try {
      const response = await this.makeRequest('/advertiser/info/', 'GET', {
        advertiser_ids: JSON.stringify([this.advertiserId])
      });

      console.log('📋 استجابة معلومات الحساب:', JSON.stringify(response, null, 2));

      if (response.data && response.data.list && response.data.list[0]) {
        const advertiserInfo = response.data.list[0];
        return {
          id: advertiserInfo.advertiser_id || this.advertiserId,
          name: advertiserInfo.name || 'اسم غير محدد',
          status: advertiserInfo.status || 'UNKNOWN',
          country: advertiserInfo.country || 'IQ',
          currency: advertiserInfo.currency || 'USD',
          timezone: advertiserInfo.timezone || 'Asia/Baghdad',
          company: advertiserInfo.company,
          phoneNumber: advertiserInfo.phone_number,
          email: advertiserInfo.email,
          address: advertiserInfo.address,
          createdTime: advertiserInfo.create_time
        };
      }

      throw new Error('لم يتم العثور على معلومات الحساب في الاستجابة');
    } catch (error) {
      console.error('❌ فشل في جلب معلومات الحساب:', (error as Error).message);
      throw new Error(`فشل في جلب معلومات الحساب: ${(error as Error).message}`);
    }
  }

  // رفع فيديو إلى TikTok مباشرة من الملف
  async uploadVideoFromFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    console.log('📹 رفع الفيديو إلى TikTok مباشرة...');
    
    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      formData.append('advertiser_id', this.advertiserId);
      formData.append('video_file', file, {
        filename: fileName,
        contentType: mimeType
      });
      formData.append('upload_type', 'UPLOAD_BY_FILE');

      console.log('🔄 جاري رفع الفيديو مباشرة إلى TikTok...');
      console.log('📊 حجم الملف:', Math.round(file.length / (1024 * 1024) * 100) / 100, 'MB');

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(
        `${this.baseUrl}/file/video/ad/upload/`,
        {
          method: 'POST',
          headers: {
            'Access-Token': this.accessToken,
            'X-Tt-Sdk-Version': 'v1.3',
            'X-Tt-Sdk-Client-Id': this.advertiserId,
            ...formData.getHeaders()
          },
          body: formData,
          // timeout: 300000 // 5 دقائق للفيديوهات الكبيرة - removed due to TypeScript compatibility
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json() as any;
      console.log('📦 استجابة TikTok API:', JSON.stringify(result, null, 2));

      if (result.code !== 0) {
        throw new Error(result.message || 'خطأ غير معروف من TikTok API');
      }

      if (result.data && result.data.video_id) {
        console.log('✅ تم رفع الفيديو بنجاح، معرف الفيديو:', result.data.video_id);
        return result.data.video_id;
      }

      // التحقق من البيانات في صيغة مصفوفة
      if (result.data && Array.isArray(result.data) && result.data[0]?.video_id) {
        console.log('✅ تم رفع الفيديو بنجاح، معرف الفيديو:', result.data[0].video_id);
        return result.data[0].video_id;
      }

      throw new Error('لم يتم العثور على معرف الفيديو في الاستجابة');

    } catch (error) {
      console.error('⚠️ فشل رفع الفيديو إلى TikTok:', (error as Error).message);
      throw new Error(`فشل رفع الفيديو إلى TikTok: ${(error as Error).message}`);
    }
  }

  // رفع فيديو إلى TikTok وإرجاع video_id (الطريقة القديمة بـ URL)
  async uploadVideo(videoUrl: string): Promise<string> {
    console.log('📹 رفع الفيديو إلى TikTok...');
    
    // محاولة إنشاء URL عام مؤقت للفيديو
    let publicUrl = videoUrl;
    
    // إذا كان الفيديو من Google Cloud Storage، إنشاء URL عام مؤقت
    if (videoUrl.includes('storage.googleapis.com')) {
      try {
        console.log('🔄 محاولة إنشاء URL عام مؤقت للفيديو...');
        
        // استيراد Google Cloud Storage
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        
        // استخراج اسم الحاوية والملف من الـ URL
        const urlParts = videoUrl.split('/');
        const bucketName = urlParts[3]; // replit-objstore-...
        const fileName = urlParts.slice(4).join('/'); // .private/uploads/...
        
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);
        
        // إنشاء URL موقع مؤقت صالح لساعة واحدة
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // ساعة واحدة
        });
        
        publicUrl = signedUrl;
        console.log('✅ تم إنشاء URL عام مؤقت للفيديو');
        
      } catch (urlError) {
        console.log('⚠️ فشل في إنشاء URL عام مؤقت:', urlError.message);
        // المتابعة مع الـ URL الأصلي
      }
    }
    
    const uploadData = {
      advertiser_id: this.advertiserId,
      video_url: publicUrl,
      upload_type: "UPLOAD_BY_URL"
    };

    console.log('TikTok API Request:', 'POST', 'https://business-api.tiktok.com/open_api/v1.3/file/video/ad/upload/');
    console.log('TikTok API Request Body:', JSON.stringify(uploadData, null, 2));

    try {
      const response = await this.makeRequest('/file/video/ad/upload/', 'POST', uploadData);

      if (response.data && response.data.video_id) {
        console.log('✅ تم رفع الفيديو بنجاح:', response.data.video_id);
        return response.data.video_id;
      } else {
        throw new Error('فشل في الحصول على video_id من TikTok');
      }
    } catch (error) {
      console.log('⚠️ فشل رفع الفيديو إلى TikTok:', error.message);
      console.log('⚠️ السبب المحتمل: حجم الفيديو غير مدعوم أو URL غير صالح');
      
      // رفع خطأ لإيقاف إنشاء الإعلان
      throw new Error(`فشل رفع الفيديو إلى TikTok: ${error.message}. يرجى التأكد من أن حجم الفيديو مناسب وأنه متاح بشكل عام.`);
    }
  }

  // رفع فيديو باستخدام UPLOAD_BY_URL (من Google Cloud Storage)
  async uploadVideoFromUrl(videoUrl: string, fileName: string): Promise<string> {
    console.log('📹 رفع فيديو إلى TikTok باستخدام UPLOAD_BY_URL...');
    console.log('📊 URL الفيديو:', videoUrl);

    const requestData = {
      advertiser_id: this.advertiserId,
      upload_type: 'UPLOAD_BY_URL',
      video_url: videoUrl,
      file_name: fileName
    };
    
    console.log('TikTok API Request Data:', requestData);

    try {
      const result = await this.makeRequest('/file/video/ad/upload/', 'POST', requestData);
      
      if (result.data && result.data.video_id) {
        console.log('✅ تم رفع الفيديو بنجاح إلى TikTok:', result.data.video_id);
        return result.data.video_id;
      } else {
        throw new Error('فشل في الحصول على video_id من TikTok');
      }

    } catch (error) {
      console.error('❌ فشل رفع الفيديو إلى TikTok:', error.message);
      throw new Error(`فشل رفع الفيديو إلى TikTok: ${error.message}`);
    }
  }

  // رفع صورة مباشرة إلى TikTok باستخدام FormData
  async uploadImage(imageBuffer: Buffer, fileName: string): Promise<any> {
    console.log('🖼️ رفع صورة إلى TikTok...', fileName);

    try {
      const crypto = await import('crypto');
      const FormData = await import('form-data');

      // حساب image_signature (MD5 hash)
      const imageSignature = crypto.createHash('md5').update(imageBuffer).digest('hex');
      
      // تنظيف اسم الملف
      const timestamp = Date.now();
      const cleanFileName = `${timestamp}_${fileName.replace(/[^\w\.-]/g, '_')}`;
      
      console.log('🔐 Image signature:', imageSignature.substring(0, 16) + '...');
      console.log('📝 Clean filename:', cleanFileName);

      // إنشاء FormData
      const form = new FormData.default();
      form.append('advertiser_id', this.advertiserId);
      form.append('upload_type', 'UPLOAD_BY_FILE');
      form.append('image_signature', imageSignature);
      form.append('image_file', imageBuffer, {
        filename: cleanFileName,
        contentType: 'image/png'
      });

      // إرسال الطلب باستخدام fetch
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/file/image/ad/upload/', {
        method: 'POST',
        headers: {
          'Access-Token': this.accessToken,
          ...form.getHeaders()
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📋 TikTok Image Upload Response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`استجابة غير صالحة: ${responseText}`);
      }

      if (result.code === 0 && result.data && result.data.image_id) {
        console.log('✅ تم رفع الصورة إلى TikTok:', result.data.image_id);
        return result;
      } else {
        console.error('❌ خطأ في رفع الصورة:', result);
        throw new Error(`فشل رفع الصورة: ${result.message || 'خطأ غير معروف'}`);
      }

    } catch (error) {
      console.error('❌ فشل رفع الصورة إلى TikTok:', error.message);
      throw new Error(`فشل رفع الصورة إلى TikTok: ${error.message}`);
    }
  }

  // استخراج إطار من الفيديو وإنشاء صورة cover بأبعاد TikTok
  async createVideoCoverImage(videoBuffer: Buffer): Promise<Buffer> {
    console.log('🎬 استخراج إطار من الفيديو لإنشاء cover image...');

    try {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      const ffmpeg = (await import('fluent-ffmpeg')).default;
      const sharp = (await import('sharp')).default;
      
      // إنشاء مجلد مؤقت
      const tempDir = path.join(os.tmpdir(), 'tiktok_covers');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // حفظ الفيديو مؤقتاً
      const tempVideoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
      fs.writeFileSync(tempVideoPath, videoBuffer);
      
      // مسار الصورة المستخرجة
      const tempImagePath = path.join(tempDir, `frame_${Date.now()}.png`);
      
      // استخراج إطار من منتصف الفيديو
      await new Promise((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .screenshots({
            timestamps: ['50%'], // إطار من منتصف الفيديو
            filename: path.basename(tempImagePath),
            folder: path.dirname(tempImagePath),
            size: '720x1280' // الحد الأدنى المطلوب لـ TikTok 2025
          })
          .on('end', resolve)
          .on('error', reject);
      });
      
      console.log('✅ تم استخراج الإطار من الفيديو');
      
      // تحسين الصورة وإضافة تأثيرات باستخدام Sharp
      const processedImageBuffer = await sharp(tempImagePath)
        .resize(720, 1280, { 
          fit: 'cover', 
          position: 'center' 
        })
        .jpeg({ quality: 85 }) // JPEG أفضل لـ TikTok
        .toBuffer();
      
      // تنظيف الملفات المؤقتة
      try {
        fs.unlinkSync(tempVideoPath);
        fs.unlinkSync(tempImagePath);
      } catch (cleanupError) {
        console.log('⚠️ لم يتم حذف الملفات المؤقتة:', cleanupError.message);
      }
      
      console.log(`✅ تم إنشاء صورة cover من الفيديو بأبعاد 720×1280 (نسبة 9:16)`);
      console.log(`📏 حجم الصورة: ${Math.round(processedImageBuffer.length / 1024)}KB`);
      
      return processedImageBuffer;
      
    } catch (error) {
      console.error('❌ فشل في استخراج الصورة من الفيديو:', error.message);
      
      // في حالة فشل استخراج الصورة، استخدم صورة احتياطية
      console.log('🔄 استخدام صورة احتياطية...');
      return this.createFallbackCoverImage();
    }
  }

  // إنشاء صورة احتياطية في حالة فشل استخراج الإطار
  async createFallbackCoverImage(): Promise<Buffer> {
    const sharp = (await import('sharp')).default;
    
    // إنشاء صورة احتياطية بسيطة
    const svgImage = `
      <svg width="720" height="1280" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="720" height="1280" fill="url(#grad1)" />
        <circle cx="360" cy="640" r="150" fill="rgba(255,255,255,0.15)" />
        <text x="360" y="620" font-family="Arial" font-size="52" font-weight="bold" fill="white" text-anchor="middle">منتج مميز</text>
        <text x="360" y="680" font-family="Arial" font-size="36" fill="white" text-anchor="middle">جودة عالية</text>
        <text x="360" y="1220" font-family="Arial" font-size="24" fill="rgba(255,255,255,0.9)" text-anchor="middle">سنادي برو</text>
      </svg>
    `;
    
    return await sharp(Buffer.from(svgImage))
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  // رفع فيديو من buffer مباشرة إلى TikTok (UPLOAD_BY_FILE) - نفس طريقة PHP
  async uploadVideoFromFileV2(videoBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    console.log('📹 رفع فيديو مباشرة إلى TikTok باستخدام UPLOAD_BY_FILE...');
    console.log('📊 حجم الملف:', Math.round(videoBuffer.length / (1024 * 1024) * 100) / 100, 'MB');

    const crypto = await import('crypto');
    const FormData = await import('form-data');
    const form = new FormData.default();

    // حساب video_signature مثل PHP: md5_file
    const videoSignature = crypto.createHash('md5').update(videoBuffer).digest('hex');
    console.log('🔐 Video signature:', videoSignature.substring(0, 8) + '...');

    // إضافة timestamp لتجنب مشكلة Duplicated material name وتحويل النص العربي
    const timestamp = Date.now();
    const fileExt = fileName.split('.').pop();
    
    // تحويل النص العربي إلى أحرف إنجليزية مفهومة
    const arabicToEnglish: { [key: string]: string } = {
      'ش': 'sh', 'ط': 't', 'ا': 'a', 'ف': 'f', 'ح': 'h', 'ن': 'n', 'م': 'm',
      'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'خ': 'kh', 'د': 'd', 'ذ': 'th',
      'ر': 'r', 'ز': 'z', 'س': 's', 'ص': 's', 'ض': 'd', 'ع': 'a', 'غ': 'gh',
      'ق': 'q', 'ك': 'k', 'ل': 'l', 'و': 'w', 'ه': 'h', 'ي': 'y', 'ة': 'h',
      'أ': 'a', 'إ': 'i', 'آ': 'a', 'ؤ': 'o', 'ئ': 'i', 'ى': 'a'
    };
    
    let transliteratedName = fileName;
    Object.keys(arabicToEnglish).forEach(arabic => {
      transliteratedName = transliteratedName.replace(new RegExp(arabic, 'g'), arabicToEnglish[arabic]);
    });
    
    // تنظيف باقي الأحرف الخاصة وإبقاء الأحرف الإنجليزية والأرقام
    const cleanName = transliteratedName.replace(/[^\w\.-]/g, '_').replace(/_+/g, '_');
    const uniqueFileName = `${timestamp}_${cleanName}`;
    
    // إضافة البيانات المطلوبة بنفس ترتيب PHP
    form.append('advertiser_id', this.advertiserId);
    form.append('video_file', videoBuffer, {
      filename: uniqueFileName,
      contentType: mimeType
    });
    form.append('video_signature', videoSignature);
    form.append('upload_type', 'UPLOAD_BY_FILE');
    
    const formHeaders = form.getHeaders();
    const headers = {
      'Access-Token': this.accessToken,
      'X-Tt-Sdk-Version': 'v1.3',
      'X-Tt-Sdk-Client-Id': this.advertiserId,
      'Accept': 'application/json',
      'Expect': '', // تعطيل توقع 100 Continue مثل PHP
      ...formHeaders
    };

    console.log('TikTok API Request: POST https://business-api.tiktok.com/open_api/v1.3/file/video/ad/upload/');
    console.log('اسم الملف الفريد:', uniqueFileName);
    console.log('رؤوس الطلب:', Object.keys(headers));

    try {
      const fetch = await import('node-fetch');
      const response = await fetch.default('https://business-api.tiktok.com/open_api/v1.3/file/video/ad/upload/', {
        method: 'POST',
        headers,
        body: form,
        timeout: 300000 // 5 دقائق مثل PHP
      });

      const result = await response.json() as any;
      
      console.log('TikTok API Response Status:', response.status);
      console.log('TikTok API Response:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      if (result.code !== 0) {
        throw new Error(result.message || 'Unknown TikTok API error');
      }

      // التحقق من البيانات - يمكن أن تكون array أو object
      let videoId = null;
      if (result.data) {
        if (Array.isArray(result.data) && result.data.length > 0 && result.data[0].video_id) {
          videoId = result.data[0].video_id;
        } else if (result.data.video_id) {
          videoId = result.data.video_id;
        }
      }

      if (videoId) {
        console.log('✅ تم رفع الفيديو بنجاح إلى TikTok:', videoId);
        return videoId;
      } else {
        console.log('❌ هيكل البيانات غير متوقع:', JSON.stringify(result.data, null, 2));
        throw new Error('فشل في الحصول على video_id من TikTok');
      }

    } catch (error) {
      console.error('❌ فشل رفع الفيديو مباشرة إلى TikTok:', error.message);
      throw new Error(`فشل رفع الفيديو إلى TikTok: ${error.message}`);
    }
  }

  // تحميل فيديو من URL كـ Buffer (للدعم الكامل)
  async downloadVideoFromUrl(videoUrl: string): Promise<Buffer> {
    console.log('📥 تحميل الفيديو من Google Cloud Storage...');
    
    try {
      const fetch = await import('node-fetch');
      const response = await fetch.default(videoUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.buffer();
      console.log('✅ تم تحميل الفيديو بنجاح، الحجم:', Math.round(buffer.length / (1024 * 1024) * 100) / 100, 'MB');
      return buffer;
      
    } catch (error) {
      console.error('❌ فشل في تحميل الفيديو:', error.message);
      throw new Error(`فشل في تحميل الفيديو: ${error.message}`);
    }
  }

  // إنشاء إعلان جديد
  async createAd(adData: {
    adgroup_id: string;
    ad_name: string;
    ad_format: string; // SINGLE_IMAGE, SINGLE_VIDEO, CAROUSEL, etc
    landing_page_url: string;
    display_name?: string;
    ad_text?: string;
    call_to_action?: string;
    image_urls?: string[];
    video_url?: string;
    pixel_id?: string;
    platform_identity?: { name: string, logo?: string };
  }) {
    console.log('3️⃣ إنشاء الإعلان...');
    
    // التحقق من وجود محتوى إبداعي
    if (!adData.video_url && (!adData.image_urls || adData.image_urls.length === 0)) {
      throw new Error('يجب تحديد فيديو أو صورة للإعلان');
    }
    
    // رفع الفيديو إلى TikTok أولاً إذا كان موجوداً
    let videoId = null;
    let videoBuffer: Buffer | null = null; // حفظ buffer للاستخدام في استخراج الإطار
    
    if (adData.video_url) {
      // إذا كان video_url فعلياً هو معرف فيديو TikTok، استخدمه مباشرة
      if (!adData.video_url.startsWith('http')) {
        console.log('📹 استخدام معرف فيديو TikTok موجود:', adData.video_url);
        videoId = adData.video_url;
      } else {
        try {
          // تحميل الفيديو كـ Buffer من URL ورفعه مباشرة
          console.log('📥 تحميل الفيديو من:', adData.video_url);
          videoBuffer = await this.downloadVideoFromUrl(adData.video_url);
          const fileName = `video_${Date.now()}.mp4`;
          const mimeType = 'video/mp4';
          
          videoId = await this.uploadVideoFromFile(videoBuffer, fileName, mimeType);
        } catch (error) {
          console.error('❌ فشل في رفع الفيديو الجديد، محاولة الطريقة القديمة:', error instanceof Error ? error.message : String(error));
          // العودة للطريقة القديمة في حالة الفشل
          videoId = await this.uploadVideo(adData.video_url);
        }
      }
    }
    
    // بناء حقل creatives وفقاً لمتطلبات TikTok API
    const creatives = [];
    
    if (videoId) {
      // التحقق إذا كان video_id هو URL أم ID حقيقي
      const isRealVideoId = !videoId.startsWith('http');
      
      if (isRealVideoId) {
        // الحصول على الهوية المناسبة
        const identity = await this.getOrCreateIdentity(adData.platform_identity);
        
        // جلب صورة الغلاف الحقيقية من TikTok (مطلوبة)
        console.log('📸 جلب صورة الغلاف الحقيقية من TikTok...');
        let coverImageId = null;
        
        try {
          // انتظار قليل للسماح لـ TikTok بمعالجة الفيديو
          console.log('⏳ انتظار 5 ثوانٍ لمعالجة TikTok للفيديو...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // محاولة جلب صورة الغلاف من TikTok
          console.log('🔍 محاولة جلب معلومات الفيديو من TikTok...');
          const videoInfoResponse = await this.makeRequest(`/file/video/ad/info/?advertiser_id=${this.advertiserId}&video_ids=["${videoId}"]`, 'GET');
          
          if (videoInfoResponse.data && videoInfoResponse.data.list && videoInfoResponse.data.list.length > 0) {
            const videoInfo = videoInfoResponse.data.list[0];
            
            if (videoInfo.video_cover_url) {
              console.log('✅ وُجدت صورة غلاف من TikTok:', videoInfo.video_cover_url);
              
              // تحميل صورة الغلاف من TikTok
              const coverImageBuffer = await this.downloadVideoFromUrl(videoInfo.video_cover_url);
              
              // رفع صورة الغلاف كصورة إعلان
              const timestamp = Date.now();
              const coverName = `tiktok_cover_${timestamp}.jpg`;
              const uploadResult = await this.uploadImage(coverImageBuffer, coverName);
              coverImageId = uploadResult.data.image_id;
              console.log('✅ تم رفع صورة الغلاف الحقيقية من TikTok:', coverImageId);
            }
          }
          
          // إذا لم نجد صورة غلاف، استخدم الطريقة الافتراضية
          if (!coverImageId) {
            console.log('⚠️ لم توجد صورة غلاف من TikTok، استخدام الصورة الافتراضية...');
            const frameBuffer = await this.createFallbackCoverImage();
            const timestamp = Date.now();
            const frameName = `${timestamp}_fallback_cover.png`;
            const uploadResult = await this.uploadImage(frameBuffer, frameName);
            coverImageId = uploadResult.data.image_id;
            console.log('✅ تم رفع صورة افتراضية:', coverImageId);
          }
        } catch (error) {
          console.log('⚠️ فشل في جلب صورة الغلاف، استخدام الصورة الافتراضية:', error.message);
          try {
            const frameBuffer = await this.createFallbackCoverImage();
            const timestamp = Date.now();
            const frameName = `${timestamp}_emergency_cover.png`;
            const uploadResult = await this.uploadImage(frameBuffer, frameName);
            coverImageId = uploadResult.data.image_id;
            console.log('✅ تم رفع صورة طوارئ:', coverImageId);
          } catch (fallbackError) {
            console.error('❌ فشل في رفع حتى الصورة الافتراضية:', fallbackError.message);
            throw new Error('فشل في رفع أي صورة للإعلان - TikTok يتطلب صورة');
          }
        }
        
        // التأكد من وجود coverImageId قبل المتابعة
        if (!coverImageId) {
          console.error('❌ لا توجد صورة للإعلان - إيقاف العملية');
          throw new Error('TikTok يتطلب رفع صورة للإعلان');
        }

        const creative: any = {
          ad_name: adData.ad_name,
          ad_text: adData.ad_text || '',
          call_to_action: adData.call_to_action || 'LEARN_MORE',
          video_id: videoId,
          identity_type: identity.type,
          ad_format: "SINGLE_VIDEO"
        };

        // إضافة صورة الغلاف المطلوبة
        if (coverImageId) {
          creative.image_ids = [coverImageId];
        }
        
        // إضافة identity_id فقط إذا لم تكن UNSET
        if (identity.type !== "UNSET" && identity.id) {
          creative.identity_id = identity.id;
        }

        // التحقق من نوع الإعلان: ليدز أم عادي
        console.log('🔍 فحص نوع الإعلان (Video ID) - lead_form_id:', (adData as any).lead_form_id, 'creative_type:', (adData as any).creative_type);
        
        const isLeadAd = (adData as any).lead_form_id || (adData as any).creative_type === 'LEAD_ADS';
        
        if (isLeadAd) {
          creative.creative_type = 'LEAD_ADS';
          if ((adData as any).lead_form_id) {
            creative.lead_form_id = (adData as any).lead_form_id;
            console.log('✅ إضافة lead_form_id للإعلان:', (adData as any).lead_form_id);
          }
          console.log('🎯 إنشاء إعلان ليدز - لن يتم إضافة landing_page_url');
        } else if (adData.landing_page_url) {
          creative.landing_page_url = adData.landing_page_url;
          console.log('🔗 إنشاء إعلان عادي مع landing_page_url:', adData.landing_page_url);
        }
        
        creatives.push(creative);
      } else {
        // استخدام video_url بدلاً من video_id للـ URLs
        // الحصول على الهوية المناسبة
        const identity = await this.getOrCreateIdentity(adData.platform_identity);
        
        const creative: any = {
          ad_name: adData.ad_name,
          ad_text: adData.ad_text || '',
          call_to_action: adData.call_to_action || 'LEARN_MORE',
          video_url: videoId, // استخدام video_url للـ URLs
          identity_type: identity.type,
          ad_format: "SINGLE_VIDEO"
        };
        
        // إضافة identity_id فقط إذا لم تكن UNSET
        if (identity.type !== "UNSET" && identity.id) {
          creative.identity_id = identity.id;
        }

        // التحقق من نوع الإعلان: ليدز أم عادي
        console.log('🔍 فحص نوع الإعلان (Video URL) - lead_form_id:', (adData as any).lead_form_id, 'creative_type:', (adData as any).creative_type);
        
        const isLeadAd = (adData as any).lead_form_id || (adData as any).creative_type === 'LEAD_ADS';
        
        if (isLeadAd) {
          creative.creative_type = 'LEAD_ADS';
          if ((adData as any).lead_form_id) {
            creative.lead_form_id = (adData as any).lead_form_id;
            console.log('✅ إضافة lead_form_id للإعلان:', (adData as any).lead_form_id);
          }
          console.log('🎯 إنشاء إعلان ليدز - لن يتم إضافة landing_page_url');
        } else if (adData.landing_page_url) {
          creative.landing_page_url = adData.landing_page_url;
          console.log('🔗 إنشاء إعلان عادي مع landing_page_url:', adData.landing_page_url);
        }
        
        creatives.push(creative);
      }
    } else if (adData.image_urls && adData.image_urls.length > 0) {
      // الحصول على الهوية المناسبة
      const identity = await this.getOrCreateIdentity(adData.platform_identity);
      
      const creative: any = {
        ad_name: adData.ad_name,
        ad_text: adData.ad_text || '',
        call_to_action: adData.call_to_action || 'LEARN_MORE',
        image_ids: adData.image_urls,
        identity_type: identity.type,
        ad_format: "SINGLE_IMAGE"
      };
      
      // إضافة identity_id فقط إذا لم تكن UNSET
      if (identity.type !== "UNSET" && identity.id) {
        creative.identity_id = identity.id;
      }

      // التحقق من نوع الإعلان: ليدز أم عادي  
      console.log('🔍 فحص نوع الإعلان (Images) - lead_form_id:', (adData as any).lead_form_id, 'creative_type:', (adData as any).creative_type);
      
      const isLeadAd = (adData as any).lead_form_id || (adData as any).creative_type === 'LEAD_ADS';
      
      if (isLeadAd) {
        creative.creative_type = 'LEAD_ADS';
        if ((adData as any).lead_form_id) {
          creative.lead_form_id = (adData as any).lead_form_id;
          console.log('✅ إضافة lead_form_id للإعلان:', (adData as any).lead_form_id);
        }
        console.log('🎯 إنشاء إعلان ليدز - لن يتم إضافة landing_page_url');
      } else if (adData.landing_page_url) {
        creative.landing_page_url = adData.landing_page_url;
        console.log('🔗 إنشاء إعلان عادي مع landing_page_url:', adData.landing_page_url);
      }
      
      creatives.push(creative);
    }

    const requestData = {
      advertiser_id: this.advertiserId,
      adgroup_id: adData.adgroup_id,
      creatives: creatives
    };

    console.log('TikTok API Request:', 'POST', 'https://business-api.tiktok.com/open_api/v1.3/ad/create/');
    console.log('TikTok API Request Body:', JSON.stringify(requestData, null, 2));
    
    const response = await this.makeRequest('/ad/create/', 'POST', requestData);
    
    console.log('✅ تم إنشاء الإعلان بنجاح:', response.data.ad_ids?.[0] || response.data.ad_id);
    return response;
  }

  // تحديث إعلان
  async updateAd(adId: string, updateData: {
    ad_name?: string;
    landing_page_url?: string;
    ad_text?: string;
    call_to_action?: string;
  }) {
    return this.makeRequest('/ad/update/', 'POST', {
      advertiser_id: this.advertiserId,
      ad_id: adId,
      ...updateData
    });
  }

  // تحديث حالة إعلان
  async updateAdStatus(adId: string, status: 'ENABLE' | 'DISABLE' | 'DELETE') {
    return this.makeRequest('/ad/status/update/', 'POST', {
      advertiser_id: this.advertiserId,
      ad_ids: [adId], // يجب أن تكون مصفوفة مثل باقي endpoints
      operation_status: status
    });
  }

  // ==================== LEAD FORMS ====================

  // جلب نماذج العملاء المحتملين
  async getLeadForms() {
    return this.makeRequest(`/leadgen/form/get/?advertiser_id=${this.advertiserId}`);
  }

  // إنشاء نموذج عملاء محتملين - Lead Generation Form API
  async createLeadForm(formData: {
    name: string;
    form_title: string;
    form_description?: string;
    privacy_policy_url?: string;
    form_fields: Array<{
      field_type: string; // NAME, PHONE, EMAIL, CUSTOM
      field_name?: string;
      is_required: boolean;
    }>;
    success_message?: string;
  }) {
    const endpoint = '/lead/gen_form/create/';
    
    const requestData = {
      advertiser_id: this.advertiserId,
      form_name: formData.name,
      description: formData.form_description || `نموذج جمع العملاء المحتملين لـ ${formData.name}`,
      privacy_policy_url: formData.privacy_policy_url,
      fields: formData.form_fields.map(field => ({
        field_type: field.field_type,
        is_required: field.is_required,
        field_name: field.field_name
      }))
    };

    console.log('📤 إرسال طلب إنشاء نموذج ليدز:', JSON.stringify(requestData, null, 2));
    
    try {
      const response = await this.makeRequest(endpoint, 'POST', requestData);
      console.log('✅ تم إنشاء نموذج الليدز بنجاح:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ خطأ في إنشاء نموذج الليدز:', error);
      console.error('❌ التفاصيل:', error.message);
      throw error; // إعادة إرسال الخطأ بدلاً من إخفاؤه
    }
  }

  // جلب العملاء المحتملين
  async getLeads(formId?: string, startDate?: string, endDate?: string) {
    let endpoint = `/leadgen/lead/get/?advertiser_id=${this.advertiserId}`;
    if (formId) {
      endpoint += `&form_id=${formId}`;
    }
    if (startDate) {
      endpoint += `&start_date=${startDate}`;
    }
    if (endDate) {
      endpoint += `&end_date=${endDate}`;
    }
    return this.makeRequest(endpoint);
  }

  // ==================== PIXELS MANAGEMENT ====================

  // جلب جميع البكسلات مع الأحداث
  async getPixels() {
    const params = {
      advertiser_id: this.advertiserId,
      page_size: 20
    };
    
    const response = await this.makeRequest(`/pixel/list/?advertiser_id=${this.advertiserId}&page_size=20`);
    
    // استخراج الأحداث الفعلية من مصفوفة events[] لكل بكسل
    if (response && response.pixels && Array.isArray(response.pixels)) {
      const processedPixels = response.pixels.map((p: any) => {
        const events = [];
        if (!this.empty(p.events) && Array.isArray(p.events)) {
          for (const evt of p.events) {
            const type = evt.event_type || evt.custom_event_type || '';
            // TikTok API عادةً يضع حالة الحدث في مفتاح deprecated أو activity_status أو event_status
            let status = 'unknown';
            if (evt.deprecated && evt.deprecated) {
              status = 'Inactive';
            } else if (evt.activity_status) {
              status = evt.activity_status;
            } else if (evt.event_status) {
              status = evt.event_status;
            } else {
              // افتراض: إذا كان deprecated فارغ أو غير موجود، اعتبره Active
              status = (!evt.deprecated || !evt.deprecated) ? 'Active' : 'Inactive';
            }
            if (type) {
              events.push({
                type: type,
                status: status
              });
            }
          }
        }
        
        return {
          pixel_id: p.pixel_id, // الرقم الذي يطلبه TikTok API
          pixel_code: p.pixel_code, // الكود النصي للعرض فقط
          pixel_name: p.pixel_name || '',
          events: events
        };
      });
      
      return {
        ...response,
        pixels: processedPixels
      };
    }
    
    return response;
  }

  // Helper function to check if array is empty
  private empty(arr: any): boolean {
    return !arr || (Array.isArray(arr) && arr.length === 0);
  }

  // جلب معلومات حساب TikTok الشخصي المرتبط
  async getUserProfile(): Promise<any> {
    try {
      // أولاً جلب معلومات المستخدم الأساسية
      const response = await this.makeRequest('/user/info/', 'GET');
      console.log('🔍 استجابة معلومات المستخدم من TikTok API:', response);
      
      if (response.data) {
        console.log('✅ تم جلب معلومات المستخدم بنجاح');
        console.log('✅ تم جلب هوية المستخدم الحقيقية:', response.data.display_name);
        
        let avatarUrl = response.data.avatar_url;
        
        // محاولة جلب الصورة من مصادر إضافية إذا كانت فارغة
        if (!avatarUrl || avatarUrl === '') {
          console.log('🔍 الصورة الشخصية فارغة، محاولة جلبها من مصادر أخرى...');
          
          // محاولة 1: Business Center
          try {
            console.log('🔍 محاولة جلب الصورة من Business Center...');
            const bcResponse = await this.makeRequest('/bc/get/', 'GET');
            console.log('📄 استجابة Business Center:', JSON.stringify(bcResponse, null, 2));
            
            if (bcResponse.data && bcResponse.data.list && bcResponse.data.list.length > 0) {
              const businessCenter = bcResponse.data.list[0];
              if (businessCenter.profile_image_url) {
                avatarUrl = businessCenter.profile_image_url;
                console.log('✅ تم جلب الصورة من Business Center:', avatarUrl);
              } else if (businessCenter.avatar_url) {
                avatarUrl = businessCenter.avatar_url;
                console.log('✅ تم جلب الصورة من أفاتار Business Center:', avatarUrl);
              }
            }
          } catch (bcError) {
            console.log('⚠️ لا يمكن جلب الصورة من Business Center:', bcError.message);
          }
        }
        
        // محاولة 2: معلومات المعلن
        if (!avatarUrl || avatarUrl === '') {
          try {
            console.log('🔍 محاولة جلب الصورة من معلومات المعلن...');
            const advResponse = await this.makeRequest(`/advertiser/info/?advertiser_ids=${encodeURIComponent(JSON.stringify([this.advertiserId]))}`, 'GET');
            console.log('📄 استجابة معلومات المعلن:', JSON.stringify(advResponse, null, 2));
            
            if (advResponse.data && advResponse.data.list && advResponse.data.list.length > 0) {
              const advertiser = advResponse.data.list[0];
              if (advertiser.company_logo_url) {
                avatarUrl = advertiser.company_logo_url;
                console.log('✅ تم جلب الصورة من شعار الشركة:', avatarUrl);
              } else if (advertiser.avatar_url) {
                avatarUrl = advertiser.avatar_url;
                console.log('✅ تم جلب الصورة من أفاتار المعلن:', avatarUrl);
              } else if (advertiser.profile_image) {
                avatarUrl = advertiser.profile_image;
                console.log('✅ تم جلب الصورة من صورة الملف الشخصي:', avatarUrl);
              }
            }
          } catch (advError) {
            console.log('⚠️ لا يمكن جلب الصورة من معلومات المعلن:', advError.message);
          }
        }
        
        // تسجيل النتيجة النهائية
        if (avatarUrl && avatarUrl !== '') {
          console.log('🎉 تم العثور على صورة شخصية أصلية:', avatarUrl);
        } else {
          console.log('⚠️ لم يتم العثور على صورة شخصية أصلية، سيتم استخدام الصورة الافتراضية');
        }
        
        return {
          user_id: response.data.core_user_id,
          username: response.data.username || null,
          display_name: response.data.display_name,
          avatar_url: avatarUrl,
          email: response.data.email,
          phone_number: response.data.phone_number || null,
          country: response.data.country || null
        };
      }
      
      console.log('⚠️ لم يتم العثور على معلومات المستخدم');
      return null;
    } catch (error) {
      console.error('❌ خطأ في جلب معلومات المستخدم:', error);
      
      // جربنا endpoint بديل لمعلومات الحساب
      try {
        console.log('🔄 جاري المحاولة مع endpoint بديل...');
        const altResponse = await this.makeRequest(`/advertiser/info/?advertiser_ids=${encodeURIComponent(JSON.stringify([this.advertiserId]))}`, 'GET');
        
        console.log('🔍 استجابة المعلن البديلة:', altResponse);
        
        if (altResponse.data && altResponse.data.list && altResponse.data.list[0]) {
          console.log('✅ تم جلب معلومات المعلن بنجاح');
          const advertiser = altResponse.data.list[0];
          return {
            user_id: advertiser.advertiser_id,
            username: advertiser.advertiser_name || null,
            display_name: advertiser.company || advertiser.advertiser_name,
            avatar_url: advertiser.company_logo_url || advertiser.avatar_url || null,
            email: advertiser.email || null,
            phone_number: advertiser.phone_number || null,
            country: advertiser.country || null
          };
        }
      } catch (altError) {
        console.error('❌ خطأ في جلب معلومات المعلن:', altError);
      }
      
      return null;
    }
  }

  // جلب الهويات المتاحة
  async getIdentities(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/identity/get/', 'GET', {
        advertiser_id: this.advertiserId
      });
      
      console.log('🔍 استجابة الهويات من TikTok API:', response);
      
      if (response.data && response.data.list) {
        console.log(`✅ تم العثور على ${response.data.list.length} هوية`);
        return response.data.list;
      }
      
      console.log('⚠️ لم يتم العثور على هويات في الاستجابة');
      return [];
    } catch (error) {
      console.error('❌ خطأ في جلب الهويات:', error);
      return [];
    }
  }

  // إنشاء هوية مخصصة للمنصة
  async createPlatformIdentity(platformData: { name: string, logo?: string }): Promise<string | null> {
    try {
      const identityData: any = {
        advertiser_id: this.advertiserId,
        identity_type: "CUSTOMIZED_USER",
        display_name: platformData.name || "منصة التجارة الإلكترونية",
        identity_authorized_bc_id: this.advertiserId
      };

      // إضافة الشعار إذا كان متوفراً
      if (platformData.logo) {
        identityData.avatar_icon_web_uri = platformData.logo;
        console.log('🖼️ إضافة صورة الهوية:', platformData.logo);
      } else {
        console.log('⚠️ لا توجد صورة هوية متاحة للإرسال');
      }

      const response = await this.makeRequest('/identity/create/', 'POST', identityData);
      
      if (response.data && response.data.identity_id) {
        console.log(`✅ تم إنشاء هوية مخصصة: ${response.data.identity_id}`);
        return response.data.identity_id;
      }
      
      console.log('⚠️ فشل في إنشاء الهوية المخصصة');
      return null;
    } catch (error) {
      console.error('❌ خطأ في إنشاء الهوية المخصصة:', error);
      return null;
    }
  }

  // الحصول على أو إنشاء هوية للإعلانات
  async getOrCreateIdentity(platformData?: { name: string, logo?: string }): Promise<{ id: string, type: string }> {
    try {
      // جلب الهويات الموجودة أولاً
      const identities = await this.getIdentities();
      
      if (identities.length > 0) {
        // استخدام أول هوية متاحة
        const identity = identities[0];
        console.log(`🎯 استخدام الهوية الموجودة: ${identity.identity_id} (${identity.identity_type})`);
        return {
          id: identity.identity_id,
          type: identity.identity_type
        };
      }
      
      // إذا لم توجد هويات، إنشاء هوية مخصصة
      if (platformData) {
        const customIdentityId = await this.createPlatformIdentity(platformData);
        if (customIdentityId) {
          return {
            id: customIdentityId,
            type: "CUSTOMIZED_USER"
          };
        }
      }
      
      // الخيار الأخير: استخدام UNSET
      console.log('⚠️ لم يتم العثور على هويات، استخدام UNSET');
      return {
        id: "",
        type: "UNSET"
      };
    } catch (error) {
      console.error('❌ خطأ في الحصول على الهوية:', error);
      return {
        id: "",
        type: "UNSET"
      };
    }
  }

  // إنشاء بكسل جديد
  async createPixel(pixelData: {
    pixel_name: string;
    pixel_mode?: string; // STANDARD_MODE, CONVERSIONS_API_MODE
  }) {
    return this.makeRequest('/pixel/create/', 'POST', {
      advertiser_id: this.advertiserId,
      ...pixelData
    });
  }

  // ==================== REPORTING & ANALYTICS ====================


  // تقرير أداء الفيديوهات باستخدام الصلاحيات الإضافية  
  async getVideoPerformanceReport(adIds: string[], startDate: string, endDate: string) {
    console.log(`جلب تقرير أداء الفيديوهات: ${adIds.join(', ')} من ${startDate} إلى ${endDate}`);
    
    const dimensions = JSON.stringify(['ad_id']);
    const metrics = JSON.stringify(['impressions', 'clicks', 'spend', 'video_play_actions', 'video_views_p25', 'video_views_p50', 'video_views_p75', 'video_views_p100']);
    const filters = JSON.stringify([{
      field_name: 'ad_ids',
      filter_type: 'IN', 
      filter_value: adIds
    }]);
    
    const params = new URLSearchParams({
      advertiser_id: this.advertiserId,
      report_type: 'BASIC',
      data_level: 'AUCTION_AD',
      dimensions,
      metrics,
      start_date: startDate,
      end_date: endDate,
      page_size: '200',
      filters
    });

    return this.makeRequest(`/report/video_performance/get/?${params.toString()}`, 'GET');
  }

  // تقرير حملات محددة باستخدام SPC
  async getCampaignSPCReport(campaignIds: string[], startDate: string, endDate: string) {
    console.log(`جلب تقرير SPC للحملات: ${campaignIds.join(', ')} من ${startDate} إلى ${endDate}`);
    
    const params = new URLSearchParams({
      advertiser_id: this.advertiserId,
      campaign_ids: JSON.stringify(campaignIds),
      start_date: startDate,
      end_date: endDate,
      page_size: '200'
    });

    return this.makeRequest(`/campaign/spc/report/get/?${params.toString()}`, 'GET');
  }

  // تقرير أداء الحملات وفقاً لوثائق TikTok الرسمية
  async getCampaignReport(campaignIds: string[], startDate: string, endDate: string) {
    console.log(`جلب تقرير للحملات: ${campaignIds.join(', ')} من ${startDate} إلى ${endDate}`);
    
    const requestBody = {
      advertiser_id: this.advertiserId,
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: ['campaign_id'],
      metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpm', 'cpc', 'conversion', 'conversion_cost', 'result', 'conversion_rate', 'result_rate'],
      start_date: startDate,
      end_date: endDate,
      page_size: 200,
      filters: [{
        field_name: 'campaign_ids', 
        filter_type: 'IN',
        filter_value: campaignIds
      }]
    };
    
    console.log('TikTok Campaign Report Request:', JSON.stringify(requestBody, null, 2));
    
    const params = new URLSearchParams({
      advertiser_id: this.advertiserId,
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: JSON.stringify(['campaign_id']),
      metrics: JSON.stringify(['spend', 'impressions', 'clicks', 'ctr', 'cpm', 'cpc', 'conversion', 'conversion_cost', 'result', 'conversion_rate', 'result_rate']),
      start_date: startDate,
      end_date: endDate,
      page_size: '200',
      filters: JSON.stringify([{
        field_name: 'campaign_ids',
        filter_type: 'IN',
        filter_value: campaignIds
      }])
    });
    
    console.log('TikTok Campaign Report GET Request:', `GET /report/integrated/get/?${params.toString()}`);
    return this.makeRequest(`/report/integrated/get/?${params.toString()}`, 'GET');
  }

  // تقرير مبسط للحملات (لآخر 7 أيام) باستخدام GET
  async getSimpleCampaignStats(campaignIds: string[]) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    console.log(`جلب إحصائيات مبسطة للحملات: ${campaignIds.join(', ')}`);
    
    try {
      const dimensions = JSON.stringify(['campaign_id']);
      const metrics = JSON.stringify(['impressions', 'clicks', 'spend', 'ctr', 'cpm', 'cpc', 'conversions', 'conversion_rate', 'conversion_cost', 'result', 'result_rate']);
      const filters = JSON.stringify([{
        field_name: 'campaign_ids',
        filter_type: 'IN',
        filter_value: campaignIds
      }]);
      
      const queryParams = new URLSearchParams({
        advertiser_id: this.advertiserId,
        report_type: 'BASIC',
        data_level: 'AUCTION_CAMPAIGN',
        dimensions: dimensions,
        metrics: metrics,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        page_size: '200',
        filters: filters
      });
      
      const endpoint = `/report/integrated/get/?${queryParams.toString()}`;
      return await this.makeRequest(endpoint, 'GET');
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات المبسطة:', error);
      throw error;
    }
  }

  // تقرير أداء مجموعات الإعلانات
  async getAdGroupReport(adGroupIds: string[], startDate: string, endDate: string) {
    const params = new URLSearchParams({
      advertiser_id: this.advertiserId,
      report_type: 'BASIC',
      data_level: 'AUCTION_ADGROUP',
      dimensions: JSON.stringify(['adgroup_id']),
      metrics: JSON.stringify([
        'impressions',
        'clicks',
        'spend',
        'cpm',
        'cpc',
        'ctr',
        'conversions',
        'conversion_rate'
      ]),
      start_date: startDate,
      end_date: endDate,
      page_size: '200',
      filters: JSON.stringify([{
        field_name: 'adgroup_ids',
        filter_type: 'IN',
        filter_value: adGroupIds
      }])
    });
    
    return this.makeRequest(`/report/integrated/get/?${params.toString()}`, 'GET');
  }

  // تقرير أداء الإعلانات
  async getAdReport(adIds: string[], startDate: string, endDate: string) {
    const params = new URLSearchParams({
      advertiser_id: this.advertiserId,
      report_type: 'BASIC',
      data_level: 'AUCTION_AD',
      dimensions: JSON.stringify(['ad_id']),
      metrics: JSON.stringify([
        'impressions',
        'clicks',
        'spend',
        'cpm',
        'cpc',
        'ctr',
        'conversions',
        'conversion_rate',
        'video_play_actions',
        'video_watched_2s',
        'video_watched_6s'
      ]),
      start_date: startDate,
      end_date: endDate,
      page_size: '200',
      filters: JSON.stringify([{
        field_name: 'ad_ids',
        filter_type: 'IN',
        filter_value: adIds
      }])
    });
    
    return this.makeRequest(`/report/integrated/get/?${params.toString()}`, 'GET');
  }

  // ==================== PIXELS & TRACKING ====================

  // جلب Pixels مع الأحداث من TikTok API
  async getPixels() {
    const endpoint = `/pixel/list/?advertiser_id=${this.advertiserId}`;
    console.log(`📡 إرسال طلب جلب البكسلات: GET ${this.baseUrl}${endpoint}`);
    
    try {
      const response = await this.makeRequest(endpoint, 'GET');
      console.log('🔍 نوع استجابة TikTok API:', typeof response, Array.isArray(response) ? 'مصفوفة' : 'كائن');
      console.log('🔍 محتوى استجابة TikTok API:', {
        isArray: Array.isArray(response),
        hasData: !!response?.data,
        hasPixels: !!response?.data?.pixels,
        directPixelsCount: Array.isArray(response) ? response.length : 'ليس مصفوفة',
        dataPixelsCount: response?.data?.pixels?.length || 'لا توجد'
      });
      
      let pixels = [];
      
      // استخراج البكسلات من أي بنية
      if (Array.isArray(response)) {
        pixels = response;
      } else if (response?.pixels && Array.isArray(response.pixels)) {
        pixels = response.pixels;
      } else if (response?.data?.pixels && Array.isArray(response.data.pixels)) {
        pixels = response.data.pixels;
      }
      
      if (pixels.length > 0) {
        console.log(`✅ تم العثور على ${pixels.length} بكسل`);
        
        // معالجة البكسلات لاستخراج الأحداث المتاحة
        const processedPixels = pixels.map((pixel: any) => {
          const events = [];
          
          // استخراج الأحداث من مصفوفة events إذا كانت موجودة
          if (pixel.events && Array.isArray(pixel.events)) {
            for (const event of pixel.events) {
              const eventType = event.event_type || event.custom_event_type || '';
              
              // تحديد حالة الحدث
              let status = 'Active';
              if (event.deprecated === true) {
                status = 'Inactive';
              } else if (event.activity_status) {
                status = event.activity_status;
              } else if (event.event_status) {
                status = event.event_status;
              }
              
              if (eventType) {
                events.push({
                  type: eventType,
                  status: status,
                  name: event.event_name || eventType
                });
              }
            }
          }
          
          // إضافة أحداث افتراضية شائعة إذا لم توجد أحداث
          if (events.length === 0) {
            events.push(
              { type: 'COMPLETE_PAYMENT', status: 'Active', name: 'Complete Payment' },
              { type: 'ADD_TO_CART', status: 'Active', name: 'Add to Cart' },
              { type: 'VIEW_CONTENT', status: 'Active', name: 'View Content' },
              { type: 'INITIATE_CHECKOUT', status: 'Active', name: 'Initiate Checkout' }
            );
          }
          
          return {
            pixel_id: pixel.pixel_id,
            pixel_code: pixel.pixel_code,
            pixel_name: pixel.pixel_name || '',
            pixel_mode: pixel.pixel_mode || 'STANDARD_MODE',
            events: events
          };
        });
        
        return processedPixels;
      }
      
      console.log('⚠️ لم يتم العثور على بكسلات، إرجاع مصفوفة فارغة');
      return [];
    } catch (error) {
      console.error('❌ خطأ في جلب البكسلات من TikTok:', error);
      throw error;
    }
  }

  // إنشاء Pixel
  async createPixel(pixelData: {
    pixel_name: string;
    pixel_mode: string; // MANUAL_MODE, CONVERSIONS_API_MODE, DEVELOPER_MODE
  }) {
    return this.makeRequest('/pixel/create/', 'POST', {
      advertiser_id: this.advertiserId,
      ...pixelData
    });
  }

  // تحديث Pixel
  async updatePixel(pixelId: string, updateData: {
    pixel_name?: string;
    pixel_mode?: string;
  }) {
    return this.makeRequest('/pixel/update/', 'POST', {
      advertiser_id: this.advertiserId,
      pixel_id: pixelId,
      ...updateData
    });
  }

  // إنشاء حدث Pixel
  async createPixelEvent(pixelId: string, eventData: {
    event_type: string; // PAGE_VIEW, PURCHASE, ADD_TO_CART, CONTACT, etc.
    event_name?: string;
    currency?: string;
    value?: number;
    optimization_event?: string;
  }) {
    return this.makeRequest('/pixel/event/create/', 'POST', {
      advertiser_id: this.advertiserId,
      pixel_id: pixelId,
      ...eventData
    });
  }

  // تحديث حدث Pixel
  async updatePixelEvent(pixelId: string, eventId: string, eventData: {
    event_type?: string;
    event_name?: string;
    currency?: string;
    value?: number;
  }) {
    return this.makeRequest('/pixel/event/update/', 'POST', {
      advertiser_id: this.advertiserId,
      pixel_id: pixelId,
      event_id: eventId,
      ...eventData
    });
  }

  // حذف حدث Pixel
  async deletePixelEvent(pixelId: string, eventId: string) {
    return this.makeRequest('/pixel/event/delete/', 'POST', {
      advertiser_id: this.advertiserId,
      pixel_id: pixelId,
      event_id: eventId
    });
  }

  // إنشاء حدث Instant Page
  async createInstantPageEvent(pixelId: string, pageData: {
    page_url: string;
    event_type: string;
  }) {
    return this.makeRequest('/pixel/instant_page/event/', 'POST', {
      advertiser_id: this.advertiserId,
      pixel_id: pixelId,
      ...pageData
    });
  }

  // إحصائيات أحداث Pixel
  async getPixelEventStats(pixelId: string, startDate: string, endDate: string) {
    return this.makeRequest('/pixel/event/stats/', 'POST', {
      advertiser_id: this.advertiserId,
      pixel_id: pixelId,
      start_date: startDate,
      end_date: endDate
    });
  }

  // تقرير صحة Pixel
  async getPixelHealthReport(pixelId: string) {
    return this.makeRequest('/pixel/event/health_reporting/', 'POST', {
      advertiser_id: this.advertiserId,
      pixel_id: pixelId
    });
  }

  // ==================== AUDIENCE TARGETING ====================

  // جلب اهتمامات الجمهور
  async getInterests(keyword?: string) {
    let endpoint = `/audience/interest/get/?advertiser_id=${this.advertiserId}`;
    if (keyword) {
      endpoint += `&keyword=${encodeURIComponent(keyword)}`;
    }
    return this.makeRequest(endpoint);
  }

  // جلب سلوكيات الجمهور
  async getBehaviors() {
    return this.makeRequest(`/audience/behavior/get/?advertiser_id=${this.advertiserId}`);
  }

  // جلب المواقع الجغرافية
  async getLocations(keyword?: string, locationType: string = 'COUNTRY') {
    let endpoint = `/audience/location/get/?advertiser_id=${this.advertiserId}&location_type=${locationType}`;
    if (keyword) {
      endpoint += `&keyword=${encodeURIComponent(keyword)}`;
    }
    return this.makeRequest(endpoint);
  }

  // ==================== CREATIVE MANAGEMENT ====================



  // رفع فيديو (وظيفة قديمة - سيتم استبدالها بالوظيفة الجديدة أعلاه)
  async uploadVideoLegacy(videoFile: Buffer, fileName: string) {
    // This would need to be implemented with proper file upload handling
    return this.makeRequest('/file/video/ad/upload/', 'POST', {
      advertiser_id: this.advertiserId,
      upload_type: 'UPLOAD_BY_URL'
    });
  }

  // جلب المواد الإبداعية
  async getCreatives() {
    return this.makeRequest(`/file/image/ad/get/?advertiser_id=${this.advertiserId}`);
  }

  // جلب معلومات الفيديو بما في ذلك صورة الغلاف
  async getVideoInfo(videoId: string): Promise<any> {
    try {
      // جربنا endpoints مختلفة لجلب معلومات الفيديو
      const endpoints = [
        `/file/video/ad/get/?advertiser_id=${this.advertiserId}&video_ids=${videoId}`,
        `/file/video/get/?advertiser_id=${this.advertiserId}&video_ids=${videoId}`,
        `/creative/get/?advertiser_id=${this.advertiserId}&filtering={"video_ids":["${videoId}"]}`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 جرب endpoint: ${endpoint}`);
          const response = await this.makeRequest(endpoint, 'GET');
          
          if (response.data && response.data.list && response.data.list.length > 0) {
            const videoInfo = response.data.list[0];
            console.log(`✅ وجدت معلومات الفيديو من ${endpoint}`);
            return {
              video_id: videoInfo.video_id,
              video_cover_url: videoInfo.video_cover_url || videoInfo.cover_image_uri || videoInfo.image_url,
              preview_url: videoInfo.preview_url,
              displayable: videoInfo.displayable,
              duration: videoInfo.duration,
              width: videoInfo.width,
              height: videoInfo.height
            };
          }
        } catch (endpointError) {
          console.log(`⚠️ فشل endpoint ${endpoint}: ${endpointError.message}`);
          continue;
        }
      }
      
      console.log(`⚠️ لم يتم العثور على معلومات للفيديو: ${videoId} في جميع endpoints`);
      return null;
    } catch (error) {
      console.error(`❌ خطأ عام في جلب معلومات الفيديو ${videoId}:`, error);
      return null;
    }
  }
}

// Helper function to get TikTok API instance for a platform
export async function getTikTokAPIForPlatform(platformId: string): Promise<TikTokBusinessAPI | null> {
  // Import storage here to avoid circular dependency
  const { storage } = await import('./storage');
  
  try {
    // جلب access token من جدول platforms
    const accessToken = await storage.getPlatformAdToken('tiktok', platformId);
    if (!accessToken) {
      return null;
    }

    // جلب advertiser ID من جدول platforms
    const advertiserIdToken = await storage.getPlatformAdToken('tiktok_advertiser', platformId);
    const advertiserId = advertiserIdToken || '7490978048867794960';
    
    return new TikTokBusinessAPI(accessToken, advertiserId);
  } catch (error) {
    console.error('Error creating TikTok API instance:', error);
    return null;
  }
}

// Sync functions لمزامنة البيانات من TikTok API إلى قاعدة البيانات المحلية
export async function syncTikTokCampaigns(platformId: string) {
  const api = await getTikTokAPIForPlatform(platformId);
  if (!api) {
    throw new Error('TikTok API not available for this platform');
  }

  const { storage } = await import('./storage');
  
  try {
    console.log(`Fetching all campaign types for platform ${platformId}`);
    
    // جلب الحملات العادية
    const regularCampaigns = await api.getCampaigns();
    console.log(`Regular campaigns response:`, JSON.stringify(regularCampaigns, null, 2));
    console.log(`Regular campaigns found: ${regularCampaigns.data?.list?.length || 0}`);
    
    // إضافة معلومات إضافية عن API call
    console.log(`API endpoint used: /campaign/get/?advertiser_id=${api.advertiserId}`);
    
    // جلب حملات Smart Plus
    let smartPlusCampaigns = { data: { list: [] } };
    try {
      smartPlusCampaigns = await api.getSmartPlusCampaigns();
      console.log(`Smart Plus campaigns found: ${smartPlusCampaigns.data?.list?.length || 0}`);
    } catch (error: any) {
      console.log('Smart Plus campaigns not available or error:', error.message);
    }
    
    // تخطي حملات GMV Max حتى نحل مشكلة API
    let gmvMaxCampaigns = { data: { list: [] } };
    console.log('تخطي GMV Max campaigns لتجنب مشاكل API');
    
    // دمج جميع الحملات - استخدام البنية الصحيحة للبيانات
    const allCampaigns = [
      ...(regularCampaigns.data?.list || []),
      ...(smartPlusCampaigns.data?.list || []),
      ...(gmvMaxCampaigns.data?.list || [])
    ];
    
    console.log(`Total campaigns to sync: ${allCampaigns.length}`);
    
    if (allCampaigns.length === 0) {
      console.log('⚠️ No campaigns returned from TikTok API - this might be a permissions issue');
      return [];
    }
    
    // حفظ أو تحديث كل حملة في قاعدة البيانات
    for (const campaign of allCampaigns) {
      console.log(`TikTok Campaign raw data:`, {
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name,
        status: campaign.status,
        primary_status: campaign.primary_status,
        secondary_status: campaign.secondary_status,
        operation_status: campaign.operation_status
      });
      
      // الحصول على الحملة الموجودة من قاعدة البيانات للتحقق من آخر تحديث
      const existingCampaign = await storage.getTikTokCampaignByCampaignId(campaign.campaign_id);
      
      // استخدم operation_status من TikTok، ولكن اتركها كما هي إذا تم تحديثها محلياً مؤخراً
      let finalStatus = campaign.operation_status || 'DISABLE';
      if (existingCampaign && existingCampaign.updatedAt) {
        const timeSinceUpdate = Date.now() - new Date(existingCampaign.updatedAt).getTime();
        // إذا تم تحديث الحملة محلياً خلال آخر دقيقتين، احتفظ بالحالة المحلية
        if (timeSinceUpdate < 120000) { // 2 minutes instead of 30 seconds
          finalStatus = existingCampaign.status;
          console.log(`Keeping local status ${finalStatus} for campaign ${campaign.campaign_id} (updated ${Math.round(timeSinceUpdate/1000)}s ago)`);
        }
      }
      
      const campaignData = {
        platformId,
        campaignId: campaign.campaign_id,
        advertiserId: campaign.advertiser_id,
        campaignName: campaign.campaign_name,
        objective: campaign.objective,
        status: finalStatus,
        budgetMode: campaign.budget_mode || 'BUDGET_MODE_INFINITE',
        budget: campaign.budget ? campaign.budget.toString() : null,
        startTime: campaign.start_time ? new Date(campaign.start_time) : null,
        endTime: campaign.end_time ? new Date(campaign.end_time) : null,
      };

      console.log(`Saving campaign with status: ${campaignData.status}`);
      
      // تحديث الحملة فقط إذا تغيرت البيانات أو لم تُحدث منذ فترة طويلة
      let shouldUpdate = true;
      if (existingCampaign) {
        const hasStatusChanged = existingCampaign.status !== finalStatus;
        const hasOtherChanges = 
          existingCampaign.campaignName !== campaignData.campaignName ||
          existingCampaign.objective !== campaignData.objective ||
          existingCampaign.budgetMode !== campaignData.budgetMode;
        
        if (!hasStatusChanged && !hasOtherChanges) {
          shouldUpdate = false;
          console.log(`Campaign ${campaign.campaign_id} unchanged, skipping update`);
        }
      }
      
      if (shouldUpdate) {
        try {
          // حفظ الحملة
          await storage.upsertTikTokCampaign(campaign.campaign_id, campaignData);
          console.log(`✅ Successfully saved campaign: ${campaign.campaign_name}`);
        } catch (saveError) {
          console.error(`❌ Failed to save campaign ${campaign.campaign_id}:`, saveError.message);
        }
      }
    }
    
    // حذف الحملات التي لم تعد موجودة في TikTok
    const existingCampaigns = await storage.getTikTokCampaigns(platformId);
    const tiktokCampaignIds = allCampaigns.map(c => c.campaign_id);
    
    for (const existingCampaign of existingCampaigns) {
      if (!tiktokCampaignIds.includes(existingCampaign.campaignId)) {
        console.log(`Campaign ${existingCampaign.campaignId} no longer exists in TikTok, deleting from database`);
        
        // حذف الإعلانات والمجموعات الإعلانية المرتبطة بالحملة أولاً
        const campaignAdGroups = await storage.getTikTokAdGroups(platformId);
        for (const adGroup of campaignAdGroups) {
          if (adGroup.campaignId === existingCampaign.id) {
            // حذف الإعلانات المرتبطة بهذه المجموعة الإعلانية
            const adGroupAds = await storage.getTikTokAds(platformId, undefined, adGroup.id);
            for (const ad of adGroupAds) {
              await storage.deleteTikTokAd(ad.id);
            }
            // حذف المجموعة الإعلانية
            await storage.deleteTikTokAdGroup(adGroup.id);
          }
        }
        
        // الآن يمكن حذف الحملة بأمان
        await storage.deleteTikTokCampaign(existingCampaign.id);
      }
    }
    
    console.log(`Synced ${allCampaigns.length} TikTok campaigns for platform ${platformId}`);
    return allCampaigns;
  } catch (error) {
    console.error('Error syncing TikTok campaigns:', error);
    throw error;
  }
}

export async function syncTikTokAdGroups(platformId: string, campaignId?: string) {
  const api = await getTikTokAPIForPlatform(platformId);
  if (!api) {
    throw new Error('TikTok API not available for this platform');
  }

  const { storage } = await import('./storage');
  
  try {
    console.log(`🔍 Getting ad groups for campaignId: ${campaignId || 'ALL'}`);
    const adGroups = await api.getAdGroups(campaignId);
    console.log(`📊 TikTok Ad Groups API Response:`, JSON.stringify(adGroups, null, 2));
    console.log(`📈 Ad groups found: ${adGroups.data?.list?.length || 0}`);
    
    // جلب المجموعات الإعلانية الحالية من قاعدة البيانات للمقارنة
    const currentAdGroups = await storage.getTikTokAdGroups(platformId);
    
    for (const adGroup of adGroups.data?.list || []) {
      // البحث عن معرف الحملة الداخلي في قاعدة البيانات
      const campaigns = await storage.getTikTokCampaigns(platformId);
      let campaign = campaigns.find(c => c.campaignId === adGroup.campaign_id);
      
      if (!campaign) {
        console.warn(`Campaign with TikTok ID ${adGroup.campaign_id} not found in database, will try to sync missing campaign first`);
        
        try {
          // محاولة مزامنة الحملة المفقودة من TikTok
          console.log(`Attempting to sync missing campaign ${adGroup.campaign_id} from TikTok...`);
          await syncTikTokCampaigns(platformId);
          
          // إعادة البحث عن الحملة بعد المزامنة
          const updatedCampaigns = await storage.getTikTokCampaigns(platformId);
          const foundCampaign = updatedCampaigns.find(c => c.campaignId === adGroup.campaign_id);
          
          if (!foundCampaign) {
            console.error(`Campaign ${adGroup.campaign_id} still not found after sync attempt, skipping ad group ${adGroup.adgroup_id}`);
            continue;
          }
          
          // استخدام الحملة المزامنة الجديدة
          campaign = foundCampaign;
          console.log(`Successfully synced and found campaign ${adGroup.campaign_id}`);
          
        } catch (syncError) {
          console.error(`Failed to sync missing campaign ${adGroup.campaign_id}:`, syncError);
          continue;
        }
      }

      // البحث عن المجموعة الإعلانية الحالية
      const existingAdGroup = currentAdGroups.find(ag => ag.adGroupId === adGroup.adgroup_id);
      
      // تحديد الحالة النهائية مع حماية التحديثات اليدوية
      let finalStatus = adGroup.operation_status || adGroup.status || 'ENABLE';
      const tiktokStatus = finalStatus; // حفظ الحالة من TikTok
      
      if (existingAdGroup) {
        const now = new Date();
        const updatedAt = existingAdGroup.updatedAt ? new Date(existingAdGroup.updatedAt) : new Date();
        const timeDifference = (now.getTime() - updatedAt.getTime()) / 1000; // بالثواني
        
        // إذا تم تحديث المجموعة محلياً خلال آخر دقيقتين والحالة لم تتغير في TikTok، نحافظ على الحالة المحلية
        if (timeDifference < 120 && existingAdGroup.status === tiktokStatus) { // 2 دقيقة = 120 ثانية
          finalStatus = existingAdGroup.status;
          console.log(`Keeping local status ${finalStatus} for ad group ${adGroup.adgroup_id} (updated ${Math.round(timeDifference)}s ago)`);
        } else if (existingAdGroup.status !== tiktokStatus) {
          // إذا تغيرت الحالة في TikTok، نحدث فوراً بغض النظر عن وقت آخر تحديث
          finalStatus = tiktokStatus;
          console.log(`TikTok status changed for ad group ${adGroup.adgroup_id}: ${existingAdGroup.status} -> ${tiktokStatus}, updating immediately`);
        }
      }

      const adGroupData = {
        platformId,
        campaignId: campaign.id, // استخدام معرف الحملة الداخلي
        adGroupId: adGroup.adgroup_id,
        adGroupName: adGroup.adgroup_name,
        status: finalStatus,
        budgetMode: adGroup.budget_mode,
        budget: adGroup.budget ? adGroup.budget.toString() : null,
        bidType: adGroup.bid_type,
        bidPrice: adGroup.bid_price ? adGroup.bid_price.toString() : null,
      };

      console.log(`Saving ad group with status: ${adGroupData.status}`);
      
      // تحديث المجموعة فقط إذا تغيرت البيانات أو لم تُحدث منذ فترة طويلة
      let shouldUpdate = true;
      if (existingAdGroup) {
        const hasStatusChanged = existingAdGroup.status !== finalStatus;
        const hasOtherChanges = 
          existingAdGroup.adGroupName !== adGroupData.adGroupName ||
          existingAdGroup.budgetMode !== adGroupData.budgetMode ||
          existingAdGroup.budget !== adGroupData.budget;
        
        if (!hasStatusChanged && !hasOtherChanges) {
          shouldUpdate = false;
          console.log(`Ad group ${adGroup.adgroup_id} unchanged, skipping update`);
        }
      }
      
      if (shouldUpdate) {
        await storage.upsertTikTokAdGroup(adGroup.adgroup_id, adGroupData);
      }
    }
    
    // حذف المجموعات الإعلانية التي لم تعد موجودة في TikTok
    const allExistingAdGroups = await storage.getTikTokAdGroups(platformId);
    const tiktokAdGroupIds = (adGroups.data?.list || []).map(ag => ag.adgroup_id);
    
    for (const existingAdGroup of allExistingAdGroups) {
      if (!tiktokAdGroupIds.includes(existingAdGroup.adGroupId)) {
        console.log(`Ad group ${existingAdGroup.adGroupId} no longer exists in TikTok, deleting from database`);
        
        // حذف الإعلانات المرتبطة بالمجموعة الإعلانية أولاً
        const adGroupAds = await storage.getTikTokAds(platformId, undefined, existingAdGroup.id);
        for (const ad of adGroupAds) {
          await storage.deleteTikTokAd(ad.id);
        }
        
        // الآن يمكن حذف المجموعة الإعلانية بأمان
        await storage.deleteTikTokAdGroup(existingAdGroup.id);
      }
    }
    
    console.log(`Synced ${adGroups.data?.list?.length || 0} TikTok ad groups for platform ${platformId}`);
    return adGroups.data?.list || [];
  } catch (error) {
    console.error('Error syncing TikTok ad groups:', error);
    throw error;
  }
}

export async function syncTikTokAds(platformId: string, adGroupId?: string) {
  const api = await getTikTokAPIForPlatform(platformId);
  if (!api) {
    throw new Error('TikTok API not available for this platform');
  }

  const { storage } = await import('./storage');
  
  try {
    console.log(`🔍 Fetching ads for platform ${platformId} ${adGroupId ? `with ad group ${adGroupId}` : 'all ad groups'}`);
    const ads = await api.getAds(undefined, adGroupId); // تمرير adGroupId كمعامل ثاني
    console.log(`📊 TikTok API ads response:`, JSON.stringify(ads, null, 2));
    console.log(`📊 Number of ads found: ${ads.data?.list?.length || 0}`);
    
    // جلب الإعلانات الحالية من قاعدة البيانات للمقارنة
    const currentAds = await storage.getTikTokAds(platformId);
    
    for (const ad of ads.data?.list || []) {
      // البحث عن معرف المجموعة الإعلانية الداخلي في قاعدة البيانات
      const adGroups = await storage.getTikTokAdGroups(platformId);
      let adGroup = adGroups.find(ag => ag.adGroupId === ad.adgroup_id);
      
      if (!adGroup) {
        console.warn(`Ad group with TikTok ID ${ad.adgroup_id} not found in database, will try to sync missing ad groups first`);
        
        try {
          // محاولة مزامنة المجموعات الإعلانية المفقودة من TikTok
          console.log(`Attempting to sync missing ad groups for platform ${platformId}...`);
          await syncTikTokAdGroups(platformId);
          
          // إعادة البحث عن المجموعة الإعلانية بعد المزامنة
          const updatedAdGroups = await storage.getTikTokAdGroups(platformId);
          const foundAdGroup = updatedAdGroups.find(ag => ag.adGroupId === ad.adgroup_id);
          
          if (!foundAdGroup) {
            console.error(`Ad group ${ad.adgroup_id} still not found after sync attempt, skipping ad ${ad.ad_id}`);
            continue;
          }
          
          // استخدام المجموعة المزامنة الجديدة
          adGroup = foundAdGroup;
          console.log(`Successfully synced and found ad group ${ad.adgroup_id}`);
          
        } catch (syncError) {
          console.error(`Failed to sync missing ad group ${ad.adgroup_id}:`, syncError);
          continue;
        }
      }

      // البحث عن الإعلان الحالي
      const existingAd = currentAds.find(a => a.adId === ad.ad_id);
      
      // تحديد الحالة النهائية مع حماية التحديثات اليدوية
      let finalStatus = ad.operation_status || ad.status || 'ENABLE';
      const tiktokStatus = finalStatus; // حفظ الحالة من TikTok
      
      if (existingAd) {
        const now = new Date();
        const updatedAt = new Date(existingAd.updatedAt);
        const timeDifference = (now.getTime() - updatedAt.getTime()) / 1000; // بالثواني
        
        // إذا تم تحديث الإعلان محلياً خلال آخر دقيقتين والحالة لم تتغير في TikTok، نحافظ على الحالة المحلية
        if (timeDifference < 120 && existingAd.status === tiktokStatus) { // 2 دقيقة = 120 ثانية
          finalStatus = existingAd.status;
          console.log(`Keeping local status ${finalStatus} for ad ${ad.ad_id} (updated ${Math.round(timeDifference)}s ago)`);
        } else if (existingAd.status !== tiktokStatus) {
          // إذا تغيرت الحالة في TikTok، نحدث فوراً بغض النظر عن وقت آخر تحديث
          finalStatus = tiktokStatus;
          console.log(`TikTok status changed for ad ${ad.ad_id}: ${existingAd.status} -> ${tiktokStatus}, updating immediately`);
        }
      }

      // إعداد بيانات الإعلان مع video_id
      const adData = {
        platformId,
        campaignId: adGroup.campaignId, // إضافة معرف الحملة
        adGroupId: adGroup.id, // استخدام معرف المجموعة الداخلي
        adId: ad.ad_id,
        adName: ad.ad_name,
        status: finalStatus,
        adFormat: ad.ad_format,
        landingPageUrl: ad.landing_page_url,
        displayName: ad.display_name,
        adText: ad.ad_text,
        callToAction: ad.call_to_action,
        videoUrl: ad.video_id || null, // حفظ video_id من TikTok API
      };
      
      // طباعة معرف الفيديو للتحقق
      if (ad.video_id) {
        console.log(`📹 حفظ video_id للإعلان ${ad.ad_id}: ${ad.video_id}`);
      }

      console.log(`Saving ad with status: ${adData.status}`);
      
      // تحديث الإعلان دائماً إذا كان يحتوي على video_id أو إذا تغيرت البيانات
      let shouldUpdate = true;
      if (existingAd) {
        const hasStatusChanged = existingAd.status !== finalStatus;
        const hasOtherChanges = 
          existingAd.adName !== adData.adName ||
          existingAd.adFormat !== adData.adFormat ||
          existingAd.landingPageUrl !== adData.landingPageUrl;
        
        // إضافة التحقق من video_id - إذا كان موجود، يجب التحديث
        const hasVideoId = !!ad.video_id;
        const videoChanged = ad.video_id !== existingAd.videoUrl;
        
        if (!hasStatusChanged && !hasOtherChanges && !hasVideoId && !videoChanged) {
          shouldUpdate = false;
          console.log(`Ad ${ad.ad_id} unchanged, skipping update`);
        } else {
          if (hasVideoId && videoChanged) {
            console.log(`🎬 Ad ${ad.ad_id} has video_id: ${ad.video_id}, forcing update`);
          }
        }
      }
      
      if (shouldUpdate) {
        await storage.upsertTikTokAd(ad.ad_id, adData);
        if (ad.video_id) {
          console.log(`✅ تم حفظ الإعلان ${ad.ad_id} مع video_id: ${ad.video_id}`);
        }
      }
    }
    
    // حذف الإعلانات التي لم تعد موجودة في TikTok
    const allExistingAds = await storage.getTikTokAds(platformId);
    const tiktokAdIds = (ads.data?.list || []).map(a => a.ad_id);
    
    for (const existingAd of allExistingAds) {
      if (!tiktokAdIds.includes(existingAd.adId)) {
        console.log(`Ad ${existingAd.adId} no longer exists in TikTok, deleting from database`);
        await storage.deleteTikTokAd(existingAd.id);
      }
    }
    
    console.log(`Synced ${ads.data?.list?.length || 0} TikTok ads for platform ${platformId}`);
    return ads.data?.list || [];
  } catch (error) {
    console.error('Error syncing TikTok ads:', error);
    throw error;
  }
}

// مزامنة محسّنة باستخدام صلاحيات متعددة
export async function syncEnhancedTikTokReports(platformId: string, startDate: string, endDate: string) {
  try {
    const api = await getTikTokAPIForPlatform(platformId);
    if (!api) {
      throw new Error('TikTok API not available for this platform');
    }

    const { storage } = await import('./storage');
    
    // جلب الحملات
    const campaigns = await storage.getTikTokCampaigns(platformId);
    const campaignIds = campaigns.map(c => c.campaignId);

    if (campaignIds.length === 0) {
      console.log('لا توجد حملات لمزامنة التقارير');
      return;
    }

    console.log('🚀 بدء المزامنة المحسّنة باستخدام صلاحيات متعددة...');

    // أولاً: مزامنة إحصائيات الإعلانات
    console.log('📊 جلب إحصائيات الإعلانات مباشرة من TikTok...');
    try {
      const ads = await storage.getTikTokAds(platformId);
      const adIds = ads.map(a => a.adId);
      
      if (adIds.length > 0) {
        console.log(`🎯 جلب إحصائيات ${adIds.length} إعلان...`);
        const adReport = await api.getAdReport(adIds, startDate, endDate);
        
        if (adReport.data?.list?.length > 0) {
          for (const row of adReport.data.list) {
            const adId = row.dimensions.ad_id;
            const metrics = row.metrics;
            
            const updateData = {
              impressions: parseInt(metrics.impressions) || 0,
              clicks: parseInt(metrics.clicks) || 0,
              spend: parseFloat(metrics.spend) || 0,
              conversions: parseInt(metrics.conversion) || 0,
              leads: parseInt(metrics.result) || 0,
              cpm: parseFloat(metrics.cpm) || 0,
              cpc: parseFloat(metrics.cpc) || 0,
              ctr: parseFloat(metrics.ctr) || 0,
              conversionRate: parseFloat(metrics.conversion_rate) || 0,
              conversionCost: parseFloat(metrics.conversion_cost) || 0,
              resultRate: parseFloat(metrics.result_rate) || 0
            };
            
            console.log(`🔄 تحديث إحصائيات الإعلان ${adId}:`, updateData);
            
            await storage.updateTikTokAdStats(adId, updateData);
            
            console.log(`✅ تم تحديث إحصائيات الإعلان ${adId}`);
          }
          console.log(`🎉 تم تحديث إحصائيات ${adReport.data.list.length} إعلان بنجاح!`);
        } else {
          console.log('⚠️ لا توجد إحصائيات للإعلانات في هذه الفترة');
        }
      }
    } catch (error) {
      console.log('خطأ في جلب إحصائيات الإعلانات:', error.message);
    }

    // ثانياً: التقرير الأساسي للحملات مع تطبيق فوري
    console.log('📈 جلب التقرير الأساسي مع التطبيق الفوري...');
    const campaignReport = await api.getCampaignReport(campaignIds, startDate, endDate);
    
    if (campaignReport.data?.list?.length > 0) {
      for (const row of campaignReport.data.list) {
        const campaignId = row.dimensions.campaign_id;
        const metrics = row.metrics;
        
        const updateData = {
          impressions: parseInt(metrics.impressions) || 0,
          clicks: parseInt(metrics.clicks) || 0,
          spend: parseFloat(metrics.spend) || 0,
          cpm: parseFloat(metrics.cpm) || 0,
          cpc: parseFloat(metrics.cpc) || 0,
          ctr: parseFloat(metrics.ctr) || 0,
          conversions: parseInt(metrics.result) || 0,
          conversionRate: parseFloat(metrics.conversion_rate) || 0,
          conversionCost: parseFloat(metrics.conversion_cost || '0') || 0,
          leads: parseInt(metrics.result) || 0,
          resultRate: parseFloat(metrics.result_rate) || 0,
          resultCost: parseFloat(metrics.spend) > 0 && parseInt(metrics.result) > 0 ? 
            parseFloat((parseFloat(metrics.spend) / parseInt(metrics.result)).toFixed(2)) : 0,
        };
        
        console.log(`🔄 تحديث فوري للحملة ${campaignId}:`, updateData);
        
        await storage.updateTikTokCampaignStats(campaignId, updateData);
        
        console.log(`✅ تم التحديث الفوري للحملة ${campaignId}`);
      }
      
      // تم إزالة مسح الكاش - سيتم تحديث البيانات تلقائياً
      console.log('🗑️ البيانات محدثة وجاهزة للعرض');
      
      console.log('🎉 المزامنة المحسّنة اكتملت بنجاح!');
    } else {
      console.log('⚠️ لا توجد بيانات في التقرير الأساسي');
    }

  } catch (error) {
    console.error('خطأ في المزامنة المحسّنة:', error);
    throw error;
  }
}

// دالة لمزامنة التقارير والإحصائيات
export async function syncTikTokReports(platformId: string, startDate: string, endDate: string) {
  const api = await getTikTokAPIForPlatform(platformId);
  if (!api) {
    throw new Error('TikTok API not available for this platform');
  }

  const { storage } = await import('./storage');
  
  try {
    // جلب جميع الحملات للحصول على IDs
    const campaigns = await storage.getTikTokCampaigns(platformId);
    const campaignIds = campaigns.map(c => c.campaignId);

    if (campaignIds.length === 0) {
      console.log('No campaigns found to sync reports for');
      return;
    }

    // جلب تقرير الحملات
    const campaignReport = await api.getCampaignReport(campaignIds, startDate, endDate);
    
    // تحديث إحصائيات الحملات
    for (const row of campaignReport.list || []) {
      const campaignId = row.dimensions.campaign_id;
      const metrics = row.metrics;
      
      const updateData = {
        impressions: parseInt(metrics.impressions) || 0,
        clicks: parseInt(metrics.clicks) || 0,
        spend: parseFloat(metrics.spend) || 0,
        cpm: parseFloat(metrics.cpm) || 0,
        cpc: parseFloat(metrics.cpc) || 0,
        ctr: parseFloat(metrics.ctr) || 0,
        conversions: parseInt(metrics.result) || 0,
        conversionRate: parseFloat(metrics.conversion_rate) || 0,
        conversionCost: parseFloat(metrics.conversion_cost || '0') || 0,
        leads: parseInt(metrics.result) || 0,
        resultRate: parseFloat(metrics.result_rate) || 0,
        resultCost: parseFloat(metrics.spend) > 0 && parseInt(metrics.result) > 0 ? 
          parseFloat((parseFloat(metrics.spend) / parseInt(metrics.result)).toFixed(2)) : 0,
      };
      
      console.log(`🔄 تحديث إحصائيات الحملة ${campaignId}:`, updateData);
      
      await storage.updateTikTokCampaignStats(campaignId, updateData);
      
      console.log(`✅ تم تحديث الحملة ${campaignId} بنجاح`);
    }
    
    console.log(`Synced TikTok reports for ${campaignIds.length} campaigns`);
  } catch (error) {
    console.error('Error syncing TikTok reports:', error);
    throw error;
  }
}

// ==================== LEAD FORMS MANAGEMENT ====================

// إضافة دوال نماذج الليدز للـ TikTokBusinessAPI class
export class TikTokBusinessAPIWithLeadForms extends TikTokBusinessAPI {
  
  // جلب جميع النماذج الموجودة
  async getLeadForms() {
    console.log('📋 جلب نماذج الليدز الموجودة...');
    return this.makeRequest(`/lead/gen_form/list/?advertiser_id=${this.advertiserId}`, 'GET');
  }

  // إنشاء نموذج ليدز جديد للاستخدام مع Lead Ads
  async createLeadForm(formData: {
    advertiser_id: string;
    form_name: string;
    page_id?: string;
    language?: string;
    theme_type?: string;
    cover_image?: { image_id: string };
    components: Array<{
      component_type: string;
      text?: { content: string };
      image?: { image_id: string };
      question?: {
        field_type?: string;
        question_type?: string;
        question_name?: string;
        options?: string[];
      };
    }>;
    privacy_policy_url: string;
  }) {
    console.log('📋 إنشاء نموذج ليدز للاستخدام مع Lead Ads:', JSON.stringify(formData, null, 2));
    
    // استخدام Lead Generation Form API الصحيح
    const endpoint = '/lead/gen_form/create/';
    
    const requestData = {
      advertiser_id: formData.advertiser_id,
      form_name: formData.form_name,
      description: `نموذج جمع العملاء المحتملين لـ ${formData.form_name}`,
      privacy_policy_url: formData.privacy_policy_url,
      fields: [
        {
          field_type: "NAME",
          is_required: true
        },
        {
          field_type: "PHONE_NUMBER", 
          is_required: true
        },
        {
          field_type: "EMAIL",
          is_required: false
        }
      ]
    };

    try {
      console.log('🚀 إرسال طلب إنشاء النموذج إلى TikTok API...');
      const response = await this.makeRequest(endpoint, 'POST', requestData);
      console.log('✅ تم إنشاء النموذج بنجاح:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ خطأ في إنشاء النموذج:', error);
      console.error('❌ التفاصيل:', error.message);
      throw error; // إعادة إرسال الخطأ ليتم التعامل معه بشكل صحيح
    }
  }

  // جلب نماذج الليدز الموجودة
  async getLeadForms() {
    console.log('📋 جلب نماذج الليدز الموجودة...');
    return this.makeRequest(`/lead/gen_form/list/?advertiser_id=${this.advertiserId}`, 'GET');
  }

  // حذف نموذج ليدز
  async deleteLeadForm(leadFormId: string) {
    console.log('🗑️ حذف نموذج الليدز:', leadFormId);
    return this.makeRequest('/lead/gen_form/delete/', 'POST', {
      advertiser_id: this.advertiserId,
      form_id: leadFormId
    });
  }

  // جلب الحقول المتاحة
  async getAvailableFields() {
    console.log('📋 جلب الحقول المتاحة...');
    return this.makeRequest('/page/field/get/', 'GET', {
      advertiser_id: this.advertiserId
    });
  }

  // تحديث نموذج ليدز موجود
  async updateLeadForm(leadFormId: string, updateData: {
    lead_form_name?: string;
    form_title?: string;
    form_description?: string;
    privacy_policy_url?: string;
    success_message?: string;
  }) {
    return this.makeRequest('/lead_form/update/', 'POST', {
      advertiser_id: this.advertiserId,
      lead_form_id: leadFormId,
      ...updateData
    });
  }



  // جلب بيانات الليدز من نموذج معين
  async getLeadFormData(leadFormId: string, startDate?: string, endDate?: string) {
    const params = [`advertiser_id=${this.advertiserId}`, `lead_form_id=${leadFormId}`];
    
    if (startDate && endDate) {
      params.push(`start_date=${startDate}`);
      params.push(`end_date=${endDate}`);
    }
    
    return this.makeRequest(`/lead_form/query/?${params.join('&')}`);
  }

  // إنشاء إعلان ليدز مع ربط النموذج
  async createLeadAd(adData: {
    campaign_id: string;
    adgroup_id: string;
    ad_name: string;
    ad_text: string;
    call_to_action: string;
    video_id?: string;
    image_ids?: string[];
    lead_form_id: string; // معرف نموذج الليدز
    identity_id: string;
  }) {
    const requestData = {
      advertiser_id: this.advertiserId,
      campaign_id: adData.campaign_id,
      adgroup_id: adData.adgroup_id,
      creatives: [{
        ad_name: adData.ad_name,
        ad_text: adData.ad_text,
        call_to_action: adData.call_to_action,
        ad_format: adData.video_id ? 'SINGLE_VIDEO' : 'SINGLE_IMAGE',
        ...(adData.video_id && { video_id: adData.video_id }),
        ...(adData.image_ids && { image_ids: adData.image_ids }),
        identity_id: adData.identity_id,
        identity_type: 'TT_USER',
        creative_type: 'LEAD_ADS', // نوع الإعلان للليدز
        lead_form_id: adData.lead_form_id, // ربط النموذج بالإعلان
        page_id: this.advertiserId, // استخدام معرف المعلن كصفحة
      }]
    };

    console.log('🎯 إنشاء إعلان ليدز جديد:', JSON.stringify(requestData, null, 2));
    return this.makeRequest('/ad/create/', 'POST', requestData);
  }
}

// دالة للحصول على API مع إمكانيات نماذج الليدز
export async function getTikTokLeadFormsAPI(platformId: string): Promise<TikTokBusinessAPIWithLeadForms | null> {
  const { storage } = await import('./storage');
  
  try {
    const platform = await storage.getPlatform(platformId);
    if (!platform) {
      console.error('❌ Platform not found:', platformId);
      return null;
    }

    console.log('🔍 Platform found, checking TikTok credentials...');
    console.log('📋 Access Token exists:', !!platform.tiktokAccessToken);
    console.log('📋 Advertiser ID exists:', !!platform.tiktokAdvertiserId);
    console.log('📋 Advertiser ID:', platform.tiktokAdvertiserId);

    if (!platform.tiktokAccessToken || !platform.tiktokAdvertiserId) {
      console.error('❌ TikTok credentials not found for platform:', platformId);
      console.error('📋 Missing credentials:', {
        hasAccessToken: !!platform.tiktokAccessToken,
        hasAdvertiserId: !!platform.tiktokAdvertiserId
      });
      return null;
    }

    console.log('✅ TikTok credentials found, creating API instance...');
    return new TikTokBusinessAPIWithLeadForms(platform.tiktokAccessToken, platform.tiktokAdvertiserId);
  } catch (error) {
    console.error('❌ Error getting TikTok Lead Forms API:', error);
    return null;
  }
}