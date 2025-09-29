import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MessageCircle, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Crown,
  Star,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RenewalData {
  selectedPlan: string;
  currentPlan?: string;
  platformName?: string;
  subdomain?: string;
  ownerName?: string;
  phoneNumber?: string;
  businessType?: string;
}

export default function SubscriptionRenewalContact() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [renewalData, setRenewalData] = useState<RenewalData | null>(null);
  
  const supportPhone = "9647838383837";
  const supportWhatsApp = `https://wa.me/${supportPhone}`;

  // خطط الاشتراك
  const plans = {
    basic: {
      name: 'البداية',
      price: '49,000',
      icon: Shield,
      color: 'text-blue-500'
    },
    premium: {
      name: 'المحترف',
      price: '69,000',
      icon: Star,
      color: 'text-purple-500'
    },
    enterprise: {
      name: 'المؤسسات',
      price: '99,000',
      icon: Crown,
      color: 'text-gold-500'
    }
  };

  useEffect(() => {
    console.log('🔍 Loading renewal data...');
    
    const loadPlatformData = async () => {
      // جلب بيانات التجديد من localStorage أو URL params
      const urlParams = new URLSearchParams(window.location.search);
      const planFromUrl = urlParams.get('plan');
      
      const savedData = localStorage.getItem('renewalData');
      console.log('📋 Saved renewal data:', savedData);
      
      // محاولة جلب البيانات من قاعدة البيانات أولاً
      try {
        console.log('🌐 Fetching platform data from API...');
        const response = await fetch('/api/platform/current', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const platformData = await response.json();
          console.log('✅ Platform data from API:', platformData);
          
          setRenewalData({
            selectedPlan: planFromUrl || 'premium',
            platformName: platformData.platformName,
            subdomain: platformData.subdomain,
            ownerName: platformData.ownerName,
            phoneNumber: platformData.phoneNumber || platformData.contactPhone,
            businessType: platformData.businessType,
            currentPlan: platformData.subscriptionPlan
          });
          return;
        } else {
          console.log('⚠️ API call failed, falling back to localStorage');
        }
      } catch (error) {
        console.error('❌ Error fetching platform data from API:', error);
      }
      
      // Fallback إلى localStorage إذا فشل API
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          console.log('✅ Parsed renewal data from localStorage:', data);
          setRenewalData({
            ...data,
            selectedPlan: planFromUrl || data.selectedPlan
          });
        } catch (error) {
          console.error('❌ Error parsing renewal data:', error);
        }
      } else {
        console.log('⚠️ No renewal data found, checking platform session...');
        
        // إذا لم توجد بيانات التجديد، جرب جلب بيانات المنصة من الجلسة
        const platformSession = localStorage.getItem('platformSession');
        console.log('📋 Platform session:', platformSession);
        
        if (platformSession) {
          try {
            const sessionData = JSON.parse(platformSession);
            console.log('✅ Parsed platform session:', sessionData);
            
            setRenewalData({
              selectedPlan: planFromUrl || 'premium',
              platformName: sessionData.platformName,
              subdomain: sessionData.subdomain,
              ownerName: sessionData.ownerName,
              phoneNumber: sessionData.phoneNumber || sessionData.contactPhone
            });
          } catch (error) {
            console.error('❌ Error parsing platform session:', error);
          }
        } else {
          // إذا لم توجد أي بيانات، استخدم الخطة من URL فقط
          setRenewalData({
            selectedPlan: planFromUrl || 'premium'
          });
        }
      }
    };

    loadPlatformData();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label} بنجاح`,
      variant: "default",
    });
  };

  const generateWhatsAppMessage = () => {
    const selectedPlanInfo = plans[renewalData?.selectedPlan as keyof typeof plans] || plans.premium;
    
    const message = `السلام عليكم ورحمة الله وبركاته

أريد تجديد اشتراك منصتي:

📋 *تفاصيل التجديد:*
• اسم المنصة: ${renewalData?.platformName || 'غير محدد'}
• الرابط: sanadi.pro/${renewalData?.subdomain || 'غير محدد'}
• اسم المالك: ${renewalData?.ownerName || 'غير محدد'}
• رقم الهاتف: ${renewalData?.phoneNumber || 'غير محدد'}

💎 *الخطة المطلوبة:*
• اسم الخطة: ${selectedPlanInfo.name}
• السعر: ${selectedPlanInfo.price} دينار/شهر
• نوع العملية: تجديد اشتراك

يرجى مساعدتي في إتمام عملية التجديد.

شكراً لكم 🙏`;

    return encodeURIComponent(message);
  };

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    window.open(`${supportWhatsApp}?text=${message}`, '_blank');
  };

  const selectedPlanInfo = plans[renewalData?.selectedPlan as keyof typeof plans] || plans.premium;
  const PlanIcon = selectedPlanInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-2xl space-y-6">
        {/* الرسالة الرئيسية */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              طلب تجديد الاشتراك 🔄
            </CardTitle>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700">
                <AlertCircle className="w-3 h-3 ml-1" />
                يتطلب تأكيد من الدعم
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* رسالة التجديد */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    يرجى التواصل مع الدعم لتجديد الاشتراك
                  </h3>
                  <p className="text-purple-700 dark:text-purple-200 text-sm leading-relaxed">
                    لإتمام عملية تجديد اشتراكك، يرجى التواصل مع فريق الدعم عبر واتساب. 
                    سيقوم الفريق بمساعدتك في اختيار الخطة المناسبة وإتمام عملية الدفع.
                  </p>
                </div>
              </div>
            </div>

            {/* تفاصيل الخطة المختارة */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <PlanIcon className={`w-5 h-5 ${selectedPlanInfo.color}`} />
                الخطة المختارة للتجديد
              </h3>
              
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r ${
                    renewalData?.selectedPlan === 'basic' ? 'from-blue-400 to-blue-600' :
                    renewalData?.selectedPlan === 'premium' ? 'from-purple-400 to-purple-600' :
                    'from-yellow-400 to-yellow-600'
                  }`}>
                    <PlanIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      خطة {selectedPlanInfo.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedPlanInfo.price} دينار/شهر
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                  للتجديد
                </Badge>
              </div>
            </div>

            {/* معلومات الاتصال */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                معلومات الدعم
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3 border border-green-100 dark:border-green-600">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-200">واتساب:</span>
                    <span className="text-gray-600 dark:text-gray-300 font-mono">{supportPhone}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(supportPhone, "رقم الواتساب")}
                    className="border-green-200 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>

                <Button
                  onClick={openWhatsApp}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 ml-2" />
                  فتح واتساب لتجديد الاشتراك
                  <ExternalLink className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>

            {/* تفاصيل المنصة */}
            {renewalData && (renewalData.platformName || renewalData.subdomain) && (
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  تفاصيل منصتك
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {renewalData.platformName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">اسم المنصة:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{renewalData.platformName}</span>
                    </div>
                  )}
                  {renewalData.subdomain && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">الرابط:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">sanadi.pro/{renewalData.subdomain}</span>
                    </div>
                  )}
                  {renewalData.ownerName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">اسم المالك:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{renewalData.ownerName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* خطوات التجديد */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">خطوات تجديد الاشتراك:</h3>
              <ol className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  اضغط على زر "فتح واتساب لتجديد الاشتراك"
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  أرسل الرسالة لفريق الدعم
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  انتظر تأكيد التجديد (خلال الساعات القادمة)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  استمتع بالخطة الجديدة بعد التفعيل
                </li>
              </ol>
            </div>

            {/* أزرار إضافية */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/subscription-renewal'}
                className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                العودة لاختيار الخطة
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/platform-login'}
                className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                تسجيل الدخول للمنصة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
