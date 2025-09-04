import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Plus,
  Settings,
  LogOut,
  Eye,
  BarChart3,
  DollarSign,
  Menu,
  Truck,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import PlatformSidebar from '@/components/PlatformSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import ThemeToggle from '@/components/ThemeToggle';
import ColorThemeSelector from '@/components/ColorThemeSelector';
import PlatformSalesChart from '@/components/dashboard/platform-sales-chart';
import { useLocation } from 'wouter';

interface EmployeeSession {
  success: boolean;
  employee: {
    id: string;
    platformId: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    department: string;
    position: string;
    salary: string;
    hireDate: string;
    profileImageUrl: string | null;
    username: string;
    lastLoginAt: string;
    permissions: string[];
  };
}

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');

  // Get employee session
  const { data: employeeSession, isLoading: sessionLoading } = useQuery<EmployeeSession>({
    queryKey: ["/api/employee/session"],
    retry: false,
  });

  // Mock platform session from employee data
  const session: PlatformSession | undefined = employeeSession ? {
    platformId: employeeSession.employee.platformId,
    platformName: 'منصة الموظف',
    subdomain: 'employee',
    userType: 'employee',
  } : undefined;

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // Redirect to employee login if no session
  useEffect(() => {
    if (!sessionLoading && !employeeSession) {
      window.location.href = '/employee/login';
    }
  }, [employeeSession, sessionLoading]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/stats`],
    enabled: !!session?.platformId,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/chart-data`, chartPeriod],
    enabled: !!session?.platformId,
  });

  const { data: recentOrders = [] } = useQuery<any[]>({
    queryKey: [`/api/platforms/${session?.platformId}/orders/recent`],
    enabled: !!session?.platformId,
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/products/top`],
    enabled: !!session?.platformId,
  });

  const handleLogout = () => {
    localStorage.removeItem('employee_session_token');
    localStorage.removeItem('employeeData');
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
    window.location.href = '/employee/login';
  };

  if (!employeeSession || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-theme-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-theme-primary-lighter overflow-hidden relative">
      <PlatformSidebar 
        session={session}
        currentPath={location}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 ${
        !sidebarCollapsed ? (isMobile ? 'ml-0' : 'mr-64') : (isMobile ? 'mr-0' : 'mr-16')
      }`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-4">
          <div className="text-right flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ColorThemeSelector />
              <ThemeToggle />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">لوحة تحكم الموظف</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{employeeSession.employee.fullName} - {employeeSession.employee.position}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* إجمالي المنتجات */}
              <div className="group relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-white/80 mb-1">إجمالي المنتجات</div>
                        <div className="text-2xl font-bold text-white">
                          {statsLoading ? '...' : ((stats as any)?.totalProducts || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">إضافة منتج جديد</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* إجمالي الطلبات */}
              <div className="group relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-500 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-white/80 mb-1">إجمالي الطلبات</div>
                        <div className="text-2xl font-bold text-white">
                          {statsLoading ? '...' : ((stats as any)?.totalOrders || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-sm">عرض التفاصيل</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* إجمالي المبيعات */}
              <div className="group relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-white/80 mb-1">إجمالي المبيعات</div>
                        <div className="text-2xl font-bold text-white">
                          {statsLoading ? '...' : formatCurrency((stats as any)?.totalRevenue || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">نمو متزايد</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* الطلبات المعلقة */}
              <div className="group relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-white/80 mb-1">الطلبات المعلقة</div>
                        <div className="text-2xl font-bold text-white">
                          {statsLoading ? '...' : ((stats as any)?.pendingOrders || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">ينتظر المراجعة</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <PlatformSalesChart 
                platformId={session.platformId}
                period={chartPeriod}
                chartType={chartType}
                onPeriodChange={setChartPeriod}
                onChartTypeChange={setChartType}
              />

              {/* مخطط توزيع الطلبات */}
              <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500"></div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">توزيع حالات الطلبات</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* قيد الانتظار */}
                    <div className="relative group">
                      <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800 hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                              {statsLoading ? '...' : ((stats as any)?.pendingOrders || 0)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-amber-700 dark:text-amber-300">قيد الانتظار</div>
                      </div>
                    </div>

                    {/* مؤكد */}
                    <div className="relative group">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800 hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                            <ShoppingCart className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {statsLoading ? '...' : ((stats as any)?.confirmedOrders || 0)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">مؤكد</div>
                      </div>
                    </div>

                    {/* مشحون */}
                    <div className="relative group">
                      <div className="bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800 hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
                            <Truck className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {statsLoading ? '...' : ((stats as any)?.shippedOrders || 0)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-purple-700 dark:text-purple-300">مشحون</div>
                      </div>
                    </div>

                    {/* مسلم */}
                    <div className="relative group">
                      <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800 hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                            <Package className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {statsLoading ? '...' : ((stats as any)?.deliveredOrders || 0)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">مسلم</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>

            {/* Quick Actions & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* أحدث الطلبات */}
              <Card className="border-0 shadow-2xl bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white text-right">أحدث الطلبات</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-right">
                    آخر الطلبات المستلمة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOrders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="text-left">
                          <Badge 
                            variant={order.status === 'pending' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {order.status === 'pending' ? 'معلق' : 
                             order.status === 'confirmed' ? 'مؤكد' :
                             order.status === 'shipped' ? 'مشحون' :
                             order.status === 'delivered' ? 'مسلم' : 'غير محدد'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-white">{order.customerName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(order.totalAmount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* أفضل المنتجات */}
              <Card className="border-0 shadow-2xl bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white text-right">أفضل المنتجات</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-right">
                    المنتجات الأكثر مبيعاً
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topProducts.slice(0, 5).map((product: any, index: number) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="text-left">
                          <div className="w-8 h-8 bg-theme-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                        </div>
                        <div className="text-right flex-1 mr-3">
                          <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{product.orderCount} طلب</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}