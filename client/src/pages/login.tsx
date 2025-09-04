import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, LogIn } from "lucide-react";

export default function Login() {
  useEffect(() => {
    // تحقق من حالة تسجيل الدخول
    fetch('/api/auth/user')
      .then(response => {
        if (response.ok) {
          // المستخدم مسجل دخوله بالفعل، توجيه للوحة التحكم
          window.location.href = '/platform-dashboard';
        }
      })
      .catch(() => {
        // المستخدم غير مسجل دخوله، ابق في صفحة تسجيل الدخول
      });
  }, []);

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-theme-primary-lighter flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl theme-border bg-theme-primary-lighter">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-theme-gradient rounded-full flex items-center justify-center">
            <Building className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-theme-primary">
            مرحباً بك
          </CardTitle>
          <p className="text-gray-600 mt-2">
            منصة إدارة التجارة الإلكترونية
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              للوصول لوحة التحكم، يجب تسجيل الدخول أولاً
            </p>
            
            <Button 
              onClick={handleLogin}
              className="w-full bg-theme-gradient text-white font-medium py-3 hover:shadow-lg transition-all duration-300"
              size="lg"
            >
              <LogIn className="ml-2 h-5 w-5" />
              دخول لوحة التحكم
            </Button>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                منصة سندي للتجارة الإلكترونية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}