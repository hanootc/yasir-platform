import { useEffect, useState } from "react";
import { Check, ArrowRight, Globe, Phone, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformSuccess() {
  const [platformData, setPlatformData] = useState<{
    subdomain: string;
    platform: string;
  } | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subdomain = urlParams.get('subdomain');
    const platform = urlParams.get('platform');
    
    if (subdomain && platform) {
      setPlatformData({
        subdomain,
        platform: decodeURIComponent(platform)
      });
    }
  }, []);

  const handleGoToLogin = () => {
    window.location.href = '/platform-login';
  };

  const handleGoToMarketing = () => {
    window.location.href = '/';
  };

  if (!platformData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 تم إنشاء منصتك بنجاح!
          </h1>
          <p className="text-lg text-gray-600">
            مرحباً بك في عالم التجارة الإلكترونية
          </p>
        </div>

        {/* Platform Details Card */}
        <Card className="border-2 border-green-200">
          <CardHeader className="text-center bg-green-50">
            <CardTitle className="text-2xl text-green-800">
              {platformData.platform}
            </CardTitle>
            <CardDescription className="text-green-600">
              منصتك الجديدة جاهزة للاستخدام
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">رابط منصتك:</p>
                <p className="text-blue-600 font-mono">
                  {platformData.subdomain}.platform.com
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">المنتجات</p>
                  <p className="text-sm text-gray-600">إدارة شاملة للمخزون</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">واتساب</p>
                  <p className="text-sm text-gray-600">تواصل مباشر مع العملاء</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">الخطوات التالية</CardTitle>
            <CardDescription>
              ابدأ رحلتك في التجارة الإلكترونية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">سجل دخول لمنصتك</p>
                  <p className="text-sm text-gray-600">استخدم النطاق الفرعي وكلمة المرور</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">أضف منتجاتك الأولى</p>
                  <p className="text-sm text-gray-600">ابدأ ببناء كتالوج منتجاتك</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">اربط حساب واتساب</p>
                  <p className="text-sm text-gray-600">للتواصل التلقائي مع العملاء</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 mt-0.5">
                  4
                </div>
                <div>
                  <p className="font-medium">أنشئ صفحات الهبوط</p>
                  <p className="text-sm text-gray-600">لزيادة المبيعات والتحويلات</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleGoToLogin}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            سجل دخول لمنصتك
          </Button>
          
          <Button 
            onClick={handleGoToMarketing}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>

        {/* Support Note */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>هل تحتاج مساعدة؟</strong>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            فريق الدعم متاح لمساعدتك في إعداد منصتك وبدء البيع
          </p>
        </div>
      </div>
    </div>
  );
}