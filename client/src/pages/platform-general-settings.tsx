import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Settings, Globe, Palette, Bell, Shield, User } from "lucide-react";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";

// Schema for platform settings
const platformGeneralSettingsSchema = z.object({
  // Platform Basic Info
  platformName: z.string().min(1, "اسم المنصة مطلوب"),
  platformDescription: z.string().optional(),
  
  // Contact Information
  contactEmail: z.string().email("بريد إلكتروني صحيح مطلوب").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  contactAddress: z.string().optional(),
  
  // Platform Settings
  isPublic: z.boolean().default(true),
  allowRegistration: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
  
  // Notification Settings
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  
});

type PlatformGeneralSettingsFormData = z.infer<typeof platformGeneralSettingsSchema>;

export default function PlatformGeneralSettings() {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const { toast } = useToast();

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // Get platform session
  const { data: session } = useQuery({
    queryKey: ["/api/platform-session"],
    retry: false,
  }) as { data?: any };

  // Get platform general settings
  const { data: platformSettings, isLoading } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/general-settings`],
    enabled: !!session?.platformId,
  }) as { data?: any, isLoading: boolean };

  // Form setup
  const form = useForm<PlatformGeneralSettingsFormData>({
    resolver: zodResolver(platformGeneralSettingsSchema),
    defaultValues: {
      platformName: "",
      platformDescription: "",
      contactEmail: "",
      contactPhone: "",
      whatsappNumber: "",
      contactAddress: "",
      isPublic: true,
      allowRegistration: true,
      maintenanceMode: false,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (platformSettings) {
      form.reset({
        platformName: platformSettings.platformName || "",
        platformDescription: platformSettings.platformDescription || "",
        contactEmail: platformSettings.contactEmail || "",
        contactPhone: platformSettings.contactPhone || "",
        whatsappNumber: platformSettings.whatsappNumber || "",
        contactAddress: platformSettings.contactAddress || "",
        isPublic: platformSettings.isPublic ?? true,
        allowRegistration: platformSettings.allowRegistration ?? true,
        maintenanceMode: platformSettings.maintenanceMode ?? false,
        emailNotifications: platformSettings.emailNotifications ?? true,
        smsNotifications: platformSettings.smsNotifications ?? false,
        pushNotifications: platformSettings.pushNotifications ?? true,
      });
    }
  }, [platformSettings, form]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: PlatformGeneralSettingsFormData) => {
      return apiRequest(`/api/platforms/${session?.platformId}/general-settings`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات المنصة بنجاح",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/platforms/${session?.platformId}/general-settings`]
      } as any);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مخول",
          description: "تم تسجيل الخروج. جاري تسجيل الدخول مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlatformGeneralSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (!session?.platformId) {
    return (
      <div className="flex items-center justify-center h-screen bg-theme-primary-lighter" dir="rtl">
        <div className="text-lg text-theme-text">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary-lighter flex relative" dir="rtl">
      <PlatformSidebar 
        session={session} 
        currentPath="/platform-general-settings" 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'
      }`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-4 shadow-sm">
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
              <h1 className="text-lg font-bold text-theme-text">إعدادات المنصة العامة</h1>
              <p className="text-xs text-theme-text-secondary mt-1">إدارة المعلومات الأساسية والإعدادات العامة للمنصة</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 relative z-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Platform Basic Information */}
              <Card className="bg-theme-primary-lighter theme-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-theme-text">
                    <Globe className="h-5 w-5 text-theme-accent" />
                    المعلومات الأساسية للمنصة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="platformName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-text">اسم المنصة</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="أدخل اسم المنصة"
                            className="theme-input"
                          />
                        </FormControl>
                        <FormDescription className="text-theme-text-secondary text-xs">
                          الاسم الرسمي للمنصة الذي سيظهر في جميع أنحاء النظام
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platformDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-text">وصف المنصة</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="أدخل وصفاً موجزاً عن المنصة"
                            className="theme-input"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription className="text-theme-text-secondary text-xs">
                          وصف مختصر عن نشاط المنصة وخدماتها
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="bg-theme-primary-lighter theme-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-theme-text">
                    <User className="h-5 w-5 text-theme-accent" />
                    معلومات التواصل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-text">البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="example@domain.com"
                            className="theme-input"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription className="text-theme-text-secondary text-xs">
                          البريد الإلكتروني الرسمي للمنصة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-text">رقم الهاتف</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="07XX XXX XXXX"
                            className="theme-input"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription className="text-theme-text-secondary text-xs">
                          رقم الهاتف الرسمي للمنصة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-text">رقم الواتساب</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="964XXXXXXXXX"
                            className="theme-input"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormDescription className="text-theme-text-secondary text-xs">
                          رقم الواتساب للمنصة (مع رمز الدولة بدون +)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-text">العنوان</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="أدخل العنوان الكامل للمنصة"
                            className="theme-input"
                            rows={2}
                          />
                        </FormControl>
                        <FormDescription className="text-theme-text-secondary text-xs">
                          العنوان الفيزيائي للمنصة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Platform Settings */}
              <Card className="bg-theme-primary-lighter theme-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-theme-text">
                    <Settings className="h-5 w-5 text-theme-accent" />
                    إعدادات المنصة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border theme-border p-4 bg-theme-primary-lighter hover:bg-theme-primary-light/50 transition-colors">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base font-medium text-theme-text">
                            منصة عامة
                          </FormLabel>
                          <FormDescription className="text-sm text-theme-text-secondary">
                            السماح للعامة بزيارة المنصة ومنتجاتها
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => field.onChange(!field.value)}
                              className={`
                                w-8 h-5 rounded-full transition-all duration-300 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-opacity-50
                                ${field.value ? 'bg-theme-gradient' : 'bg-gray-700 dark:bg-gray-600'}
                                cursor-pointer
                              `}
                            >
                              <span
                                className={`
                                  inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                  ${field.value ? 'left-4 bg-white' : 'left-0.5 bg-theme-primary'}
                                `}
                              />
                            </button>
                            <span className={`text-xs font-medium ${
                              field.value ? 'text-theme-primary' : 'text-theme-primary/60'
                            }`}>
                              {field.value ? 'نشط' : 'متوقف'}
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowRegistration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border theme-border p-4 bg-theme-primary-lighter hover:bg-theme-primary-light/50 transition-colors">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base font-medium text-theme-text">
                            السماح بالتسجيل
                          </FormLabel>
                          <FormDescription className="text-sm text-theme-text-secondary">
                            السماح للمستخدمين الجدد بإنشاء حسابات
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => field.onChange(!field.value)}
                              className={`
                                w-8 h-5 rounded-full transition-all duration-300 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-opacity-50
                                ${field.value ? 'bg-theme-gradient' : 'bg-gray-700 dark:bg-gray-600'}
                                cursor-pointer
                              `}
                            >
                              <span
                                className={`
                                  inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                  ${field.value ? 'left-4 bg-white' : 'left-0.5 bg-theme-primary'}
                                `}
                              />
                            </button>
                            <span className={`text-xs font-medium ${
                              field.value ? 'text-theme-primary' : 'text-theme-primary/60'
                            }`}>
                              {field.value ? 'نشط' : 'متوقف'}
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border theme-border p-4 bg-theme-primary-lighter hover:bg-theme-primary-light/50 transition-colors">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base font-medium text-theme-text">
                            وضع الصيانة
                          </FormLabel>
                          <FormDescription className="text-sm text-theme-text-secondary">
                            تفعيل وضع الصيانة وإخفاء المنصة مؤقتاً
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => field.onChange(!field.value)}
                              className={`
                                w-8 h-5 rounded-full transition-all duration-300 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
                                ${field.value ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gray-700 dark:bg-gray-600'}
                                cursor-pointer
                              `}
                            >
                              <span
                                className={`
                                  inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                  ${field.value ? 'left-4 bg-white' : 'left-0.5 bg-red-500'}
                                `}
                              />
                            </button>
                            <span className={`text-xs font-medium ${
                              field.value ? 'text-red-500' : 'text-theme-primary/60'
                            }`}>
                              {field.value ? 'نشط' : 'متوقف'}
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="bg-theme-primary-lighter theme-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-theme-text">
                    <Bell className="h-5 w-5 text-theme-accent" />
                    إعدادات التنبيهات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border theme-border p-4 bg-theme-primary-lighter hover:bg-theme-primary-light/50 transition-colors">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base font-medium text-theme-text">
                            التنبيهات عبر البريد الإلكتروني
                          </FormLabel>
                          <FormDescription className="text-sm text-theme-text-secondary">
                            استقبال تنبيهات الطلبات والأنشطة عبر البريد الإلكتروني
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => field.onChange(!field.value)}
                              className={`
                                w-8 h-5 rounded-full transition-all duration-300 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-opacity-50
                                ${field.value ? 'bg-theme-gradient' : 'bg-gray-700 dark:bg-gray-600'}
                                cursor-pointer
                              `}
                            >
                              <span
                                className={`
                                  inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                  ${field.value ? 'left-4 bg-white' : 'left-0.5 bg-theme-primary'}
                                `}
                              />
                            </button>
                            <span className={`text-xs font-medium ${
                              field.value ? 'text-theme-primary' : 'text-theme-primary/60'
                            }`}>
                              {field.value ? 'نشط' : 'متوقف'}
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smsNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border theme-border p-4 bg-theme-primary-lighter hover:bg-theme-primary-light/50 transition-colors">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base font-medium text-theme-text">
                            التنبيهات عبر الرسائل النصية
                          </FormLabel>
                          <FormDescription className="text-sm text-theme-text-secondary">
                            استقبال تنبيهات الطلبات المهمة عبر الرسائل النصية
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => field.onChange(!field.value)}
                              className={`
                                w-8 h-5 rounded-full transition-all duration-300 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-opacity-50
                                ${field.value ? 'bg-theme-gradient' : 'bg-gray-700 dark:bg-gray-600'}
                                cursor-pointer
                              `}
                            >
                              <span
                                className={`
                                  inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                  ${field.value ? 'left-4 bg-white' : 'left-0.5 bg-theme-primary'}
                                `}
                              />
                            </button>
                            <span className={`text-xs font-medium ${
                              field.value ? 'text-theme-primary' : 'text-theme-primary/60'
                            }`}>
                              {field.value ? 'نشط' : 'متوقف'}
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border theme-border p-4 bg-theme-primary-lighter hover:bg-theme-primary-light/50 transition-colors">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base font-medium text-theme-text">
                            التنبيهات الفورية
                          </FormLabel>
                          <FormDescription className="text-sm text-theme-text-secondary">
                            استقبال التنبيهات الفورية في المتصفح
                          </FormDescription>
                        </div>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => field.onChange(!field.value)}
                              className={`
                                w-8 h-5 rounded-full transition-all duration-300 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-opacity-50
                                ${field.value ? 'bg-theme-gradient' : 'bg-gray-700 dark:bg-gray-600'}
                                cursor-pointer
                              `}
                            >
                              <span
                                className={`
                                  inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-0.5 
                                  ${field.value ? 'left-4 bg-white' : 'left-0.5 bg-theme-primary'}
                                `}
                              />
                            </button>
                            <span className={`text-xs font-medium ${
                              field.value ? 'text-theme-primary' : 'text-theme-primary/60'
                            }`}>
                              {field.value ? 'نشط' : 'متوقف'}
                            </span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>


              {/* Save Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="theme-border hover:bg-theme-primary-light px-6"
                  onClick={() => window.location.reload()}
                >
                  إعادة تعيين
                </Button>
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="bg-theme-gradient hover:opacity-90 text-white theme-shadow px-8"
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Settings className="ml-2 h-4 w-4" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}