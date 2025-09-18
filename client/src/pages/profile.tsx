import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User, Lock, Bell, Shield, Upload, Building } from "lucide-react";
import PlatformSidebar from "@/components/PlatformSidebar";
import { LogoUploader } from "@/components/UniversalFileUploader";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
}

// Schema for basic profile update
const profileSchema = z.object({
  platformName: z.string().min(1, "اسم المنصة مطلوب"),
  subdomain: z.string().min(3, "النطاق الفرعي يجب أن يكون 3 أحرف على الأقل"),
  description: z.string().optional(),
  contactEmail: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

// Schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Profile() {
  const [activeTab, setActiveTab] = useState("profile");
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
  });

  // Type the session data
  const platformSession = session as PlatformSession | undefined;

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      platformName: platformSession?.platformName || "",
      subdomain: platformSession?.subdomain || "",
      description: platformSession?.description || "",
      contactEmail: platformSession?.contactEmail || "",
      contactPhone: platformSession?.contactPhone || "",
      whatsappNumber: platformSession?.whatsappNumber || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest(`/api/platforms/${platformSession?.platformId}/profile`, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الملف الشخصي بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-session"] });
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مخول",
          description: "تم تسجيل الخروج. جاري تسجيل الدخول مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/platform-login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ",
        description: `فشل في تحديث الملف الشخصي: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      return apiRequest(`/api/platforms/${platformSession?.platformId}/change-password`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مخول",
          description: "تم تسجيل الخروج. جاري تسجيل الدخول مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/platform-login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ",
        description: "فشل في تغيير كلمة المرور. تأكد من كلمة المرور الحالية",
        variant: "destructive",
      });
    },
  });

  // Logo update mutation
  const updateLogoMutation = useMutation({
    mutationFn: async (logoURL: string) => {
      return apiRequest(`/api/platforms/${platformSession?.platformId}/logo`, "PUT", { logoURL });
    },
    onSuccess: (updatedPlatform) => {
      toast({
        title: "تم تحديث الشعار",
        description: "تم رفع الشعار الجديد بنجاح",
      });
      // Invalidate and refetch session data to update the UI
      queryClient.invalidateQueries({ queryKey: ["/api/platform-session"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مصرح",
          description: "تم تسجيل الخروج. جاري تسجيل الدخول مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/platform-login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ في رفع الشعار",
        description: error.message || "حدث خطأ أثناء رفع الشعار",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  // Update form defaults when session loads
  if (platformSession && platformSession.platformName && !profileForm.getValues().platformName) {
    profileForm.reset({
      platformName: platformSession.platformName || "",
      subdomain: platformSession.subdomain || "",
      description: platformSession.description || "",
      contactEmail: platformSession.contactEmail || "",
      contactPhone: platformSession.contactPhone || "",
      whatsappNumber: platformSession.whatsappNumber || "",
    });
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
        <div className="text-lg">جاري تحميل بيانات الملف الشخصي...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary-lighter flex relative" dir="rtl">
      <PlatformSidebar 
        session={platformSession || {} as PlatformSession} 
        currentPath="/profile" 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'md:mr-16' : 'md:mr-64'
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
              <h1 className="text-lg font-bold text-theme-text">الملف الشخصي</h1>
              <p className="text-xs text-theme-text-secondary mt-1">إدارة بيانات المنصة وكلمة المرور</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 relative z-10">

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-theme-primary-lighter theme-border">
                <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white">
                  <User className="h-4 w-4" />
                  المعلومات الأساسية
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white">
                  <Lock className="h-4 w-4" />
                  الأمان
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="grid gap-6">
                  <Card className="bg-theme-primary-lighter theme-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-theme-text">
                        <User className="h-5 w-5 text-theme-accent" />
                        معلومات المنصة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Logo Upload Section - Outside Form */}
                      <div className="mb-6 p-4 bg-theme-primary-lighter rounded-lg theme-border border-2 border-dashed">
                        <div className="text-center">
                          <h4 className="text-lg font-semibold mb-3 text-theme-text">شعار المنصة</h4>
                          
                          {/* Current Logo Display */}
                          {platformSession?.logoUrl ? (
                            <div className="mb-4">
                              <img
                                src={platformSession.logoUrl}
                                alt="شعار المنصة"
                                className="w-24 h-24 object-contain mx-auto rounded-lg theme-border bg-theme-primary-lighter p-2"
                              />
                              <p className="text-sm text-theme-text-secondary mt-2">الشعار الحالي</p>
                            </div>
                          ) : (
                            <div className="mb-4">
                              <div className="w-24 h-24 bg-theme-primary-lighter rounded-lg flex items-center justify-center mx-auto theme-border">
                                <Building className="h-8 w-8 text-theme-text-secondary" />
                              </div>
                              <p className="text-sm text-theme-text-secondary mt-2">لا يوجد شعار</p>
                            </div>
                          )}

                          {/* Upload Logo Button */}
                          <LogoUploader
                            maxNumberOfFiles={1}
                            maxFileSize={2097152} // 2MB
                            onComplete={(files) => {
                              if (files && files.length > 0) {
                                const uploadedFile = files[0];
                                updateLogoMutation.mutate(uploadedFile.url);
                              }
                            }}
                            buttonClassName="bg-theme-gradient text-white theme-shadow"
                          >
                            <Upload className="h-4 w-4 ml-2" />
                            {platformSession?.logoUrl ? "تغيير الشعار" : "رفع شعار"}
                          </LogoUploader>
                          
                          <p className="text-xs text-theme-text-secondary mt-2">
                            يُفضل أن يكون الشعار مربع الشكل، حد أقصى 2MB
                          </p>
                        </div>
                      </div>

                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="platformName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-theme-text">اسم المنصة *</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="اسم منصتك التجارية"
                                      className="text-right theme-input"
                                      dir="rtl"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="subdomain"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-theme-text">النطاق الفرعي *</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        {...field}
                                        placeholder="yourstore"
                                        className="text-left theme-input"
                                        dir="ltr"
                                      />
                                      <span className="text-theme-text-secondary text-sm">.sanadi.pro</span>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-theme-text">وصف المنصة</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="وصف قصير عن منصتك التجارية..."
                                    className="text-right min-h-[100px] theme-input"
                                    dir="rtl"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="contactEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-theme-text">البريد الإلكتروني</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="contact@yourstore.com"
                                    className="text-left theme-input"
                                    dir="ltr"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="contactPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-theme-text">رقم الهاتف</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="+964 771 234 5678"
                                      className="text-left theme-input"
                                      dir="ltr"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="whatsappNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-theme-text">رقم الواتساب</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="+964 771 234 5678"
                                      className="text-left theme-input"
                                      dir="ltr"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={updateProfileMutation.isPending}
                              className="bg-theme-gradient text-white theme-shadow"
                            >
                              {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <div className="grid gap-6">
                  <Card className="bg-theme-primary-lighter theme-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-theme-text">
                        <Lock className="h-5 w-5 text-theme-accent" />
                        تغيير كلمة المرور
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-theme-text">كلمة المرور الحالية *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="أدخل كلمة المرور الحالية"
                                    className="text-left theme-input"
                                    dir="ltr"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-theme-text">كلمة المرور الجديدة *</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="password"
                                      placeholder="كلمة مرور جديدة (6 أحرف على الأقل)"
                                      className="text-left theme-input"
                                      dir="ltr"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={passwordForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-theme-text">تأكيد كلمة المرور *</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="password"
                                      placeholder="أعد كتابة كلمة المرور الجديدة"
                                      className="text-left theme-input"
                                      dir="ltr"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="bg-theme-primary-lighter theme-border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="h-4 w-4 text-theme-accent" />
                              <h4 className="font-medium text-theme-text">نصائح الأمان</h4>
                            </div>
                            <ul className="text-sm text-theme-text-secondary space-y-1">
                              <li>• استخدم كلمة مرور قوية تحتوي على أرقام وحروف</li>
                              <li>• لا تشارك كلمة المرور مع أي شخص آخر</li>
                              <li>• غيّر كلمة المرور بانتظام للحفاظ على الأمان</li>
                            </ul>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={changePasswordMutation.isPending}
                              className="bg-theme-gradient text-white theme-shadow"
                            >
                              {changePasswordMutation.isPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
                            </Button>
                          </div>
                        </form>
                      </Form>
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