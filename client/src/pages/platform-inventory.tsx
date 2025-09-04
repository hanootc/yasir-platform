import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";

interface InventoryProduct {
  id: string;
  name: string;
  imageUrls: string[];
  stock: number;
  price: number;
  cost: number;
  unitCost: number;
  totalCost: number;
  soldQuantity: number;
  returnedQuantity: number;
  remainingQuantity: number;
  remainingValue: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  category?: string;
  sku?: string;
  lastUpdated: string;
}

interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lowStockItems: number;
  totalSold: number;
  totalReturned: number;
}

export default function PlatformInventory() {
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const queryClient = useQueryClient();

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // جلب بيانات الجلسة
  const { data: sessionData } = useQuery({
    queryKey: ["/api/platform-session"],
  });

  // جلب بيانات المخزن
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["/api/platform-inventory", dateFrom, dateTo, showLowStockOnly],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateFrom,
        to: dateTo,
        lowStockOnly: showLowStockOnly.toString()
      });
      const response = await fetch(`/api/platform-inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
    staleTime: 0, // تحديث فوري عند invalidation
    gcTime: 30000, // احتفاظ بالـ cache 30 ثانية فقط
  });

  // جلب ملخص المخزن
  const { data: summary } = useQuery({
    queryKey: ["/api/platform-inventory/summary", dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({ from: dateFrom, to: dateTo });
      const response = await fetch(`/api/platform-inventory/summary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    },
    staleTime: 0, // تحديث فوري عند invalidation
    gcTime: 30000, // احتفاظ بالـ cache 30 ثانية فقط
  });

  // تحديث المخزن
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, newStock }: { productId: string; newStock: number }) => {
      return apiRequest(`/api/products/${productId}/stock`, 'PUT', { stock: newStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory/summary"] });
    }
  });

  // تحديث حد التنبيه
  const updateThresholdMutation = useMutation({
    mutationFn: async ({ productId, threshold }: { productId: string; threshold: number }) => {
      return apiRequest(`/api/products/${productId}/threshold`, 'PUT', { lowStockThreshold: threshold });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory"] });
    }
  });

  const products: InventoryProduct[] = inventory || [];
  const summaryData: InventorySummary = {
    totalProducts: summary?.totalProducts || 0,
    totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0), // استخدام المخزون الأصلي
    totalValue: summary?.totalInventoryValue || 0,
    lowStockItems: summary?.lowStockProducts || 0,
    totalSold: products.reduce((sum, p) => sum + (p.soldQuantity || 0), 0),
    totalReturned: products.reduce((sum, p) => sum + (p.returnedQuantity || 0), 0)
  };

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // اختيار جميع المنتجات
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  // اختيار منتج واحد
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  // تحويل URL الصور
  const convertToPublicUrls = (imageUrls: string[] = []) => {
    return imageUrls.map(url => {
      if (url.startsWith('/objects/')) {
        return url.replace('/objects/', '/public-objects/');
      }
      return url;
    });
  };

  // تنسيق العملة بالأرقام الإنجليزية
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' د.ع';
  };

  // تحديث المخزن
  const handleStockUpdate = (productId: string, newStock: number) => {
    updateStockMutation.mutate({ productId, newStock });
  };

  // تحديث حد التنبيه
  const handleThresholdUpdate = (productId: string, threshold: number) => {
    updateThresholdMutation.mutate({ productId, threshold });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PlatformSidebar 
        session={sessionData as any}
        currentPath="/platform-inventory"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`transition-all duration-300 ${
        !sidebarCollapsed ? (isMobile ? 'ml-0' : 'mr-64') : (isMobile ? 'mr-0' : 'mr-16')
      }`}>
        {/* Page Title Section */}
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
                className="lg:hidden bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <i className="fas fa-bars h-4 w-4"></i>
              </Button>
            </div>
            <div className="flex-1 text-center sm:text-right">
              <h1 className="text-lg sm:text-xl font-bold text-theme-primary">إدارة المخزن</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">تتبع المخزون والكميات المتاحة بدقة وسهولة</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-8">

        {/* إحصائيات المخزن */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-boxes text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">المنتجات</p>
                  <p className="text-sm sm:text-lg font-bold text-theme-primary">{formatNumber(summaryData.totalProducts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-cubes text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">الكمية</p>
                  <p className="text-sm sm:text-lg font-bold text-theme-primary">{formatNumber(summaryData.totalStock)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">القيمة</p>
                  <p className="text-sm font-bold text-theme-primary">{formatCurrency(summaryData.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">تجديد</p>
                  <p className="text-sm sm:text-lg font-bold text-theme-primary">{formatNumber(summaryData.lowStockItems)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-shopping-cart text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">مبيعات</p>
                  <p className="text-sm sm:text-lg font-bold text-theme-primary">{formatNumber(summaryData.totalSold)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-undo text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">مرتجع</p>
                  <p className="text-sm sm:text-lg font-bold text-theme-primary">{formatNumber(summaryData.totalReturned)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* بطاقات تفصيل المبيعات حسب الحالات */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-check text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">مؤكد</p>
                  <p className="text-sm sm:text-lg font-bold text-theme-primary">
                    {formatNumber(products.reduce((sum, p) => {
                      const confirmedSales = (p as any).confirmedQuantity || 0;
                      return sum + confirmedSales;
                    }, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-truck text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">تم التسليم</p>
                  <p className="text-sm sm:text-lg font-bold text-theme-primary">
                    {formatNumber(products.reduce((sum, p) => {
                      const deliveredSales = (p as any).deliveredQuantity || 0;
                      return sum + deliveredSales;
                    }, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-clock text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">قيد المعالجة</p>
                  <p className="text-sm sm:text-lg font-bold text-theme-primary">
                    {formatNumber(products.reduce((sum, p) => {
                      const processingSales = (p as any).processingQuantity || 0;
                      return sum + processingSales;
                    }, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
            <CardContent className="p-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-theme-primary-light rounded flex items-center justify-center">
                    <i className="fas fa-pause text-theme-primary text-xs"></i>
                  </div>
                </div>
                <div className="mr-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">مؤجل</p>
                  <p className="text-sm sm:text-lg font-bold text-theme-primary">
                    {formatNumber(products.reduce((sum, p) => {
                      const postponedSales = (p as any).postponedSales || 0;
                      return sum + postponedSales;
                    }, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* فلاتر البحث */}
        <Card className="mb-4 sm:mb-6 theme-border bg-theme-primary-lighter shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">البحث</label>
                <Input
                  placeholder="اسم المنتج أو الرمز..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 text-sm theme-border"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">من تاريخ</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-8 text-sm theme-border"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">إلى تاريخ</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-8 text-sm theme-border"
                />
              </div>

              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={showLowStockOnly}
                    onCheckedChange={(checked) => setShowLowStockOnly(checked === true)}
                  />
                  <span className="text-xs text-theme-primary">مخزون منخفض</span>
                </label>
              </div>

              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory/summary"] });
                  }}
                  className="bg-theme-gradient hover:opacity-90 text-white theme-shadow flex items-center gap-2 h-8 text-xs px-3 transition-all duration-300 w-full sm:w-auto"
                >
                  <i className="fas fa-search text-xs"></i>
                  بحث
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setDateFrom(format(new Date(), "yyyy-MM-dd"));
                    setDateTo(format(new Date(), "yyyy-MM-dd"));
                    setShowLowStockOnly(false);
                  }}
                  className="h-8 text-xs px-3 theme-border hover:bg-theme-primary-light hover:text-theme-primary"
                >
                  إعادة تعيين
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* جدول المخزن */}
        <Card className="theme-border theme-shadow">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 bg-theme-primary-lighter">
                <div className="animate-pulse space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-theme-primary">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="h-4 bg-theme-gradient rounded w-20"></div>
                    ))}
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-theme-primary">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <div key={j} className="h-3 bg-theme-gradient rounded w-16"></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full" dir="rtl">
                  <thead className="bg-theme-primary-light border-b border-theme-primary">
                    <tr>
                      <th className="py-2 px-2 text-xs font-medium text-gray-900 dark:text-white text-center">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="py-2 px-2 text-xs font-medium text-gray-900 dark:text-white text-center min-w-[80px]">الصورة</th>
                      <th className="py-2 px-2 text-xs font-medium text-gray-900 dark:text-white text-center min-w-[150px]">اسم المنتج</th>
                      <th className="py-2 px-2 text-xs font-semibold text-theme-primary text-center min-w-[80px] bg-theme-primary-lighter">الكمية</th>
                      <th className="py-2 px-2 text-xs font-semibold text-theme-primary text-center min-w-[80px] bg-theme-primary-lighter">الكلفة</th>
                      <th className="py-2 px-2 text-xs font-semibold text-theme-primary text-center min-w-[80px] bg-theme-primary-lighter">مبيعات</th>
                      <th className="py-2 px-2 text-xs font-semibold text-theme-primary text-center min-w-[80px] bg-theme-primary-lighter">مرتجع</th>
                      <th className="py-2 px-2 text-xs font-semibold text-theme-primary text-center min-w-[80px] bg-theme-primary-lighter">متبقي</th>
                      <th className="py-2 px-2 text-xs font-semibold text-theme-primary text-center min-w-[100px] bg-theme-primary-lighter">قيمة متبقي</th>
                      <th className="py-2 px-2 text-xs font-medium text-gray-900 dark:text-white text-center min-w-[80px]">حد تنبيه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-primary bg-white dark:bg-gray-800">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className={`hover:bg-theme-primary-light transition-all duration-200 ${product.isLowStock ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'}`}>
                        <td className="py-2 px-2 text-center">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                          />
                        </td>

                        {/* الصورة */}
                        <td className="py-2 px-2 text-center">
                          {product.imageUrls && product.imageUrls.length > 0 ? (
                            <img
                              src={convertToPublicUrls(product.imageUrls)[0]}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded border mx-auto"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMzMC42Mjc0IDMyIDM2IDI2LjYyNzQgMzYgMjBTMzAuNjI3NCA4IDI0IDhTMTIgMTMuMzcyNiAxMiAyMFMxNy4zNzI2IDMyIDI0IDMyWiIgZmlsbD0iI0Q5RDlEOSIvPgo8cGF0aCBkPSJNMjQgMjRDMjYuMjA5MSAyNCAyOCAyMi4yMDkxIDI4IDIwUzI2LjIwOTEgMTYgMjQgMTZTMjAgMTcuNzkwOSAyMCAyMFMyMS43OTA5IDI0IDI0IDI0WiIgZmlsbD0iI0Y5RkFGQiIvPgo8L3N2Zz4K';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 border rounded flex items-center justify-center mx-auto">
                              <i className="fas fa-image text-gray-400 text-xs"></i>
                            </div>
                          )}
                        </td>

                        {/* اسم المنتج */}
                        <td className="py-2 px-2">
                          <div>
                            <div className="text-xs font-medium text-gray-900">{product.name}</div>
                            {product.sku && (
                              <div className="text-xs text-gray-500">رمز: {product.sku}</div>
                            )}
                            {product.category && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* الكمية المتوفرة */}
                        <td className="py-2 px-2 text-center bg-white">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              value={product.stock}
                              onChange={(e) => handleStockUpdate(product.id, parseInt(e.target.value) || 0)}
                              className="w-16 text-center text-xs h-6"
                              min="0"
                            />
                            {product.isLowStock && (
                              <i className="fas fa-exclamation-triangle text-red-500 text-xs" title="مخزون منخفض"></i>
                            )}
                          </div>
                        </td>

                        {/* كلفة الشراء */}
                        <td className="py-2 px-2 text-center bg-white">
                          <span className="text-xs font-medium text-blue-700">
                            {formatCurrency((product as any).unitCost || product.cost || 0)}
                          </span>
                        </td>

                        {/* عدد المبيعات */}
                        <td className="py-2 px-2 text-center bg-white">
                          <div>
                            <div className="text-xs font-medium text-orange-700">
                              {formatNumber(product.soldQuantity || 0)}
                            </div>
                            <div className="text-xs font-bold text-orange-900 border-t border-orange-200 pt-1 mt-1">
                              {formatCurrency((product.soldQuantity || 0) * ((product as any).unitCost || product.cost || 0))}
                            </div>
                          </div>
                        </td>

                        {/* المرتجعات */}
                        <td className="py-2 px-2 text-center bg-white">
                          <div>
                            <div className="text-xs font-medium text-red-700">
                              {formatNumber(product.returnedQuantity || 0)}
                            </div>
                            <div className="text-xs font-bold text-red-900 border-t border-red-200 pt-1 mt-1">
                              {formatCurrency((product.returnedQuantity || 0) * ((product as any).unitCost || product.cost || 0))}
                            </div>
                          </div>
                        </td>

                        {/* الكمية المتبقية */}
                        <td className="py-2 px-2 text-center bg-white">
                          <span className="text-xs font-medium text-purple-700">
                            {formatNumber((product as any).remainingQuantity || (product.stock || 0))}
                          </span>
                        </td>

                        {/* قيمة المتبقي */}
                        <td className="py-2 px-2 text-center bg-white">
                          <span className="text-xs font-bold text-purple-800">
                            {formatCurrency((product as any).remainingValue || ((product.stock || 0) * ((product as any).unitCost || product.cost || 0)))}
                          </span>
                        </td>

                        {/* حد التنبيه */}
                        <td className="py-2 px-2 text-center">
                          <Input
                            type="number"
                            value={product.lowStockThreshold}
                            onChange={(e) => handleThresholdUpdate(product.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center text-xs h-6"
                            min="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* إجمالي */}
                  <tfoot className="bg-theme-primary-light border-b border-theme-primary">
                    <tr>
                      <td colSpan={3} className="py-2 px-2 text-center text-xs font-bold text-gray-900 dark:text-white">الإجمالي</td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatNumber(filteredProducts.reduce((sum, p) => sum + p.stock, 0))}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatCurrency(filteredProducts.reduce((sum, p) => sum + ((p as any).unitCost || p.cost || 0) * (p.stock || 0), 0))}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatCurrency(filteredProducts.reduce((sum, p) => sum + (p.soldQuantity || 0) * ((p as any).unitCost || p.cost || 0), 0))}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatCurrency(filteredProducts.reduce((sum, p) => sum + (p.returnedQuantity || 0) * ((p as any).unitCost || p.cost || 0), 0))}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatNumber(filteredProducts.reduce((sum, p) => sum + (p.stock || 0), 0))}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {formatCurrency(filteredProducts.reduce((sum, p) => sum + (p.stock || 0) * ((p as any).unitCost || p.cost || 0), 0))}
                        </span>
                      </td>
                      <td className="py-2 px-2 bg-theme-primary-light"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center bg-gradient-to-br from-purple-25 to-blue-25">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <i className="fas fa-boxes text-3xl text-purple-500"></i>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">لا توجد منتجات</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">لم يتم العثور على منتجات تتطابق مع البحث الحالي. جرب تعديل معايير البحث</p>
                <Button 
                  onClick={() => window.location.href = '/platform/products'}
                  className="gradient-primary text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  إضافة منتج جديد
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}