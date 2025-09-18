import { useQuery } from '@tanstack/react-query';
import { Calendar, AlertTriangle, Clock, Shield, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SubscriptionInfoProps {
  className?: string;
}

// Define subscription data interface
interface SubscriptionData {
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  daysExpired?: number;
  daysRemaining?: number;
  subscriptionStartDate?: string;
  createdAt?: string;
  subscriptionEndDate?: string;
  subscriptionPlan?: string;
}

export function SubscriptionInfo({ className = "" }: SubscriptionInfoProps) {
  // جلب بيانات الاشتراك الحقيقية من الخادم
  const { data: subscriptionData, isLoading } = useQuery<SubscriptionData>({
    queryKey: ['/api/platform/subscription-status'],
    retry: false,
  });

  if (isLoading || !subscriptionData) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-');
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'basic': return 'البداية';
      case 'premium': return 'المحترف';
      case 'enterprise': return 'المتطور';
      default: return plan;
    }
  };

  const getStatusColor = () => {
    if (subscriptionData?.isExpired) return 'bg-red-100 text-red-800 border-red-200';
    if (subscriptionData?.isExpiringSoon) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getWarningMessage = () => {
    if (subscriptionData?.isExpired) {
      return `انتهى منذ ${subscriptionData.daysExpired || 0} يوم`;
    }
    if (subscriptionData?.isExpiringSoon) {
      return `ينتهي خلال ${subscriptionData.daysRemaining || 0} يوم`;
    }
    return `ينتهي خلال ${subscriptionData.daysRemaining || 0} يوم`;
  };

  const handleRenewal = () => {
    // توجيه إلى صفحة تجديد الاشتراك المخصصة
    window.location.href = '/subscription-renewal';
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* معلومات الاشتراك - مخفية على الشاشات الصغيرة */}
      <div className="hidden md:flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>البداية:</span>
          <span className="font-medium">{formatDate(subscriptionData?.subscriptionStartDate || subscriptionData?.createdAt || '')}</span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>النهاية:</span>
          <span className="font-medium">{formatDate(subscriptionData?.subscriptionEndDate || '')}</span>
        </div>
      </div>

      {/* شارة الخطة */}
      <Badge variant="outline" className="flex items-center gap-1">
        <Shield className="w-3 h-3" />
        {getPlanName(subscriptionData?.subscriptionPlan || '')}
      </Badge>

      {/* تحذير الاشتراك */}
      {(subscriptionData?.isExpired || subscriptionData?.isExpiringSoon) && (
        <div className="flex items-center gap-2">
          <Badge 
            className={`flex items-center gap-1 border ${getStatusColor()}`}
            variant="outline"
          >
            <AlertTriangle className="w-3 h-3" />
            {getWarningMessage()}
          </Badge>
          
          {/* زر التجديد */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRenewal}
            className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            تجديد
          </Button>
        </div>
      )}
    </div>
  );
}