// Meta (Facebook) Marketing API Integration
export class MetaMarketingAPI {
  private baseUrl = 'https://graph.facebook.com/v23.0';
  
  constructor(private accessToken: string, private adAccountId: string) {
    console.log('🔧 Meta API تم إنشاؤه بمعرف الحساب الأصلي:', this.adAccountId);
    // إزالة "act_" إذا كان موجوداً بالفعل لتجنب التكرار
    if (this.adAccountId.startsWith('act_')) {
      this.adAccountId = this.adAccountId.substring(4);
      console.log('✂️ تم إزالة act_ prefix، معرف الحساب الجديد:', this.adAccountId);
    }
  }

  // Getter methods for accessing private properties
  public getAccessToken() { return this.accessToken; }
  public getAdAccountId() { return this.adAccountId; }

  // Helper method for making API requests
  public async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: any = {
      'Content-Type': 'application/json',
    };

    // إضافة access_token كمعامل في URL للطلبات المختلفة
    const tokenParam = `access_token=${this.accessToken}`;
    const fullUrl = url.includes('?') ? `${url}&${tokenParam}` : `${url}?${tokenParam}`;

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    console.log(`Meta API Request: ${method} ${fullUrl}`);
    if (data && method !== 'GET') {
      console.log('Meta API Request Body:', JSON.stringify(data, null, 2));
    }
    
    try {
      const response = await fetch(fullUrl, options);
      
      // التحقق من status code أولاً
      if (!response.ok) {
        console.error(`Meta API HTTP Error: ${response.status} ${response.statusText}`);
        
        // محاولة قراءة تفاصيل الخطأ من Meta
        try {
          const errorDetails = await response.json();
          console.error('Meta API Error Details:', JSON.stringify(errorDetails, null, 2));
          throw new Error(`HTTP ${response.status}: ${errorDetails?.error?.message || response.statusText}`);
        } catch (parseError) {
          console.error('Failed to parse error response');
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      // محاولة parsing JSON
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Meta API Response is not valid JSON:', parseError);
        const text = await response.text();
        console.error('Raw response:', text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
      }
      
      console.log('Meta API Response:', JSON.stringify(result, null, 2));
      
      // التحقق من وجود خطأ في الاستجابة
      if (result.error) {
        console.error('Meta API Error:', result.error);
        throw new Error(result.error.message || 'Meta API request failed');
      }
      
      return result;
    } catch (error) {
      console.error('Meta API request failed:', error);
      throw error;
    }
  }

  // ==================== CAMPAIGN MANAGEMENT ====================

  // جلب جميع الحملات
  async getCampaigns() {
    return this.makeRequest(`/act_${this.adAccountId}/campaigns`, 'GET');
  }

  // إنشاء حملة جديدة
  async createCampaign(campaignData: {
    name: string;
    objective: string; // MESSAGES, CONVERSIONS
    status?: string;
    start_time?: string;
    stop_time?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    buying_type?: string;
    special_ad_categories?: string[]; // مطلوب من Meta API
  }) {
    const requestData = {
      name: campaignData.name,
      objective: campaignData.objective,
      status: campaignData.status || 'ACTIVE', // إنشاء الحملة في حالة مفعلة
      buying_type: campaignData.buying_type || 'AUCTION',
      special_ad_categories: campaignData.special_ad_categories || [], // مطلوب من Meta API
      ...(campaignData.start_time && { start_time: campaignData.start_time }),
      ...(campaignData.stop_time && { stop_time: campaignData.stop_time }),
      ...(campaignData.daily_budget && { daily_budget: campaignData.daily_budget }),
      ...(campaignData.lifetime_budget && { lifetime_budget: campaignData.lifetime_budget }),
    };

    console.log('📝 إنشاء حملة Meta:', JSON.stringify(requestData, null, 2));
    return this.makeRequest(`/act_${this.adAccountId}/campaigns`, 'POST', requestData);
  }

  // تحديث حملة
  async updateCampaign(campaignId: string, updateData: {
    name?: string;
    status?: string;
    daily_budget?: number;
    lifetime_budget?: number;
  }) {
    return this.makeRequest(`/${campaignId}`, 'POST', updateData);
  }

  // ==================== AD SET MANAGEMENT ====================

  // جلب جميع مجموعات الإعلانات
  async getAdSets(campaignId?: string) {
    const endpoint = campaignId 
      ? `/${campaignId}/adsets`
      : `/act_${this.adAccountId}/adsets`;
    return this.makeRequest(endpoint, 'GET');
  }

  // إنشاء مجموعة إعلانية جديدة
  async createAdSet(adSetData: {
    name: string;
    campaign_id: string;
    optimization_goal: string; // OFFSITE_CONVERSIONS, CONVERSATIONS
    billing_event: string; // IMPRESSIONS, LINK_CLICKS
    bid_strategy: string; // LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP
    daily_budget?: number;
    lifetime_budget?: number;
    start_time?: string;
    end_time?: string;
    bid_amount?: number;
    targeting?: any;
    promoted_object?: any; // للـ CONVERSIONS أو MESSAGES
    destination_type?: string; // WEBSITE, MESSENGER
  }) {
    console.log('🎯 إنشاء مجموعة إعلانية Meta:', JSON.stringify(adSetData, null, 2));
    return this.makeRequest(`/act_${this.adAccountId}/adsets`, 'POST', adSetData);
  }

  // تحديث مجموعة إعلانية
  async updateAdSet(adSetId: string, updateData: {
    name?: string;
    status?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    bid_amount?: number;
    targeting?: any;
  }) {
    return this.makeRequest(`/${adSetId}`, 'POST', updateData);
  }

  // ==================== AD MANAGEMENT ====================

  // جلب جميع الإعلانات
  async getAds(campaignId?: string, adSetId?: string) {
    let endpoint;
    if (adSetId) {
      endpoint = `/${adSetId}/ads`;
    } else if (campaignId) {
      endpoint = `/${campaignId}/ads`;
    } else {
      endpoint = `/act_${this.adAccountId}/ads`;
    }
    return this.makeRequest(endpoint, 'GET');
  }

  // رفع فيديو إلى Meta

  // استخراج الإطار الأول من الفيديو كصورة مصغرة
  async extractVideoThumbnail(videoBuffer: Buffer): Promise<Buffer> {
    const ffmpeg = (await import('fluent-ffmpeg')).default;
    const path = await import('path');
    const fs = await import('fs');
    
    return new Promise((resolve, reject) => {
      const tempVideoPath = `/tmp/video_${Date.now()}.mp4`;
      const thumbnailPath = `/tmp/thumbnail_${Date.now()}.jpg`;
      
      // كتابة الفيديو لملف مؤقت
      fs.writeFileSync(tempVideoPath, videoBuffer);
      
      ffmpeg(tempVideoPath)
        .screenshots({
          timestamps: ['0'],  // الثانية 0 (الإطار الأول)
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '1200x630'  // حجم مناسب لـ Meta
        })
        .on('end', () => {
          try {
            const thumbnailBuffer = fs.readFileSync(thumbnailPath);
            // تنظيف الملفات المؤقتة
            fs.unlinkSync(tempVideoPath);
            fs.unlinkSync(thumbnailPath);
            resolve(thumbnailBuffer);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          // تنظيف الملفات المؤقتة في حالة الخطأ
          try {
            if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
            if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
          } catch {}
          reject(err);
        });
    });
  }

  // تحميل فيديو من Meta باستخدام معرف الفيديو
  private async downloadVideoById(videoId: string): Promise<Buffer> {
    console.log('📥 تحميل فيديو من Meta بمعرف:', videoId);
    
    try {
      // الحصول على URL للفيديو من Meta
      const videoInfoResponse = await this.makeRequest(`/${videoId}?fields=source`);
      const videoUrl = videoInfoResponse.source;
      
      if (!videoUrl) {
        throw new Error('لا يمكن الحصول على رابط الفيديو من Meta');
      }

      // تحميل الفيديو من الرابط
      return await this.downloadMediaFromUrl(videoUrl);
    } catch (error) {
      console.error('❌ فشل في تحميل الفيديو من Meta:', error);
      throw error;
    }
  }

  // رفع فيديو مع thumbnail مخصص في عملية واحدة
  async uploadVideoWithThumbnail(videoBuffer: Buffer, thumbnailBuffer: Buffer, fileName: string): Promise<string> {
    console.log('📹 رفع فيديو مع thumbnail مخصص إلى Meta...');
    
    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      formData.append('access_token', this.accessToken);
      formData.append('source', videoBuffer, {
        filename: fileName,
        contentType: 'video/mp4'
      });
      
      // إضافة thumbnail مخصص - هذه هي الطريقة الصحيحة!
      formData.append('thumb', thumbnailBuffer, {
        filename: `${fileName}_thumbnail.jpg`,
        contentType: 'image/jpeg'
      });

      console.log('🔄 جاري رفع الفيديو مع thumbnail إلى Meta...');
      console.log('📊 حجم الفيديو:', Math.round(videoBuffer.length / (1024 * 1024) * 100) / 100, 'MB');
      console.log('🖼️ حجم thumbnail:', Math.round(thumbnailBuffer.length / 1024), 'KB');
      console.log('🔗 رابط رفع الفيديو:', `${this.baseUrl}/act_${this.adAccountId}/advideos`);

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(
        `${this.baseUrl}/act_${this.adAccountId}/advideos`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json() as any;
      console.log('📦 استجابة Meta API:', JSON.stringify(result, null, 2));

      if (result.error) {
        throw new Error(result.error.message || 'خطأ غير معروف من Meta API');
      }

      if (result.id) {
        console.log('✅ تم رفع الفيديو مع thumbnail مخصص بنجاح، معرف الفيديو:', result.id);
        return result.id;
      }

      throw new Error('لم يتم العثور على معرف الفيديو في الاستجابة');

    } catch (error) {
      console.error('⚠️ فشل رفع الفيديو مع thumbnail إلى Meta:', (error as Error).message);
      throw new Error(`فشل رفع الفيديو مع thumbnail إلى Meta: ${(error as Error).message}`);
    }
  }

  // رفع فيديو عادي (بدون thumbnail)
  async uploadVideo(videoBuffer: Buffer, fileName: string): Promise<string> {
    console.log('📹 رفع فيديو عادي إلى Meta...');
    
    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      formData.append('access_token', this.accessToken);
      formData.append('source', videoBuffer, {
        filename: fileName,
        contentType: 'video/mp4'
      });

      console.log('🔄 جاري رفع الفيديو إلى Meta...');
      console.log('📊 حجم الملف:', Math.round(videoBuffer.length / (1024 * 1024) * 100) / 100, 'MB');
      console.log('🔗 رابط رفع الفيديو:', `${this.baseUrl}/act_${this.adAccountId}/advideos`);

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(
        `${this.baseUrl}/act_${this.adAccountId}/advideos`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json() as any;
      console.log('📦 استجابة Meta API:', JSON.stringify(result, null, 2));

      if (result.error) {
        throw new Error(result.error.message || 'خطأ غير معروف من Meta API');
      }

      if (result.id) {
        console.log('✅ تم رفع الفيديو بنجاح، معرف الفيديو:', result.id);
        return result.id;
      }

      throw new Error('لم يتم العثور على معرف الفيديو في الاستجابة');

    } catch (error) {
      console.error('⚠️ فشل رفع الفيديو إلى Meta:', (error as Error).message);
      throw new Error(`فشل رفع الفيديو إلى Meta: ${(error as Error).message}`);
    }
  }

  // جلب thumbnails المتاحة للفيديو من Meta
  async getVideoThumbnails(videoId: string): Promise<string | null> {
    console.log('🖼️ جلب thumbnails للفيديو:', videoId);
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(
        `${this.baseUrl}/${videoId}/thumbnails?fields=uri,is_preferred,width,height&access_token=${this.accessToken}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ في جلب thumbnails:', response.status, errorText);
        return null;
      }

      const result = await response.json() as any;
      console.log('📦 thumbnails متاحة:', JSON.stringify(result, null, 2));

      if (result.data && result.data.length > 0) {
        // ابحث عن preferred thumbnail أولاً
        const preferredThumbnail = result.data.find((thumb: any) => thumb.is_preferred);
        if (preferredThumbnail && preferredThumbnail.uri) {
          console.log('✅ تم العثور على preferred thumbnail:', preferredThumbnail.uri);
          return preferredThumbnail.uri;
        }
        
        // إذا لم يوجد preferred، استخدم أول thumbnail متاح
        const firstThumbnail = result.data[0];
        if (firstThumbnail && firstThumbnail.uri) {
          console.log('✅ تم العثور على أول thumbnail متاح:', firstThumbnail.uri);
          return firstThumbnail.uri;
        }
      }

      console.log('⚠️ لم يتم العثور على أي thumbnails');
      return null;

    } catch (error) {
      console.error('⚠️ فشل جلب thumbnails:', (error as Error).message);
      return null;
    }
  }

  // رفع thumbnail مخصص للفيديو
  async uploadVideoThumbnail(videoId: string, thumbnailBuffer: Buffer, fileName: string): Promise<boolean> {
    console.log('🖼️ رفع thumbnail مخصص للفيديو:', videoId);
    
    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      formData.append('access_token', this.accessToken);
      formData.append('is_preferred', 'true');
      formData.append('source', thumbnailBuffer, {
        filename: fileName,
        contentType: 'image/jpeg'
      });

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(
        `${this.baseUrl}/${videoId}/thumbnails`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ في رفع thumbnail:', response.status, errorText);
        return false;
      }

      const result = await response.json() as any;
      console.log('📦 استجابة thumbnail:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log('✅ تم رفع thumbnail بنجاح للفيديو');
        return true;
      }

      return false;

    } catch (error) {
      console.error('⚠️ فشل رفع thumbnail:', (error as Error).message);
      return false;
    }
  }

  // رفع صورة إلى Meta
  async uploadImage(imageBuffer: Buffer, fileName: string): Promise<string | null> {
    console.log('🖼️ رفع صورة إلى Meta...', fileName);

    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      formData.append('access_token', this.accessToken);
      formData.append('source', imageBuffer, {
        filename: fileName,
        contentType: fileName.endsWith('.jpg') ? 'image/jpeg' : 'image/png'
      });

      console.log('🔄 جاري رفع الصورة إلى Meta...');

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(
        `${this.baseUrl}/act_${this.adAccountId}/adimages`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json() as any;
      console.log('📦 Meta Image Upload Response:', JSON.stringify(result, null, 2));

      if (result.error) {
        throw new Error(result.error.message || 'خطأ غير معروف من Meta API');
      }

      // Meta API ترجع hash في images object
      if (result.images) {
        console.log('📋 Images object keys:', Object.keys(result.images));
        
        for (const [key, value] of Object.entries(result.images)) {
          console.log(`🔍 Key: ${key}, Value:`, value);
          
          // البحث عن hash حقيقي في البيانات
          if (value && typeof value === 'object' && (value as any).hash) {
            console.log('✅ Found real hash in image data:', (value as any).hash);
            return (value as any).hash;
          }
          
          // إذا كان المفتاح hash صحيح
          if (key.length > 20 && /^[a-f0-9]+$/.test(key)) {
            console.log('✅ Valid hex hash found as key:', key);
            return key;
          }
        }
        
        // إذا لم نجد hash صحيح، استخدم أول مفتاح
        const firstKey = Object.keys(result.images)[0];
        console.warn('❌ No valid hash found, using first key:', firstKey);
        return firstKey || '';
      }

      // أحياناً Meta ترجع hash مباشرة
      if (result.hash) {
        console.log('✅ تم رفع الصورة بنجاح، hash مباشر:', result.hash);
        return result.hash;
      }

      // أحياناً Meta ترجع id
      if (result.id) {
        console.log('✅ تم رفع الصورة بنجاح، معرف الصورة:', result.id);
        return result.id;
      }

      console.error('📋 استجابة Meta كاملة:', result);
      throw new Error('لم يتم العثور على hash الصورة في الاستجابة');

    } catch (error) {
      console.error('⚠️ فشل رفع الصورة إلى Meta:', (error as Error).message);
      throw new Error(`فشل رفع الصورة إلى Meta: ${(error as Error).message}`);
    }
  }

  // إنشاء إعلان جديد
  async createAd(adData: {
    name: string;
    adset_id: string;
    creative: any; // Facebook Ad Creative object
    status?: string;
  }) {
    const requestData = {
      name: adData.name,
      adset_id: adData.adset_id,
      creative: adData.creative,
      status: adData.status || 'ACTIVE',
    };

    console.log('📰 إنشاء إعلان Meta:', JSON.stringify(requestData, null, 2));
    return this.makeRequest(`/act_${this.adAccountId}/ads`, 'POST', requestData);
  }

  // إنشاء Ad Creative
  async createAdCreative(creativeData: {
    name: string;
    object_story_spec: any;
    degrees_of_freedom_spec?: any;
  }) {
    console.log('🎨 إنشاء Ad Creative:', JSON.stringify(creativeData, null, 2));
    return this.makeRequest(`/act_${this.adAccountId}/adcreatives`, 'POST', creativeData);
  }

  // جلب الصفحات المرتبطة بالحساب
  async getPages() {
    return this.makeRequest('/me/accounts', 'GET');
  }

  // جلب معلومات صفحة محددة مع Instagram business account
  async getPageDetails(pageId: string) {
    return this.makeRequest(`/${pageId}?fields=id,name,username,instagram_business_account{id,name,username,instagram_business_account}`, 'GET');
  }
  
  // جلب Instagram Actor ID الصحيح للإعلانات
  async getInstagramActorId(pageId: string) {
    try {
      // جلب معلومات الصفحة مع Instagram business account
      const pageDetails = await this.getPageDetails(pageId);
      
      if (!pageDetails?.instagram_business_account?.id) {
        console.log('❌ لا يوجد Instagram business account مرتبط بهذه الصفحة');
        return null;
      }
      
      const igBusinessAccountId = pageDetails.instagram_business_account.id;
      console.log('📄 Instagram Business Account ID:', igBusinessAccountId);
      
      // الطريقة الصحيحة: استخدام Instagram Business Account ID مباشرة كـ Actor ID
      // في معظم الحالات، Instagram Business Account ID = Instagram Actor ID
      return igBusinessAccountId;
      
    } catch (error) {
      console.error('⚠️ خطأ في جلب Instagram Actor ID:', error);
      return null;
    }
  }

  // جلب البكسلات المرتبطة بالحساب
  async getPixels() {
    return this.makeRequest(`/act_${this.adAccountId}/adspixels`, 'GET');
  }

  // جلب الأحداث المخصصة للبكسل
  async getPixelEvents(pixelId: string) {
    return this.makeRequest(`/${pixelId}/customconversions`, 'GET');
  }

  // تحديث حالة إعلان
  async updateAdStatus(adId: string, status: 'ACTIVE' | 'PAUSED') {
    return this.makeRequest(`/${adId}`, 'POST', { status });
  }

  // ==================== COMPLETE CAMPAIGN CREATION ====================

  // Helper function لتحديد destination type للإنستقرام والماسنجر فقط
  private getMessageDestinationType(destinations: string[]): string {
    if (!destinations || destinations.length === 0) {
      return 'MESSENGER'; // افتراضي
    }
    
    console.log('🎯 الوجهات المطلوبة:', destinations);
    
    // للوجهات المتعددة: استخدام MESSENGER فقط وسنتعامل مع الباقي لاحقاً
    if (destinations.length > 1) {
      console.log('💡 تم اكتشاف وجهات متعددة، سنستخدم MESSENGER ونضيف الباقي لاحقاً');
      return 'MESSENGER';
    }
    
    // للوجهة الواحدة
    switch (destinations[0]) {
      case 'MESSENGER':
        return 'MESSENGER';
      case 'INSTAGRAM':
        return 'INSTAGRAM_DIRECT';
      default:
        console.log('⚠️ وجهة غير مدعومة، استخدام MESSENGER كافتراضي');
        return 'MESSENGER';
    }
  }

  // إنشاء حملة كاملة (Campaign + Ad Set + Ad)
  async createCompleteCampaign(data: {
    // Campaign data
    campaignName: string;
    objective: string;
    campaignBudgetMode: string;
    campaignBudget?: string;
    startTime?: string;
    endTime?: string;
    
    // Ad Set data
    adSetName: string;
    adSetBudgetMode: string;
    adSetBudget: string;
    bidStrategy: string;
    bidAmount?: string;
    destinationType: string;
    
    // Ad data
    adName: string;
    adFormat: string;
    landingPageUrl?: string;
    displayName: string;
    adText: string;
    adDescription?: string;
    callToAction: string;
    
    // Media
    videoUrl?: string;
    imageUrls?: string[];
    imageHash?: string;
    thumbnailUrl?: string;
    
    // Tracking
    pixelId?: string;
    customEventType?: string;
    pageId?: string;
    
    // Targeting
    targeting?: any;
    productId?: string;
    
    // Placements configuration
    placements?: any;
    
    // وجهات الرسائل (للحملات الرسائل فقط)
    messageDestinations?: string[];
  }) {
    console.log('🚀 إنشاء حملة Meta كاملة:', data.campaignName);
    console.log('🖼️ بيانات الوسائط:', {
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      imageUrls: data.imageUrls,
      imageHash: data.imageHash
    });

    try {
      // 1. إنشاء الحملة
      const campaignResult = await this.createCampaign({
        name: data.campaignName,
        objective: data.objective,
        special_ad_categories: [], // مطلوب من Meta API
        ...(data.campaignBudget && data.campaignBudgetMode !== 'UNLIMITED' && { 
          [data.campaignBudgetMode === 'DAILY_BUDGET' ? 'daily_budget' : 'lifetime_budget']: parseInt(data.campaignBudget) * 100 // تحويل للسنت
        }),
        // إزالة startTime لجعل الحملة نشطة فوراً بدلاً من "تم الجدولة"
        // ...(data.startTime && { start_time: data.startTime }),
        ...(data.endTime && { stop_time: data.endTime }),
      });

      const campaignId = campaignResult.id;
      console.log('✅ تم إنشاء الحملة:', campaignId);

      // 2. تحديد الوجهات المطلوبة وإنشاء ad sets منفصلة
      const messageDestinations = data.messageDestinations || [];
      const isMessagingCampaign = data.objective === 'OUTCOME_TRAFFIC';
      
      let adSetIds: string[] = [];
      
      if (isMessagingCampaign && messageDestinations.length > 1) {
        console.log('🎯 إنشاء ad sets منفصلة للوجهات المتعددة:', messageDestinations);
        
        // إنشاء ad set منفصل لكل وجهة
        for (const destination of messageDestinations) {
          const destinationName = destination === 'MESSENGER' ? 'ماسنجر' : 'إنستقرام';
          const adSetData: any = {
            name: `${data.adSetName} - ${destinationName}`,
            campaign_id: campaignId,
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'CONVERSATIONS',
            destination_type: destination === 'MESSENGER' ? 'MESSENGER' : 'INSTAGRAM_DIRECT',
            bid_strategy: data.bidStrategy,
            ...(data.adSetBudget && {
              [data.adSetBudgetMode === 'DAILY_BUDGET' ? 'daily_budget' : 'lifetime_budget']: Math.floor(parseInt(data.adSetBudget) * 100 / messageDestinations.length) // تقسيم الميزانية
            }),
            // إضافة bid_amount فقط إذا تم توفيره من المستخدم
            ...(data.bidAmount && { bid_amount: parseInt(data.bidAmount) }),
            // إزالة startTime لجعل Ad Set نشط فوراً
            // ...(data.startTime && { start_time: data.startTime }),
            ...(data.endTime && { end_time: data.endTime }),
            status: 'ACTIVE',
            promoted_object: {
              page_id: data.pageId
            },
          };

          // إضافة الاستهداف من الواجهة (يتضمن بيانات المواضع)
          if (data.targeting) {
            adSetData.targeting = this.buildTargeting(data.targeting, data.placements);
          } else {
            adSetData.targeting = this.buildTargeting({
              geoLocations: { countries: ['IQ'] },
              ageMin: 18,
              ageMax: 65
            }, data.placements);
          }

          const adSetResult = await this.createAdSet(adSetData);
          adSetIds.push(adSetResult.id);
          console.log(`✅ تم إنشاء ad set للـ ${destinationName}:`, adSetResult.id);
        }
      } else {
        // إنشاء ad set واحد للوجهة الواحدة أو حملة التحويلات
        const adSetData: any = {
          name: data.adSetName,
          campaign_id: campaignId,
          billing_event: 'IMPRESSIONS',
          optimization_goal: data.objective === 'OUTCOME_SALES' ? 'OFFSITE_CONVERSIONS' : 'CONVERSATIONS',
          destination_type: isMessagingCampaign 
            ? this.getMessageDestinationType(messageDestinations)
            : 'WEBSITE',
          bid_strategy: data.bidStrategy,
          ...(data.adSetBudget && {
            [data.adSetBudgetMode === 'DAILY_BUDGET' ? 'daily_budget' : 'lifetime_budget']: parseInt(data.adSetBudget) * 100
          }),
          // إضافة bid_amount فقط إذا تم توفيره من المستخدم
          ...((() => {
            console.log('💰 Bid Amount Debug:', {
              bidAmount: data.bidAmount,
              bidAmountType: typeof data.bidAmount,
              bidStrategy: data.bidStrategy,
              parsed: data.bidAmount ? parseInt(data.bidAmount) : 'N/A'
            });
            return data.bidAmount && { bid_amount: parseInt(data.bidAmount) };
          })()),
          // إزالة startTime لجعل Ad Set نشط فوراً
          // ...(data.startTime && { start_time: data.startTime }),
          ...(data.endTime && { end_time: data.endTime }),
          status: 'ACTIVE',
        };

        // إضافة promoted_object حسب نوع الحملة
        if (data.objective === 'OUTCOME_SALES' && data.pixelId) {
          adSetData.promoted_object = {
            pixel_id: data.pixelId,
            custom_event_type: data.customEventType || 'PURCHASE'
          };
        } else if (isMessagingCampaign && data.pageId) {
          adSetData.promoted_object = {
            page_id: data.pageId
          };
        }

        // إضافة الاستهداف من الواجهة (يتضمن بيانات المواضع)
        if (data.targeting) {
          adSetData.targeting = this.buildTargeting(data.targeting, data.placements);
        } else {
          adSetData.targeting = this.buildTargeting({
            geoLocations: { countries: ['IQ'] },
            ageMin: 18,
            ageMax: 65
          }, data.placements);
        }

        const adSetResult = await this.createAdSet(adSetData);
        adSetIds.push(adSetResult.id);
        console.log('✅ تم إنشاء مجموعة الإعلان:', adSetResult.id);
      }

      // 4. رفع الوسائط وإنشاء الإعلان
      let videoId: string | undefined = undefined;
      let imageHash: string | null | undefined = undefined;

      let videoBuffer: Buffer | undefined = undefined;

      if (data.videoUrl) {
        console.log('🎬 معالجة الفيديو:', data.videoUrl);
        
        // إذا كان videoUrl معرف فيديو (رقمي) فاستخدمه مباشرة، وإلا قم بتحميله ورفعه
        if (/^\d+$/.test(data.videoUrl)) {
          console.log('🆔 معرف فيديو Meta موجود مسبقاً - استخدام مباشر');
          videoId = data.videoUrl; // معرف فيديو موجود مسبقاً
          // لا نحتاج لتحميل أو رفع الفيديو مرة أخرى
        } else if (data.videoUrl.startsWith('http')) {
          console.log('🔗 رابط فيديو جديد، جاري التحميل والرفع...');
          // تحميل ورفع الفيديو من URL
          videoBuffer = await this.downloadMediaFromUrl(data.videoUrl);
          videoId = await this.uploadVideo(videoBuffer, `${data.adName}.mp4`);
        } else {
          console.warn('⚠️ نوع videoUrl غير معروف:', data.videoUrl);
          videoId = data.videoUrl; // استخدام كما هو
        }

        // استخراج صورة مصغرة من الفيديو إذا كان متوفراً
        if (videoBuffer) {
          console.log('🖼️ بدء استخراج صورة مصغرة من الفيديو...');
          try {
            const thumbnailBuffer = await this.extractVideoThumbnail(videoBuffer);
            const uploadResult = await this.uploadImage(thumbnailBuffer, `${data.adName}_thumbnail.jpg`);
            if (uploadResult) {
              imageHash = uploadResult;
              console.log('✅ تم رفع صورة مصغرة الفيديو:', imageHash);
            } else {
              console.warn('⚠️ فشل رفع الصورة، سيتم إنشاء إعلان بدون صورة مصغرة');
            }
          } catch (error) {
            console.error('❌ فشل في استخراج الصورة المصغرة:', error);
          }
        } else {
          console.warn('⚠️ لا يوجد videoBuffer لاستخراج الصورة المصغرة');
          console.log('⏩ سيتم استخدام image_url افتراضي للفيديو');
        }
      }

      // استخدام imageHash من البيانات إذا كان متوفراً (من رفع الفيديو المباشر)
      if (!imageHash && data.imageHash) {
        console.log('🖼️ استخدام صورة غلاف من رفع الفيديو المباشر:', data.imageHash);
        imageHash = data.imageHash;
      }

      if (data.imageUrls && data.imageUrls.length > 0) {
        // رفع أول صورة
        const imageBuffer = await this.downloadMediaFromUrl(data.imageUrls[0]);
        const uploadResult = await this.uploadImage(imageBuffer, `${data.adName}.png`);
        if (uploadResult) {
          imageHash = uploadResult;
        }
      }

      // 5. إنشاء Ad Creative
      const creativeData = await this.buildAdCreative({
        name: `${data.adName} Creative`,
        pageId: data.pageId,
        adText: data.adText,
        adDescription: data.adDescription,
        callToAction: data.callToAction,
        landingPageUrl: data.landingPageUrl,
        videoId,
        imageHash,
        thumbnailUrl: data.thumbnailUrl,
        adFormat: data.adFormat,
        displayName: data.displayName,
        messageDestinations: data.messageDestinations
      });

      const creativeResult = await this.createAdCreative(creativeData);
      const creativeId = creativeResult.id;
      console.log('✅ تم إنشاء Ad Creative:', creativeId);

      // 6. إنشاء الإعلانات لكل ad set
      const adIds: string[] = [];
      
      for (let i = 0; i < adSetIds.length; i++) {
        const adSetId = adSetIds[i];
        const isMultiple = adSetIds.length > 1;
        const adName = isMultiple ? 
          `${data.adName} - ${messageDestinations[i] === 'MESSENGER' ? 'ماسنجر' : 'إنستقرام'}` : 
          data.adName;
        
        const adResult = await this.createAd({
          name: adName,
          adset_id: adSetId,
          creative: { creative_id: creativeId }
        });

        adIds.push(adResult.id);
        console.log(`✅ تم إنشاء الإعلان (${adName}):`, adResult.id);
      }

      return {
        success: true,
        campaign: { id: campaignId, name: data.campaignName },
        adSets: adSetIds.map((id, index) => ({ 
          id, 
          name: adSetIds.length > 1 ? 
            `${data.adSetName} - ${messageDestinations[index] === 'MESSENGER' ? 'ماسنجر' : 'إنستقرام'}` : 
            data.adSetName 
        })),
        ads: adIds.map((id, index) => ({ 
          id, 
          name: adIds.length > 1 ? 
            `${data.adName} - ${messageDestinations[index] === 'MESSENGER' ? 'ماسنجر' : 'إنستقرام'}` : 
            data.adName 
        })),
        creative: { id: creativeId }
      };

    } catch (error) {
      console.error('❌ فشل إنشاء الحملة الكاملة:', error);
      throw error;
    }
  }

  // بناء Ad Creative حسب نوع الإعلان
  private async buildAdCreative(data: {
    name: string;
    pageId?: string;
    adText: string;
    adDescription?: string;
    callToAction: string;
    landingPageUrl?: string;
    videoId?: string;
    imageHash?: string;
    thumbnailUrl?: string;
    adFormat: string;
    displayName: string;
    messageDestinations?: string[];
  }) {
    console.log('🏗️ بدء buildAdCreative مع البيانات:', {
      name: data.name,
      callToAction: data.callToAction,
      messageDestinations: data.messageDestinations,
      pageId: data.pageId
    });
    
    // جلب Instagram Actor ID للاستخدام في الإعلانات (لجميع الحملات التي تنشر على Instagram)
    let instagramActorId = null;
    const isMessagingCampaign = data.callToAction === 'MESSAGE_PAGE';
    const publishesToInstagram = true; // نفترض أن جميع الحملات تنشر على Instagram
    
    if (data.pageId && publishesToInstagram) {
      try {
        console.log('📄 جلب Instagram Actor ID للصفحة:', data.pageId);
        instagramActorId = await this.getInstagramActorId(data.pageId);
        if (instagramActorId) {
          console.log('🎯 تم العثور على Instagram Actor ID:', instagramActorId);
        } else {
          console.log('⚠️ لا يوجد Instagram business account مربوط - سيتم النشر على Facebook فقط');
        }
      } catch (error) {
        console.error('⚠️ خطأ في جلب Instagram Actor ID - سيتم تجاهله والمتابعة:', error);
        instagramActorId = null;
      }
    } else {
      console.log('ℹ️ تخطي Instagram Actor ID - لا توجد صفحة محددة');
    }
    
    const creative: any = {
      name: data.name,
      object_story_spec: {
        page_id: data.pageId,
        // إضافة Instagram actor ID لجميع الحملات التي تنشر على Instagram
        ...(instagramActorId && { 
          instagram_actor_id: instagramActorId 
        }),
        link_data: {
          message: data.adText,
          call_to_action: {
            type: data.callToAction,
            ...(data.landingPageUrl && { value: { link: data.landingPageUrl } })
          },
          name: data.displayName,
        }
      }
    };

    console.log('✨ Object Story Spec مع Instagram:', {
      page_id: data.pageId,
      instagram_actor_id: instagramActorId,
      hasInstagram: !!instagramActorId
    });

    // إضافة الوسائط حسب النوع
    if (data.adFormat === 'SINGLE_VIDEO' && data.videoId) {
      // فحص وجود thumbnail URL للفيديو
      if (!data.thumbnailUrl) {
        throw new Error('يجب وجود thumbnail URL للفيديو - لا نقبل صور افتراضية!');
      }
      creative.object_story_spec.video_data = {
        video_id: data.videoId,
        message: data.adText, // النص الأساسي
        title: data.displayName, // العنوان
        link_description: data.adDescription || data.adText, // الوصف المنفصل أو النص الأساسي كبديل
        call_to_action: creative.object_story_spec.link_data.call_to_action,
        // استخدام thumbnail URL الحقيقي من الفيديو فقط - لا صور افتراضية!
        ...(data.thumbnailUrl ? { image_url: data.thumbnailUrl } : {}),
        // Instagram actor ID إذا كان متوفراً
        ...(instagramActorId ? { instagram_actor_id: instagramActorId } : {})
      };
      console.log('✅ تم إعداد video_data - الفيديو مرفوع مع thumbnail مخصص من الفيديو نفسه');
      delete creative.object_story_spec.link_data;
    } else if (data.adFormat === 'SINGLE_IMAGE' && data.imageHash) {
      creative.object_story_spec.link_data.image_hash = data.imageHash;
    }

    // إضافة degrees_of_freedom_spec دائماً للحملات الرسائل
    console.log('🔍 فحص messageDestinations:', data.messageDestinations, 'length:', data.messageDestinations?.length);
    console.log('🔍 فحص callToAction:', data.callToAction);
    
    // للوجهات المتعددة: نستخدم degrees_of_freedom_spec دون message_extensions 
    // (لتجنب مشكلة صلاحيات WhatsApp Business)
    if (data.callToAction === 'MESSAGE_PAGE') {
      console.log('✅ إضافة degrees_of_freedom_spec لحملة الرسائل');
      creative.degrees_of_freedom_spec = {
        creative_features_spec: {}
      };
      
      if (data.messageDestinations && data.messageDestinations.length > 1) {
        console.log('💡 ملاحظة: سيتم إنشاء إعلان واحد يدعم الوجهات المتعددة عبر destination_type');
      }
    } else {
      console.log('❌ لم يتم إضافة أي مواصفات - ليست حملة رسائل');
    }

    console.log('✨ Ad Creative النهائي قبل الإرسال:', JSON.stringify(creative, null, 2));
    return creative;
  }

  // بناء إعدادات المواضع
  private buildPlacements(placements?: any): any {
    const placementData: any = {};
    
    if (placements) {
      // Publisher platforms مع تحكم يدوي صريح
      if (placements.publisherPlatforms?.length > 0) {
        placementData.publisher_platforms = placements.publisherPlatforms;
        
        // تحديد المواضع المحددة لكل منصة لإجبار التحكم اليدوي
        if (placements.publisherPlatforms.includes('facebook')) {
          placementData.facebook_positions = placements.facebookPlacements && placements.facebookPlacements.length > 0 
            ? placements.facebookPlacements 
            : ['feed', 'right_hand_column'];
        }
        
        if (placements.publisherPlatforms.includes('instagram')) {
          placementData.instagram_positions = placements.instagramPlacements && placements.instagramPlacements.length > 0 
            ? placements.instagramPlacements 
            : ['stream', 'story'];
        }
        
        if (placements.publisherPlatforms.includes('audience_network')) {
          placementData.audience_network_positions = placements.audienceNetwork && placements.audienceNetwork.length > 0 
            ? placements.audienceNetwork 
            : ['classic'];
        }
        
        if (placements.publisherPlatforms.includes('messenger')) {
          placementData.messenger_positions = ['messenger_home'];
        }
        
      } else {
        placementData.publisher_platforms = ['facebook', 'instagram']; // افتراضي
        placementData.facebook_positions = ['feed', 'right_hand_column'];
        placementData.instagram_positions = ['stream', 'story'];
      }
      
    } else {
      // القيم الافتراضية إذا لم يتم تمرير المواضع
      placementData.publisher_platforms = ['facebook', 'instagram'];
      placementData.facebook_positions = ['feed', 'right_hand_column'];
      placementData.instagram_positions = ['stream', 'story'];
    }
    
    return placementData;
  }

  // بناء معايير الاستهداف
  private buildTargeting(targeting: any, placements?: any) {
    const metaTargeting: any = {
      geo_locations: {
        countries: ['IQ'] // العراق افتراضياً
      },
      // استخدام قيم الأجهزة من الواجهة أو الافتراضي (الأجهزة المحمولة فقط)
      device_platforms: placements?.devicePlatforms?.length > 0 ? placements.devicePlatforms : ['mobile'],
      targeting_automation: {
        advantage_audience: targeting.advantageAudience ? 1 : 0 // تفعيل/تعطيل Advantage+ Audience حسب اختيار المستخدم
      }
    };

    // 🔥 إضافة بيانات المواضع داخل targeting للتحكم اليدوي
    if (placements) {
      const placementData = this.buildPlacements(placements);
      Object.assign(metaTargeting, placementData);
    }

    if (targeting.genders && targeting.genders.length > 0) {
      metaTargeting.genders = targeting.genders;
    }

    if (targeting.ageMin) {
      metaTargeting.age_min = targeting.ageMin;
    }

    if (targeting.ageMax) {
      metaTargeting.age_max = targeting.ageMax;
    }

    if (targeting.geoLocations) {
      metaTargeting.geo_locations = targeting.geoLocations;
    }

    if (targeting.interests && targeting.interests.length > 0) {
      metaTargeting.interests = targeting.interests.map((interest: string) => ({
        id: interest,
        name: interest
      }));
    }

    if (targeting.behaviors && targeting.behaviors.length > 0) {
      metaTargeting.behaviors = targeting.behaviors.map((behavior: string) => ({
        id: behavior,
        name: behavior
      }));
    }

    return metaTargeting;
  }

  // تحميل ملف وسائط من URL
  async downloadMediaFromUrl(mediaUrl: string): Promise<Buffer> {
    console.log('📥 تحميل الوسائط من Google Cloud Storage...');
    
    try {
      // إنشاء URL موقع مؤقت إذا كان الملف من Google Cloud Storage
      let downloadUrl = mediaUrl;
      
      if (mediaUrl.includes('storage.googleapis.com')) {
        // const { Storage } = await import('@google-cloud/storage');
        // const storage = new Storage();
        console.warn('Google Cloud Storage support disabled - using direct URL');
        
        // Google Cloud Storage support disabled
        // Using direct URL instead
        console.log('⚠️ Google Cloud Storage URL detected but support is disabled - using direct URL');
        // If you need GCS support, uncomment the code below and install @google-cloud/storage
        /*
        const urlParts = mediaUrl.split('/');
        const bucketName = urlParts[3];
        const fileName = urlParts.slice(4).join('/');
        
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);
        
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000,
        });
        
        downloadUrl = signedUrl;
        */
      }
      
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.buffer();
      console.log('✅ تم تحميل الوسائط بنجاح، الحجم:', Math.round(buffer.length / (1024 * 1024) * 100) / 100, 'MB');
      
      return buffer;
      
    } catch (error) {
      console.error('❌ فشل في تحميل الوسائط:', (error as Error).message);
      throw new Error(`فشل في تحميل الوسائط: ${(error as Error).message}`);
    }
  }
}