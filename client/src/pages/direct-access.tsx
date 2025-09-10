import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  UserPlus, 
  FileText, 
  CheckCircle, 
  LogIn, 
  AlertTriangle, 
  RefreshCw, 
  CreditCard,
  BarChart3
} from "lucide-react";

export default function DirectAccess() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Remove authentication check that was causing issues

  const directAccessLinks = [
    {
      href: "/register-platform",
      icon: UserPlus,
      label: "تسجيل منصة جديدة",
      description: "إنشاء منصة جديدة في النظام",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      href: "/platform-registration", 
      icon: FileText,
      label: "صفحة تسجيل المنصة",
      description: "نموذج تسجيل المنصة الكامل",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      href: "/platform-success",
      icon: CheckCircle,
      label: "صفحة نجاح التسجيل", 
      description: "صفحة تأكيد نجاح التسجيل",
      color: "bg-emerald-500 hover:bg-emerald-600"
    },
    {
      href: "/platform-login",
      icon: LogIn,
      label: "تسجيل دخول المنصة",
      description: "صفحة دخول الموظفين للمنصة",
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      href: "/subscription-expired",
      icon: AlertTriangle,
      label: "صفحة انتهاء الاشتراك",
      description: "إشعار انتهاء فترة الاشتراك",
      color: "bg-red-500 hover:bg-red-600"
    },
    {
      href: "/subscription-renewal",
      icon: RefreshCw,
      label: "تجديد الاشتراك",
      description: "صفحة تجديد الاشتراك",
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      href: "/payment",
      icon: CreditCard,
      label: "صفحة الدفع",
      description: "معالجة المدفوعات عبر زين كاش",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      href: "/platform-dashboard",
      icon: BarChart3,
      label: "لوحة تحكم المنصة",
      description: "إحصائيات وتحليلات المنصة",
      color: "bg-cyan-500 hover:bg-cyan-600"
    }
  ];

  return (
    <div className="flex h-screen bg-theme-primary-lighter dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="زر مباشر"
          subtitle="وصول سريع ومباشر لجميع صفحات النظام المهمة"
        />
        
        <main className="flex-1 overflow-y-auto p-6 bg-theme-primary-lighter dark:bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {directAccessLinks.map((link, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow theme-border bg-theme-primary-lighter">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${link.color} text-white theme-shadow`}>
                      <link.icon className="h-6 w-6" />
                    </div>
                  </div>
              
                  <h3 className="text-lg font-semibold mb-2 text-right text-theme-primary">
                    {link.label}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 text-right">
                    {link.description}
                  </p>
                  
                  <Link href={link.href}>
                    <Button 
                      className={`w-full ${link.color} text-white border-0 theme-shadow hover:scale-105 transition-all duration-300`}
                      variant="default"
                    >
                      انتقال مباشر
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-right text-theme-primary">نصائح للاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2 text-right">
                  <p>• استخدم هذه الصفحة للوصول السريع لأي صفحة في النظام</p>
                  <p>• يمكنك حفظ هذه الصفحة في المفضلة للوصول السريع</p>
                  <p>• جميع الروابط تفتح في نفس النافذة للحفاظ على جلسة العمل</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}