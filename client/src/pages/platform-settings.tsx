import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Settings, Facebook, Smartphone, Chrome, ArrowRight, HelpCircle } from "lucide-react";
import { SiTiktok, SiSnapchat, SiGoogleads } from "react-icons/si";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import PlatformInstructionImage from "@/components/PlatformInstructionImage";

// Import images
import facebookPixelImg from "@assets/image_1755321112335.png";
import facebookAccessTokenImg from "@assets/image_1755318095758.png";
import tiktokPixelImg from "@assets/image_1755139734449.png";
import tiktokAccessTokenImg from "@assets/image_1755141605112.png";
import snapchatPixelImg from "@assets/image_1755147393825.png";
import snapchatAccessTokenImg from "@assets/image_1755147480368.png";
import googleAnalyticsImg from "@assets/image_1755150591275.png";
import googleAdsCustomerImg from "@assets/image_1755186700995.png";
import googleAdsAccessImg from "@assets/image_1755189566401.png";
import googleRefreshImg from "@assets/image_1755252636921.png";

// Interfaces
interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
}

interface AdPlatformSettings {
  facebookPixelId?: string;
  facebookAccessToken?: string;
  tiktokPixelId?: string;
  tiktokAccessToken?: string;
  snapchatPixelId?: string;
  snapchatAccessToken?: string;
  googleAnalyticsId?: string;
  googleAdsCustomerId?: string;
  googleAdsAccessToken?: string;
  googleAdsRefreshToken?: string;
}

// Schema for ad platform settings
const adPlatformSettingsSchema = z.object({
  // Facebook/Meta settings
  facebookPixelId: z.string().optional(),
  facebookAccessToken: z.string().optional(), 
  
  // TikTok settings
  tiktokPixelId: z.string().optional(),
  tiktokAccessToken: z.string().optional(),
  
  // Snapchat settings  
  snapchatPixelId: z.string().optional(),
  snapchatAccessToken: z.string().optional(),
  
  // Google settings
  googleAnalyticsId: z.string().optional(),
  googleAdsCustomerId: z.string().optional(),
  googleAdsAccessToken: z.string().optional(),
  googleAdsRefreshToken: z.string().optional(),
});

type AdPlatformSettingsFormData = z.infer<typeof adPlatformSettingsSchema>;

export default function PlatformSettings() {
  const [activeTab, setActiveTab] = useState("facebook");
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
  }) as { data: PlatformSession | undefined };

  // Get ad platform settings
  const { data: adPlatformSettings, isLoading } = useQuery({
    queryKey: [`/api/platforms/${session?.platformId}/ad-platform-settings`],
    enabled: !!session?.platformId,
  }) as { data: AdPlatformSettings | undefined, isLoading: boolean };

  // Form setup
  const form = useForm<AdPlatformSettingsFormData>({
    resolver: zodResolver(adPlatformSettingsSchema),
    defaultValues: {
      facebookPixelId: "",
      facebookAccessToken: "",
      tiktokPixelId: "",
      tiktokAccessToken: "",
      snapchatPixelId: "",
      snapchatAccessToken: "",
      googleAnalyticsId: "",
      googleAdsCustomerId: "",
      googleAdsAccessToken: "",
      googleAdsRefreshToken: "",
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (adPlatformSettings) {
      form.reset({
        facebookPixelId: adPlatformSettings.facebookPixelId || "",
        facebookAccessToken: adPlatformSettings.facebookAccessToken || "",
        tiktokPixelId: adPlatformSettings.tiktokPixelId || "",
        tiktokAccessToken: adPlatformSettings.tiktokAccessToken || "",
        snapchatPixelId: adPlatformSettings.snapchatPixelId || "",
        snapchatAccessToken: adPlatformSettings.snapchatAccessToken || "",
        googleAnalyticsId: adPlatformSettings.googleAnalyticsId || "",
        googleAdsCustomerId: adPlatformSettings.googleAdsCustomerId || "",
        googleAdsAccessToken: adPlatformSettings.googleAdsAccessToken || "",
        googleAdsRefreshToken: adPlatformSettings.googleAdsRefreshToken || "",
      });
    }
  }, [adPlatformSettings, form]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: AdPlatformSettingsFormData) => {
      const subdomain = session?.subdomain || window.location.hostname.split('.')[0];
      return apiRequest(`/api/platforms/${session?.platformId}/ad-platform-settings?subdomain=${subdomain}`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات المنصات الإعلانية بنجاح",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/platforms/${session?.platformId}/ad-platform-settings`] 
      });
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

  const onSubmit = (data: AdPlatformSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-theme-primary-lighter" dir="rtl">
        <div className="text-lg text-theme-text">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary-lighter flex relative" dir="rtl">
      <PlatformSidebar 
        session={session as PlatformSession} 
        currentPath="/platform-settings" 
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
              <h1 className="text-lg font-bold text-theme-text">إعدادات المنصة</h1>
              <p className="text-xs text-theme-text-secondary mt-1">إدارة إعدادات المنصة والبكسلات الإعلانية</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 relative z-10">
          {/* Instructions Banner */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">دليل الإعدادات</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  اضغط على أيقونة المساعدة (؟) بجوار كل حقل لرؤية صور توضيحية تُظهر مكان العثور على هذه المعلومات في المنصات الحقيقية
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8 bg-theme-primary-lighter theme-border">
                  <TabsTrigger 
                    value="facebook" 
                    className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white"
                  >
                    <Facebook className="h-4 w-4" />
                    فيسبوك
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tiktok" 
                    className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white"
                  >
                    <SiTiktok className="h-4 w-4" />
                    تيك توك
                  </TabsTrigger>
                  <TabsTrigger 
                    value="snapchat" 
                    className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white"
                  >
                    <SiSnapchat className="h-4 w-4" />
                    سناب شات
                  </TabsTrigger>
                  <TabsTrigger 
                    value="google" 
                    className="flex items-center gap-2 data-[state=active]:bg-theme-gradient data-[state=active]:text-white"
                  >
                    <SiGoogleads className="h-4 w-4" />
                    جوجل
                  </TabsTrigger>
                </TabsList>

                {/* Facebook Tab */}
                <TabsContent value="facebook">
                  <Card className="bg-theme-primary-lighter theme-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-theme-text">
                        <Facebook className="h-5 w-5 text-theme-accent" />
                        إعدادات فيسبوك / ميتا
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="facebookPixelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                معرف البكسل (Pixel ID)
                              </div>
                              <PlatformInstructionImage
                                imageSrc={facebookPixelImg}
                                altText="موقع معرف البكسل في فيسبوك"
                                title="كيفية العثور على معرف البكسل في فيسبوك"
                                description="انتقل إلى إدارة الأعمال → أدوات البيانات → بكسل، ثم انسخ المعرف المعروض"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="123456789012345"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              معرف بكسل فيسبوك للتتبع والتحليل - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="facebookAccessToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                رمز الوصول (Access Token)
                              </div>
                              <PlatformInstructionImage
                                imageSrc={facebookAccessTokenImg}
                                altText="موقع رمز الوصول في فيسبوك"
                                title="كيفية الحصول على رمز الوصول من فيسبوك"
                                description="انتقل إلى أدوات المطورين → إعدادات التطبيق → الأساسيات، ثم احصل على رمز الوصول"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="EAAxxxxxxxxxx"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              رمز الوصول لواجهة برمجة التطبيقات - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TikTok Tab */}
                <TabsContent value="tiktok">
                  <Card className="bg-theme-primary-lighter theme-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-theme-text">
                        <SiTiktok className="h-5 w-5 text-theme-accent" />
                        إعدادات تيك توك
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="tiktokPixelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                معرف البكسل (Pixel ID)
                              </div>
                              <PlatformInstructionImage
                                imageSrc={tiktokPixelImg}
                                altText="موقع معرف البكسل في تيك توك"
                                title="كيفية العثور على معرف البكسل في تيك توك"
                                description="انتقل إلى TikTok Business Manager → الأحداث → إدارة البكسل، ثم انسخ معرف البكسل"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="C4xxxxxxxxxxxxxxxxx"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              معرف بكسل تيك توك للتتبع والتحليل - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tiktokAccessToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                رمز الوصول (Access Token)
                              </div>
                              <PlatformInstructionImage
                                imageSrc={tiktokAccessTokenImg}
                                altText="موقع رمز الوصول في تيك توك"
                                title="كيفية الحصول على رمز الوصول من تيك توك"
                                description="انتقل إلى TikTok for Business → Developer Tools → Marketing API، ثم احصل على رمز الوصول"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="xxxxxxxxxxxxxxxxx"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              رمز الوصول لواجهة برمجة تطبيقات تيك توك - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Snapchat Tab */}
                <TabsContent value="snapchat">
                  <Card className="bg-theme-primary-lighter theme-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-theme-text">
                        <SiSnapchat className="h-5 w-5 text-theme-accent" />
                        إعدادات سناب شات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="snapchatPixelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                معرف البكسل (Pixel ID)
                              </div>
                              <PlatformInstructionImage
                                imageSrc={snapchatPixelImg}
                                altText="موقع معرف البكسل في سناب شات"
                                title="كيفية العثور على معرف البكسل في سناب شات"
                                description="انتقل إلى Snapchat Ads Manager → إعدادات البكسل → أحداث التحويل، ثم انسخ معرف البكسل"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="xxxx-xxxx-xxxx-xxxx"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              معرف بكسل سناب شات للتتبع والتحليل - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="snapchatAccessToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                رمز الوصول (Access Token)
                              </div>
                              <PlatformInstructionImage
                                imageSrc={snapchatAccessTokenImg}
                                altText="موقع رمز الوصول في سناب شات"
                                title="كيفية الحصول على رمز الوصول من سناب شات"
                                description="انتقل إلى Business Manager → API Tools → Generate Token، ثم احصل على رمز الوصول"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="xxxxxxxxxxxxxxxxx"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              رمز الوصول لواجهة برمجة تطبيقات سناب شات - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Google Tab */}
                <TabsContent value="google">
                  <Card className="bg-theme-primary-lighter theme-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-theme-text">
                        <SiGoogleads className="h-5 w-5 text-theme-accent" />
                        إعدادات جوجل
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="googleAnalyticsId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                معرف جوجل أناليتكس (GA4)
                              </div>
                              <PlatformInstructionImage
                                imageSrc={googleAnalyticsImg}
                                altText="موقع معرف جوجل أناليتكس"
                                title="كيفية العثور على معرف جوجل أناليتكس"
                                description="انتقل إلى Google Analytics → Admin → Property Settings، ثم انسخ Measurement ID"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="G-XXXXXXXXXX"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              معرف جوجل أناليتكس للتتبع والتحليل - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="googleAdsCustomerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                معرف عميل جوجل أدز
                              </div>
                              <PlatformInstructionImage
                                imageSrc={googleAdsCustomerImg}
                                altText="موقع معرف العميل في جوجل أدز"
                                title="كيفية العثور على معرف العميل في جوجل أدز"
                                description="انتقل إلى Google Ads → Account Settings → Account Information، ثم انسخ Customer ID"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="1234567890"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              معرف حساب العميل في جوجل أدز - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="googleAdsAccessToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                رمز الوصول (Access Token)
                              </div>
                              <PlatformInstructionImage
                                imageSrc={googleAdsAccessImg}
                                altText="موقع رمز الوصول في جوجل أدز"
                                title="كيفية الحصول على رمز الوصول من جوجل أدز"
                                description="انتقل إلى Google Cloud Console → APIs & Services → Credentials، ثم احصل على OAuth 2.0 Access Token"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="ya29.xxxxxxxxxx"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              رمز الوصول لواجهة برمجة تطبيقات جوجل أدز - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="googleAdsRefreshToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between text-theme-text">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                رمز التحديث (Refresh Token)
                              </div>
                              <PlatformInstructionImage
                                imageSrc={googleRefreshImg}
                                altText="موقع رمز التحديث في جوجل"
                                title="كيفية الحصول على رمز التحديث من جوجل"
                                description="هذا الرمز يتم الحصول عليه مع رمز الوصول من OAuth 2.0 flow في Google Cloud Console"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="1//xxxxxxxxxx"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormDescription className="text-theme-text-secondary text-xs">
                              رمز التحديث لتجديد رمز الوصول تلقائياً - اضغط على علامة الاستفهام لمعرفة مكانه
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Save Button */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="bg-theme-gradient text-white theme-shadow"
                >
                  {updateSettingsMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}