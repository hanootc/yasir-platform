import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WhatsAppSession {
  id: string;
  phoneNumber: string;
  isConnected: boolean;
  qrCode?: string;
  lastActivity: string;
  platformId: string;
}

interface WhatsAppChat {
  id: string;
  name: string;
  phoneNumber: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  profilePicture?: string;
}

interface WhatsAppMessage {
  id: string;
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  sender: 'user' | 'customer';
  timestamp: string;
  mediaUrl?: string;
}

export default function PlatformWhatsApp() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  // جلب جلسة المنصة
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/platform-session"],
  });

  // جلب جلسة الواتساب
  const { data: whatsappSession, isLoading: sessionLoadding, refetch: refetchSession } = useQuery({
    queryKey: [`/api/whatsapp/session`],
    refetchInterval: 2000, // تحديث كل ثانيتين
  });

  // للتصحيح - عرض البيانات في console
  console.log('WhatsApp Session Data:', whatsappSession);

  // جلب المحادثات
  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: [`/api/whatsapp/chats`],
  });

  // جلب الرسائل للمحادثة المحددة
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/whatsapp/messages`, selectedChat],
    enabled: !!selectedChat,
  });

  // إنشاء جلسة واتساب جديدة
  const createSessionMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string, businessName: string }) => {
      const response = await fetch(`/api/whatsapp/connect`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // تحديث البيانات فوراً
      queryClient.setQueryData([`/api/whatsapp/session`], data);
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/session`] });
      toast({
        title: "تم إنشاء رمز الربط",
        description: "امسح الرمز من واتساب بيزنس لإتمام الاتصال",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء جلسة الواتساب",
        variant: "destructive",
      });
    }
  });

  // قطع الاتصال
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/whatsapp/disconnect`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/session`] });
      toast({
        title: "تم قطع الاتصال",
        description: "تم قطع الاتصال من الواتساب بنجاح",
      });
    },
  });

  // إرسال رسالة
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, content, type = 'text', mediaFile }: {
      chatId: string;
      content: string;
      type?: 'text' | 'image' | 'video';
      mediaFile?: File;
    }) => {
      const formData = new FormData();
      formData.append('chatId', chatId);
      formData.append('content', content);
      formData.append('type', type);
      if (mediaFile) {
        formData.append('media', mediaFile);
      }

      return await fetch(`/api/whatsapp/send`, {
        method: "POST",
        body: formData
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/messages`, selectedChat] });
      setNewMessage("");
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الإرسال",
        description: "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!selectedChat || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      chatId: selectedChat,
      content: newMessage,
      type: 'text'
    });
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;

    const type = file.type.startsWith('image/') ? 'image' : 'video';
    
    sendMessageMutation.mutate({
      chatId: selectedChat,
      content: file.name,
      type,
      mediaFile: file
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <PlatformSidebar 
        session={sessionData as any}
        currentPath="/platform-whatsapp"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'mr-16' : 'mr-64'}`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <div className="text-right">
            <h1 className="text-lg font-bold text-gray-900">واتساب للأعمال</h1>
            <p className="text-xs text-gray-600 mt-1">إدارة محادثات العملاء عبر الواتساب</p>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          {whatsappSession?.isConnected ? (
            /* واجهة الواتساب */
            <div>الواجهة متصلة - قريباً!</div>
          ) : whatsappSession?.qrCode ? (
            /* عرض QR Code */
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center gap-2">
                    <i className="fab fa-whatsapp text-purple-500 text-xl"></i>
                    امسح رمز QR من واتساب بيزنس
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center space-y-6">
                    <div className="text-purple-600">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
                        </svg>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">
                        رقم الهاتف: <span className="font-medium">{whatsappSession?.phoneNumber}</span>
                      </p>
                      <p className="text-gray-600">
                        النشاط التجاري: <span className="font-medium">{whatsappSession?.businessName}</span>
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                      <ol className="text-sm text-gray-700 space-y-2 text-right">
                        <li>1. افتح تطبيق <strong>واتساب بيزنس</strong> على هاتفك</li>
                        <li>2. اذهب إلى <strong>الإعدادات</strong> {'>'} <strong>الأجهزة المرتبطة</strong></li>
                        <li>3. اضغط على <strong>"ربط جهاز"</strong></li>
                        <li>4. وجه الكاميرا نحو الرمز أدناه</li>
                      </ol>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
                      <img 
                        src={whatsappSession?.qrCode} 
                        alt="QR Code للربط" 
                        className="w-72 h-72 mx-auto"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={() => refetchSession()}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        تحديث الرمز
                      </Button>
                      <Button 
                        onClick={() => disconnectMutation.mutate()}
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        ✕ إلغاء الاتصال
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      سيتم الاتصال تلقائياً خلال 15 ثانية من مسح الرمز
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* إعدادات الاتصال */
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center gap-2">
                    <i className="fab fa-whatsapp text-purple-500 text-xl"></i>
                    ربط الواتساب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* إنشاء جلسة جديدة */}
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-100 rounded-full flex items-center justify-center mx-auto">
                        <i className="fab fa-whatsapp text-purple-500 text-3xl"></i>
                      </div>
                      <h3 className="text-lg font-medium">ابدأ بربط حساب الواتساب</h3>
                      <p className="text-gray-600 mb-6">
                        اربط حساب الواتساب بيزنس الخاص بك لبدء استقبال وإرسال الرسائل من العملاء مباشرة من لوحة التحكم
                      </p>
                      
                      <div className="max-w-lg mx-auto space-y-4">
                        <div className="bg-gradient-to-r from-purple-50 border border-blue-200 rounded-lg p-4 text-sm">
                          <h4 className="font-medium text-purple-800 mb-2">متطلبات الربط:</h4>
                          <ul className="text-purple-700 space-y-1">
                            <li>• حساب واتساب بيزنس نشط</li>
                            <li>• رقم هاتف عراقي مُفعّل</li>
                            <li>• تطبيق واتساب بيزنس على الهاتف</li>
                          </ul>
                        </div>
                        
                        <Input
                          type="text"
                          placeholder="رقم الواتساب بيزنس (+9647xxxxxxxx)"
                          className="text-center"
                          id="phoneNumber"
                        />
                        
                        <Input
                          type="text"
                          placeholder="اسم النشاط التجاري (اختياري)"
                          className="text-center"
                          id="businessName"
                        />
                        
                        <Button 
                          onClick={() => {
                            const phoneInput = document.getElementById('phoneNumber') as HTMLInputElement;
                            const businessInput = document.getElementById('businessName') as HTMLInputElement;
                            if (phoneInput?.value) {
                              createSessionMutation.mutate({
                                phoneNumber: phoneInput.value,
                                businessName: businessInput?.value || ''
                              });
                            }
                          }}
                          disabled={createSessionMutation.isPending}
                          className="w-full bg-gradient-to-r from-green-600 hover:bg-gradient-to-r from-green-700 text-white font-medium py-3"
                          size="lg"
                        >
                          {createSessionMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                              جاري الاتصال بالواتساب...
                            </>
                          ) : (
                            <>
                              <div className="w-5 h-5 ml-2">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
                                </svg>
                              </div>
                              ربط الواتساب بيزنس
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : whatsappSession?.qrCode && !whatsappSession?.isConnected ? (
                    /* عرض QR Code للربط */
                    <div className="text-center space-y-6">
                      <div className="text-purple-600">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-2">امسح رمز QR من واتساب بيزنس</h3>
                        <p className="text-gray-600">
                          رقم الهاتف: <span className="font-medium">{(whatsappSession as any)?.phoneNumber}</span>
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                        <ol className="text-sm text-gray-700 space-y-2 text-right">
                          <li>1. افتح تطبيق <strong>واتساب بيزنس</strong> على هاتفك</li>
                          <li>2. اذهب إلى <strong>الإعدادات</strong> {'>'} <strong>الأجهزة المرتبطة</strong></li>
                          <li>3. اضغط على <strong>"ربط جهاز"</strong></li>
                          <li>4. وجه الكاميرا نحو الرمز أدناه</li>
                        </ol>
                      </div>
                      
                      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
                        <img 
                          src={(whatsappSession as any)?.qrCode} 
                          alt="QR Code للربط" 
                          className="w-72 h-72 mx-auto"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button 
                          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/session`] })}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          تحديث الرمز
                        </Button>
                        <Button 
                          onClick={() => disconnectMutation.mutate()}
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          ✕ إلغاء الاتصال
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        سيتم الاتصال تلقائياً خلال 15 ثانية من مسح الرمز
                      </div>
                    </div>
                  ) : whatsappSession?.isConnected ? (
                    /* حالة الاتصال الناجح */
                    <div className="text-center space-y-6">
                      <div className="text-purple-600">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-purple-600 mb-2">تم ربط الواتساب بنجاح!</h3>
                        <p className="text-gray-600">
                          رقم الهاتف: <span className="font-medium">{(whatsappSession as any)?.phoneNumber}</span>
                        </p>
                        <p className="text-gray-600">
                          النشاط التجاري: <span className="font-medium">{(whatsappSession as any)?.businessName}</span>
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-purple-800 mb-2">✓ جاهز للاستخدام</h4>
                        <p className="text-purple-700 text-sm">
                          يمكنك الآن استقبال وإرسال الرسائل من عملائك مباشرة من هذه الصفحة
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => disconnectMutation.mutate()}
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        قطع الاتصال
                      </Button>
                    </div>
                  ) : (
                    // حالة الانتظار
                    <div className="text-center space-y-4">
                      <div className="animate-pulse">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                      </div>
                      <h3 className="text-lg font-medium">جاري تهيئة الاتصال...</h3>
                      <p className="text-gray-600">يرجى الانتظار قليلاً</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {whatsappSession?.isConnected && (
            // واجهة الواتساب
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              {/* قائمة المحادثات */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">المحادثات</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <i className="fab fa-whatsapp ml-1"></i>
                        متصل
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => disconnectMutation.mutate()}
                      >
                        <i className="fas fa-sign-out-alt"></i>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {chatsLoading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                      </div>
                    ) : chats.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <i className="fas fa-comments text-2xl mb-2 block"></i>
                        لا توجد محادثات بعد
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {(chats as WhatsAppChat[]).map((chat: WhatsAppChat) => (
                          <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat.id)}
                            className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedChat === chat.id ? 'bg-gradient-to-r from-green-50 border-l-2 border-l-green-500' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={chat.profilePicture} />
                                <AvatarFallback>
                                  <i className="fas fa-user text-gray-400"></i>
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {chat.name}
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {formatTime(chat.lastMessageTime)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-500 truncate">
                                    {chat.lastMessage}
                                  </p>
                                  {chat.unreadCount > 0 && (
                                    <Badge variant="secondary" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                                      {chat.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* منطقة المحادثة */}
              <Card className="lg:col-span-2">
                {selectedChat ? (
                  <>
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              <i className="fas fa-user text-gray-400"></i>
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-medium">
                              {(chats as WhatsAppChat[]).find((c: WhatsAppChat) => c.id === selectedChat)?.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {(chats as WhatsAppChat[]).find((c: WhatsAppChat) => c.id === selectedChat)?.phoneNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col h-[450px]">
                      {/* الرسائل */}
                      <ScrollArea className="flex-1 p-4">
                        {messagesLoading ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(messages as WhatsAppMessage[]).map((message: WhatsAppMessage) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs px-3 py-2 rounded-lg ${
                                    message.sender === 'user'
                                      ? 'bg-gradient-to-r from-green-500 text-white'
                                      : 'bg-gray-200 text-gray-900'
                                  }`}
                                >
                                  {message.type === 'text' ? (
                                    <p className="text-sm">{message.content}</p>
                                  ) : (
                                    <div>
                                      {message.type === 'image' && message.mediaUrl && (
                                        <img 
                                          src={message.mediaUrl} 
                                          alt="صورة"
                                          className="rounded mb-2 max-w-full"
                                        />
                                      )}
                                      {message.type === 'video' && message.mediaUrl && (
                                        <video 
                                          src={message.mediaUrl} 
                                          controls
                                          className="rounded mb-2 max-w-full"
                                        />
                                      )}
                                      <p className="text-xs opacity-75">{message.content}</p>
                                    </div>
                                  )}
                                  <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
                                    {formatTime(message.timestamp)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>

                      {/* منطقة الإرسال */}
                      <div className="border-t p-4">
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleMediaUpload}
                            className="hidden"
                            id="media-upload"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById('media-upload')?.click()}
                            disabled={sendMessageMutation.isPending}
                          >
                            <i className="fas fa-paperclip"></i>
                          </Button>
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="اكتب رسالة..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={sendMessageMutation.isPending}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          >
                            <i className="fas fa-paper-plane"></i>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-[500px]">
                    <div className="text-center text-gray-500">
                      <i className="fab fa-whatsapp text-4xl mb-4 block"></i>
                      <h3 className="text-lg font-medium mb-2">اختر محادثة</h3>
                      <p className="text-sm">حدد محادثة من القائمة لبدء المراسلة</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}