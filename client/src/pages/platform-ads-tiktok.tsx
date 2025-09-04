import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { X, TrendingUp, ExternalLink } from "lucide-react";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import ThemeToggle from "@/components/ThemeToggle";

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

export default function PlatformAdsTikTok() {
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

  const handleConnectTikTok = async () => {
    setIsConnecting(true);
    try {
      // استدعاء API للحصول على رابط التفويض
      const response = await fetch('/api/platform-ads/tiktok/auth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('فشل في الحصول على رابط التفويض');
      }
      
      const { authUrl } = await response.json();
      
      toast({
        title: "توجيهك لصفحة TikTok",
        description: "يرجى منح الصلاحيات المطلوبة",
      });
      
      // توجيه المستخدم لصفحة التفويض
      window.open(authUrl, 'tiktok-auth', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      // الاستماع لرسائل من النافذة المنبثقة
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'tiktok-success') {
          toast({
            title: "تم الربط بنجاح",
            description: "تم ربط حساب TikTok بنجاح",
          });
          window.removeEventListener('message', messageHandler);
          // تحديث حالة الربط
          refetchStatus();
        } else if (event.data.type === 'tiktok-error') {
          toast({
            title: "فشل في الربط",
            description: event.data.error || "حدث خطأ أثناء ربط الحساب",
            variant: "destructive",
          });
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
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
        !sidebarCollapsed ? (isMobile ? 'ml-0' : 'mr-64') : (isMobile ? 'mr-0' : 'mr-16')
      }`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-8 py-4">
          <div className="flex items-center">
            <div className="text-right">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-theme-primary" />
                ربط إعلانات TikTok
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">اربط حسابك مع TikTok Ads لإدارة الحملات الإعلانية</p>
            </div>
            <div className="flex-1"></div>
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
                    <h3 className="font-semibold text-theme-primary">TikTok Ads Manager</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">اربط حسابك لبدء إدارة الإعلانات</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {statusLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (connectionStatus as any)?.tiktok?.connected ? (
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        مربوط ✓
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        غير مربوط
                      </Badge>
                    )}
                    {(connectionStatus as any)?.tiktok?.connected ? (
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button 
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/platform-ads/tiktok/disconnect', {
                                method: 'POST',
                              });
                              if (response.ok) {
                                toast({
                                  title: "تم فصل الاتصال",
                                  description: "تم فصل ربط حساب TikTok بنجاح",
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
                          className="border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20 w-full sm:w-auto"
                          disabled
                        >
                          <TrendingUp className="ml-2 w-4 h-4" />
                          مربوط بنجاح
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleConnectTikTok}
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
                            <i className="fab fa-tiktok ml-2"></i>
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
            {(connectionStatus as any)?.tiktok?.connected && (
              <>

              </>
            )}

            {/* Instructions Card */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-3 text-theme-primary">
                  <TrendingUp className="w-5 h-5" />
                  خطوات الربط
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-theme-primary-light rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-theme-gradient text-white rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div className="text-right">
                      <h4 className="font-semibold text-theme-primary">انقر على "ربط الحساب"</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">سيتم توجيهك إلى صفحة TikTok لتسجيل الدخول</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-theme-primary-light rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-theme-gradient text-white rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div className="text-right">
                      <h4 className="font-semibold text-theme-primary">سجل دخولك إلى TikTok Ads</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">استخدم بيانات حساب TikTok Ads الخاص بك</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-theme-primary-light rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-theme-gradient text-white rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div className="text-right">
                      <h4 className="font-semibold text-theme-primary">امنح الصلاحيات</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">اختر الصلاحيات المطلوبة لإدارة الحملات الإعلانية</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 dark:bg-green-700 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div className="text-right">
                      <h4 className="font-semibold text-green-800 dark:text-green-200">ابدأ بإدارة إعلاناتك</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">بعد الربط بنجاح، ستتمكن من إنشاء وإدارة الحملات</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-3 text-theme-primary">
                  <TrendingUp className="w-5 h-5" />
                  مميزات الربط مع TikTok
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-theme-primary-light rounded-lg">
                    <TrendingUp className="w-5 h-5 text-theme-primary mt-1" />
                    <div className="text-right">
                      <h4 className="font-semibold text-theme-primary">إحصائيات مفصلة</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">تتبع أداء الحملات والمشاهدات والتفاعل</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-theme-primary-light rounded-lg">
                    <TrendingUp className="w-5 h-5 text-theme-primary mt-1" />
                    <div className="text-right">
                      <h4 className="font-semibold text-theme-primary">استهداف دقيق</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">استهدف الجمهور المناسب بناءً على الاهتمامات</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-theme-primary-light rounded-lg">
                    <TrendingUp className="w-5 h-5 text-theme-primary mt-1" />
                    <div className="text-right">
                      <h4 className="font-semibold text-theme-primary">إدارة الميزانية</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">تحكم كامل في ميزانية الإعلانات والمصاريف</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-theme-primary-light rounded-lg">
                    <TrendingUp className="w-5 h-5 text-theme-primary mt-1" />
                    <div className="text-right">
                      <h4 className="font-semibold text-theme-primary">إعلانات فيديو</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">أنشئ إعلانات فيديو جذابة وتفاعلية</p>
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