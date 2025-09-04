import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CreditCard, ArrowRight, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

export default function SubscriptionExpired() {
  const [countdown, setCountdown] = useState(10);

  // جلب معلومات المنصة
  const { data: session } = useQuery({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // جلب حالة الاشتراك
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/platform/subscription-status"],
    retry: false,
  });

  // عداد تنازلي لإعادة التوجيه التلقائي
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // إعادة توجيه تلقائي إلى صفحة تجديد الاشتراك
      window.location.href = '/subscription-renewal';
    }
  }, [countdown]);

  const handleRenewal = () => {
    window.location.href = '/subscription-renewal';
  };

  const handleContactSupport = () => {
    // إعادة توجيه إلى الواتساب أو البريد الإلكتروني
    window.open('https://wa.me/+964XXXXXXXXX', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* شعار تحذيري */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* معلومات انتهاء الاشتراك */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
              انتهت صلاحية اشتراكك
            </CardTitle>
            <Badge variant="destructive" className="mx-auto">
              اشتراك منتهي الصلاحية
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* معلومات المنصة */}
            {session?.platformName && (
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  منصة: {session.platformName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {session.subdomain}.منصتي.com
                </p>
              </div>
            )}

            {/* معلومات انتهاء الصلاحية */}
            {subscriptionStatus?.subscriptionEndDate && (
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    انتهى الاشتراك في:
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {new Date(subscriptionStatus.subscriptionEndDate).toLocaleDateString('ar-IQ')}
                  </p>
                </div>
              </div>
            )}

            {/* رسالة تحذيرية */}
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                <strong>تم إيقاف جميع خدمات المنصة مؤقتاً</strong>
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                لن تتمكن من الوصول لبيانات المنصة حتى يتم تجديد الاشتراك
              </p>
            </div>

            {/* أزرار العمل */}
            <div className="space-y-3">
              <Button 
                onClick={handleRenewal}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                تجديد الاشتراك الآن
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                onClick={handleContactSupport}
                variant="outline"
                className="w-full"
                size="lg"
              >
                التواصل مع الدعم الفني
              </Button>
            </div>

            {/* العداد التنازلي */}
            <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  إعادة توجيه تلقائي خلال
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {countdown}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>في حالة استمرار المشكلة، يرجى التواصل مع الدعم الفني</p>
        </div>
      </div>
    </div>
  );
}