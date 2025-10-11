/**
 * TikTok Event Monitoring System
 * يراقب معدل deduplication ويكشف مشاكل event_id mismatch
 */

interface EventRecord {
  eventId: string;
  eventType: string;
  timestamp: number;
  source: 'browser' | 'server';
  contentId?: string;
  value?: number;
  currency?: string;
}

class TikTokEventMonitor {
  private events: EventRecord[] = [];
  private readonly STORAGE_KEY = 'tiktok_event_monitor';
  private readonly MAX_EVENTS = 100;
  private readonly DEDUPLICATION_WINDOW = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadEvents();
  }

  /**
   * تسجيل حدث جديد
   */
  recordEvent(eventId: string, eventType: string, source: 'browser' | 'server', metadata?: any) {
    const event: EventRecord = {
      eventId,
      eventType,
      timestamp: Date.now(),
      source,
      contentId: metadata?.contentId,
      value: metadata?.value,
      currency: metadata?.currency
    };

    this.events.push(event);
    
    // الاحتفاظ بآخر MAX_EVENTS فقط
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    this.saveEvents();
    this.analyzeDeduplication();
  }

  /**
   * تحليل معدل deduplication
   */
  private analyzeDeduplication() {
    const now = Date.now();
    const recentEvents = this.events.filter(
      event => now - event.timestamp <= this.DEDUPLICATION_WINDOW
    );

    // تجميع الأحداث حسب event_id
    const eventGroups = new Map<string, EventRecord[]>();
    recentEvents.forEach(event => {
      if (!eventGroups.has(event.eventId)) {
        eventGroups.set(event.eventId, []);
      }
      eventGroups.get(event.eventId)!.push(event);
    });

    // حساب معدل deduplication
    let totalEvents = 0;
    let duplicatedEvents = 0;
    let browserServerMatches = 0;

    eventGroups.forEach((events, eventId) => {
      totalEvents++;
      
      if (events.length > 1) {
        duplicatedEvents++;
        
        // فحص إذا كان هناك تطابق بين browser و server
        const hasBrowser = events.some(e => e.source === 'browser');
        const hasServer = events.some(e => e.source === 'server');
        
        if (hasBrowser && hasServer) {
          browserServerMatches++;
        }
      }
    });

    const deduplicationRate = totalEvents > 0 ? (duplicatedEvents / totalEvents) * 100 : 0;
    const browserServerMatchRate = totalEvents > 0 ? (browserServerMatches / totalEvents) * 100 : 0;

    // تسجيل التحليل
    console.log('🎵 TikTok Deduplication Analysis:', {
      totalEvents,
      duplicatedEvents,
      browserServerMatches,
      deduplicationRate: `${deduplicationRate.toFixed(1)}%`,
      browserServerMatchRate: `${browserServerMatchRate.toFixed(1)}%`,
      status: deduplicationRate >= 80 ? '✅ GOOD' : '⚠️ NEEDS_IMPROVEMENT'
    });

    // إرسال تحذير إذا كان معدل deduplication منخفض
    if (deduplicationRate < 80 && totalEvents >= 5) {
      this.reportLowDeduplicationRate(deduplicationRate, browserServerMatchRate);
    }
  }

  /**
   * تقرير معدل deduplication منخفض
   */
  private reportLowDeduplicationRate(deduplicationRate: number, browserServerMatchRate: number) {
    console.warn('🚨 TikTok Low Deduplication Rate Detected:', {
      currentRate: `${deduplicationRate.toFixed(1)}%`,
      browserServerMatchRate: `${browserServerMatchRate.toFixed(1)}%`,
      recommendation: 'Check event_id consistency between browser and server events',
      recentEvents: this.getRecentEventsSummary()
    });

    // إرسال event مخصص للتنبيه
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tiktok_low_deduplication', {
        detail: {
          deduplicationRate,
          browserServerMatchRate,
          timestamp: Date.now()
        }
      }));
    }
  }

  /**
   * الحصول على ملخص الأحداث الأخيرة
   */
  getRecentEventsSummary() {
    const now = Date.now();
    const recentEvents = this.events
      .filter(event => now - event.timestamp <= this.DEDUPLICATION_WINDOW)
      .slice(-10);

    return recentEvents.map(event => ({
      eventId: event.eventId,
      eventType: event.eventType,
      source: event.source,
      timeAgo: Math.round((now - event.timestamp) / 1000) + 's ago'
    }));
  }

  /**
   * الحصول على إحصائيات شاملة
   */
  getStats() {
    const now = Date.now();
    const last24Hours = this.events.filter(
      event => now - event.timestamp <= 24 * 60 * 60 * 1000
    );

    const eventsByType = new Map<string, number>();
    const eventsBySource = new Map<string, number>();

    last24Hours.forEach(event => {
      eventsByType.set(event.eventType, (eventsByType.get(event.eventType) || 0) + 1);
      eventsBySource.set(event.source, (eventsBySource.get(event.source) || 0) + 1);
    });

    return {
      totalEvents: last24Hours.length,
      eventsByType: Object.fromEntries(eventsByType),
      eventsBySource: Object.fromEntries(eventsBySource),
      timeRange: '24 hours'
    };
  }

  /**
   * فحص event_id محدد
   */
  checkEventId(eventId: string) {
    const matches = this.events.filter(event => event.eventId === eventId);
    
    if (matches.length === 0) {
      return { found: false };
    }

    const sources = [...new Set(matches.map(e => e.source))];
    const hasDuplication = matches.length > 1;
    const hasBrowserServerMatch = sources.includes('browser') && sources.includes('server');

    return {
      found: true,
      count: matches.length,
      sources,
      hasDuplication,
      hasBrowserServerMatch,
      events: matches.map(e => ({
        source: e.source,
        timestamp: e.timestamp,
        eventType: e.eventType
      }))
    };
  }

  /**
   * حفظ الأحداث في localStorage
   */
  private saveEvents() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
      }
    } catch (error) {
      console.warn('Failed to save TikTok events to localStorage:', error);
    }
  }

  /**
   * تحميل الأحداث من localStorage
   */
  private loadEvents() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.events = JSON.parse(stored);
          
          // تنظيف الأحداث القديمة
          const now = Date.now();
          const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
          this.events = this.events.filter(event => event.timestamp > oneWeekAgo);
        }
      }
    } catch (error) {
      console.warn('Failed to load TikTok events from localStorage:', error);
      this.events = [];
    }
  }

  /**
   * مسح جميع البيانات
   */
  clear() {
    this.events = [];
    this.saveEvents();
  }
}

// إنشاء instance واحد للاستخدام العام
export const tiktokEventMonitor = new TikTokEventMonitor();

// تصدير الكلاس للاستخدام المتقدم
export { TikTokEventMonitor };
