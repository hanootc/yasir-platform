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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Check className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            🎉 تم إنشاء منصتك بنجاح!
          </h1>
          <p className="text-lg text-slate-700">
            مرحباً بك في عالم التجارة الإلكترونية
          </p>
        </div>

        {/* Platform Details Card */}
        <Card className="border-2 border-emerald-200 bg-white shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="text-2xl text-emerald-800">
              {platformData.platform}
            </CardTitle>
            <CardDescription className="text-emerald-600">
              منصتك الجديدة جاهزة للاستخدام
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-slate-800">رابط منصتك:</p>
                <p className="text-blue-600 font-mono text-sm">
                  {platformData.subdomain}.platform.com
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Package className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-slate-800">المنتجات</p>
                  <p className="text-sm text-slate-600">إدارة شاملة للمخزون</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-slate-800">واتساب</p>
                  <p className="text-sm text-slate-600">تواصل مباشر مع العملاء</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl border border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">الخطوات التالية</CardTitle>
            <CardDescription className="text-white/80">
              ابدأ رحلتك في التجارة الإلكترونية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white mt-0.5 shadow-md">
                  1
                </div>
                <div>
                  <p className="font-medium text-white">سجل دخول لمنصتك</p>
                  <p className="text-sm text-white/70">استخدم النطاق الفرعي وكلمة المرور</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white mt-0.5 shadow-md">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">أضف منتجاتك الأولى</p>
                  <p className="text-sm text-white/70">ابدأ ببناء كتالوج منتجاتك</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-sm font-bold text-white mt-0.5 shadow-md">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">اربط حساب واتساب</p>
                  <p className="text-sm text-white/70">للتواصل التلقائي مع العملاء</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-sm font-bold text-white mt-0.5 shadow-md">
                  4
                </div>
                <div>
                  <p className="font-medium text-white">أنشئ صفحات الهبوط</p>
                  <p className="text-sm text-white/70">لزيادة المبيعات والتحويلات</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleGoToLogin}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
            size="lg"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            سجل دخول لمنصتك
          </Button>
          
          <Button 
            onClick={handleGoToMarketing}
            variant="outline"
            className="flex-1 border-2 border-slate-300 text-white hover:bg-slate-50 hover:text-slate-700"
            size="lg"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>

        {/* Support Note */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
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