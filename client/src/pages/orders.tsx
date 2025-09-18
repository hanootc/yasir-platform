import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatTimeAgo, formatDate } from "@/lib/utils";

// Helper function to extract quantity from offer text
const extractQuantityFromOffer = (offer: string): string => {
  if (!offer) return "1";
  
  // Look for Arabic numbers like "قطعة واحدة", "قطعتان", "ثلاث قطع", etc.
  const arabicNumbers: { [key: string]: string } = {
    'واحدة': '1',
    'واحد': '1',
    'قطعة واحدة': '1',
    'قطعتان': '2',
    'قطعتين': '2',
    'ثلاث': '3',
    'أربع': '4',
    'خمس': '5',
    'ست': '6',
    'سبع': '7',
    'ثمان': '8',
    'تسع': '9',
    'عشر': '10'
  };
  
  // Check for exact matches first
  for (const [arabic, number] of Object.entries(arabicNumbers)) {
    if (offer.includes(arabic)) {
      return number;
    }
  }
  
  // Look for numeric values in the text
  const numericMatch = offer.match(/(\d+)/);
  if (numericMatch) {
    return numericMatch[1];
  }
  
  return "1"; // Default to 1 if nothing found
};
import { apiRequest } from "@/lib/queryClient";
import CreateOrderModal from "@/components/modals/create-order-modal";
import PrintInvoiceModal from "@/components/modals/print-invoice-modal";
import { PlatformSelector } from "@/components/PlatformSelector";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800", 
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
  no_answer: "bg-pink-100 text-pink-800",
  postponed: "bg-indigo-100 text-indigo-800"
};

const statusLabels = {
  pending: "في الانتظار",
  confirmed: "مؤكد",
  processing: "قيد المعالجة", 
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  refunded: "مسترد",
  no_answer: "لا يرد",
  postponed: "مؤجل"
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set default date range (from user creation to today)
  const { data: userInfo } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Get platform session to determine platform ID
  const { data: platformSession } = useQuery({
    queryKey: ['/api/platform-session'],
  });

  const platformId = platformSession?.platformId || null;

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: selectedPlatform && selectedPlatform !== 'none' ? ["/api/admin/platforms", selectedPlatform, "orders"] : ["empty-orders"],
    queryFn: async () => {
      if (!selectedPlatform || selectedPlatform === 'none') {
        return [];
      }
      
      const url = `/api/admin/platforms/${selectedPlatform}/orders`;
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    staleTime: 0, // Always fresh data
    gcTime: 0, // Don't cache (TanStack Query v5 uses gcTime instead of cacheTime)
    refetchOnMount: true, // Always refetch on mount
    enabled: false, // Disable automatic fetching
  });

  // Fetch platform products for filtering
  const { data: products } = useQuery({
    queryKey: selectedPlatform && selectedPlatform !== 'none' ? [`/api/admin/platforms/${selectedPlatform}/products`] : ["empty-products"],
    queryFn: async () => {
      if (!selectedPlatform || selectedPlatform === 'none') {
        return [];
      }
      const response = await fetch(`/api/admin/platforms/${selectedPlatform}/products`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: false,
  });



  // Manually trigger refetch when platform changes
  useEffect(() => {
    if (selectedPlatform && selectedPlatform !== 'none') {
      refetch();
      // Also refetch products for the selected platform
      queryClient.refetchQueries({ 
        queryKey: [`/api/admin/platforms/${selectedPlatform}/products`] 
      });
    }
  }, [selectedPlatform, refetch, queryClient]);

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest(`/api/orders/${orderId}/status`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      // تحديث cache المخزون لأن تغيير حالة الطلب يؤثر على الكميات
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory/summary"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الطلب بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  // Calculate date statistics
  const dateStats = useMemo(() => {
    if (!orders || !Array.isArray(orders) || !selectedPlatform || selectedPlatform === 'none') {
      return { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
    }
    
    const filtered = orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
      
      let dateMatch = true;
      if (fromDate && orderDate < fromDate) dateMatch = false;
      if (toDate && orderDate > toDate) dateMatch = false;
      
      return dateMatch;
    });
    
    const totalOrders = filtered.length;
    const totalRevenue = filtered.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return { totalOrders, totalRevenue, avgOrderValue };
  }, [orders, dateFrom, dateTo, selectedPlatform]);

  const filteredOrders = (Array.isArray(orders) && selectedPlatform && selectedPlatform !== 'none') ? orders.filter((order: any) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    // Product filtering - check if order contains the selected product
    const matchesProduct = productFilter === "all" || 
      (order.productName && Array.isArray(products) && products.find((p: any) => p.id === productFilter)?.name === order.productName) ||
      order.items?.some((item: any) => item.productId === productFilter);
    
    // Date filtering
    const orderDate = new Date(order.createdAt);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    
    let matchesDate = true;
    if (fromDate && orderDate < fromDate) matchesDate = false;
    if (toDate && orderDate > toDate) matchesDate = false;
    
    return matchesSearch && matchesStatus && matchesProduct && matchesDate;
  }) : [];

  // Set default dates when user data is loaded
  useEffect(() => {
    if (userInfo && (userInfo as any).createdAt && !dateFrom) {
      const userCreatedDate = new Date((userInfo as any).createdAt).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      setDateFrom(userCreatedDate);
      setDateTo(today);
    }
  }, [userInfo, dateFrom]);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus });
  };

  const handlePrintInvoice = (order: any) => {
    setSelectedOrderForPrint(order);
  };

  // Hidden function to update order numbers (for admin use)
  const updateOrderNumbersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/landing-page-orders/update-numbers', 'POST');
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث أرقام الطلبات إلى الترقيم التسلسلي الجديد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (selectedPlatform) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/platforms", selectedPlatform, "orders"] });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث أرقام الطلبات",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="إدارة الطلبات"
          subtitle="تتبع ومعالجة طلبات العملاء"
          onCreateProduct={() => setShowCreateOrder(true)}
          onCreateLandingPage={() => {
            toast({
              title: "قريباً",
              description: "منشئ صفحات الهبوط قيد التطوير",
            });
          }}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Actions & Stats */}
            <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-4">
              <div className="flex flex-col lg:flex-row items-end lg:items-center gap-4 order-2 lg:order-1">
                {/* Date Range Stats */}
                {(dateFrom || dateTo) && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 text-right">
                      الفترة: {dateFrom ? `من ${new Date(dateFrom).toLocaleDateString('ar-EG')}` : 'من البداية'} 
                      {dateTo ? ` إلى ${new Date(dateTo).toLocaleDateString('ar-EG')}` : ' إلى اليوم'}
                    </div>
                    <div className="flex flex-wrap gap-4 justify-end">
                      <div className="bg-theme-primary-light rounded-lg p-3 min-w-[120px] text-right">
                        <p className="text-xs text-theme-primary font-medium">عدد الطلبات</p>
                        <p className="text-lg font-bold text-theme-primary">{dateStats.totalOrders}</p>
                      </div>
                      <div className="bg-theme-primary-light rounded-lg p-3 min-w-[140px] text-right">
                        <p className="text-xs text-theme-primary font-medium">إجمالي الإيرادات</p>
                        <p className="text-lg font-bold text-theme-primary">{formatCurrency(dateStats.totalRevenue)}</p>
                      </div>
                      <div className="bg-theme-primary-light rounded-lg p-3 min-w-[140px] text-right">
                        <p className="text-xs text-theme-primary font-medium">متوسط قيمة الطلب</p>
                        <p className="text-lg font-bold text-theme-primary">{formatCurrency(dateStats.avgOrderValue)}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-right">
                  <h2 
                    className="text-2xl font-bold text-theme-primary cursor-pointer select-none" 
                    onDoubleClick={() => updateOrderNumbersMutation.mutate()}
                    title="اضغط مرتين لتحديث أرقام الطلبات"
                  >
                    الطلبات
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {filteredOrders ? `${filteredOrders.length} طلب` : "جارٍ التحميل..."}
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowCreateOrder(true)}
                className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300 order-1 lg:order-2"
              >
                <i className="fas fa-plus mr-2"></i>
                إضافة طلب جديد
              </Button>
            </div>

            {/* Filters */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Platform Selector */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-theme-primary whitespace-nowrap">اختر المنصة:</label>
                    <PlatformSelector 
                      value={selectedPlatform || undefined}
                      onValueChange={setSelectedPlatform}
                      placeholder="جميع المنصات"
                    />
                  </div>
                  
                  {/* Date Range Filter */}
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-sm font-medium text-theme-primary whitespace-nowrap">من تاريخ:</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full md:w-40 theme-border"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-sm font-medium text-theme-primary whitespace-nowrap">إلى تاريخ:</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full md:w-40 theme-border"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="theme-border hover:bg-theme-primary-light hover:text-theme-primary"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setDateFrom(today);
                          setDateTo(today);
                        }}
                      >
                        اليوم
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="theme-border hover:bg-theme-primary-light hover:text-theme-primary"
                        onClick={() => {
                          const today = new Date();
                          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                          setDateFrom(lastWeek.toISOString().split('T')[0]);
                          setDateTo(today.toISOString().split('T')[0]);
                        }}
                      >
                        آخر أسبوع
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="theme-border hover:bg-theme-primary-light hover:text-theme-primary"
                        onClick={() => {
                          const today = new Date();
                          const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                          setDateFrom(lastMonth.toISOString().split('T')[0]);
                          setDateTo(today.toISOString().split('T')[0]);
                        }}
                      >
                        آخر شهر
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="theme-border hover:bg-theme-primary-light hover:text-theme-primary"
                        onClick={() => {
                          if (userInfo && (userInfo as any).createdAt) {
                            const userCreatedDate = new Date((userInfo as any).createdAt).toISOString().split('T')[0];
                            const today = new Date().toISOString().split('T')[0];
                            setDateFrom(userCreatedDate);
                            setDateTo(today);
                          }
                        }}
                      >
                        من تاريخ التسجيل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="theme-border hover:bg-theme-primary-light hover:text-theme-primary"
                        onClick={() => {
                          setDateFrom("");
                          setDateTo("");
                        }}
                      >
                        إزالة التصفية
                      </Button>
                    </div>
                  </div>
                  
                  {/* Search and Filters */}
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <Input
                        placeholder="البحث برقم الطلب أو اسم العميل أو البريد الإلكتروني..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 theme-border"
                      />
                      <div className="w-full md:w-48">
                        <div className="text-xs font-bold text-theme-primary mb-1">🔍 تصفية المنتجات</div>
                        <Select value={productFilter} onValueChange={setProductFilter}>
                          <SelectTrigger className="w-full theme-border">
                            <SelectValue placeholder="اختر منتج للتصفية" />
                          </SelectTrigger>
                          <SelectContent className="bg-theme-primary-lighter theme-border">
                            <SelectItem value="all" className="hover:bg-theme-primary-light">جميع المنتجات</SelectItem>
                            {products && Array.isArray(products) && products.map((product: any) => (
                              <SelectItem key={product.id} value={product.id} className="hover:bg-theme-primary-light">
                                {String(product.name || 'منتج غير محدد')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-48 theme-border">
                          <SelectValue placeholder="جميع الحالات" />
                        </SelectTrigger>
                        <SelectContent className="bg-theme-primary-lighter theme-border">
                          <SelectItem value="all" className="hover:bg-theme-primary-light">جميع الحالات</SelectItem>
                          <SelectItem value="pending" className="hover:bg-theme-primary-light">في الانتظار</SelectItem>
                          <SelectItem value="confirmed" className="hover:bg-theme-primary-light">مؤكد</SelectItem>
                          <SelectItem value="processing" className="hover:bg-theme-primary-light">قيد المعالجة</SelectItem>
                          <SelectItem value="shipped" className="hover:bg-theme-primary-light">تم الشحن</SelectItem>
                          <SelectItem value="delivered" className="hover:bg-theme-primary-light">تم التسليم</SelectItem>
                          <SelectItem value="cancelled" className="hover:bg-theme-primary-light">ملغي</SelectItem>
                          <SelectItem value="refunded" className="hover:bg-theme-primary-light">مسترد</SelectItem>
                          <SelectItem value="no_answer" className="hover:bg-theme-primary-light">لا يرد</SelectItem>
                          <SelectItem value="postponed" className="hover:bg-theme-primary-light">مؤجل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="text-center text-red-700">
                    <h3 className="text-lg font-semibold mb-2">خطأ في تحميل الطلبات</h3>
                    <p className="text-sm mb-4">
                      {error.message.includes('401') 
                        ? 'يجب تسجيل الدخول أولاً' 
                        : 'حدث خطأ أثناء تحميل البيانات'
                      }
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/api/login'} 
                      variant="outline"
                      size="sm"
                    >
                      تسجيل الدخول
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Orders List */}
            {!error && isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-48"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !selectedPlatform || selectedPlatform === 'none' ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <i className="fas fa-shopping-cart text-6xl mb-4"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">اختر منصة لعرض الطلبات</h3>
                <p className="text-gray-500">يرجى اختيار منصة من القائمة أعلاه لعرض وإدارة الطلبات</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order: any) => (
                  <Card key={order.id} className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 text-right" dir="rtl">
                      <div className="flex flex-row-reverse justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex flex-row-reverse items-center gap-2 mb-2 justify-end">
                            <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                              {statusLabels[order.status as keyof typeof statusLabels]}
                            </Badge>
                            <h3 className="text-lg font-semibold text-purple-700">
                              طلب #{order.orderNumber}
                            </h3>
                          </div>
                          
                          <div className="space-y-1 text-right">
                            <p className="text-sm text-gray-600">
                              العميل: {order.customerName}
                            </p>
                            {order.customerEmail && (
                              <p className="text-sm text-gray-600">
                                البريد الإلكتروني: {order.customerEmail}
                              </p>
                            )}
                            {order.customerPhone && (
                              <p className="text-sm text-gray-600">
                                الهاتف: {order.customerPhone}
                              </p>
                            )}
                          </div>
                          
                          {/* المحافظة والعنوان - ترتيب جديد واضح */}
                          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-3 mt-3 text-right border-2 border-purple-200">
                            {order.customerGovernorate && (
                              <p className="text-sm font-bold text-purple-700 mb-1">
                                المحافظة: {order.customerGovernorate}
                              </p>
                            )}
                            {order.customerAddress && (
                              <p className="text-sm text-gray-700">
                                العنوان: {order.customerAddress}
                              </p>
                            )}
                          </div>
                          {order.productName && (
                            <div className="flex items-center gap-3 mb-2 p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border-2 border-blue-200">
                              {order.productImage && order.productImage[0] && (
                                <div className="relative group cursor-pointer">
                                  <img 
                                    src={order.productImage[0]} 
                                    alt={order.productName}
                                    className="w-12 h-12 object-cover rounded-md border transition-transform duration-300 group-hover:scale-110"
                                  />
                                  {/* صورة مكبرة عند الـ hover */}
                                  <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none">
                                    <img 
                                      src={order.productImage[0]} 
                                      alt={order.productName}
                                      className="max-w-sm max-h-sm object-contain rounded-lg shadow-2xl transform scale-125"
                                    />
                                  </div>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-blue-700 font-medium">
                                  {order.productName}
                                </p>
                                <p className="text-xs text-gray-600">
                                  المبلغ: {(() => {
                                    // عرض سعر العرض الأصلي بدون خصم
                                    const offerPrice = order.offer ? 
                                      parseFloat(order.offer.split(' - ')[1]?.replace(/[^\d.]/g, '') || order.productPrice) : 
                                      parseFloat(order.productPrice);
                                    return formatCurrency(offerPrice);
                                  })()}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* حقول منفصلة للمتغيرات */}
                          <div className="space-y-2 mb-3">
                            {/* حقل اللون */}
                            {order.selectedColor && (
                              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-blue-800">اللون:</span>
                                  <div className="flex items-center gap-2">
                                    {order.selectedColor.imageUrl && (
                                      <img 
                                        src={order.selectedColor.imageUrl} 
                                        alt={order.selectedColor.name}
                                        className="w-5 h-5 object-cover rounded-full border-2 border-blue-300"
                                      />
                                    )}
                                    {order.selectedColor.code && (
                                      <div 
                                        className="w-5 h-5 rounded-full border-2 border-blue-300"
                                        style={{ backgroundColor: order.selectedColor.code }}
                                      ></div>
                                    )}
                                    <span className="text-blue-700 font-medium">{order.selectedColor.name}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* حقل الشكل */}
                            {order.selectedShape && (
                              <div className="bg-gradient-to-r from-green-50 to-green-100 p-2 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-green-800">الشكل:</span>
                                  <div className="flex items-center gap-2">
                                    {order.selectedShape.imageUrl && (
                                      <img 
                                        src={order.selectedShape.imageUrl} 
                                        alt={order.selectedShape.name}
                                        className="w-5 h-5 object-cover rounded border-2 border-green-300"
                                      />
                                    )}
                                    <span className="text-green-700 font-medium">{order.selectedShape.name}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* حقل القياس */}
                            {order.selectedSize && (
                              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-2 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-purple-800">القياس:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-purple-700 font-medium">{order.selectedSize.name}</span>
                                    {order.selectedSize.value && (
                                      <span className="text-purple-600 bg-purple-200 px-2 py-1 rounded text-xs">
                                        ({order.selectedSize.value})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* عرض الخصم إذا كان موجوداً */}
                          {order.discountAmount && parseFloat(order.discountAmount) > 0 && (
                            <div className="text-sm bg-gradient-to-r from-red-100 to-pink-100 p-2 rounded-lg mb-2 border-2 border-red-200">
                              <span className="font-medium text-red-700">الخصم:</span>
                              <span className="text-red-600 mr-1 font-bold">
                                {formatCurrency(parseFloat(order.discountAmount))}
                              </span>
                            </div>
                          )}
                          
                          {order.offer && (
                            <div className="text-sm bg-gradient-to-r from-green-100 to-blue-100 p-2 rounded-lg mb-2 border-2 border-green-200">
                              <span className="font-medium text-green-700">العرض المختار:</span>
                              <span className="text-gray-700 mr-1">{order.offer}</span>
                            </div>
                          )}
                          {order.type && (
                            <p className="text-xs text-purple-600 mb-1">
                              نوع الطلب: {order.type === 'landing_page' ? 'طلب من صفحة الهبوط' : 'طلب عادي'}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-left" dir="ltr">
                          {order.offer && (
                            <div className="text-center mb-2 bg-gradient-to-r from-orange-100 to-yellow-100 p-2 rounded-lg border-2 border-orange-200">
                              <p className="text-sm text-orange-700 font-medium">
                                الكمية: {extractQuantityFromOffer(order.offer)} قطعة
                              </p>
                              <p className="text-xs text-gray-600">
                                {order.offer.split(' - ')[1] || order.offer}
                              </p>
                            </div>
                          )}
                          <p className="text-lg font-bold text-purple-700 text-center">
                            {(() => {
                              // حساب الإجمالي: سعر العرض - الخصم
                              const offerPrice = order.offer ? 
                                parseFloat(order.offer.split(' - ')[1]?.replace(/[^\d.]/g, '') || order.productPrice) : 
                                parseFloat(order.productPrice);
                              const discount = (order.discountAmount && parseFloat(order.discountAmount)) || 
                                              (order.discount && parseFloat(order.discount)) || 0;
                              const total = offerPrice - discount;
                              return formatCurrency(total);
                            })()}
                          </p>
                          <p className="text-sm text-gray-600 text-center">
                            {order.type === 'landing_page' ? 
                              `${extractQuantityFromOffer(order.offer)} قطعة` : 
                              `${order.orderItems?.length || 0} منتج`
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-row-reverse justify-between items-center" dir="rtl">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="theme-border hover:bg-theme-primary-light hover:text-theme-primary">
                            <i className="fas fa-eye ml-1"></i>
                            عرض التفاصيل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintInvoice(order)}
                            className="theme-border hover:bg-theme-primary-light hover:text-theme-primary"
                          >
                            <i className="fas fa-print ml-1"></i>
                            طباعة الفاتورة
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="w-40 theme-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-theme-primary-lighter theme-border">
                              <SelectItem value="pending" className="hover:bg-theme-primary-light">في الانتظار</SelectItem>
                              <SelectItem value="confirmed" className="hover:bg-theme-primary-light">مؤكد</SelectItem>
                              <SelectItem value="processing" className="hover:bg-theme-primary-light">قيد المعالجة</SelectItem>
                              <SelectItem value="shipped" className="hover:bg-theme-primary-light">تم الشحن</SelectItem>
                              <SelectItem value="delivered" className="hover:bg-theme-primary-light">تم التسليم</SelectItem>
                              <SelectItem value="cancelled" className="hover:bg-theme-primary-light">ملغي</SelectItem>
                              <SelectItem value="refunded" className="hover:bg-theme-primary-light">مسترد</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="theme-border bg-theme-primary-lighter">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-theme-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-shopping-cart text-2xl text-theme-primary"></i>
                  </div>
                  <h3 className="text-lg font-medium text-theme-primary mb-2">لا توجد طلبات</h3>
                  <p className="text-gray-500 mb-4">لم يتم العثور على طلبات تتطابق مع البحث الحالي</p>
                  <Button onClick={() => setShowCreateOrder(true)} className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300">
                    إضافة أول طلب
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showCreateOrder && (
        <CreateOrderModal
          isOpen={showCreateOrder}
          onClose={(open) => setShowCreateOrder(open)}
        />
      )}
      
      {selectedOrderForPrint && (
        <PrintInvoiceModal
          isOpen={!!selectedOrderForPrint}
          onClose={() => setSelectedOrderForPrint(null)}
          order={selectedOrderForPrint}
        />
      )}
    </div>
  );
}
