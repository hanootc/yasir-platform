import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import TopProducts from "@/components/dashboard/top-products";
import SystemActivity from "@/components/dashboard/system-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "غير مصرح",
        description: "تم تسجيل خروجك. يتم إعادة تسجيل الدخول...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }



  const handleGenerateReport = () => {
    toast({
      title: "قريباً",
      description: "منشئ التقارير قيد التطوير",
    });
  };

  const handlePrintInvoices = () => {
    toast({
      title: "قريباً",
      description: "نظام طباعة الفواتير قيد التطوير",
    });
  };

  return (
    <div className="flex h-screen bg-theme-primary-lighter dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="لوحة التحكم"
          subtitle="نظرة عامة على أداء المنصة"
        />
        
        <main className="flex-1 overflow-y-auto p-6 bg-theme-primary-lighter dark:bg-gray-900">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <SalesChart />
            <RecentOrders />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <TopProducts />
            <SystemActivity />
          </div>

          {/* Quick Actions */}
          <Card className="mb-8 theme-border bg-theme-primary-lighter">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-theme-primary">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">


                <Button
                  variant="outline"
                  className="flex items-center justify-between p-4 h-auto bg-theme-primary-light hover:bg-theme-gradient border-2 border-dashed theme-border hover:text-white transition-all duration-300 hover:scale-105 theme-shadow hover:shadow-lg"
                  onClick={handleGenerateReport}
                >
                  <span className="font-medium">إنشاء تقرير</span>
                  <i className="fas fa-chart-line text-2xl text-theme-primary hover:text-white transition-colors"></i>
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center justify-between p-4 h-auto bg-theme-primary-light hover:bg-theme-gradient border-2 border-dashed theme-border hover:text-white transition-all duration-300 hover:scale-105 theme-shadow hover:shadow-lg"
                  onClick={handlePrintInvoices}
                >
                  <span className="font-medium">طباعة فواتير</span>
                  <i className="fas fa-print text-2xl text-theme-primary hover:text-white transition-colors"></i>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>


    </div>
  );
}
