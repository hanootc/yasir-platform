/**
 * Content ID Extractor for TikTok Pixel
 * يستخرج content_id صالح من مصادر مختلفة لحل مشكلة "Content ID is missing"
 */

interface ContentIdExtractionResult {
  contentId: string;
  source: string;
  isGenerated: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export class ContentIdExtractor {
  /**
   * استخراج content_id من البيانات المختلفة
   */
  static extract(data: any): ContentIdExtractionResult {
    // قائمة المصادر مرتبة حسب الأولوية
    const sources = [
      { key: 'content_ids[0]', value: data?.content_ids?.[0], confidence: 'high' as const },
      { key: 'content_id', value: data?.content_id, confidence: 'high' as const },
      { key: 'product_id', value: data?.product_id, confidence: 'high' as const },
      { key: 'sku', value: data?.sku, confidence: 'high' as const },
      { key: 'item_id', value: data?.item_id, confidence: 'high' as const },
      { key: 'id', value: data?.id, confidence: 'medium' as const },
      { key: 'landing_page_id', value: data?.landing_page_id, confidence: 'medium' as const },
      { key: 'transaction_id', value: data?.transaction_id, confidence: 'medium' as const },
      { key: 'order_number', value: data?.order_number, confidence: 'medium' as const },
      { key: 'order_id', value: data?.order_id, confidence: 'medium' as const }
    ];

    // البحث عن أول قيمة صالحة
    for (const source of sources) {
      const contentId = this.validateAndClean(source.value);
      if (contentId) {
        return {
          contentId,
          source: source.key,
          isGenerated: false,
          confidence: source.confidence
        };
      }
    }

    // إذا لم نجد content_id صالح، أنشئ واحد ذكي
    return this.generateFallbackContentId(data);
  }

  /**
   * تنظيف وvalidation للقيمة
   */
  private static validateAndClean(value: any): string | null {
    if (!value) return null;
    
    // تحويل الرقم إلى string
    if (typeof value === 'number') {
      return value.toString();
    }
    
    // تنظيف string
    if (typeof value === 'string') {
      const cleaned = value.trim();
      if (cleaned.length > 0 && cleaned !== 'undefined' && cleaned !== 'null') {
        return cleaned;
      }
    }
    
    return null;
  }

  /**
   * إنشاء content_id احتياطي ذكي
   */
  private static generateFallbackContentId(data: any): ContentIdExtractionResult {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 4);
    
    // محاولة إنشاء معرف ذكي من البيانات المتاحة
    let prefix = 'product';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    // إذا كان لدينا معلومات عن المنتج
    if (data?.content_name || data?.product_name) {
      const name = (data.content_name || data.product_name).toLowerCase();
      prefix = name.replace(/[^a-z0-9]/g, '').substr(0, 8) || 'product';
      confidence = 'medium';
    }
    
    // إذا كان لدينا معلومات عن الفئة
    if (data?.content_category || data?.product_category) {
      const category = (data.content_category || data.product_category).toLowerCase();
      prefix = category.replace(/[^a-z0-9]/g, '').substr(0, 6) || prefix;
      confidence = 'medium';
    }
    
    // إذا كان لدينا معلومات عن السعر
    if (data?.value || data?.price) {
      const price = (data.value || data.price).toString().replace(/[^0-9]/g, '');
      if (price.length > 0) {
        prefix += '_' + price.substr(0, 4);
        confidence = 'medium';
      }
    }

    const contentId = `${prefix}_${timestamp.toString().slice(-8)}_${randomSuffix}`;
    
    console.warn('🎵 Generated fallback content_id:', {
      contentId,
      prefix,
      confidence,
      availableData: Object.keys(data || {})
    });

    return {
      contentId,
      source: 'generated',
      isGenerated: true,
      confidence
    };
  }

  /**
   * تحسين content_id للكتالوج
   */
  static optimizeForCatalog(contentId: string, data: any): string {
    // إذا كان content_id يحتوي على UUID، حاول استخراج معرف رقمي
    if (contentId.includes('-') && contentId.length > 20) {
      // محاولة العثور على معرف رقمي في البيانات
      const numericCandidates = [
        data?.numeric_id,
        data?.catalog_id,
        data?.variant_id,
        data?.sku
      ];
      
      for (const candidate of numericCandidates) {
        const cleaned = this.validateAndClean(candidate);
        if (cleaned && /^\d+$/.test(cleaned)) {
          console.log('🎵 Optimized content_id for catalog:', contentId, '->', cleaned);
          return cleaned;
        }
      }
    }
    
    return contentId;
  }

  /**
   * إحصائيات استخراج content_id
   */
  static getExtractionStats(): { [source: string]: number } {
    const stats = JSON.parse(localStorage.getItem('content_id_extraction_stats') || '{}');
    return stats;
  }

  /**
   * تسجيل إحصائية استخراج
   */
  static recordExtraction(source: string, isGenerated: boolean) {
    try {
      const stats = this.getExtractionStats();
      const key = isGenerated ? `generated_${source}` : source;
      stats[key] = (stats[key] || 0) + 1;
      localStorage.setItem('content_id_extraction_stats', JSON.stringify(stats));
    } catch (error) {
      // تجاهل أخطاء localStorage
    }
  }

  /**
   * تحليل جودة content_id
   */
  static analyzeQuality(contentId: string): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // فحص الطول
    if (contentId.length < 3) {
      issues.push('Content ID too short');
      score -= 30;
    }
    if (contentId.length > 100) {
      issues.push('Content ID too long');
      score -= 10;
    }

    // فحص الأحرف
    if (!/^[a-zA-Z0-9_-]+$/.test(contentId)) {
      issues.push('Contains special characters');
      score -= 20;
      recommendations.push('Use only alphanumeric characters, underscores, and hyphens');
    }

    // فحص إذا كان generated
    if (contentId.includes('product_') && contentId.includes('_')) {
      issues.push('Generated content ID');
      score -= 15;
      recommendations.push('Use actual product IDs from your catalog');
    }

    // فحص UUID
    if (contentId.includes('-') && contentId.length > 30) {
      issues.push('UUID format may not match catalog');
      score -= 10;
      recommendations.push('Consider using numeric product IDs');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}

// تصدير دالة مبسطة للاستخدام السريع
export function extractContentId(data: any): string {
  const result = ContentIdExtractor.extract(data);
  ContentIdExtractor.recordExtraction(result.source, result.isGenerated);
  return result.contentId;
}
