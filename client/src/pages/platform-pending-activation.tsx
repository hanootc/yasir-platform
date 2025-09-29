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
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlatformData {
  platformName: string;
  subdomain: string;
  ownerName: string;
  phoneNumber: string;
  businessType: string;
  subscriptionPlan: string;
  createdAt: string;
}

export default function PlatformPendingActivation() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [platformData, setPlatformData] = useState<PlatformData | null>(null);
  
  const supportPhone = "9647838383837";
  const supportWhatsApp = `https://wa.me/${supportPhone}`;

  useEffect(() => {
    // جلب بيانات المنصة من localStorage (من التسجيل أو تسجيل الدخول)
    const newPlatformData = localStorage.getItem('newPlatformData');
    const pendingPlatformData = localStorage.getItem('pendingPlatformData');
    
    console.log('🔍 Platform data check:', {
      newPlatformData,
      pendingPlatformData
    });
    
    const savedData = newPlatformData || pendingPlatformData;
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        console.log('✅ Parsed platform data:', data);
        setPlatformData(data);
      } catch (error) {
        console.error('❌ Error parsing platform data:', error);
      }
    } else {
      console.log('⚠️ No platform data found in localStorage');
    }
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
    const message = `السلام عليكم ورحمة الله وبركاته

أريد تفعيل منصتي الجديدة:

📋 *تفاصيل المنصة:*
• اسم المنصة: ${platformData?.platformName || 'غير محدد'}
• الرابط: sanadi.pro/${platformData?.subdomain || 'غير محدد'}
• اسم المالك: ${platformData?.ownerName || 'غير محدد'}
• رقم الهاتف: ${platformData?.phoneNumber || 'غير محدد'}
• نوع النشاط: ${platformData?.businessType || 'غير محدد'}
• خطة الاشتراك: ${platformData?.subscriptionPlan || 'غير محدد'}
• تاريخ التسجيل: ${platformData?.createdAt ? new Date(platformData.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}

يرجى تفعيل المنصة في أقرب وقت ممكن.

شكراً لكم 🙏`;

    return encodeURIComponent(message);
  };

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    window.open(`${supportWhatsApp}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-2xl space-y-6">
        {/* الرسالة الرئيسية */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              تم إنشاء منصتك بنجاح! 🎉
            </CardTitle>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700">
                <AlertCircle className="w-3 h-3 ml-1" />
                في انتظار التفعيل
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* رسالة التفعيل */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    يرجى التواصل مع الدعم لتفعيل المنصة
                  </h3>
                  <p className="text-blue-700 dark:text-blue-200 text-sm leading-relaxed">
                    منصتك جاهزة ولكنها تحتاج إلى تفعيل من فريق الدعم. 
                    يرجى التواصل معنا عبر واتساب لإكمال عملية التفعيل.
                  </p>
                </div>
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
                  فتح واتساب مع تفاصيل المنصة
                  <ExternalLink className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>

            {/* تفاصيل المنصة */}
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                تفاصيل منصتك
              </h3>
              
              {platformData ? (
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">اسم المنصة:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platformData.platformName || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">الرابط:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">sanadi.pro/{platformData.subdomain || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">اسم المالك:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platformData.ownerName || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">رقم الهاتف:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platformData.phoneNumber || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">نوع النشاط:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platformData.businessType || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">خطة الاشتراك:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{platformData.subscriptionPlan || 'غير محدد'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    لم يتم العثور على تفاصيل المنصة. 
                    <br />
                    يرجى التواصل مع الدعم مع ذكر اسم المنصة أو الرابط.
                  </p>
                </div>
              )}
            </div>

            {/* خطوات التفعيل */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">خطوات التفعيل:</h3>
              <ol className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  اضغط على زر "فتح واتساب مع تفاصيل المنصة"
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  أرسل الرسالة لفريق الدعم
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  انتظر تأكيد التفعيل (خلال الساعات القادمة)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  ابدأ استخدام منصتك بعد التفعيل
                </li>
              </ol>
            </div>

            {/* أزرار إضافية */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                العودة للصفحة الرئيسية
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
