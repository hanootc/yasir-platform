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
import IraqMap from '@/components/dashboard/iraq-map';
import { useLocation } from 'wouter';
import { SubscriptionExpiredAlert } from '@/components/SubscriptionExpiredAlert';
import { SubscriptionInfo } from '@/components/SubscriptionInfo';

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

// دالة لتحويل البيانات إلى مسار SVG
function generateChartPath(data: number[], type: 'orders' | 'revenue'): string {
  if (!data || data.length === 0) return "M 50 110 L 350 110";
  
  // حد أقصى 6 نقاط
  const limitedData = data.slice(0, 6);
  const maxValue = Math.max(...limitedData) || 1;
  
  const points = limitedData.map((value, index) => {
    const x = 50 + (index * 60);
    const y = 140 - ((value / maxValue) * 80);
    return { x, y };
  });
  
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = prev.x + (curr.x - prev.x) / 2;
    path += ` Q ${cpx} ${prev.y}, ${curr.x} ${curr.y}`;
  }
  
  return path;
}

export default function PlatformDashboard() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');

  // Get platform session from API instead of localStorage
  const { data: session, isLoading: sessionLoading } = useQuery<PlatformSession>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // Redirect to platform login if no session
  useEffect(() => {
    if (!sessionLoading && !session) {
      window.location.href = '/platform-login';
    }
  }, [session, sessionLoading]);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/stats`],
    enabled: !!session?.platformId,
    refetchInterval: 5000, // تحديث كل 5 ثواني
    refetchIntervalInBackground: true,
  });

  // معالجة خطأ انتهاء الاشتراك
  useEffect(() => {
    if (statsError && statsError.message.includes('402:')) {
      // إعادة توجيه إلى صفحة انتهاء الاشتراك
      window.location.href = '/subscription-expired';
    }
  }, [statsError]);

  const { data: chartData, isLoading: chartLoading, error: chartError } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/chart-data`, chartPeriod],
    enabled: !!session?.platformId,
    refetchInterval: 5000, // تحديث كل 5 ثواني
    refetchIntervalInBackground: true,
  });

  // معالجة خطأ انتهاء الاشتراك للرسم البياني
  useEffect(() => {
    if (chartError && chartError.message.includes('402:')) {
      window.location.href = '/subscription-expired';
    }
  }, [chartError]);

  const { data: recentOrders = [], isLoading: recentOrdersLoading, refetch: refetchRecentOrders, error: ordersError } = useQuery<any[]>({
    queryKey: [`/api/platforms/${session?.platformId}/orders/recent`],
    enabled: !!session?.platformId,
    staleTime: 0,
    gcTime: 0, // Changed from cacheTime to gcTime for TanStack Query v5
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  // معالجة خطأ انتهاء الاشتراك للطلبات
  useEffect(() => {
    if (ordersError && ordersError.message.includes('402:')) {
      window.location.href = '/subscription-expired';
    }
  }, [ordersError]);

  // Debug recent orders and force refresh
  useEffect(() => {
    if (recentOrders) {
      console.log('🎯 Recent orders data:', recentOrders);
    }
  }, [recentOrders]);

  // Force refetch on component mount
  useEffect(() => {
    if (session?.platformId) {
      setTimeout(() => {
        refetchRecentOrders();
      }, 1000);
    }
  }, [session?.platformId, refetchRecentOrders]);

  const { data: topProducts = [] } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/products/top`],
    enabled: !!session?.platformId,
  });

  const handleLogout = () => {
    localStorage.removeItem('platformSession');
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
    window.location.href = '/platform-login';
  };

  if (!session) {
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
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:px-8 py-4">
          <div className="text-right">
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <h1 className="text-base font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{session.platformName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-bars h-4 w-4"></i>
                  </Button>
                  <ColorThemeSelector />
                  <ThemeToggle />
                </div>
              </div>
              <div className="flex justify-center">
                <SubscriptionInfo />
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{session.platformName}</p>
              </div>
              <div className="flex items-center gap-4">
                {/* معلومات الاشتراك */}
                <SubscriptionInfo />
                
                {/* عناصر التحكم بالثيم */}
                <div className="flex items-center gap-2">
                  <ColorThemeSelector />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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

          {/* Charts Section - استخدام المكون المحسن */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <PlatformSalesChart 
              platformId={session.platformId}
              period={chartPeriod}
              chartType={chartType}
              onPeriodChange={setChartPeriod}
              onChartTypeChange={setChartType}
            />

            {/* Recent Activity */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-theme-primary">النشاط الأخير</CardTitle>
                <CardDescription className="text-sm">آخر العمليات في المنصة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentOrders && recentOrders.length > 0 ? 
                  recentOrders.slice(0, 4).map((order: any, index: number) => (
                    <div key={order.id || index} className="flex items-center gap-3 p-3 bg-theme-primary-light rounded-lg hover:bg-theme-primary transition-colors">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-theme-primary truncate">
                          طلب جديد #{order.orderNumber || order.id?.slice(-6) || `${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {order.customerName || 'عميل جديد'} - {formatCurrency(order.total || 0)}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 ${
                          order.status === 'pending' 
                            ? 'border-amber-300 text-amber-700 bg-amber-50' 
                            : order.status === 'confirmed'
                            ? 'border-blue-300 text-blue-700 bg-blue-50'
                            : order.status === 'delivered'
                            ? 'border-green-300 text-green-700 bg-green-50'
                            : 'border-gray-300 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {order.status === 'pending' ? 'في الانتظار' : 
                         order.status === 'confirmed' ? 'مؤكد' :
                         order.status === 'processing' ? 'قيد المعالجة' :
                         order.status === 'shipped' ? 'مشحون' :
                         order.status === 'delivered' ? 'مسلم' :
                         order.status === 'cancelled' ? 'ملغي' : 'غير محدد'}
                      </Badge>
                    </div>
                  )) : null}
                
                {(!recentOrders || recentOrders.length === 0) && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-theme-primary-light rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShoppingCart className="w-6 h-6 text-theme-primary" />
                    </div>
                    <p className="text-sm font-medium text-theme-primary mb-1">لا توجد طلبات حديثة</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ستظهر الطلبات الجديدة هنا</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* خريطة العراق وتوزيع الحالات */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <IraqMap />
            
            {/* بطاقة توزيع حالات الطلبات */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 w-full lg:w-1/3">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500"></div>
              <CardContent className="p-4">
                <div className="min-h-[400px] flex items-start justify-center pt-4">
                  <div className="w-full">
                    {/* Enhanced Order Status Chart */}
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      {/* قيد الانتظار */}
                      <div className="relative group">
                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-2 border border-amber-200 dark:border-amber-800 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                              <Eye className="h-3 w-3 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                {statsLoading ? '...' : ((stats as any)?.pendingOrders || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-amber-700 dark:text-amber-300">قيد الانتظار</div>
                        </div>
                      </div>

                      {/* مؤكد */}
                      <div className="relative group">
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-2 border border-blue-200 dark:border-blue-800 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                              <ShoppingCart className="h-3 w-3 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {statsLoading ? '...' : ((stats as any)?.confirmedOrders || (((stats as any)?.totalOrders || 0) - ((stats as any)?.pendingOrders || 0)))}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-blue-700 dark:text-blue-300">مؤكد</div>
                        </div>
                      </div>

                      {/* مشحون */}
                      <div className="relative group">
                        <div className="bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-2 border border-purple-200 dark:border-purple-800 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
                              <Truck className="h-3 w-3 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                {statsLoading ? '...' : ((stats as any)?.shippedOrders || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-purple-700 dark:text-purple-300">مشحون</div>
                        </div>
                      </div>

                      {/* مسلم */}
                      <div className="relative group">
                        <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-2 border border-green-200 dark:border-green-800 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                              <Package className="h-3 w-3 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                {statsLoading ? '...' : ((stats as any)?.deliveredOrders || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-green-700 dark:text-green-300">مسلم</div>
                        </div>
                      </div>

                      {/* قيد المعالجة */}
                      <div className="relative group">
                        <div className="bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-2 border border-cyan-200 dark:border-cyan-800 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg">
                              <Settings className="h-3 w-3 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                                {statsLoading ? '...' : ((stats as any)?.processingOrders || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-cyan-700 dark:text-cyan-300">قيد المعالجة</div>
                        </div>
                      </div>

                      {/* ملغي */}
                      <div className="relative group">
                        <div className="bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-2 border border-red-200 dark:border-red-800 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <div className="p-1.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg">
                              <X className="h-3 w-3 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-red-600 dark:text-red-400">
                                {statsLoading ? '...' : ((stats as any)?.cancelledOrders || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-red-700 dark:text-red-300">ملغي</div>
                        </div>
                      </div>

                      {/* مسترد */}
                      <div className="relative group">
                        <div className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-2 border border-orange-200 dark:border-orange-800 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <div className="p-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                              <TrendingUp className="h-3 w-3 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                {statsLoading ? '...' : ((stats as any)?.refundedOrders || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-orange-700 dark:text-orange-300">مسترد</div>
                        </div>
                      </div>

                      {/* لا يرد */}
                      <div className="relative group">
                        <div className="bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-2 border border-gray-200 dark:border-gray-800 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <div className="p-1.5 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg">
                              <Users className="h-3 w-3 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                {statsLoading ? '...' : ((stats as any)?.noAnswerOrders || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">لا يرد</div>
                        </div>
                      </div>

                      {/* مؤجل */}
                      <div className="relative group">
                        <div className="bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-2 border border-indigo-200 dark:border-indigo-800 hover:scale-105 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1">
                            <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                              <BarChart3 className="h-3 w-3 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                {statsLoading ? '...' : ((stats as any)?.postponedOrders || 0)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">مؤجل</div>
                        </div>
                      </div>
                    </div>

                    {/* Centered Title */}
                    <div className="text-center mb-3">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">توزيع حالات الطلبات</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">إحصائيات الطلبات حسب الحالة</p>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">قيد الانتظار</span>
                        <span className="text-amber-600 dark:text-amber-400">
                          {Math.round((((stats as any)?.pendingOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-amber-100 dark:bg-amber-900/20 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.round((((stats as any)?.pendingOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">مؤكد</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {Math.round((((stats as any)?.confirmedOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-100 dark:bg-blue-900/20 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.round((((stats as any)?.confirmedOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-600 dark:text-purple-400 font-medium">مشحون</span>
                        <span className="text-purple-600 dark:text-purple-400">
                          {Math.round((((stats as any)?.shippedOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-100 dark:bg-purple-900/20 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-violet-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.round((((stats as any)?.shippedOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 dark:text-green-400 font-medium">مسلم</span>
                        <span className="text-green-600 dark:text-green-400">
                          {Math.round((((stats as any)?.deliveredOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-green-100 dark:bg-green-900/20 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.round((((stats as any)?.deliveredOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-600 dark:text-red-400 font-medium">ملغي</span>
                        <span className="text-red-600 dark:text-red-400">
                          {Math.round((((stats as any)?.cancelledOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-red-100 dark:bg-red-900/20 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-rose-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.round((((stats as any)?.cancelledOrders || 0) / Math.max(1, (stats as any)?.totalOrders || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Button 
              className="bg-theme-gradient hover:opacity-90 h-20 flex-col gap-2 shadow-lg hover:shadow-xl transition-all" 
              asChild
            >
              <a href={`/platform/${session?.subdomain}/products`}>
                <Package className="w-6 h-6" />
                <span className="font-medium">إدارة المنتجات</span>
              </a>
            </Button>
            
            <Button 
              variant="outline" 
              className="theme-border hover:bg-theme-primary-light h-20 flex-col gap-2 shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <a href={`/platform/${session?.subdomain}/orders`}>
                <ShoppingCart className="w-6 h-6 text-theme-primary" />
                <span className="font-medium text-theme-primary">إدارة الطلبات</span>
              </a>
            </Button>
            
            <Button 
              variant="outline" 
              className="theme-border hover:bg-theme-primary-light h-20 flex-col gap-2 shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <a href={`/platform/${session?.subdomain}/ads-tiktok-management`}>
                <TrendingUp className="w-6 h-6 text-theme-primary" />
                <span className="font-medium text-theme-primary">إعلانات تيك توك</span>
              </a>
            </Button>
            
            <Button 
              variant="outline" 
              className="theme-border hover:bg-theme-primary-light h-20 flex-col gap-2 shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <a href={`/platform/${session?.subdomain}/settings`}>
                <Settings className="w-6 h-6 text-theme-primary" />
                <span className="font-medium text-theme-primary">إعدادات المنصة</span>
              </a>
            </Button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}