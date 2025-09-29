import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLocation } from "wouter";
import { X, TrendingUp, ExternalLink, Search, Filter, Eye, BarChart3, Users, DollarSign, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import ThemeToggle from "@/components/ThemeToggle";

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

export default function PlatformAdsMeta() {
  // تعيين عنوان الصفحة
  usePageTitle('إعلانات فيسبوك وإنستغرام');

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [isConnecting, setIsConnecting] = useState(false);

  // Get platform session
  const { data: session, isLoading: sessionLoading } = useQuery<PlatformSession>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // Get connection status
  const { data: connectionStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["/api/platform-ads/connection-status"],
    retry: false,
    enabled: !!session,
  });

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

  const handleConnectMeta = async () => {
    setIsConnecting(true);
    try {
      // استدعاء API للحصول على رابط التفويض
      const response = await fetch('/api/platform-ads/meta/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في الحصول على رابط التفويض');
      }
      
      const { authUrl } = await response.json();
      
      toast({
        title: "توجيهك لصفحة Meta",
        description: "يرجى منح الصلاحيات المطلوبة",
      });
      
      // توجيه المستخدم لصفحة التفويض
      const authWindow = window.open(authUrl, 'meta-auth', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      // الاستماع لرسائل من النافذة المنبثقة
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'meta-success') {
          toast({
            title: "تم الربط بنجاح",
            description: "تم ربط حساب Meta بنجاح",
          });
          refetchStatus();
          authWindow?.close();
        } else if (event.data.type === 'meta-error') {
          toast({
            title: "خطأ في الربط",
            description: event.data.error || "فشل في ربط الحساب",
            variant: "destructive",
          });
        }
        window.removeEventListener('message', handleMessage);
      };
      
      window.addEventListener('message', handleMessage);
      
    } catch (error: any) {
      toast({
        title: "خطأ في الربط",
        description: error?.message || "حدث خطأ أثناء ربط الحساب",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-primary-lighter">
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
        sidebarCollapsed ? 'mr-0 lg:mr-16' : 'mr-0 lg:mr-64'
      }`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
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
            <div className="text-right ml-auto">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <i className="fab fa-meta text-theme-primary"></i>
                ربط إعلانات Meta
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">اربط حسابك مع Meta Ads لإدارة حملات Facebook و Instagram</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            
            {/* Connection Status Card */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-3 text-theme-primary">
                  <i className="fas fa-link text-theme-primary"></i>
                  حالة الربط
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-theme-primary-light dark:bg-gray-800 rounded-lg gap-4">
                  <div className="text-center sm:text-right w-full sm:w-auto">
                    <h3 className="font-semibold text-theme-primary">Meta Business Manager</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">اربط حسابك لبدء إدارة إعلانات Facebook و Instagram</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {statusLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (connectionStatus as any)?.meta?.connected ? (
                      <Badge variant="secondary" className="bg-theme-gradient text-white">
                        مربوط ✓
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        غير مربوط
                      </Badge>
                    )}
                    {(connectionStatus as any)?.meta?.connected ? (
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button 
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/platform-ads/meta/disconnect', {
                                method: 'POST',
                              });
                              if (response.ok) {
                                toast({
                                  title: "تم فصل الاتصال",
                                  description: "تم فصل ربط حساب Meta بنجاح",
                                });
                                refetchStatus();
                              } else {
                                throw new Error('فشل في فصل الاتصال');
                              }
                            } catch (error) {
                              toast({
                                title: "خطأ",
                                description: "حدث خطأ في فصل الاتصال",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <X className="ml-1 h-4 w-4" />
                          فصل الاتصال
                        </Button>
                        <Button 
                          variant="outline" 
                          className="theme-border text-theme-primary w-full sm:w-auto"
                          onClick={() => {
                            window.location.href = '/platform-ads-meta-management';
                          }}
                        >
                          <TrendingUp className="ml-2 w-4 h-4" />
                          إدارة الحملات
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleConnectMeta}
                        disabled={isConnecting}
                        className="bg-theme-gradient hover:opacity-90 w-full sm:w-auto"
                      >
                        {isConnecting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                            جاري الربط...
                          </>
                        ) : (
                          <>
                            <i className="fab fa-meta ml-2"></i>
                            ربط الحساب
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Management - Only show if connected */}
            {(connectionStatus as any)?.meta?.connected && (
              <>
                <Card className="theme-border bg-theme-primary-lighter">
                  <CardHeader>
                    <CardTitle className="text-right flex items-center gap-3 text-theme-primary">
                      <TrendingUp className="w-5 h-5" />
                      إدارة الحملات الإعلانية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <Button 
                        onClick={() => window.location.href = '/platform-ads-meta-management'}
                        className="h-20 flex flex-col items-center justify-center bg-theme-gradient hover:opacity-90 gap-2"
                      >
                        <TrendingUp className="w-6 h-6" />
                        إنشاء حملة جديدة
                      </Button>
                      
                      <Button 
                        onClick={() => window.location.href = '/platform-ads-meta-management'}
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center theme-border text-theme-primary hover:bg-theme-primary-light gap-2"
                      >
                        <i className="fas fa-chart-line text-xl"></i>
                        إدارة الحملات
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="theme-border bg-theme-primary-lighter">
                  <CardHeader>
                    <CardTitle className="text-right flex items-center gap-3 text-theme-primary">
                      <i className="fas fa-bullseye w-5 h-5"></i>
                      البكسل وتتبع التحويلات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-theme-primary-light dark:bg-gray-800 rounded-lg">
                        <h4 className="font-semibold text-theme-primary mb-2">Facebook Pixel</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">قم بإعداد بكسل فيسبوك لتتبع التحويلات بدقة</p>
                        <Button 
                          onClick={() => {
                            const platformSession = localStorage.getItem('platformSession');
                            if (platformSession) {
                              const session = JSON.parse(platformSession);
                              window.location.href = `/platform/${session.subdomain}/settings`;
                            } else {
                              window.location.href = '/platform-settings';
                            }
                          }}
                          variant="outline" 
                          className="theme-border text-theme-primary hover:bg-theme-primary-light"
                        >
                          <i className="fas fa-cog ml-2"></i>
                          إعدادات البكسل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Platforms Coverage */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-3 text-theme-primary">
                  <i className="fas fa-globe w-5 h-5"></i>
                  المنصات المدعومة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-theme-primary-light dark:bg-gray-800 rounded-lg">
                    <i className="fab fa-facebook text-theme-primary text-2xl"></i>
                    <div className="text-right">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Facebook</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">أنشئ حملات إعلانية على أكبر شبكة اجتماعية</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-pink-50 dark:bg-gray-800 rounded-lg">
                    <i className="fab fa-instagram text-pink-600 text-2xl"></i>
                    <div className="text-right">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Instagram</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">استهدف الجمهور الشاب بإعلانات بصرية جذابة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-3 text-theme-primary">
                  <i className="fas fa-star w-5 h-5"></i>
                  مميزات الربط مع Meta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-theme-primary-light dark:bg-gray-800 rounded-lg">
                    <i className="fas fa-users text-theme-primary mt-1"></i>
                    <div className="text-right">
                      <h4 className="font-semibold text-gray-900 dark:text-white">وصول واسع</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">اوصل لمليارات المستخدمين عبر Facebook و Instagram</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-theme-primary-light dark:bg-gray-800 rounded-lg">
                    <i className="fas fa-bullseye text-green-600 mt-1"></i>
                    <div className="text-right">
                      <h4 className="font-semibold text-gray-900 dark:text-white">استهداف متقدم</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">استهدف بناءً على الاهتمامات والسلوك والموقع</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-theme-primary-light dark:bg-gray-800 rounded-lg">
                    <i className="fas fa-chart-bar text-theme-primary mt-1"></i>
                    <div className="text-right">
                      <h4 className="font-semibold text-gray-900 dark:text-white">تحليلات شاملة</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">احصل على تقارير مفصلة عن أداء الحملات</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-theme-primary-light dark:bg-gray-800 rounded-lg">
                    <i className="fas fa-palette text-pink-600 mt-1"></i>
                    <div className="text-right">
                      <h4 className="font-semibold text-gray-900 dark:text-white">تنوع الإعلانات</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">صور، فيديوهات، قصص، وأشكال إعلانية متنوعة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}