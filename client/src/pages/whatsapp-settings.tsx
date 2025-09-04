import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, MessageCircle, QrCode, RotateCcw, AlertCircle, CheckCircle, Clock, Smartphone, Users, Settings, Link2, Zap, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useLocation } from "wouter";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";

interface WhatsAppSession {
  platformId: string;
  phoneNumber: string;
  businessName: string;
  status: 'disconnected' | 'connecting' | 'connected';
  isConnected: boolean;
  qrCode?: string;
}

export default function WhatsAppSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // استعلام جلسة المنصة
  const { data: platformSession } = useQuery({
    queryKey: ['/api/platform-session'],
    retry: false,
  });

  // استعلام حالة الجلسة
  const { data: session, isLoading } = useQuery<WhatsAppSession>({
    queryKey: ['/api/whatsapp/session'],
    refetchInterval: 2000, // تحديث كل ثانيتين
  });

  // طلب الاتصال
  const connectMutation = useMutation({
    mutationFn: async () => {
      setIsConnecting(true);
      return await apiRequest(`/api/whatsapp/connect/${session?.platformId || '1'}`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "بدء الاتصال",
        description: "تم بدء عملية الاتصال بـ WhatsApp",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/session'] });
    },
    onError: (error) => {
      console.error('Error connecting:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بـ WhatsApp. حاول مرة أخرى.",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  });

  // قطع الاتصال
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/whatsapp/disconnect/${session?.platformId || '1'}`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "تم قطع الاتصال",
        description: "تم قطع الاتصال بـ WhatsApp بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/session'] });
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error('Error disconnecting:', error);
      toast({
        title: "خطأ",
        description: "فشل في قطع الاتصال",
        variant: "destructive"
      });
    }
  });

  // إعادة الاتصال
  const reconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/whatsapp/reconnect`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "تم إعادة الاتصال",
        description: "تم إعادة الاتصال بـ WhatsApp بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/session'] });
    },
    onError: (error: any) => {
      console.error('Reconnection error:', error);
      const errorData = error.response?.data;
      if (errorData?.requiresReset) {
        toast({
          title: "الجلسة منتهية الصلاحية",
          description: "يجب حذف الجلسة وإنشاء اتصال جديد بكود QR",
          variant: "destructive"
        });
      } else {
        toast({
          title: "فشل إعادة الاتصال",
          description: "حاول مرة أخرى أو احذف الجلسة",
          variant: "destructive"
        });
      }
    }
  });

  // إعادة ضبط الجلسة
  const resetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/whatsapp/reset/${session?.platformId || '1'}`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "تم حذف الجلسة",
        description: "تم حذف جلسة WhatsApp بنجاح - يمكنك الآن إنشاء اتصال جديد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/session'] });
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error('Error resetting:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الجلسة",
        variant: "destructive"
      });
    }
  });

  // إيقاف حالة الاتصال عند الاتصال الناجح
  useEffect(() => {
    if (session?.status === 'connected') {
      setIsConnecting(false);
    }
  }, [session?.status]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500 text-white hover:bg-green-600">
            <CheckCircle className="w-3 h-3 ml-1" />
            متصل
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
            <Clock className="w-3 h-3 ml-1 animate-spin" />
            جاري الاتصال
          </Badge>
        );
      case 'disconnected':
      default:
        return (
          <Badge className="bg-red-500 text-white hover:bg-red-600">
            <AlertCircle className="w-3 h-3 ml-1" />
            غير متصل
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex">
          <div className="w-64 bg-white dark:bg-gray-800 h-screen"></div>
          <div className="flex-1 p-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!platformSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">خطأ في تحميل بيانات المنصة</h1>
          <p className="text-gray-600 dark:text-gray-400">يرجى المحاولة مرة أخرى</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <PlatformSidebar 
        session={platformSession}
        currentPath={location}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 min-h-screen ${
        !sidebarCollapsed ? 'mr-64' : 'mr-16'
      }`}>
            {/* Platform Header */}
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
                <div className="text-right">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    إعدادات WhatsApp
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">إدارة حساب WhatsApp Business والمحادثات</p>
                </div>
              </div>
            </div>



            {/* Content Container */}
            <div className="flex-1 p-6 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 overflow-y-auto">
              <div className="max-w-5xl mx-auto space-y-6">
              {/* بطاقة الحالة الرئيسية */}
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {session && getStatusBadge(session.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {session ? (
                    <>
                      {/* معلومات الحساب */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            رقم الهاتف
                          </Label>
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <p className="text-xl font-mono text-green-600 dark:text-green-400" dir="ltr">
                              {session.phoneNumber || 'غير محدد'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            اسم النشاط التجاري
                          </Label>
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <p className="text-xl text-gray-900 dark:text-white">
                              {session.businessName || 'غير محدد'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-6" />

                      {/* إحصائيات الحالة */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-lg text-center">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm opacity-90">حالة الاتصال</p>
                          <p className="text-xl font-bold">
                            {session.isConnected ? 'نشط' : 'غير نشط'}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-lg text-center">
                          <Settings className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm opacity-90">معرف المنصة</p>
                          <p className="text-lg font-mono">{session.platformId}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-4 rounded-lg text-center">
                          <Clock className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm opacity-90">آخر تحديث</p>
                          <p className="text-lg">{new Date().toLocaleTimeString('ar-SA')}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">لا توجد معلومات جلسة متاحة</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* QR Code with WhatsApp styling */}
              {session?.qrCode && (
                <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-3">
                      <QrCode className="w-6 h-6" />
                      كود QR للاتصال
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="text-center space-y-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl inline-block">
                        <img 
                          src={session.qrCode} 
                          alt="WhatsApp QR Code"
                          className="w-64 h-64 mx-auto rounded-lg"
                          onError={(e) => {
                            console.log('QR Code image error:', session.qrCode?.substring(0, 100));
                          }}
                        />
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 border border-green-200 dark:border-gray-500 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">خطوات الربط</h3>
                        </div>
                        <ol className="text-sm space-y-3 text-right">
                          <li className="flex items-center gap-3">
                            <span className="bg-green-500 dark:bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">افتح WhatsApp على هاتفك</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <span className="bg-green-500 dark:bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">اذهب إلى الإعدادات ← الأجهزة المرتبطة</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <span className="bg-green-500 dark:bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">اضغط على "ربط جهاز" وامسح الكود</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* أزرار التحكم */}
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3">
                    <Settings className="w-6 h-6" />
                    إدارة الاتصال
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {session?.status === 'disconnected' && (
                      <Button 
                        onClick={() => connectMutation.mutate()}
                        disabled={connectMutation.isPending || isConnecting}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-12 text-lg font-semibold shadow-lg"
                        data-testid="button-connect-whatsapp"
                      >
                        {(connectMutation.isPending || isConnecting) ? (
                          <>
                            <Clock className="w-5 h-5 ml-2 animate-spin" />
                            جاري الاتصال...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-5 h-5 ml-2" />
                            ربط WhatsApp
                          </>
                        )}
                      </Button>
                    )}

                    {session?.status === 'connected' && (
                      <Button 
                        onClick={() => disconnectMutation.mutate()}
                        disabled={disconnectMutation.isPending}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white h-12 text-lg font-semibold shadow-lg"
                        data-testid="button-disconnect-whatsapp"
                      >
                        {disconnectMutation.isPending ? (
                          <>
                            <Clock className="w-5 h-5 ml-2 animate-spin" />
                            جاري قطع الاتصال...
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 ml-2" />
                            قطع الاتصال
                          </>
                        )}
                      </Button>
                    )}

                    {session?.status === 'disconnected' && (
                      <Button 
                        onClick={() => reconnectMutation.mutate()}
                        disabled={reconnectMutation.isPending}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white h-12 text-lg font-semibold shadow-lg"
                        data-testid="button-reconnect-whatsapp"
                      >
                        {reconnectMutation.isPending ? (
                          <>
                            <Clock className="w-5 h-5 ml-2 animate-spin" />
                            جاري إعادة الاتصال...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-5 h-5 ml-2" />
                            محاولة إعادة الاتصال
                          </>
                        )}
                      </Button>
                    )}

                    <Button 
                      onClick={() => resetMutation.mutate()}
                      disabled={resetMutation.isPending}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-12 text-lg font-semibold shadow-lg"
                      data-testid="button-reset-whatsapp"
                    >
                      {resetMutation.isPending ? (
                        <>
                          <Clock className="w-5 h-5 ml-2 animate-spin" />
                          جاري حذف الجلسة...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5 ml-2" />
                          حذف الجلسة نهائياً
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/session'] })}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-12 text-lg font-semibold shadow-lg"
                      data-testid="button-refresh-status"
                    >
                      <Zap className="w-5 h-5 ml-2" />
                      تحديث الحالة
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* معلومات إضافية */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-blue-900 dark:text-blue-200">
                    <AlertCircle className="w-6 h-6" />
                    معلومات مهمة
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          ✓
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">حفظ الجلسة التلقائي</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            يتم حفظ جلسة WhatsApp تلقائياً بحيث لا تحتاج إلى إعادة مسح QR code في كل مرة
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          ↻
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">إعادة الاتصال التلقائي</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            في حالة انقطاع الاتصال، ستحاول المنصة إعادة الاتصال تلقائياً باستخدام الجلسة المحفوظة
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-orange-200">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          !
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">حذف الجلسة</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            استخدم "حذف الجلسة نهائياً" لحذف جميع بيانات WhatsApp المحفوظة والبدء من جديد. ستحتاج لمسح QR Code مرة أخرى
                          </p>
                        </div>
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