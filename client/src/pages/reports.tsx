import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";

export default function Reports() {
  return (
    <div className="flex h-screen bg-theme-primary-lighter">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="التقارير والإحصائيات"
          subtitle="تقارير مفصلة عن الأداء والمبيعات"
          onCreateProduct={() => {}}
          onCreateLandingPage={() => {}}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Card className="theme-border bg-theme-primary-lighter">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-theme-gradient rounded-full flex items-center justify-center mx-auto mb-4 theme-shadow">
                <i className="fas fa-chart-bar text-2xl text-white"></i>
              </div>
              <h3 className="text-lg font-medium text-theme-primary mb-2">التقارير والإحصائيات</h3>
              <p className="text-gray-500 dark:text-gray-400">قريباً - نظام التقارير قيد التطوير</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
