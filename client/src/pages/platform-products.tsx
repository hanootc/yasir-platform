import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, LogOut, Plus, Tag, Edit, Eye, Trash2, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import CreateProductModal from "@/components/modals/create-product-modal";
import CreateCategoryModal from "@/components/modals/create-category-modal";
import EditProductModal from "@/components/modals/edit-product-modal";
import { ProductVariantsTab } from "@/components/product-variants/ProductVariantsTab";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

// Navigation menu items
const menuItems = [
  { href: "/platform-dashboard", icon: "fas fa-chart-pie", label: "لوحة التحكم" },
  { href: "/platform-products", icon: "fas fa-box", label: "إدارة المنتجات", badge: "24", isActive: true },
  { href: "/platform-landing-pages", icon: "fas fa-pager", label: "صفحات الهبوط" },
  { href: "/platform-orders", icon: "fas fa-shopping-cart", label: "إدارة الطلبات", badge: "12", badgeVariant: "destructive" as const },
  { href: "/platform-accounting", icon: "fas fa-calculator", label: "النظام المحاسبي" },
  { href: "/platform-reports", icon: "fas fa-chart-bar", label: "التقارير والإحصائيات" },
  { href: "/platform-settings", icon: "fas fa-cog", label: "الإعدادات" },
];

export default function PlatformProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [variantsProduct, setVariantsProduct] = useState<any>(null);
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get platform session from API
  const { data: session, isLoading: sessionLoading } = useQuery<PlatformSession>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // Fetch products for this platform
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/products`],
    enabled: !!session?.platformId,
  });

  // Fetch categories for this platform
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/categories`],
    enabled: !!session?.platformId,
  });

  // Filter products based on search and filters  
  const filteredProducts = Array.isArray(products) ? products.filter((product: any) => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) : [];

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

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
  };

  const handleViewProduct = async (product: any) => {
    try {
      // البحث عن صفحة الهبوط المرتبطة بهذا المنتج
      const response = await fetch(`/api/platforms/${session?.platformId}/products/${product.id}/landing-pages`);
      
      if (response.ok) {
        const landingPages = await response.json();
        
        if (landingPages && landingPages.length > 0) {
          // تجاهل صفحات الاختبار والبحث عن الصفحة الحقيقية
          const realLandingPage = landingPages.find((page: any) => 
            !page.customUrl.includes('test-pixel-tracking') &&
            !page.title.includes('اختبار')
          ) || landingPages[0]; // إذا لم توجد صفحة حقيقية، استخدم الأولى
          
          // استخدام customUrl مع اسم المنصة
          const landingUrl = `/${session?.subdomain}/${realLandingPage.customUrl}`;
          window.open(landingUrl, '_blank');
        } else {
          // إذا لم توجد صفحة هبوط، اعرض رسالة
          toast({
            title: "لا توجد صفحة هبوط",
            description: "يجب إنشاء صفحة هبوط لهذا المنتج أولاً",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('فشل في جلب صفحات الهبوط');
      }
    } catch (error) {
      console.error('Error fetching landing pages:', error);
      toast({
        title: "خطأ",
        description: "فشل في فتح صفحة الهبوط",
        variant: "destructive",
      });
    }
  };

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest(`/api/platforms/${session?.platformId}/products/${productId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج بنجاح",
      });
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${session?.platformId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${session?.platformId}/landing-pages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${session?.platformId}/product-names`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${session?.platformId}/stats`] });
      
      // Also invalidate any landing pages or product-related queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key => 
            typeof key === 'string' && 
            (key.includes('landing') || key.includes('product') || key.includes('public'))
          );
        }
      });
      
      // Specifically invalidate public product endpoints
      queryClient.invalidateQueries({ queryKey: ['/api/public/products'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حذف المنتج",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (product: any) => {
    if (window.confirm(`هل أنت متأكد من حذف المنتج "${product.name}"؟`)) {
      deleteMutation.mutate(product.id);
    }
  };

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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 page-transition" dir="rtl">
      <PlatformSidebar 
        session={session} 
        currentPath="/platform-products" 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>
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
                className="md:hidden bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <i className="fas fa-bars h-4 w-4"></i>
              </Button>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">إدارة المنتجات</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">إضافة وتحرير المنتجات</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المنتجات</CardTitle>
                <Package className="h-5 w-5 text-theme-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-theme-primary">
                  {Array.isArray(products) ? products.length : 0}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">جميع المنتجات المسجلة</p>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">منتجات نشطة</CardTitle>
                <CheckCircle className="h-5 w-5 text-theme-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-theme-primary">
                  {Array.isArray(products) ? products.filter((p: any) => p.status === 'active').length : 0}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">متاحة للبيع</p>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">التصنيفات</CardTitle>
                <Tag className="h-5 w-5 text-theme-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-theme-primary">
                  {Array.isArray(categories) ? categories.length : 0}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">تصنيفات المنتجات</p>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">منتجات غير نشطة</CardTitle>
                <AlertCircle className="h-5 w-5 text-theme-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-theme-primary">
                  {Array.isArray(products) ? products.filter((p: any) => p.status === 'inactive').length : 0}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">تحتاج لمراجعة</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button
                onClick={() => setShowCreateProduct(true)}
                className="bg-theme-gradient hover:opacity-90 text-white theme-shadow"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج جديد
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateCategory(true)}
                className="platform-button"
              >
                <Tag className="h-4 w-4 ml-2" />
                إدارة التصنيفات
              </Button>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="البحث في المنتجات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full platform-input"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="platform-select">
                      <SelectValue placeholder="جميع التصنيفات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التصنيفات</SelectItem>
                      {Array.isArray(categories) && categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="platform-select">
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>المنتجات ({filteredProducts?.length || 0})</span>
                  <Badge variant="outline" className="text-xs">
                    {session.platformName}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProducts && Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
                  <div className="space-y-3">
                    {filteredProducts.map((product: any) => (
                      <div key={product.id} className="bg-theme-primary-lighter theme-border rounded-lg theme-shadow p-4 hover:theme-shadow-hover transition-all duration-300">
                        <div className="flex items-center gap-4 w-full">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                              <img 
                                src={product.imageUrls[0].startsWith('/objects/') 
                                  ? product.imageUrls[0].replace('/objects/', '/public-objects/') 
                                  : product.imageUrls[0]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold text-theme-primary truncate">{product.name}</h3>
                              <Badge 
                                variant={product.isActive ? "default" : "secondary"} 
                                className={`text-xs ${product.isActive 
                                  ? 'bg-theme-gradient text-white' 
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {product.isActive ? "نشط" : "غير نشط"}
                              </Badge>
                            </div>
                            {product.description && (
                              <p className="text-theme-secondary text-sm truncate">{product.description}</p>
                            )}
                            <div className="space-y-2 mt-2">
                              {/* السعر الأساسي */}
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-theme-primary font-bold">{formatCurrency(product.price)}</span>
                                <span className="text-theme-secondary">المخزون: {product.stock || 0}</span>
                                {product.categoryId && Array.isArray(categories) && (
                                  <span className="text-theme-secondary">
                                    <Tag className="h-3 w-3 inline ml-1 text-theme-accent" />
                                    {categories.find((cat: any) => cat.id === product.categoryId)?.name || 'غير محدد'}
                                  </span>
                                )}
                              </div>
                              
                              {/* عروض الأسعار الجديدة */}
                              {product.priceOffers && Array.isArray(product.priceOffers) && product.priceOffers.length > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-theme-secondary">العروض:</span>
                                  <div className="flex gap-1 flex-wrap">
                                    {product.priceOffers.slice(0, 3).map((offer: any, index: number) => (
                                      <Badge 
                                        key={index}
                                        variant="outline" 
                                        className={`text-[10px] px-1.5 py-0.5 ${
                                          offer.isDefault 
                                            ? 'border-theme-primary text-theme-primary bg-theme-primary-lighter' 
                                            : 'border-gray-300 text-gray-600'
                                        }`}
                                      >
                                        {offer.quantity}x - {formatCurrency(offer.price)}
                                      </Badge>
                                    ))}
                                    {product.priceOffers.length > 3 && (
                                      <span className="text-theme-secondary text-[10px]">+{product.priceOffers.length - 3} عرض</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-theme-gradient text-white hover:scale-[1.02] transform transition-all duration-300"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4 ml-1" />
                              تعديل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewProduct(product)}
                              className="border-theme-border text-theme-primary hover:bg-theme-gradient hover:text-white hover:scale-[1.02] transform transition-all duration-300"
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              عرض
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setVariantsProduct(product)}
                              className="border-theme-border text-theme-accent hover:bg-theme-gradient hover:text-white hover:scale-[1.02] transform transition-all duration-300"
                            >
                              <Settings className="h-4 w-4 ml-1" />
                              متغيرات
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد منتجات</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإضافة منتجات لمتجرك</p>
                    <Button
                      onClick={() => setShowCreateProduct(true)}
                      className="gradient-primary"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة منتج الآن
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modals */}
            {showCreateProduct && (
              <CreateProductModal
                isOpen={showCreateProduct}
                onClose={() => setShowCreateProduct(false)}
                platformId={session.platformId}
              />
            )}

            {showCreateCategory && (
              <CreateCategoryModal
                isOpen={showCreateCategory}
                onClose={() => setShowCreateCategory(false)}
                platformId={session.platformId}
              />
            )}

            {selectedProduct && (
              <EditProductModal
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
                platformId={session.platformId}
              />
            )}

            {/* Product Variants Dialog */}
            <Dialog open={!!variantsProduct} onOpenChange={() => setVariantsProduct(null)}>
              <DialogContent className="bg-black max-w-6xl h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-theme-primary text-xl">
                    إدارة متغيرات المنتج: {variantsProduct?.name}
                  </DialogTitle>
                </DialogHeader>
                {variantsProduct && (
                  <ProductVariantsTab 
                    productId={variantsProduct.id}
                    platformId={session.platformId}
                  />
                )}
              </DialogContent>
            </Dialog>
        </div>
      </div>
    </div>
  );
}