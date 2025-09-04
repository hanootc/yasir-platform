import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Eye,
  MousePointer,
  MessageCircle,
  Target,
  Calendar,
  Download,
  Filter,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import { exportReportToPDF, exportReportToExcel, exportReportToCSV } from "@/utils/reportExporter";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface ReportsData {
  overview: {
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  salesChart: {
    daily: Array<{ date: string; sales: number; orders: number; }>;
    monthly: Array<{ month: string; sales: number; orders: number; }>;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    orders: number;
    revenue: number;
    imageUrl?: string;
  }>;
  customerAnalytics: {
    newCustomers: number;
    returningCustomers: number;
    customersByGovernorate: Array<{ governorate: string; count: number; }>;
  };
  tiktokAnalytics: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalImpressions: number;
    totalClicks: number;
    totalSpend: number;
    leads: number;
    ctr: number;
    cpc: number;
  };
  orderAnalytics: {
    statusBreakdown: Array<{ status: string; count: number; percentage: number; }>;
    governorateBreakdown: Array<{ governorate: string; count: number; revenue: number; }>;
  };
}

export default function PlatformReports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30_days");
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedGovernorate, setSelectedGovernorate] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [reportType, setReportType] = useState("comprehensive"); // comprehensive, sales, products, customers
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // Update date range when selection changes
  useEffect(() => {
    const now = new Date();
    switch (dateRange) {
      case "7_days":
        setDateFrom(format(subDays(now, 7), "yyyy-MM-dd"));
        setDateTo(format(now, "yyyy-MM-dd"));
        break;
      case "30_days":
        setDateFrom(format(subDays(now, 30), "yyyy-MM-dd"));
        setDateTo(format(now, "yyyy-MM-dd"));
        break;
      case "3_months":
        setDateFrom(format(subMonths(now, 3), "yyyy-MM-dd"));
        setDateTo(format(now, "yyyy-MM-dd"));
        break;
      case "current_month":
        setDateFrom(format(startOfMonth(now), "yyyy-MM-dd"));
        setDateTo(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "last_month":
        const lastMonth = subMonths(now, 1);
        setDateFrom(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
        setDateTo(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
        break;
    }
  }, [dateRange]);

  // Get session data
  const { data: session } = useQuery<{ platformId: string; platformName: string; subdomain: string; userType: string }>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // Get reports data
  const { data: reportsData, isLoading } = useQuery<ReportsData>({
    queryKey: ["/api/reports/comprehensive", session?.platformId, dateFrom, dateTo, selectedGovernorate, selectedProduct],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        ...(selectedGovernorate !== "all" && { governorate: selectedGovernorate }),
        ...(selectedProduct !== "all" && { productId: selectedProduct })
      });
      const response = await fetch(`/api/platforms/${session?.platformId}/reports/comprehensive?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reports data');
      return response.json();
    },
    enabled: !!session?.platformId,
  });

  // Get products for filter
  const { data: products } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: [`/api/platforms/${session?.platformId}/products`],
    enabled: !!session?.platformId,
  });

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
        <div className="text-lg">جاري تحميل بيانات الجلسة...</div>
      </div>
    );
  }

  const governorates = [
    "بغداد", "البصرة", "نينوى", "أربيل", "النجف", "كربلاء", "الأنبار", "دهوك", 
    "واسط", "صلاح الدين", "القادسية", "بابل", "كركوك", "ديالى", "المثنى", "ميسان", "ذي قار", "السليمانية"
  ];

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "bg-theme-gradient" }: any) => (
    <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-theme-text-secondary truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-bold text-theme-text mt-1 truncate">{value}</p>
            {trend && (
              <div className={`flex items-center mt-2 text-xs sm:text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 ml-1" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`${color} p-2 sm:p-3 rounded-full flex-shrink-0`}>
            <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PlatformSidebar 
        session={session}
        currentPath="/platform-reports"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'mr-0 md:mr-16' : 'mr-0 md:mr-64'}`}>
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-8 py-4 shadow-sm">
          <div className="text-right flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ColorThemeSelector />
              <ThemeToggle />
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="md:hidden bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <i className="fas fa-bars h-4 w-4"></i>
              </Button>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-theme-primary">التقارير والإحصائيات</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">تقارير شاملة عن أداء المنصة والمبيعات</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-8 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">الفلاتر:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-40 theme-border">
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent className="theme-dropdown">
                <SelectItem value="7_days">آخر 7 أيام</SelectItem>
                <SelectItem value="30_days">آخر 30 يوم</SelectItem>
                <SelectItem value="3_months">آخر 3 أشهر</SelectItem>
                <SelectItem value="current_month">الشهر الحالي</SelectItem>
                <SelectItem value="last_month">الشهر الماضي</SelectItem>
                <SelectItem value="custom">فترة مخصصة</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === "custom" && (
              <>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-40 theme-input"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-40 theme-input"
                />
              </>
            )}

            <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
              <SelectTrigger className="w-full sm:w-40 theme-border">
                <SelectValue placeholder="المحافظة" />
              </SelectTrigger>
              <SelectContent className="theme-dropdown">
                <SelectItem value="all">كل المحافظات</SelectItem>
                {governorates.map((gov) => (
                  <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full sm:w-40 theme-border">
                <SelectValue placeholder="المنتج" />
              </SelectTrigger>
              <SelectContent className="theme-dropdown">
                <SelectItem value="all">كل المنتجات</SelectItem>
                {products?.map((product: any) => (
                  <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full sm:w-40 theme-border report-select-trigger">
                <SelectValue placeholder="نوع التقرير" />
              </SelectTrigger>
              <SelectContent className="theme-dropdown">
                <SelectItem value="comprehensive">تقرير شامل</SelectItem>
                <SelectItem value="sales">تقرير المبيعات</SelectItem>
                <SelectItem value="products">تقرير المنتجات</SelectItem>
                <SelectItem value="customers">تقرير العملاء</SelectItem>
                <SelectItem value="tiktok">تقرير TikTok Ads</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-theme-gradient text-white hover:opacity-90 w-full sm:w-auto">
                  <Download className="h-4 w-4 ml-2" />
                  تصدير التقرير
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="theme-dropdown" align="end">
                <DropdownMenuItem 
                  onClick={() => reportsData && exportReportToPDF(reportsData, `${dateFrom} إلى ${dateTo}`, reportType)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  تصدير PDF
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => reportsData && exportReportToExcel(reportsData, `${dateFrom} إلى ${dateTo}`, reportType)}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير Excel
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => reportsData && exportReportToCSV(reportsData, `${dateFrom} إلى ${dateTo}`, reportType)}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  تصدير CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full overflow-x-auto mb-6 sm:mb-8">
              <TabsList className="flex w-full min-w-max bg-theme-primary-lighter theme-border">
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white text-sm px-4 py-2 whitespace-nowrap">
                  <BarChart className="h-4 w-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white text-sm px-4 py-2 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4" />
                  المبيعات
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white text-sm px-4 py-2 whitespace-nowrap">
                  <Package className="h-4 w-4" />
                  المنتجات
                </TabsTrigger>
                <TabsTrigger value="customers" className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white text-sm px-4 py-2 whitespace-nowrap">
                  <Users className="h-4 w-4" />
                  العملاء
                </TabsTrigger>
                <TabsTrigger value="tiktok" className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white text-sm px-4 py-2 whitespace-nowrap">
                  <Target className="h-4 w-4" />
                  TikTok Ads
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard
                      title="إجمالي المبيعات"
                      value={formatCurrency(reportsData?.overview.totalSales || 0)}
                      icon={DollarSign}
                      trend="up"
                      trendValue="+12.5%"
                    />
                    <StatCard
                      title="إجمالي الطلبات"
                      value={formatNumber(reportsData?.overview.totalOrders || 0)}
                      icon={ShoppingCart}
                      trend="up"
                      trendValue="+8.2%"
                    />
                    <StatCard
                      title="عدد المنتجات"
                      value={formatNumber(reportsData?.overview.totalProducts || 0)}
                      icon={Package}
                      color="bg-purple-500"
                    />
                    <StatCard
                      title="معدل التحويل"
                      value={`${reportsData?.overview.conversionRate || 0}%`}
                      icon={Target}
                      trend="up"
                      trendValue="+2.1%"
                      color="bg-green-500"
                    />
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Chart */}
                    <Card className="theme-border bg-theme-primary-lighter">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-theme-text">
                          <LineChart className="h-5 w-5 text-theme-accent" />
                          مخطط المبيعات اليومية
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 flex items-center justify-center text-theme-text-secondary">
                          <div className="text-center">
                            <BarChart className="h-12 w-12 mx-auto mb-4 text-theme-accent" />
                            <p>مخطط المبيعات</p>
                            <p className="text-sm mt-1">البيانات محدودة في الفترة المحددة</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order Status Breakdown */}
                    <Card className="theme-border bg-theme-primary-lighter">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-theme-text">
                          <PieChart className="h-5 w-5 text-theme-accent" />
                          حالة الطلبات
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {reportsData?.orderAnalytics.statusBreakdown?.map((status, index) => (
                            <div key={status.status} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  status.status === 'completed' ? 'bg-green-500' :
                                  status.status === 'pending' ? 'bg-yellow-500' :
                                  status.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                                }`}></div>
                                <span className="text-theme-text">{
                                  status.status === 'completed' ? 'مكتملة' :
                                  status.status === 'pending' ? 'في الانتظار' :
                                  status.status === 'cancelled' ? 'ملغية' : status.status
                                }</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-theme-text font-medium">{formatNumber(status.count)}</span>
                                <span className="text-theme-text-secondary text-sm">{status.percentage}%</span>
                              </div>
                            </div>
                          )) || (
                            <div className="text-center text-theme-text-secondary py-8">
                              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-theme-accent" />
                              <p>لا توجد بيانات طلبات في الفترة المحددة</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="theme-border bg-theme-primary-lighter">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-theme-text">
                        <TrendingUp className="h-5 w-5 text-theme-accent" />
                        اتجاه المبيعات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 flex items-center justify-center text-theme-text-secondary">
                        <div className="text-center">
                          <LineChart className="h-16 w-16 mx-auto mb-4 text-theme-accent" />
                          <p>مخطط المبيعات التفصيلي</p>
                          <p className="text-sm mt-1">سيتم عرض البيانات عند توفرها</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <StatCard
                    title="متوسط قيمة الطلب"
                    value={formatCurrency(reportsData?.overview.averageOrderValue || 0)}
                    icon={DollarSign}
                    trend="up"
                    trendValue="+5.3%"
                  />
                  
                  <Card className="theme-border bg-theme-primary-lighter">
                    <CardHeader>
                      <CardTitle className="text-theme-text">أفضل المحافظات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportsData?.orderAnalytics.governorateBreakdown?.slice(0, 5).map((gov, index) => (
                          <div key={gov.governorate} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-theme-gradient text-white text-xs flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="text-theme-text">{gov.governorate}</span>
                            </div>
                            <div className="text-left">
                              <p className="text-theme-text font-medium">{formatNumber(gov.count)}</p>
                              <p className="text-theme-text-secondary text-xs">{formatCurrency(gov.revenue)}</p>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center text-theme-text-secondary py-4">
                            <p>لا توجد بيانات متاحة</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="theme-border bg-theme-primary-lighter">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-theme-text">
                      <Package className="h-5 w-5 text-theme-accent" />
                      أفضل المنتجات مبيعاً
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportsData?.topProducts?.map((product, index) => (
                        <div key={product.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg theme-border">
                          <span className="w-8 h-8 rounded-full bg-theme-gradient text-white text-sm flex items-center justify-center">
                            {index + 1}
                          </span>
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-theme-text">{product.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-theme-text-secondary text-sm">{formatNumber(product.orders)} طلب</span>
                              <span className="text-theme-accent font-medium">{formatCurrency(product.revenue)}</span>
                            </div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-theme-text-secondary py-8">
                          <Package className="h-12 w-12 mx-auto mb-4 text-theme-accent" />
                          <p>لا توجد بيانات منتجات في الفترة المحددة</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="theme-border bg-theme-primary-lighter">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-theme-text">
                      <BarChart className="h-5 w-5 text-theme-accent" />
                      أداء المنتجات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-theme-text-secondary">
                      <div className="text-center">
                        <BarChart className="h-12 w-12 mx-auto mb-4 text-theme-accent" />
                        <p>مخطط أداء المنتجات</p>
                        <p className="text-sm mt-1">سيتم عرض البيانات عند توفرها</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="theme-border bg-theme-primary-lighter">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-theme-text">
                        <Users className="h-5 w-5 text-theme-accent" />
                        تحليل العملاء
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg theme-border">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-theme-text">{formatNumber(reportsData?.customerAnalytics.newCustomers || 0)}</h3>
                          <p className="text-theme-text-secondary">عملاء جدد</p>
                        </div>
                        
                        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg theme-border">
                          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-theme-text">{formatNumber(reportsData?.customerAnalytics.returningCustomers || 0)}</h3>
                          <p className="text-theme-text-secondary">عملاء عائدون</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <StatCard
                    title="إجمالي العملاء"
                    value={formatNumber(reportsData?.overview.totalCustomers || 0)}
                    icon={Users}
                    trend="up"
                    trendValue="+15.3%"
                    color="bg-indigo-500"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TikTok Tab */}
            <TabsContent value="tiktok">
              <div className="space-y-6">
                {/* TikTok Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="إجمالي الحملات"
                    value={formatNumber(reportsData?.tiktokAnalytics.totalCampaigns || 0)}
                    icon={Target}
                    color="bg-pink-500"
                  />
                  <StatCard
                    title="مرات الظهور"
                    value={formatNumber(reportsData?.tiktokAnalytics.totalImpressions || 0)}
                    icon={Eye}
                    trend="up"
                    trendValue="+23.1%"
                    color="bg-indigo-500"
                  />
                  <StatCard
                    title="النقرات"
                    value={formatNumber(reportsData?.tiktokAnalytics.totalClicks || 0)}
                    icon={MousePointer}
                    trend="up"
                    trendValue="+18.7%"
                    color="bg-green-500"
                  />
                  <StatCard
                    title="إجمالي الإنفاق"
                    value={`$${reportsData?.tiktokAnalytics.totalSpend?.toFixed(2) || '0.00'}`}
                    icon={DollarSign}
                    trend="up"
                    trendValue="+12.5%"
                  />
                </div>

                {/* TikTok Performance Chart */}
                <Card className="theme-border bg-theme-primary-lighter">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-theme-text">
                      <BarChart className="h-5 w-5 text-theme-accent" />
                      أداء حملات TikTok
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-theme-text-secondary">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-4 text-pink-500" />
                        <p>مخطط أداء الحملات</p>
                        <p className="text-sm mt-1">معدل النقر: {reportsData?.tiktokAnalytics.ctr?.toFixed(2) || '0.00'}%</p>
                        <p className="text-sm">تكلفة النقرة: ${reportsData?.tiktokAnalytics.cpc?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}