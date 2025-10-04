import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Info,
  Calendar
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";

interface DatasetQualityMetrics {
  matchRate: number;
  matchedUsers: number;
  uploadedUsers: number;
  timestamp: number;
}

interface QualityRecommendation {
  type: 'success' | 'warning' | 'critical';
  title: string;
  description: string;
  actions: string[];
}

interface FacebookDatasetQualityProps {
  className?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export default function FacebookDatasetQuality({ className, dateRange: externalDateRange }: FacebookDatasetQualityProps) {
  console.log('🔍 FacebookDatasetQuality component mounted [v2]', {
    hasExternalDateRange: !!externalDateRange,
    externalDateRange
  });

  // تحقق من جلسة المنصة أولاً
  const { data: platformSession } = useQuery({
    queryKey: ['/api/platform-session'],
    queryFn: async () => {
      const response = await fetch('/api/platform-session', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  // تحقق من إعدادات Facebook
  const { data: settingsCheck, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ['/api/platform/facebook/settings-check'],
    queryFn: async () => {
      console.log('🔍 Fetching Facebook settings check...');
      const response = await fetch('/api/platform/facebook/settings-check', {
        credentials: 'include'
      });
      
      console.log('📊 Settings check response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('⚠️ Platform authentication required for Facebook settings');
          return { success: false, hasSettings: false, authRequired: true };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // تشخيص المحتوى المرجع
      const responseText = await response.text();
      console.log('📄 Raw response text (first 200 chars):', responseText.substring(0, 200));
      
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Settings check result:', result);
        return result;
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('📄 Full response text:', responseText);
        throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }
    },
    enabled: !!platformSession?.platformId, // تشغيل فقط إذا كانت هناك جلسة منصة
  });

  console.log('🔍 Platform session:', platformSession);
  console.log('🔍 Settings check result:', {
    settingsCheck,
    settingsLoading,
    settingsError: settingsError?.message
  });

  // استخدام الفترة الزمنية الخارجية إذا كانت متاحة، وإلا استخدام الافتراضية
  const [internalDateRange, setInternalDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // تحديد الفترة الزمنية المستخدمة مع التأكد من عدم تجاوز اليوم الحالي
  const activeeDateRange = useMemo(() => {
    if (externalDateRange) {
      // تقليل النطاق الزمني إذا كان أكبر من 30 يوم
      const daysDiff = Math.ceil((externalDateRange.endDate.getTime() - externalDateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const adjustedEndDate = daysDiff > 30 ? subDays(externalDateRange.startDate, -30) : externalDateRange.endDate;
      
      return {
        startDate: format(externalDateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(
          adjustedEndDate > new Date() ? new Date() : adjustedEndDate, 
          'yyyy-MM-dd'
        )
      };
    }
    return internalDateRange;
  }, [externalDateRange, internalDateRange]);

  // جلب مقاييس جودة البيانات
  const { 
    data: qualityData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/platform/facebook/dataset-quality', activeeDateRange.startDate, activeeDateRange.endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: activeeDateRange.startDate,
        endDate: activeeDateRange.endDate
      });
      
      console.log('📊 Fetching Facebook Dataset Quality:', {
        startDate: activeeDateRange.startDate,
        endDate: activeeDateRange.endDate,
        url: `/api/platform/facebook/dataset-quality?${params}`
      });

      const response = await fetch(`/api/platform/facebook/dataset-quality?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Dataset Quality API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Dataset Quality Response:', result);
      return result;
    },
    enabled: settingsCheck?.hasSettings === true, // تشغيل فقط إذا كانت الإعدادات موجودة
    refetchInterval: 10 * 60 * 1000, // تحديث كل 10 دقائق
    staleTime: 5 * 60 * 1000, // البيانات صالحة لمدة 5 دقائق
  });

  const metrics: DatasetQualityMetrics | null = qualityData?.data || null;
  const recommendations: QualityRecommendation[] = qualityData?.recommendations || [];

  const getMatchRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchRateBgColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100 dark:bg-green-900';
    if (rate >= 50) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className={className}>
      <Card className="theme-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              جودة بيانات Facebook Conversions API
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* فترة البيانات */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              البيانات من {format(new Date(activeeDateRange.startDate), 'dd MMM yyyy', { locale: ar })} 
              {' '}إلى {format(new Date(activeeDateRange.endDate), 'dd MMM yyyy', { locale: ar })}
            </span>
          </div>

          {/* تحقق من تسجيل الدخول */}
          {settingsCheck?.authRequired && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>يجب تسجيل الدخول</AlertTitle>
              <AlertDescription>
                يجب تسجيل الدخول إلى المنصة أولاً لعرض مقاييس جودة البيانات.
              </AlertDescription>
            </Alert>
          )}

          {/* تحقق من إعدادات Facebook */}
          {settingsCheck && !settingsCheck.hasSettings && !settingsCheck.authRequired && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>إعدادات Facebook مفقودة</AlertTitle>
              <AlertDescription>
                <p className="mb-2">يجب إعداد Facebook Pixel أولاً لعرض مقاييس الجودة:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {!settingsCheck.settings?.hasPixelId && <li>أضف Facebook Pixel ID</li>}
                  {!settingsCheck.settings?.hasAccessToken && <li>أضف Facebook Access Token</li>}
                </ul>
                <p className="mt-2 text-sm">اذهب إلى إعدادات المنصة لإضافة هذه المعلومات.</p>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>خطأ في جلب البيانات</AlertTitle>
              <AlertDescription>
                <p>تعذر جلب مقاييس جودة البيانات.</p>
                <p className="text-sm mt-1">تفاصيل الخطأ: {error.message}</p>
                
                {/* خطأ صلاحيات Facebook */}
                {error.message.includes('Missing Permission') && (
                  <div className="mt-3 p-3 bg-red-100 dark:bg-red-900 rounded">
                    <p className="text-sm font-medium">🔐 مشكلة في صلاحيات Facebook Access Token</p>
                    <div className="text-xs mt-2 space-y-1">
                      <p><strong>السبب:</strong> Facebook Access Token لا يحتوي على الصلاحيات المطلوبة</p>
                      <p><strong>الصلاحيات المطلوبة:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li><code>business_management</code></li>
                        <li><code>ads_management</code></li>
                        <li><code>ads_read</code></li>
                      </ul>
                      <p className="mt-2"><strong>الحل:</strong> قم بتحديث Facebook Access Token في إعدادات المنصة</p>
                    </div>
                  </div>
                )}
                
                {error.message.includes('HTML') && (
                  <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                    <p className="text-sm font-medium">💡 حل مقترح:</p>
                    <ul className="text-xs mt-1 space-y-1">
                      <li>• تأكد من تسجيل الدخول بشكل صحيح</li>
                      <li>• امسح cache المتصفح (Ctrl+Shift+R)</li>
                      <li>• أعد تحميل الصفحة</li>
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">جاري جلب مقاييس الجودة...</p>
            </div>
          )}

          {!isLoading && !error && !qualityData?.success && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <Info className="w-4 h-4" />
              <AlertTitle>لا توجد بيانات جودة</AlertTitle>
              <AlertDescription>
                <p className="mb-2">لا توجد بيانات جودة متاحة للفترة المحددة ({format(new Date(activeeDateRange.startDate), 'dd/MM', { locale: ar })} - {format(new Date(activeeDateRange.endDate), 'dd/MM', { locale: ar })}).</p>
                <div className="text-sm space-y-1">
                  <p>💡 <strong>نصائح لتحسين البيانات:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>تأكد من إرسال أحداث Facebook Pixel بانتظام</li>
                    <li>جرب فترة زمنية أطول (آخر 30 يوم)</li>
                    <li>تحقق من صحة إعدادات Facebook Conversions API</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {metrics && (
            <>
              {/* المقاييس الرئيسية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* معدل المطابقة */}
                <Card className={`theme-border ${getMatchRateBgColor(metrics.matchRate)}`}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getMatchRateColor(metrics.matchRate)}`}>
                        {metrics.matchRate}%
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                        معدل المطابقة
                      </p>
                      <Progress 
                        value={metrics.matchRate} 
                        className="mt-2 h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* المستخدمون المطابقون */}
                <Card className="theme-border">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {metrics.matchedUsers.toLocaleString('ar-IQ')}
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                        مستخدمون مطابقون
                      </p>
                      <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
                        <Users className="w-3 h-3 mr-1" />
                        مطابق بنجاح
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* إجمالي المستخدمين */}
                <Card className="theme-border">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {metrics.uploadedUsers.toLocaleString('ar-IQ')}
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                        إجمالي المرسل
                      </p>
                      <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        تم الإرسال
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* التوصيات */}
              {recommendations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">توصيات التحسين</h3>
                  {recommendations.map((rec, index) => (
                    <Alert 
                      key={index}
                      className={`
                        ${rec.type === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950' : ''}
                        ${rec.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950' : ''}
                        ${rec.type === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-950' : ''}
                      `}
                    >
                      {getRecommendationIcon(rec.type)}
                      <AlertTitle className="flex items-center gap-2">
                        {rec.title}
                        <Badge 
                          variant={rec.type === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {rec.type === 'success' ? 'ممتاز' : rec.type === 'warning' ? 'تحسين' : 'هام'}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">{rec.description}</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {rec.actions.map((action, actionIndex) => (
                            <li key={actionIndex}>{action}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* معلومات إضافية */}
              <div className="text-xs text-gray-500 text-center">
                آخر تحديث: {format(new Date(metrics.timestamp), 'dd/MM/yyyy HH:mm', { locale: ar })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
