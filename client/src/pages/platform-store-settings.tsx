import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCurrentSession } from "@/hooks/useSessionInfo";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import { Store, Layout, Grid3X3, List, LayoutGrid, Check, Upload, Image, ExternalLink, Copy, Facebook } from "lucide-react";

const storeTemplates = [
  {
    id: "grid",
    name: "عرض الشبكة",
    description: "عرض المنتجات في شكل بطاقات منظمة في شبكة",
    icon: Grid3X3,
    preview: "/assets/store-grid-preview.svg",
    features: [
      "عرض الصور بوضوح عالي",
      "تنظيم أنيق للمنتجات",
      "سهولة في التصفح",
      "مناسب للمتاجر الكبيرة"
    ]
  },
  {
    id: "list",
    name: "عرض القائمة",
    description: "عرض المنتجات في قائمة عمودية مفصلة",
    icon: List,
    preview: "/assets/store-list-preview.svg",
    features: [
      "عرض تفاصيل أكثر",
      "مساحة للوصف الطويل",
      "تصفح سريع",
      "مناسب للمنتجات المتخصصة"
    ]
  },
  {
    id: "catalog",
    name: "عرض الكتالوج",
    description: "عرض منتجات بتصميم كتالوج تجاري احترافي",
    icon: LayoutGrid,
    preview: "/assets/store-catalog-preview.svg",
    features: [
      "تصميم تجاري احترافي",
      "عرض متدرج للمنتجات",
      "مناسب للعلامات التجارية",
      "جذاب للعملاء"
    ]
  },
  {
    id: "dark_elegant",
    name: "النمط الليلي الأنيق",
    description: "تصميم ليلي أنيق مع ألوان داكنة وتأثيرات متوهجة",
    icon: Store,
    preview: "/assets/store-dark-elegant-preview.svg",
    features: [
      "ألوان داكنة مريحة للعين",
      "تأثيرات متوهجة جذابة",
      "تصميم عصري وأنيق",
      "مناسب للمساء والليل"
    ]
  },
  {
    id: "dark_minimal",
    name: "النمط الليلي البسيط",
    description: "تصميم ليلي بسيط ونظيف مع التركيز على المحتوى",
    icon: Layout,
    preview: "/assets/store-dark-minimal-preview.svg",
    features: [
      "بساطة في التصميم",
      "تركيز على المنتجات",
      "سهولة في التصفح",
      "أداء سريع"
    ]
  },
  {
    id: "dark_premium",
    name: "النمط الليلي المميز",
    description: "تصميم ليلي فاخر مع عناصر ذهبية وتدرجات مميزة",
    icon: LayoutGrid,
    preview: "/assets/store-dark-premium-preview.svg",
    features: [
      "تصميم فاخر ومميز",
      "عناصر ذهبية فاخرة",
      "تدرجات ليلية جذابة",
      "مناسب للمنتجات الراقية"
    ]
  }
];

export default function PlatformStoreSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // Get platform session data instead of auth user
  const { platformSession } = useCurrentSession();

  // Get current platform data for sidebar
  const { data: currentPlatform } = useQuery({
    queryKey: ["/api/current-platform"],
    enabled: !!platformSession?.platformId,
  });

  const platformId = platformSession?.platformId;
  console.log("Platform Store Settings - Platform ID:", platformId);
  console.log("Current Platform Data:", currentPlatform);

  // Get current store settings
  const { data: storeSettings, isLoading } = useQuery({
    queryKey: [`/api/current-platform/store-settings`],
    enabled: !!platformId,
  });

  // Update store settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/current-platform/store-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: templateId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/current-platform/store-settings`] 
      });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات المتجر بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في حفظ الإعدادات",
        variant: "destructive",
      });
      console.error("Store settings error:", error);
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    updateSettingsMutation.mutate(templateId);
  };

  // Upload store banner image mutation
  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/current-platform/store-banner`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/current-platform/store-settings`] 
      });
      toast({
        title: "تم الرفع",
        description: "تم رفع صورة المتجر بنجاح",
      });
      setUploadingImage(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في رفع الصورة",
        variant: "destructive",
      });
      console.error("Banner upload error:", error);
      setUploadingImage(false);
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      uploadBannerMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-theme-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary-lighter" dir="rtl">
      <PlatformSidebar 
        session={{ 
          platformId: platformId || '',
          platformName: (currentPlatform as any)?.platformName || '',
          subdomain: (currentPlatform as any)?.subdomain || '',
          userType: 'owner',
          logoUrl: (currentPlatform as any)?.logoUrl 
        }} 
        currentPath="/platform-store-settings"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'mr-0 lg:mr-16' : 'mr-0 lg:mr-64'}`}>
        {/* Header */}
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
              <h1 className="text-2xl font-bold text-theme-primary">إعدادات المتجر</h1>
              <p className="text-theme-primary/70">اختر شكل عرض المتجر للعملاء</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Template Info */}
          {(storeSettings as any)?.template && (
            <Card className="mb-6 theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-xl text-theme-primary">
                  <Store className="w-6 h-6 ml-2 inline-block" />
                  النموذج الحالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge className="bg-theme-primary-light text-theme-primary px-3 py-1">
                    {storeTemplates.find(t => t.id === (storeSettings as any).template)?.name || "غير محدد"}
                  </Badge>
                  <span className="text-gray-600">
                    {storeTemplates.find(t => t.id === (storeSettings as any).template)?.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Template Selection Header */}
          <Card className="mb-6 theme-border bg-theme-primary-light">
            <CardHeader>
              <CardTitle className="text-xl text-theme-primary flex items-center">
                <Layout className="w-6 h-6 ml-2" />
                اختيار نموذج عرض المتجر
              </CardTitle>
              <p className="text-theme-primary/80">
                اختر الشكل الذي يناسب نوع منتجاتك وطريقة عرضها للعملاء
              </p>
            </CardHeader>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {storeTemplates.map((template) => {
              const IconComponent = template.icon;
              const isSelected = (storeSettings as any)?.template === template.id;
              
              return (
                <Card 
                  key={template.id}
                  className={`theme-border transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${
                    isSelected 
                      ? 'ring-2 ring-theme-primary bg-theme-primary-light shadow-lg' 
                      : 'bg-theme-primary-lighter hover:bg-theme-primary-light'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-3 relative">
                      {/* Template Icon */}
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isSelected 
                          ? 'bg-theme-primary text-white' 
                          : 'bg-theme-gradient text-white'
                      }`}>
                        <IconComponent className="w-8 h-8" />
                      </div>
                      
                      {/* Selection Check */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-theme-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <CardTitle className="text-lg text-theme-primary">
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                  </CardHeader>

                  <CardContent>
                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-theme-primary text-sm">المميزات:</h4>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {template.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <div className="w-1 h-1 bg-theme-primary rounded-full ml-2"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={`w-full mt-4 ${
                        isSelected 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'border-theme-primary text-theme-primary hover:bg-theme-primary-light'
                      }`}
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending && updateSettingsMutation.variables === template.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          جاري التطبيق...
                        </div>
                      ) : isSelected ? (
                        'النموذج المختار'
                      ) : (
                        'اختيار هذا النموذج'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Store Banner Image Upload */}
          <Card className="mt-6 theme-border bg-theme-primary-lighter">
            <CardHeader>
              <CardTitle className="text-xl text-theme-primary flex items-center">
                <Image className="w-6 h-6 ml-2" />
                صورة المتجر
              </CardTitle>
              <p className="text-theme-primary/80">
                ارفع صورة لتظهر في بداية متجرك للعملاء
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Banner Display */}
                {(storeSettings as any)?.bannerUrl && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-theme-primary mb-2 block">
                      الصورة الحالية:
                    </Label>
                    <div className="relative w-full max-w-md">
                      <img 
                        src={(storeSettings as any).bannerUrl} 
                        alt="صورة المتجر الحالية"
                        className="w-full h-32 object-cover rounded-lg border theme-border"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Section */}
                <div>
                  <Label htmlFor="banner-upload" className="text-sm font-medium text-theme-primary mb-2 block">
                    رفع صورة جديدة:
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="theme-border"
                    />
                    <Button
                      variant="outline"
                      disabled={uploadingImage}
                      className="border-theme-primary text-theme-primary hover:bg-theme-primary-light"
                      onClick={() => document.getElementById('banner-upload')?.click()}
                    >
                      {uploadingImage ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          جاري الرفع...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          اختر صورة
                        </div>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    الأحجام المدعومة: JPG, PNG, GIF (الحد الأقصى: 5MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facebook Catalog Integration */}
          <Card className="mt-6 theme-border bg-theme-primary-lighter">
            <CardHeader>
              <CardTitle className="text-xl text-theme-primary flex items-center gap-2">
                <Facebook className="w-5 h-5" />
                ربط كتالوج بفيسبوك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Catalog URL Display */}
                <div>
                  <Label className="text-sm font-medium text-theme-primary mb-2 block">
                    رابط كتالوج المنتجات:
                  </Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border theme-border">
                    <code className="flex-1 text-sm text-gray-700 dark:text-gray-300 break-all">
                      {`https://sanadi.pro/facebook-catalog/${platformSession?.platformId}.csv`}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://sanadi.pro/facebook-catalog/${platformSession?.platformId}.csv`);
                        toast({
                          title: "تم النسخ",
                          description: "تم نسخ رابط الكتالوج بنجاح",
                        });
                      }}
                      className="border-theme-primary text-theme-primary hover:bg-theme-primary-light"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    كيفية ربط الكتالوج بفيسبوك:
                  </h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>انسخ الرابط أعلاه</li>
                    <li>اذهب إلى Facebook Business Manager</li>
                    <li>اختر Commerce Manager → Catalog</li>
                    <li>أضف Data Feed جديد</li>
                    <li>الصق الرابط واختر التحديث اليومي</li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.open('https://business.facebook.com/products/catalogs/new', '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    فتح Facebook Business Manager
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://sanadi.pro/facebook-catalog/${platformSession?.platformId}.csv`, '_blank')}
                    className="border-theme-primary text-theme-primary hover:bg-theme-primary-light flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    معاينة الكتالوج
                  </Button>
                </div>

                {/* Benefits */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    فوائد ربط الكتالوج:
                  </h4>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>• إنشاء إعلانات ديناميكية للمنتجات</li>
                    <li>• استهداف العملاء الذين زاروا منتجاتك</li>
                    <li>• عرض المنتجات في Facebook Shop</li>
                    <li>• تفعيل التسوق في Instagram</li>
                    <li>• ربط كتالوج WhatsApp Business</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card className="mt-6 theme-border bg-theme-primary-lighter">
            <CardHeader>
              <CardTitle className="text-xl text-theme-primary">
                إعدادات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600 dark:text-gray-400">
                <p className="mb-2">• يمكنك تغيير شكل المتجر في أي وقت</p>
                <p className="mb-2">• التغييرات تطبق فوراً على متجر العملاء</p>
                <p className="mb-2">• صورة المتجر تظهر في أعلى الصفحة للعملاء</p>
                <p>• جميع النماذج محسنة للهواتف المحمولة</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}