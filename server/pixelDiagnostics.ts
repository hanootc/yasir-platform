// أدوات تشخيص وتحليل أداء Facebook Pixel و Server-Side API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// إصلاح __dirname في ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PixelEventLog {
  timestamp: string;
  eventType: string;
  eventId?: string;
  externalId?: string;
  source: 'client' | 'server';
  success: boolean;
  error?: string;
  platformId: string;
}

class PixelDiagnostics {
  private logFile: string;
  private events: PixelEventLog[] = [];

  constructor() {
    this.logFile = path.join(__dirname, '../logs/pixel-diagnostics.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // تسجيل حدث البكسل
  logPixelEvent(event: Omit<PixelEventLog, 'timestamp'>) {
    const logEntry: PixelEventLog = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.push(logEntry);
    
    // كتابة السجل إلى الملف
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFile, logLine);

    console.log('📊 Pixel Event Logged:', {
      eventType: event.eventType,
      eventId: event.eventId,
      source: event.source,
      success: event.success
    });
  }

  // تحليل معدل النجاح للأحداث
  analyzeEventSuccess(timeRangeHours: number = 24): {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    successRate: number;
    eventsByType: Record<string, { total: number; successful: number }>;
    deduplicationRate: number;
  } {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => 
      new Date(event.timestamp) > cutoffTime
    );

    const totalEvents = recentEvents.length;
    const successfulEvents = recentEvents.filter(event => event.success).length;
    const failedEvents = totalEvents - successfulEvents;
    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;

    // تحليل الأحداث حسب النوع
    const eventsByType: Record<string, { total: number; successful: number }> = {};
    recentEvents.forEach(event => {
      if (!eventsByType[event.eventType]) {
        eventsByType[event.eventType] = { total: 0, successful: 0 };
      }
      eventsByType[event.eventType].total++;
      if (event.success) {
        eventsByType[event.eventType].successful++;
      }
    });

    // حساب معدل منع التكرار
    const uniqueEventIds = new Set(recentEvents.map(event => event.eventId).filter(Boolean));
    const deduplicationRate = recentEvents.length > 0 ? 
      (uniqueEventIds.size / recentEvents.length) * 100 : 100;

    return {
      totalEvents,
      successfulEvents,
      failedEvents,
      successRate,
      eventsByType,
      deduplicationRate
    };
  }

  // تحليل مطابقة المعرفات الخارجية
  analyzeExternalIdMatching(timeRangeHours: number = 24): {
    totalEventsWithExternalId: number;
    uniqueExternalIds: number;
    matchingRate: number;
    duplicateExternalIds: string[];
  } {
    const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => 
      new Date(event.timestamp) > cutoffTime && event.externalId
    );

    const totalEventsWithExternalId = recentEvents.length;
    const externalIds = recentEvents.map(event => event.externalId!);
    const uniqueExternalIds = new Set(externalIds).size;
    const matchingRate = totalEventsWithExternalId > 0 ? 
      (uniqueExternalIds / totalEventsWithExternalId) * 100 : 100;

    // العثور على المعرفات المكررة
    const idCounts: Record<string, number> = {};
    externalIds.forEach(id => {
      idCounts[id] = (idCounts[id] || 0) + 1;
    });
    const duplicateExternalIds = Object.keys(idCounts).filter(id => idCounts[id] > 1);

    return {
      totalEventsWithExternalId,
      uniqueExternalIds,
      matchingRate,
      duplicateExternalIds
    };
  }

  // إنشاء تقرير شامل
  generateDiagnosticReport(timeRangeHours: number = 24): string {
    const successAnalysis = this.analyzeEventSuccess(timeRangeHours);
    const externalIdAnalysis = this.analyzeExternalIdMatching(timeRangeHours);

    const report = `
=== Facebook Pixel Diagnostic Report ===
Time Range: Last ${timeRangeHours} hours
Generated: ${new Date().toISOString()}

📊 Event Success Analysis:
- Total Events: ${successAnalysis.totalEvents}
- Successful Events: ${successAnalysis.successfulEvents}
- Failed Events: ${successAnalysis.failedEvents}
- Success Rate: ${successAnalysis.successRate.toFixed(2)}%
- Deduplication Rate: ${successAnalysis.deduplicationRate.toFixed(2)}%

📋 Events by Type:
${Object.entries(successAnalysis.eventsByType).map(([type, stats]) => 
  `- ${type}: ${stats.successful}/${stats.total} (${((stats.successful/stats.total)*100).toFixed(1)}%)`
).join('\n')}

🔗 External ID Analysis:
- Events with External ID: ${externalIdAnalysis.totalEventsWithExternalId}
- Unique External IDs: ${externalIdAnalysis.uniqueExternalIds}
- Matching Rate: ${externalIdAnalysis.matchingRate.toFixed(2)}%
- Duplicate External IDs: ${externalIdAnalysis.duplicateExternalIds.length}

${externalIdAnalysis.duplicateExternalIds.length > 0 ? 
  `⚠️ Duplicate External IDs Found:\n${externalIdAnalysis.duplicateExternalIds.slice(0, 5).join('\n')}` : 
  '✅ No duplicate External IDs found'
}

=== End Report ===
    `;

    return report.trim();
  }

  // طباعة التقرير إلى وحدة التحكم
  printDiagnosticReport(timeRangeHours: number = 24) {
    const report = this.generateDiagnosticReport(timeRangeHours);
    console.log('\n' + report + '\n');
  }

  // حفظ التقرير إلى ملف
  saveDiagnosticReport(timeRangeHours: number = 24) {
    const report = this.generateDiagnosticReport(timeRangeHours);
    const reportFile = path.join(__dirname, '../logs/pixel-diagnostic-report.txt');
    fs.writeFileSync(reportFile, report);
    console.log(`📄 Diagnostic report saved to: ${reportFile}`);
  }
}

// إنشاء مثيل مشترك
export const pixelDiagnostics = new PixelDiagnostics();

// دالة مساعدة لتسجيل أحداث العميل
export function logClientPixelEvent(
  eventType: string,
  eventId: string | undefined,
  externalId: string | undefined,
  platformId: string,
  success: boolean,
  error?: string
) {
  pixelDiagnostics.logPixelEvent({
    eventType,
    eventId,
    externalId,
    source: 'client',
    success,
    error,
    platformId
  });
}

// دالة مساعدة لتسجيل أحداث الخادم
export function logServerPixelEvent(
  eventType: string,
  eventId: string | undefined,
  externalId: string | undefined,
  platformId: string,
  success: boolean,
  error?: string
) {
  pixelDiagnostics.logPixelEvent({
    eventType,
    eventId,
    externalId,
    source: 'server',
    success,
    error,
    platformId
  });
}
