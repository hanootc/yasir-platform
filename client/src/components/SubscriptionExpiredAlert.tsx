import { AlertCircle, Calendar, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SubscriptionExpiredAlertProps {
  platform: {
    platformName: string;
    subscriptionPlan: string;
    subscriptionEndDate: string;
    daysExpired: number;
  };
  onRenew: () => void;
}

export function SubscriptionExpiredAlert({ platform, onRenew }: SubscriptionExpiredAlertProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'basic': return '1,000 د.ع';
      case 'premium': return '69,000 د.ع';
      case 'enterprise': return '99,000 د.ع';
      default: return '0 د.ع';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full border border-red-200 dark:border-red-800">
        {/* رمز التحذير */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
        </div>

        {/* العنوان */}
        <h3 className="text-xl font-bold text-center text-red-600 dark:text-red-500 mb-2">
          انتهى اشتراك منصتك
        </h3>
        
        {/* الوصف */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          انتهت صلاحية اشتراك منصة "{platform.platformName}" منذ {platform.daysExpired} يوم
        </p>

        {/* معلومات الاشتراك */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">الخطة المنتهية:</span>
            <Badge variant="outline" className="border-red-200 text-red-700">
              {platform.subscriptionPlan}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">انتهى في:</span>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(platform.subscriptionEndDate)}
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="space-y-3">
          <Button 
            onClick={onRenew}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <CreditCard className="w-4 h-4 ml-2" />
            تجديد الاشتراك - {getPlanPrice(platform.subscriptionPlan)}
          </Button>
          
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-300">
              منصتك ومتجرك غير متاحين للزوار حالياً. ستعود للعمل فور التجديد.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}