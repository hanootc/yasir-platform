import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useLocation } from "wouter";
import { useSessionInfo } from "@/hooks/useSessionInfo";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Calendar, TrendingUp, TrendingDown, Package, Truck, DollarSign, Target, Clock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AccountsData {
  confirmedOrders: number;
  totalQuantity: number; // إضافة عدد القطع الإجمالي
  baghdadDeliveryFee: number;
  provincesDeliveryFee: number;
  totalSales: number;
  totalCost: number;
  deliveryRevenue: number;
  adSpend: number;
  netProfit: number;
}

export function MyAccounts() {
  const [location] = useLocation();
  const { platformSession, isLoading } = useSessionInfo();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  
  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for filters and manual inputs
  const [period, setPeriod] = useState<'yesterday' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [manualAdSpend, setManualAdSpend] = useState<string>(() => {
    return localStorage.getItem('manualAdSpend') || '0';
  });
  const [adSpendCurrency, setAdSpendCurrency] = useState<'USD' | 'IQD'>(() => {
    return (localStorage.getItem('adSpendCurrency') as 'USD' | 'IQD') || 'USD';
  });
  const [exchangeRate, setExchangeRate] = useState<string>(() => {
    return localStorage.getItem('exchangeRate') || '1310';
  });
  
  // سعر صرف الدولار مقابل الدينار العراقي (قابل للتعديل)
  const USD_TO_IQD_RATE = parseFloat(exchangeRate) || 1310;

  // Save values to localStorage when they change
  useEffect(() => {
    localStorage.setItem('manualAdSpend', manualAdSpend);
  }, [manualAdSpend]);

  useEffect(() => {
    localStorage.setItem('adSpendCurrency', adSpendCurrency);
  }, [adSpendCurrency]);

  useEffect(() => {
    localStorage.setItem('exchangeRate', exchangeRate);
  }, [exchangeRate]);

  // تحديث النطاق الزمني عند تغيير الفترة
  useEffect(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'yesterday':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // أمس
        end = new Date(now.getTime() - 24 * 60 * 60 * 1000); // أمس
        break;
        
      case 'daily':
        start = now; // اليوم فقط
        end = now;
        break;
        
      case 'weekly':
        start = new Date(now.getTime() - 7 * 7 * 24 * 60 * 60 * 1000); // آخر 7 أسابيع
        end = now;
        break;
        
      case 'monthly':
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); // آخر سنة
        end = now;
        break;
        
      default:
        start = now;
        end = now;
    }

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    setDateRange({
      start: formatDate(start),
      end: formatDate(end)
    });
    
    console.log('📅 تحديث النطاق الزمني:', {
      period,
      start: formatDate(start),
      end: formatDate(end)
    });
  }, [period]);

  // Fetch accounts data based on filters
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: [`/api/platforms/${platformSession?.platformId}/accounts`, period, dateRange.start, dateRange.end],
    queryFn: async () => {
      const url = `/api/platforms/${platformSession?.platformId}/accounts?period=${period}&start=${dateRange.start}&end=${dateRange.end}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!platformSession?.platformId,
  });

  // Fetch daily ad spend data
  const { data: adSpendData } = useQuery({
    queryKey: [`/api/platforms/${platformSession?.platformId}/daily-ad-spend`, dateRange.start, dateRange.end],
    queryFn: async () => {
      const url = `/api/platforms/${platformSession?.platformId}/daily-ad-spend?startDate=${dateRange.start}&endDate=${dateRange.end}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!platformSession?.platformId,
  });

  // Mutation for saving daily ad spend
  const saveAdSpendMutation = useMutation({
    mutationFn: async (data: { date: string; amount: number; currency: string; notes?: string }) => {
      const response = await fetch(`/api/platforms/${platformSession?.platformId}/daily-ad-spend`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('فشل في حفظ مصاريف الإعلان');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/platforms/${platformSession?.platformId}/daily-ad-spend`] 
      });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ مصاريف الإعلان بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حفظ مصاريف الإعلان",
        variant: "destructive",
      });
    }
  });

  // Calculate totals with database ad spend
  const calculateTotals = (data: any, adSpendTotal?: number) => {
    if (!data) {
      console.log('📊 Calculating totals with database:', { data, error: 'data is null/undefined' });
      return null;
    }
    
    // Use database ad spend data if available, otherwise fall back to manual input
    let adSpendValue = adSpendTotal || 0;
    
    // If no database data, use manual input as fallback
    if (adSpendValue === 0 && manualAdSpend) {
      adSpendValue = parseFloat(manualAdSpend) || 0;
      // تحويل من الدولار إلى الدينار العراقي إذا كانت العملة المحددة دولار
      if (adSpendCurrency === 'USD') {
        adSpendValue = adSpendValue * USD_TO_IQD_RATE;
      }
    }
    
    const netProfit = data.totalSales - data.totalCost - adSpendValue;
    
    console.log('📊 Calculating totals with database:', {
      data,
      adSpendFromDB: adSpendTotal,
      manualAdSpend: parseFloat(manualAdSpend) || 0,
      currency: adSpendCurrency,
      exchangeRate: USD_TO_IQD_RATE,
      finalAdSpendValue: adSpendValue,
      totalSales: data.totalSales,
      totalCost: data.totalCost,
      netProfit
    });
    
    return {
      ...data,
      adSpend: adSpendValue,
      adSpendOriginal: adSpendTotal ? null : (parseFloat(manualAdSpend) || 0),
      adSpendCurrency: adSpendTotal ? 'DB' : adSpendCurrency,
      exchangeRate: USD_TO_IQD_RATE,
      netProfit: netProfit
    };
  };

  const totals = calculateTotals(accountsData, adSpendData?.total);
  
  console.log('📊 Final totals:', totals);


  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!platformSession) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">غير مسموح بالوصول</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-theme-primary-lighter overflow-hidden relative">
      <PlatformSidebar 
        session={platformSession}
        currentPath={location}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 ${
        sidebarCollapsed ? 'mr-0 lg:mr-16' : 'mr-0 lg:mr-64'
      }`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-4">
          <div className="text-right flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ColorThemeSelector />
              <ThemeToggle />
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <i className="fas fa-bars h-4 w-4"></i>
              </Button>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">حساباتي</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{platformSession.platformName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-7xl mx-auto space-y-4">
            
            {/* Filters Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-right text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3" />
                  فلاتر التقارير
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-right text-sm">
                  <div>
                    <Label htmlFor="period" className="text-right">الفترة الزمنية</Label>
                    <Select value={period} onValueChange={(value: 'yesterday' | 'daily' | 'weekly' | 'monthly') => setPeriod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yesterday">أمس</SelectItem>
                        <SelectItem value="daily">يومي</SelectItem>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="startDate" className="text-right">من تاريخ</Label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate" className="text-right">إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currency" className="text-right">عملة الإعلانات</Label>
                    <Select value={adSpendCurrency} onValueChange={(value: 'USD' | 'IQD') => setAdSpendCurrency(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">دولار (USD)</SelectItem>
                        <SelectItem value="IQD">دينار (IQD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adSpend" className="text-right">
                      مبلغ الإعلانات ({adSpendCurrency})
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={manualAdSpend}
                        onChange={(e) => setManualAdSpend(e.target.value)}
                        placeholder={`أدخل المبلغ بال${adSpendCurrency === 'USD' ? 'دولار' : 'دينار'}`}
                        className="text-right flex-1"
                        dir="rtl"
                      />
                      <Button
                        onClick={() => {
                          if (period === 'daily' && manualAdSpend && parseFloat(manualAdSpend) > 0) {
                            saveAdSpendMutation.mutate({
                              date: dateRange.start,
                              amount: parseFloat(manualAdSpend),
                              currency: adSpendCurrency
                            });
                          }
                        }}
                        size="sm"
                        disabled={!manualAdSpend || parseFloat(manualAdSpend) <= 0 || period !== 'daily' || saveAdSpendMutation.isPending}
                        className="bg-theme-primary hover:bg-theme-primary/90 text-white px-3"
                      >
                        {saveAdSpendMutation.isPending ? 'حفظ...' : 'حفظ'}
                      </Button>
                    </div>
                    {period !== 'daily' && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        يمكن حفظ مصاريف الإعلان فقط في التقرير اليومي
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="exchangeRate" className="text-right">سعر الصرف (USD → IQD)</Label>
                    <Input
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      placeholder="مثال: 1310"
                      className="text-right"
                      dir="rtl"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      السعر الحالي: 1 USD = {USD_TO_IQD_RATE.toLocaleString()} IQD
                    </p>
                  </div>
                </div>
                
                {/* Display current database ad spend */}
                {adSpendData && adSpendData.total > 0 && (
                  <div className="mt-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <div className="text-center">
                      <div className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">
                        إجمالي مصاريف الإعلانات المحفوظة للفترة المحددة
                      </div>
                      <div className="text-green-700 dark:text-green-300 font-bold text-base">
                        {adSpendData.total.toLocaleString()} د.ع
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Currency Conversion Display */}
                {adSpendCurrency === 'USD' && parseFloat(manualAdSpend) > 0 && (
                  <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-blue-600 dark:text-blue-400">
                        <span className="font-medium">سعر الصرف: 1 USD = {USD_TO_IQD_RATE.toLocaleString()} IQD</span>
                      </div>
                      <div className="text-blue-700 dark:text-blue-300 font-bold text-sm">
                        المبلغ بالدينار: {(parseFloat(manualAdSpend) * USD_TO_IQD_RATE).toLocaleString()} د.ع
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loading State */}
            {accountsLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-theme-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500">جاري تحميل البيانات...</p>
              </div>
            )}

            {/* Main Statistics Cards */}
            {totals && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
                
                {/* Confirmed Orders */}
                <div className="group relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-90"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                  <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                          <Package className="h-3 w-3 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-white/80 mb-1">الطلبات المؤكدة</div>
                          <div className="text-base font-bold text-white">
                            {totals.confirmedOrders}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Total Quantity */}
                <div className="group relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-90"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                  <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                          <div className="h-3 w-3 rounded-full bg-white flex items-center justify-center">
                            <span className="text-[8px] font-bold text-indigo-600">{totals.totalQuantity || 0}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-white/80 mb-1">إجمالي القطع</div>
                          <div className="text-base font-bold text-white">
                            {totals.totalQuantity || 0} قطعة
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Total Sales */}
                <div className="group relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-90"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                  <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                          <DollarSign className="h-3 w-3 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-white/80 mb-1">إجمالي المبيعات</div>
                          <div className="text-base font-bold text-white">
                            {Math.round(totals.totalSales).toLocaleString()} د.ع
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Delivery Revenue */}
                <div className="group relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-90"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                  <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                          <Truck className="h-3 w-3 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-white/80 mb-1">رسوم التوصيل</div>
                          <div className="text-base font-bold text-white">
                            {Math.round(totals.deliveryRevenue).toLocaleString()} د.ع
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Net Profit */}
                <div className="group relative overflow-hidden rounded-2xl">
                  <div className={`absolute inset-0 ${totals.netProfit >= 0 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : 'bg-gradient-to-br from-red-500 to-orange-500'} opacity-90`}>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                  <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                          {totals.netProfit >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-white" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-white/80 mb-1">صافي الربح</div>
                          <div className="text-base font-bold text-white">
                            {Math.round(totals.netProfit).toLocaleString()} د.ع
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cost Per Order */}
                {totals.adSpend > 0 && totals.confirmedOrders > 0 && (
                  <div className="group relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-90"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
                    <Card className="relative border-0 bg-transparent text-white hover:scale-105 transition-all duration-500 shadow-lg">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                            <Target className="h-3 w-3 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium text-white/80 mb-1">تكلفة الطلب الواحد</div>
                            <div className="text-base font-bold text-white">
                              {Math.round(totals.adSpend / totals.confirmedOrders).toLocaleString()} د.ع
                            </div>
                            <div className="text-xs text-white/70 mt-1">
                              ${((totals.adSpend / totals.confirmedOrders) / USD_TO_IQD_RATE).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-white/60 text-right">
                          من إجمالي {totals.confirmedOrders} طلب مؤكد
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

              </div>
            )}

            {/* Order Status Breakdown */}
            {totals && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-right text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                    <Package className="h-3 w-3" />
                    تتبع الأرباح حسب مراحل الطلبات
                  </CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-right">
                    متابعة تطور الأرباح من مرحلة التأكيد حتى التسليم
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    {/* Potential Profit - Confirmed Orders */}
                    <div className="relative p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 bg-blue-500 rounded-md">
                          <Clock className="h-3 w-3 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                            أرباح محتملة (مؤكد)
                          </div>
                          <div className="text-base font-bold text-blue-700 dark:text-blue-300">
                            {Math.round(totals.potentialProfit || 0).toLocaleString()} د.ع
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {totals.confirmedOrdersOnly || 0} طلب
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        طلبات تم تأكيدها وبانتظار المعالجة
                      </div>
                      {/* Cost per order for confirmed orders */}
                      {totals.adSpend > 0 && totals.confirmedOrdersOnly > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                          <div className="text-center">
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                              تكلفة الطلب المؤكد
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-blue-700 dark:text-blue-300 font-bold text-sm">
                                {Math.round(totals.adSpend / totals.confirmedOrdersOnly).toLocaleString()} د.ع
                              </div>
                              <div className="text-blue-700 dark:text-blue-300 font-bold text-sm">
                                ${((totals.adSpend / totals.confirmedOrdersOnly) / USD_TO_IQD_RATE).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* In Transit Profit - Processing + Shipped */}
                    <div className="relative p-3 rounded-lg bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 bg-orange-500 rounded-md">
                          <Truck className="h-3 w-3 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">
                            أرباح في الطريق (مشحون)
                          </div>
                          <div className="text-base font-bold text-orange-700 dark:text-orange-300">
                            {Math.round(totals.inTransitProfit || 0).toLocaleString()} د.ع
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            {(totals.processingOrders || 0) + (totals.shippedOrders || 0)} طلب
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        طلبات قيد المعالجة والشحن
                      </div>
                      {/* Cost per order for in-transit orders */}
                      {totals.adSpend > 0 && ((totals.processingOrders || 0) + (totals.shippedOrders || 0)) > 0 && (
                        <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
                          <div className="text-center">
                            <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                              تكلفة الطلب المشحون
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-orange-700 dark:text-orange-300 font-bold text-sm">
                                {Math.round(totals.adSpend / ((totals.processingOrders || 0) + (totals.shippedOrders || 0))).toLocaleString()} د.ع
                              </div>
                              <div className="text-orange-700 dark:text-orange-300 font-bold text-sm">
                                ${((totals.adSpend / ((totals.processingOrders || 0) + (totals.shippedOrders || 0))) / USD_TO_IQD_RATE).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Realized Profit - Delivered */}
                    <div className="relative p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 bg-green-500 rounded-md">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                            أرباح محققة (مكتمل)
                          </div>
                          <div className="text-base font-bold text-green-700 dark:text-green-300">
                            {Math.round(totals.realizedProfit || 0).toLocaleString()} د.ع
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {totals.deliveredOrders || 0} طلب
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        طلبات تم توصيلها بنجاح
                      </div>
                      {/* Cost per order for delivered orders */}
                      {totals.adSpend > 0 && totals.deliveredOrders > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                          <div className="text-center">
                            <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                              تكلفة الطلب المكتمل
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-green-700 dark:text-green-300 font-bold text-sm">
                                {Math.round(totals.adSpend / totals.deliveredOrders).toLocaleString()} د.ع
                              </div>
                              <div className="text-green-700 dark:text-green-300 font-bold text-sm">
                                ${((totals.adSpend / totals.deliveredOrders) / USD_TO_IQD_RATE).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        مسار تطور الأرباح
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mb-1"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">مؤكد</span>
                      </div>
                      <div className="flex-1 h-1 bg-blue-200 dark:bg-blue-800"></div>
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mb-1"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">مشحون</span>
                      </div>
                      <div className="flex-1 h-1 bg-orange-200 dark:bg-orange-800"></div>
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mb-1"></div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">مكتمل</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Per Order Analysis */}
                  {totals.adSpend > 0 && totals.confirmedOrders > 0 && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="text-center">
                        <div className="text-purple-600 dark:text-purple-400 font-medium mb-2 text-sm">
                          تكلفة الطلب الواحد من الإعلانات
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="text-center">
                            <div className="text-purple-700 dark:text-purple-300 font-bold text-base">
                              {Math.round(totals.adSpend / totals.confirmedOrders).toLocaleString()} د.ع
                            </div>
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                              تكلفة الطلب بالدينار العراقي
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-purple-700 dark:text-purple-300 font-bold text-base">
                              ${((totals.adSpend / totals.confirmedOrders) / 1310).toFixed(2)}
                            </div>
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                              تكلفة الطلب بالدولار الأمريكي
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-purple-600 dark:text-purple-400">
                          إجمالي الإعلانات: {Math.round(totals.adSpend).toLocaleString()} د.ع ÷ {totals.confirmedOrders} طلب
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Detailed Breakdown */}
            {totals && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Financial Breakdown */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-right text-gray-900 dark:text-white text-sm">
                      تفصيل الحسابات المالية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-green-600">
                        {Math.round(totals.totalSales).toLocaleString()} د.ع
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">إجمالي المبيعات</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-red-600">
                        -{Math.round(totals.totalCost).toLocaleString()} د.ع
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">التكلفة الإجمالية</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-orange-600">
                        -{Math.round(totals.deliveryRevenue).toLocaleString()} د.ع
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">رسوم التوصيل</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-right">
                        <div className="font-medium text-blue-600">
                          -{Math.round(totals.adSpend).toLocaleString()} د.ع
                        </div>
                        {totals.adSpendCurrency === 'USD' && totals.adSpendOriginal > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            (أصلاً {totals.adSpendOriginal} USD × {totals.exchangeRate.toLocaleString()})
                          </div>
                        )}
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">مصاريف الإعلانات</span>
                    </div>
                    
                    {/* ROI from Advertising */}
                    {totals.adSpend > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-right">
                          <div className="font-medium text-purple-600">
                            {Math.round(((totals.totalSales - totals.totalCost) / totals.adSpend) * 100)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            تكلفة الطلب: {Math.round(totals.adSpend / totals.confirmedOrders).toLocaleString()} د.ع
                          </div>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">عائد الاستثمار الإعلاني</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center py-3 border-t-2 border-theme-primary">
                      <span className={`text-xl font-bold ${totals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.round(totals.netProfit).toLocaleString()} د.ع
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">صافي الربح</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-right text-gray-900 dark:text-white">
                      تفصيل رسوم التوصيل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-blue-600">
                        {Math.round(totals.baghdadDeliveryFee).toLocaleString()} د.ع
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">رسوم توصيل بغداد</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-purple-600">
                        {Math.round(totals.provincesDeliveryFee).toLocaleString()} د.ع
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">رسوم توصيل المحافظات</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-t-2 border-theme-primary">
                      <span className="text-xl font-bold text-orange-600">
                        {Math.round(totals.deliveryRevenue).toLocaleString()} د.ع
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">إجمالي رسوم التوصيل</span>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}



          </div>
        </div>
      </div>
    </div>
  );
}