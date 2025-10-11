/**
 * Server-side Content ID Extractor for TikTok Events API
 * نسخة server-side من content-id-extractor
 */

export function extractServerContentId(data: any): string {
  // قائمة المصادر مرتبة حسب الأولوية
  const candidates = [
    data.content_id,
    data.content_ids?.[0],
    data.product_id,
    data.sku,
    data.item_id,
    data.id,
    data.landing_page_id,
    data.transaction_id,
    data.order_number,
    data.order_id
  ];
  
  // البحث عن أول قيمة صالحة
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
    if (candidate && typeof candidate === 'number') {
      return candidate.toString();
    }
  }
  
  // إنشاء fallback ID ذكي
  return generateServerFallbackId(data);
}

function generateServerFallbackId(data: any): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 4);
  
  let prefix = 'server_product';
  
  // محاولة إنشاء معرف ذكي من البيانات المتاحة
  if (data.content_name || data.product_name) {
    const name = (data.content_name || data.product_name).toLowerCase();
    prefix = 'srv_' + name.replace(/[^a-z0-9]/g, '').substr(0, 6);
  } else if (data.content_category || data.product_category) {
    const category = (data.content_category || data.product_category).toLowerCase();
    prefix = 'srv_' + category.replace(/[^a-z0-9]/g, '').substr(0, 6);
  }
  
  const fallbackId = `${prefix}_${timestamp.toString().slice(-8)}_${randomSuffix}`;
  
  console.warn('🎬 TikTok Server: Generated fallback content_id:', {
    fallbackId,
    prefix,
    availableData: Object.keys(data || {})
  });
  
  return fallbackId;
}

export function validateContentId(contentId: string): boolean {
  return !!(contentId && 
           typeof contentId === 'string' && 
           contentId.trim().length > 0 && 
           contentId.trim() !== 'undefined' && 
           contentId.trim() !== 'null');
}
