import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-theme-primary-lighter flex items-center justify-center p-4">
      <Card className="w-full max-w-md theme-border bg-theme-primary-lighter">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-theme-gradient rounded-full flex items-center justify-center mx-auto mb-6 theme-shadow">
              <i className="fas fa-rocket text-white text-2xl"></i>
            </div>
            
            <h1 className="text-3xl font-bold text-theme-primary mb-2">منصة المنتجات</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">إدارة متكاملة للمنتجات وصفحات الهبوط</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <i className="fas fa-check text-theme-primary ml-3"></i>
                <span>إدارة شاملة للمنتجات</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <i className="fas fa-check text-theme-primary ml-3"></i>
                <span>إنشاء صفحات مقصودة احترافية</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <i className="fas fa-check text-theme-primary ml-3"></i>
                <span>نظام محاسبي متكامل</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <i className="fas fa-check text-theme-primary ml-3"></i>
                <span>تقارير وإحصائيات تفصيلية</span>
              </div>
            </div>
            
            <Button 
              onClick={handleLogin}
              className="w-full bg-theme-gradient py-3 text-lg text-white hover:shadow-lg transition-all duration-300"
            >
              <i className="fas fa-sign-in-alt ml-2"></i>
              تسجيل الدخول
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
