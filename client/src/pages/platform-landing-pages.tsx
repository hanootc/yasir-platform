import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, LogOut, Plus, Tag, Edit, Eye, Trash2, FileText, ExternalLink, CheckCircle, Palette } from 'lucide-react';
import CreateLandingPageModal from "@/components/modals/create-landing-page-modal";
import EditLandingPageModal from "@/components/modals/edit-landing-page-modal";
import PlatformSidebar from "@/components/PlatformSidebar";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageTitle } from '@/hooks/usePageTitle';
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import { useCurrentSession } from "@/hooks/useSessionInfo";
import { getTemplateDisplayName } from "@/lib/landingPageTemplates";

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
  { href: "/platform-products", icon: "fas fa-box", label: "إدارة المنتجات", badge: "24" },
  { href: "/platform-landing-pages", icon: "fas fa-pager", label: "صفحات الهبوط", isActive: true },
  { href: "/platform-orders", icon: "fas fa-shopping-cart", label: "إدارة الطلبات", badge: "12", badgeVariant: "destructive" as const },
  { href: "/platform-accounting", icon: "fas fa-calculator", label: "النظام المحاسبي" },
  { href: "/platform-reports", icon: "fas fa-chart-bar", label: "التقارير والإحصائيات" },
  { href: "/platform-settings", icon: "fas fa-cog", label: "الإعدادات" },
];

export default function PlatformLandingPages() {
  // تعيين عنوان الصفحة
  usePageTitle('صفحات الهبوط');

  const { isEmployee, employeeSession, isLoading: sessionLoading } = useCurrentSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [showCreateLandingPage, setShowCreateLandingPage] = useState(false);
  const [selectedLandingPage, setSelectedLandingPage] = useState<any>(null);
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get platform session data
  const { data: platformSession } = useQuery<PlatformSession>({
    queryKey: ["/api/platform-session"],
    retry: false,
    enabled: !isEmployee, // Only fetch if not employee
  });

  // Extract platform ID from current session
  const platformId = isEmployee && employeeSession?.success
    ? employeeSession.employee.platformId 
    : (platformSession as PlatformSession)?.platformId;

  // Fetch landing pages for this platform
  const { data: landingPages = [], isLoading: landingPagesLoading, error: landingPagesError } = useQuery<any[]>({
    queryKey: [`/api/platforms/${platformId}/landing-pages`],
    enabled: !!platformId,
  });

  // Fetch products for this platform for filtering  
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/platform-products"],
    enabled: !!platformId,
  });

  // Filter landing pages based on search and filters
  const filteredLandingPages = landingPages && Array.isArray(landingPages) ? landingPages.filter((page: any) => {
    const matchesSearch = !searchTerm || 
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.customUrl?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProduct = selectedProduct === 'all' || page.productId === selectedProduct;
    const matchesTemplate = templateFilter === 'all' || page.template === templateFilter;
    
    return matchesSearch && matchesProduct && matchesTemplate;
  }) : [];

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);



  const handleEditLandingPage = (page: any) => {
    setSelectedLandingPage(page);
  };

  const handleViewLandingPage = (page: any) => {
    // Build the correct URL for the landing page
    const subdomain = isEmployee && employeeSession?.success
      ? 'souqnaiq' // Default subdomain for employee access
      : (platformSession as PlatformSession)?.subdomain;
    const landingUrl = `/${subdomain}/${page.customUrl}`;
    window.open(landingUrl, '_blank');
  };

  // Delete landing page mutation
  const deleteMutation = useMutation({
    mutationFn: async (pageId: string) => {
      return apiRequest(`/api/platforms/${platformId}/landing-pages/${pageId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/platforms/${platformId}/landing-pages`] 
      });
      toast({
        title: "تم حذف صفحة الهبوط",
        description: "تم حذف صفحة الهبوط بنجاح",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "خطأ في الحذف",
        description: `فشل في حذف صفحة الهبوط: ${error}`,
        variant: "destructive",
      });
    }
  });

  const handleDeleteLandingPage = (page: any) => {
    if (confirm(`هل أنت متأكد من حذف صفحة الهبوط "${page.title}"؟`)) {
      deleteMutation.mutate(page.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('platformSession');
    window.location.href = '/api/logout';
  };

  // Create unified session object for sidebar
  const sessionForSidebar: PlatformSession = isEmployee && employeeSession?.success 
    ? {
        type: 'employee' as const,
        employee: employeeSession.employee,
        platformId: employeeSession.employee.platformId,
        platformName: 'سوكنا',
        subdomain: 'souqnaiq',
        userType: 'employee'
      } as PlatformSession
    : (platformSession as PlatformSession) || {} as PlatformSession;

  if (sessionLoading || (!isEmployee && !platformSession) || (isEmployee && !employeeSession?.success)) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">جاري التحميل...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-theme-primary-lighter" dir="rtl">
      <PlatformSidebar 
        session={sessionForSidebar} 
        currentPath="/platform-landing-pages"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>
        {/* Page Title Section */}
        <div className="theme-border bg-theme-primary-lighter px-8 py-4">
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
              <h1 className="text-lg font-bold text-theme-primary">صفحات الهبوط</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">إدارة وتخصيص صفحات الهبوط للمنتجات</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الصفحات</CardTitle>
                <FileText className="h-5 w-5 text-theme-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-theme-primary">
                  {(landingPages as any[])?.length || 0}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">جميع صفحات الهبوط</p>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">صفحات نشطة</CardTitle>
                <CheckCircle className="h-5 w-5 text-theme-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-theme-primary">
                  {filteredLandingPages.filter((p: any) => p.isActive).length}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">متاحة للعرض</p>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">القوالب المستخدمة</CardTitle>
                <Palette className="h-5 w-5 text-theme-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-theme-primary">
                  {new Set((landingPages as any[])?.map((p: any) => p.template) || []).size}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">أنواع القوالب</p>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">زيارات اليوم</CardTitle>
                <Eye className="h-5 w-5 text-theme-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-theme-primary">
                  0
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">قريباً</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button
              onClick={() => setShowCreateLandingPage(true)}
              className="bg-theme-gradient hover:opacity-90 text-white theme-shadow"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة صفحة هبوط جديدة
            </Button>
          </div>

          {/* Filters */}
            <Card className="mb-6 theme-border bg-theme-primary-lighter">
              <CardHeader className="border-b border-theme-primary">
                <CardTitle className="text-lg font-semibold text-theme-primary">البحث والفلترة</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="البحث في العناوين والروابط..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="col-span-2 theme-input"
                  />
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="theme-select-trigger">
                      <SelectValue placeholder="اختر المنتج - سيملأ العنوان تلقائياً" />
                    </SelectTrigger>
                    <SelectContent className="mt-2 theme-dropdown-content">
                      <SelectItem value="all">جميع المنتجات ({(landingPages as any[]).length})</SelectItem>
                      {products && Array.isArray(products) && products.map((product: any) => {
                        const productPagesCount = (landingPages as any[]).filter((page: any) => 
                          page.productId === product.id || page.product_id === product.id
                        ).length;
                        return (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{product.name || 'منتج غير محدد'}</span>
                              <span className="text-xs bg-theme-primary-light px-2 py-1 rounded mr-2">
                                {productPagesCount} صفحة
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Select value={templateFilter} onValueChange={setTemplateFilter}>
                    <SelectTrigger className="theme-select-trigger">
                      <SelectValue placeholder="جميع القوالب" />
                    </SelectTrigger>
                    <SelectContent className="mt-2 theme-dropdown-content">
                      <SelectItem value="all">جميع القوالب</SelectItem>
                      <SelectItem value="modern_minimal">البسيط</SelectItem>
                      <SelectItem value="bold_hero">التجاري</SelectItem>
                      <SelectItem value="product_showcase">العارض</SelectItem>
                      <SelectItem value="testimonial_focus">الشهادات</SelectItem>
                      <SelectItem value="feature_highlight">المميزات</SelectItem>
                      <SelectItem value="countdown_urgency">الاستعجال</SelectItem>
                      <SelectItem value="colorful_vibrant">الملوّن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Landing Pages Table */}
            <Card className="theme-border bg-theme-primary-lighter theme-shadow">
              <CardHeader className="border-b border-theme-primary bg-theme-primary-light">
                <CardTitle className="text-xl font-bold text-theme-primary">
                  صفحات الهبوط ({filteredLandingPages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">

                
                {landingPagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-theme-primary-light dark:bg-gray-700 rounded-lg p-4 animate-pulse theme-border">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-theme-primary-lighter rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-theme-primary-lighter rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-theme-primary-lighter rounded w-1/2"></div>
                          </div>
                          <div className="h-8 bg-theme-primary-lighter rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredLandingPages.length > 0 ? (
                  <div className="space-y-3">
                    {filteredLandingPages.map((page: any) => (
                      <div key={page.id} className="theme-border bg-theme-primary-lighter rounded-lg p-4 hover:theme-shadow transition-all duration-300">
                        <div className="flex items-center gap-4 w-full">
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-theme-primary-light rounded-lg overflow-hidden flex-shrink-0 theme-border">
                            {(() => {
                              let imageUrl = null;
                              
                              // تحديد مصدر الصورة وتحويل المسار للوصول العام
                              if (page.product_image_urls && page.product_image_urls.length > 0) {
                                const firstImage = page.product_image_urls[0];
                                if (firstImage.startsWith('/objects/')) {
                                  imageUrl = firstImage.replace('/objects/', '/public-objects/');
                                } else {
                                  imageUrl = firstImage;
                                }
                              } else if (page.product_image_url) {
                                if (page.product_image_url.startsWith('/objects/')) {
                                  imageUrl = page.product_image_url.replace('/objects/', '/public-objects/');
                                } else {
                                  imageUrl = page.product_image_url;
                                }
                              }
                              
                              return imageUrl ? (
                                <img 
                                  src={imageUrl} 
                                  alt={page.productName || page.product_name || page.title}
                                  className="w-full h-full object-cover rounded-md"

                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <FileText className="h-6 w-6" />
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Page Info */}
                          <div className="flex-1 min-w-0">
                            {/* عنوان صفحة الهبوط */}
                            <div className="text-right">
                              <h3 className="text-lg font-bold text-theme-primary truncate mb-2">{page.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <a
                                  href={`/${isEmployee && employeeSession?.success ? 'souqnaiq' : (platformSession as PlatformSession)?.subdomain}/${page.customUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="landing-page-link hover:underline transition-all duration-300"
                                >
                                  {page.customUrl}
                                </a>
                                <span>•</span>
                                <span>
                                  {getTemplateDisplayName(page.template)}
                                </span>
                                <span>•</span>
                                <span className="text-gray-400">
                                  {new Date(page.createdAt).toLocaleDateString('en-US')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity duration-200">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditLandingPage(page)}
                              className="border-theme-primary text-theme-primary hover:bg-theme-primary-light hover:border-theme-primary transition-all duration-200"
                            >
                              <Edit className="h-4 w-4 ml-1" />
                              تعديل
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewLandingPage(page)}
                              className="border-theme-primary text-theme-primary hover:bg-theme-primary-light hover:border-theme-primary transition-all duration-200"
                            >
                              <ExternalLink className="h-4 w-4 ml-1" />
                              عرض
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteLandingPage(page)}
                              className="text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-theme-primary-lighter rounded-lg border-2 border-dashed border-theme-primary">
                    <div className="w-24 h-24 bg-theme-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-12 w-12 text-theme-primary" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">لا توجد صفحات هبوط</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">ابدأ بإنشاء صفحة هبوط جديدة لمنتجاتك واجعل عملائك يتفاعلون معها بسهولة</p>
                    <Button
                      onClick={() => setShowCreateLandingPage(true)}
                      className="bg-theme-gradient text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 ml-2" />
                      إضافة صفحة هبوط الآن
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modals */}
            {showCreateLandingPage && (
              <CreateLandingPageModal
                open={showCreateLandingPage}
                onOpenChange={setShowCreateLandingPage}
              />
            )}

            {selectedLandingPage && (
              <EditLandingPageModal
                isOpen={!!selectedLandingPage}
                onClose={() => setSelectedLandingPage(null)}
                landingPage={selectedLandingPage}
              />
            )}
        </div>
      </div>
    </div>
  );
}