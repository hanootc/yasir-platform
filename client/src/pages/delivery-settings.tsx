import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PlatformSidebar from "@/components/PlatformSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Truck, Clock, DollarSign, Package, Upload, X, Trash2 } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import ThemeToggle from '@/components/ThemeToggle';
import ColorThemeSelector from '@/components/ColorThemeSelector';
import { useLocation } from 'wouter';

interface DeliverySettings {
  companyName: string;
  companyPhone: string;
  reportsPhone: string;
  companyLogo: string;
  deliveryPriceBaghdad: number;
  deliveryPriceProvinces: number;
  freeDeliveryThreshold: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  isActive: boolean;
  allowCashOnDelivery: boolean;
  allowOnlinePayment: boolean;
  deliveryNotes: string;
  specialInstructions: string;
}

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

export default function DeliverySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DeliverySettings>({
    companyName: "",
    companyPhone: "",
    reportsPhone: "",
    companyLogo: "",
    deliveryPriceBaghdad: 0,
    deliveryPriceProvinces: 0,
    freeDeliveryThreshold: 0,
    deliveryTimeMin: 24,
    deliveryTimeMax: 72,
    isActive: true,
    allowCashOnDelivery: true,
    allowOnlinePayment: false,
    deliveryNotes: "",
    specialInstructions: ""
  });

  // جلب بيانات جلسة المنصة
  const { data: session } = useQuery<PlatformSession>({
    queryKey: ['/api/platform-session'],
  });

  // جلب إعدادات التوصيل الحالية
  const { data: deliverySettings, isLoading } = useQuery<DeliverySettings>({
    queryKey: ["/api/delivery/settings"],
  });

  // حفظ الإعدادات
  const saveSettingsMutation = useMutation({
    mutationFn: (data: DeliverySettings) => {
      console.log('🚚 Mutation function called with data:', data);
      const subdomain = session?.subdomain || window.location.hostname.split('.')[0];
      return apiRequest(`/api/delivery/settings?subdomain=${subdomain}`, "POST", data);
    },
    onSuccess: (result) => {
      console.log('🚚 Mutation success:', result);
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات التوصيل بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/settings"] });
      setShowForm(false); // إخفاء النموذج بعد الحفظ
    },
    onError: (error) => {
      console.error('🚚 Mutation error:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ إعدادات التوصيل",
        variant: "destructive",
      });
      console.error("Error saving delivery settings:", error);
    }
  });

  // حذف شركة التوصيل
  const deleteDeliveryCompanyMutation = useMutation({
    mutationFn: () => {
      const subdomain = session?.subdomain || window.location.hostname.split('.')[0];
      return apiRequest(`/api/delivery/settings?subdomain=${subdomain}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف شركة التوصيل بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/settings"] });
      setShowForm(true); // عرض النموذج لإضافة شركة جديدة
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف شركة التوصيل",
        variant: "destructive",
      });
      console.error("Error deleting delivery company:", error);
    }
  });

  const handleInputChange = (field: keyof DeliverySettings, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚚 Form submitted - handleSubmit called');
    console.log('🚚 Form data:', formData);
    
    let updatedFormData = { ...formData };
    
    // رفع الشعار إذا تم اختيار ملف جديد
    if (logoFile) {
      try {
        console.log('🚚 Uploading logo...');
        const logoPath = await uploadLogo(logoFile);
        updatedFormData.companyLogo = logoPath;
        console.log('🚚 Logo uploaded:', logoPath);
      } catch (error) {
        console.error('🚚 Logo upload error:', error);
        toast({
          title: "خطأ في رفع الشعار",
          description: "فشل في رفع صورة الشعار",
          variant: "destructive",
        });
        return;
      }
    }
    
    console.log('🚚 Calling mutation with data:', updatedFormData);
    saveSettingsMutation.mutate(updatedFormData);
  };

  // دالة تفعيل/إيقاف الخدمة
  const toggleServiceStatus = () => {
    if (!deliverySettings) return;
    
    const updatedSettings: DeliverySettings = {
      ...deliverySettings,
      isActive: !deliverySettings.isActive
    };
    
    saveSettingsMutation.mutate(updatedSettings);
  };

  // تحديث البيانات عند تحميل الإعدادات
  useEffect(() => {
    if (deliverySettings) {
      setFormData(deliverySettings);
      if (deliverySettings.companyLogo) {
        setLogoPreview(deliverySettings.companyLogo);
      }
      // إذا كان لدينا إعدادات محفوظة وليس لدينا اسم شركة، عرض النموذج
      if (!deliverySettings.companyName) {
        setShowForm(true);
      } else {
        setShowForm(false); // إخفاء النموذج إذا كانت البيانات موجودة
      }
    } else {
      // إذا لم تكن هناك إعدادات، عرض النموذج
      setShowForm(true);
    }
  }, [deliverySettings]);

  // وظائف رفع الشعار
  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار ملف صورة فقط",
          variant: "destructive",
        });
      }
    }
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview("");
    setFormData(prev => ({ ...prev, companyLogo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload/local-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('فشل في رفع الصورة');
    }

    const result = await response.json();
    return result.imageUrl;
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-theme-gradient rounded-lg text-white">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">إعدادات التوصيل</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">إدارة شركة التوصيل والخدمات المقدمة للعملاء</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-theme-primary" />
            </div>
          ) : showForm ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* معلومات الشركة */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Package className="h-5 w-5" />
                    معلومات شركة التوصيل
                  </CardTitle>
                  <CardDescription>
                    معلومات الشركة المسؤولة عن التوصيل
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-right">
                          اسم الشركة *
                        </Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          placeholder="مثال: شركة التوصيل السريع"
                          className="text-right"
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="companyPhone" className="text-right">
                          رقم هاتف الشركة
                        </Label>
                        <Input
                          id="companyPhone"
                          value={formData.companyPhone}
                          onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                          placeholder="07########"
                          className="text-right"
                          dir="rtl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reportsPhone" className="text-right">
                          رقم البلاغات الذي سيبلغ المندوب عليها
                        </Label>
                        <Input
                          id="reportsPhone"
                          value={formData.reportsPhone}
                          onChange={(e) => handleInputChange('reportsPhone', e.target.value)}
                          placeholder="07########"
                          className="text-right"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-right">شعار الشركة</Label>
                      <div className="space-y-4">
                        {logoPreview ? (
                          <div className="flex justify-center">
                            <div className="relative inline-block">
                              <img 
                                src={logoPreview}
                                alt="شعار الشركة"
                                className="max-w-48 max-h-48 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-md"
                                style={{ width: 'auto', height: 'auto' }}
                              />
                              <button
                                type="button"
                                onClick={handleLogoRemove}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-sm text-gray-500">لا يوجد شعار محمل</p>
                          </div>
                        )}
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoSelect}
                          className="hidden"
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 ml-2" />
                          {logoPreview ? "تغيير الشعار" : "اختيار شعار"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* إعدادات التكلفة والوقت */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <DollarSign className="h-5 w-5" />
                    تكلفة ووقت التوصيل
                  </CardTitle>
                  <CardDescription>
                    إعداد تكاليف وأوقات التوصيل المختلفة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryPriceBaghdad" className="text-right">
                        تكلفة التوصيل - بغداد (دينار عراقي)
                      </Label>
                      <Input
                        id="deliveryPriceBaghdad"
                        type="number"
                        min="0"
                        step="500"
                        value={isNaN(formData.deliveryPriceBaghdad) ? '' : Math.round(formData.deliveryPriceBaghdad)}
                        onChange={(e) => handleInputChange('deliveryPriceBaghdad', e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="3000"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryPriceProvinces" className="text-right">
                        تكلفة التوصيل - المحافظات (دينار عراقي)
                      </Label>
                      <Input
                        id="deliveryPriceProvinces"
                        type="number"
                        min="0"
                        step="500"
                        value={isNaN(formData.deliveryPriceProvinces) ? '' : Math.round(formData.deliveryPriceProvinces)}
                        onChange={(e) => handleInputChange('deliveryPriceProvinces', e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="5000"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="freeDeliveryThreshold" className="text-right">
                        الحد الأدنى للتوصيل المجاني (دينار عراقي)
                      </Label>
                      <Input
                        id="freeDeliveryThreshold"
                        type="number"
                        min="0"
                        step="1000"
                        value={isNaN(formData.freeDeliveryThreshold) ? '' : Math.round(formData.freeDeliveryThreshold)}
                        onChange={(e) => handleInputChange('freeDeliveryThreshold', e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="50000"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryTimeMin" className="text-right flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        أقل وقت توصيل (بالساعات)
                      </Label>
                      <Input
                        id="deliveryTimeMin"
                        type="number"
                        min="1"
                        value={isNaN(formData.deliveryTimeMin) ? '' : formData.deliveryTimeMin}
                        onChange={(e) => handleInputChange('deliveryTimeMin', e.target.value === '' ? 24 : Number(e.target.value))}
                        placeholder="24"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryTimeMax" className="text-right flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        أكثر وقت توصيل (بالساعات)
                      </Label>
                      <Input
                        id="deliveryTimeMax"
                        type="number"
                        min="1"
                        value={isNaN(formData.deliveryTimeMax) ? '' : formData.deliveryTimeMax}
                        onChange={(e) => handleInputChange('deliveryTimeMax', e.target.value === '' ? 72 : Number(e.target.value))}
                        placeholder="72"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* خيارات الدفع والتفعيل */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    خيارات الدفع والتفعيل
                  </CardTitle>
                  <CardDescription>
                    إعدادات طرق الدفع المتاحة وحالة الخدمة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">تفعيل خدمة التوصيل</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        تفعيل أو إلغاء تفعيل خدمة التوصيل للعملاء
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">السماح بالدفع عند الاستلام</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        السماح للعملاء بالدفع عند استلام الطلب
                      </p>
                    </div>
                    <Switch
                      checked={formData.allowCashOnDelivery}
                      onCheckedChange={(checked) => handleInputChange('allowCashOnDelivery', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">السماح بالدفع الإلكتروني</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        السماح للعملاء بالدفع الإلكتروني قبل التوصيل
                      </p>
                    </div>
                    <Switch
                      checked={formData.allowOnlinePayment}
                      onCheckedChange={(checked) => handleInputChange('allowOnlinePayment', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ملاحظات إضافية */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    ملاحظات وتعليمات إضافية
                  </CardTitle>
                  <CardDescription>
                    إضافة معلومات إضافية حول خدمة التوصيل
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryNotes" className="text-right">
                      ملاحظات التوصيل
                    </Label>
                    <Textarea
                      id="deliveryNotes"
                      value={formData.deliveryNotes}
                      onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
                      placeholder="ملاحظات عامة حول خدمة التوصيل..."
                      className="text-right min-h-[100px]"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialInstructions" className="text-right">
                      تعليمات خاصة
                    </Label>
                    <Textarea
                      id="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                      placeholder="تعليمات خاصة للتوصيل أو معلومات إضافية..."
                      className="text-right min-h-[100px]"
                      dir="rtl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="px-8"
                >
                  <i className="fas fa-times ml-2 h-4 w-4"></i>
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={saveSettingsMutation.isPending}
                  className="bg-theme-gradient hover:opacity-90 text-white px-8"
                  onClick={(e) => {
                    console.log('🚚 Save button clicked!');
                    // Let the form handle the submission naturally
                  }}
                >
                  {saveSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Truck className="ml-2 h-4 w-4" />
                      حفظ الإعدادات
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* زر إضافة شركة توصيل */}
              <div className="text-center">
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-theme-gradient hover:opacity-90 text-white px-8"
                >
                  <Truck className="ml-2 h-4 w-4" />
                  إضافة شركة توصيل
                </Button>
              </div>

              {/* بطاقة عرض المعلومات */}
              {deliverySettings && (
                <div className="space-y-4">
                  {/* زر التفعيل خارج البطاقة */}
                  <div className="flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${deliverySettings.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        حالة الخدمة: {deliverySettings.isActive ? 'مفعلة' : 'معطلة'}
                      </span>
                    </div>
                    <Button
                      onClick={toggleServiceStatus}
                      disabled={saveSettingsMutation.isPending}
                      className={`${
                        deliverySettings.isActive 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-theme-gradient hover:opacity-90'
                      } text-white px-4 py-2`}
                      size="sm"
                    >
                      {saveSettingsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <i className={`fas ${deliverySettings.isActive ? 'fa-pause' : 'fa-play'} ml-2 h-4 w-4`}></i>
                          {deliverySettings.isActive ? 'إيقاف الخدمة' : 'تفعيل الخدمة'}
                        </>
                      )}
                    </Button>
                  </div>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowForm(true)}
                        className="bg-theme-gradient hover:opacity-90 text-white px-3 py-1.5 text-sm"
                        size="sm"
                      >
                        <i className="fas fa-edit ml-1 h-3 w-3"></i>
                        تعديل
                      </Button>
                      <Button
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف شركة التوصيل؟ سيتم حذف جميع الإعدادات المرتبطة بها.')) {
                            deleteDeliveryCompanyMutation.mutate();
                          }
                        }}
                        disabled={deleteDeliveryCompanyMutation.isPending}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 text-sm"
                        size="sm"
                      >
                        {deleteDeliveryCompanyMutation.isPending ? (
                          <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="ml-1 h-3 w-3" />
                        )}
                        حذف
                      </Button>
                    </div>
                    <div className="text-right">
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                        <Package className="h-4 w-4" />
                        {deliverySettings.companyName}
                      </CardTitle>
                      <CardDescription className="text-right text-sm">
                        شركة التوصيل المفعلة حالياً
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-md">
                            <i className="fas fa-phone text-blue-600 dark:text-blue-400 text-xs"></i>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">رقم الهاتف</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {deliverySettings.companyPhone || 'غير محدد'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-red-100 dark:bg-red-900 rounded-md">
                            <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-xs"></i>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">رقم البلاغات</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {deliverySettings.reportsPhone || 'غير محدد'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                            <DollarSign className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">توصيل بغداد</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {Math.round(deliverySettings.deliveryPriceBaghdad).toLocaleString()} دينار
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-md">
                            <DollarSign className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">توصيل المحافظات</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {Math.round(deliverySettings.deliveryPriceProvinces).toLocaleString()} دينار
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-md">
                            <Clock className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">وقت التوصيل</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {deliverySettings.deliveryTimeMin} - {deliverySettings.deliveryTimeMax} ساعة
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-md">
                            <i className="fas fa-gift text-indigo-600 dark:text-indigo-400 text-xs"></i>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">التوصيل المجاني من</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {deliverySettings.freeDeliveryThreshold ? 
                                `${Math.round(deliverySettings.freeDeliveryThreshold).toLocaleString()} دينار` : 
                                'غير مفعل'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {deliverySettings.companyLogo && (
                      <div className="flex justify-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">شعار الشركة</p>
                          <img 
                            src={deliverySettings.companyLogo} 
                            alt="شعار الشركة" 
                            className="h-10 w-auto mx-auto rounded-md shadow-md"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${deliverySettings.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {deliverySettings.isActive ? 'مفعل' : 'غير مفعل'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        طرق الدفع: {deliverySettings.allowCashOnDelivery && 'الدفع عند الاستلام'} 
                        {deliverySettings.allowOnlinePayment && deliverySettings.allowCashOnDelivery && ' • '}
                        {deliverySettings.allowOnlinePayment && 'الدفع الإلكتروني'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}