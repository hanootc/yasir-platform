import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlatformSidebar from "@/components/PlatformSidebar";
import { apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageTitle } from '@/hooks/usePageTitle';
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";


interface WhatsAppSession {
  platformId: string;
  phoneNumber: string | null;
  businessName?: string;
  isConnected: boolean;
  qrCode: string | null;
  status: 'disconnected' | 'connecting' | 'connected';
  sessionId?: string;
  createdAt?: string;
}

interface WhatsAppChat {
  id: string;
  name: string;
  phoneNumber: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
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
  // تعيين عنوان الصفحة
  usePageTitle('واتساب للأعمال');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesRef = useRef<WhatsAppMessage[]>([]);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showOrders, setShowOrders] = useState(false);
  const [showChatList, setShowChatList] = useState(true); // للتحكم في عرض قائمة المحادثات في الشاشات الصغيرة

  // تحديث حالة السايدبار عند تغيير حجم الشاشة
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  // جلب جلسة المنصة
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/platform-session"],
  });
  
  // للتصحيح - عرض بيانات المنصة
  console.log('Platform Session Data:', sessionData);

  // جلب جلسة الواتساب
  const { data: whatsappSession, isLoading: sessionLoadding, refetch: refetchSession } = useQuery<WhatsAppSession>({
    queryKey: [`/api/whatsapp/session`],
    refetchInterval: 2000, // تحديث كل ثانيتين
  });

  // للتصحيح - عرض البيانات في console
  console.log('WhatsApp Session Data:', whatsappSession);

  // جلب المحادثات فقط عند الاتصال مع تحديث دوري
  const { data: chats = [], isLoading: chatsLoading, refetch: refetchChats } = useQuery<WhatsAppChat[]>({
    queryKey: [`/api/whatsapp/chats`],
    enabled: whatsappSession?.status === 'connected',
    refetchInterval: whatsappSession?.status === 'connected' ? 8000 : false, // تحديث كل 8 ثوانٍ
  });

  // جلب الرسائل للمحادثة المحددة مع تحديث تلقائي
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<WhatsAppMessage[]>({
    queryKey: [`/api/whatsapp/messages/${selectedChat}`],
    enabled: !!selectedChat && whatsappSession?.status === 'connected',
    refetchInterval: selectedChat && whatsappSession?.status === 'connected' ? 3000 : false,
  });

  // جلب الطلبات المرتبطة بالمحادثة المحددة - تلقائياً عند اختيار محادثة
  const { data: chatOrders, isLoading: ordersLoading } = useQuery<any>({
    queryKey: [`/api/whatsapp/chat-orders/${selectedChat}`],
    enabled: !!selectedChat, // جلب الطلبات تلقائياً عند اختيار محادثة
  });

  // جلب جميع بيانات الطلبات للمحادثات (للاستخدام في القائمة الجانبية)
  const { data: allChatOrders = [] } = useQuery<any[]>({
    queryKey: [`/api/whatsapp/all-chat-orders`],
    enabled: whatsappSession?.status === 'connected' && chats && chats.length > 0,
    refetchInterval: 10000, // تحديث كل 10 ثوان
  });

  // تتبع الرسائل الجديدة وإرسال إشعارات
  useEffect(() => {
    if (messages.length > 0 && lastMessageCount > 0 && messages.length > lastMessageCount) {
      const newMessages = messages.slice(lastMessageCount);
      const incomingMessages = newMessages.filter(m => m.sender === 'customer');
      
      if (incomingMessages.length > 0) {
        toast({
          title: "رسالة جديدة",
          description: `تم استلام ${incomingMessages.length} رسالة جديدة`,
          className: "bg-green-500 text-white border-green-600 dark:bg-green-600 dark:text-white dark:border-green-700"
        });
      }
    }
    
    if (messages.length > 0) {
      setLastMessageCount(messages.length);
      messagesRef.current = messages;
    }
  }, [messages, lastMessageCount, toast]);

  // التمرير التلقائي للرسائل الجديدة
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // التمرير التلقائي في الشاشات الكبيرة
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // التمرير التلقائي عند اختيار محادثة جديدة 
  useEffect(() => {
    if (selectedChat) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        // التمرير التلقائي في الشاشات الكبيرة
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [selectedChat]);

  // التمرير التلقائي عند العودة من الطلبات للدردشة
  useEffect(() => {
    if (!showOrders && selectedChat) {
      // تمرير فوري بدون تأثيرات بصرية
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
      }
      // التمرير التلقائي في الشاشات الكبيرة
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [showOrders, selectedChat]);

  // إنشاء جلسة واتساب جديدة
  const createSessionMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string, businessName: string }) => {
      console.log('API Request: POST /api/whatsapp/connect', data);
      const response = await apiRequest('/api/whatsapp/connect', 'POST', data);
      return response;
    },
    onSuccess: (data) => {
      console.log('WhatsApp connection successful:', data);
      // تحديث البيانات فوراً
      queryClient.setQueryData([`/api/whatsapp/session`], data);
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/session`] });
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/chats`] });
      toast({
        title: "تم بدء عملية الربط",
        description: "امسح رمز QR الذي ظهر بواسطة تطبيق WhatsApp على هاتفك",
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      console.log('WhatsApp connection error:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('Timeout') || error.message.includes('60 seconds')) {
        errorMessage = "انتهت مهلة الانتظار (60 ثانية). يرجى المحاولة مرة أخرى ومسح رمز QR بسرعة.";
      } else if (error.message.includes('Session already exists')) {
        errorMessage = "الجلسة موجودة بالفعل. قم بحذف الجلسة القديمة أولاً.";
      }
      
      toast({
        title: "فشل في الربط",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    },
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
        description: "تم قطع اتصال الواتساب بنجاح",
      });
    },
  });

  // إعادة الاتصال التلقائي
  const reconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/whatsapp/reconnect`, "POST");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/session`] });
      toast({
        title: "تم إعادة الاتصال",
        description: "تم إعادة ربط الواتساب بنجاح",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      console.error('Reconnection error:', error);
      
      let title = "فشل في إعادة الاتصال";
      let description = "حدث خطأ في إعادة الاتصال";
      
      // تحليل نوع الخطأ لإظهار رسالة مناسبة
      if (error.message && error.message.includes("لا توجد جلسة محفوظة")) {
        title = "لا توجد جلسة محفوظة";
        description = "يرجى إنشاء جلسة جديدة بالضغط على 'إنشاء جلسة' ومسح رمز QR";
      } else if (error.message && error.message.includes("منتهية الصلاحية")) {
        title = "الجلسة منتهية الصلاحية";
        description = "يرجى حذف الجلسة وإنشاء جلسة جديدة";
      } else {
        description = error.message || "لا يمكن إعادة الاتصال تلقائياً - يرجى إنشاء جلسة جديدة";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  // إرسال رسالة
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { chatId: string, content: string, type: string }) => {
      console.log('📤 Sending message:', data);
      const result = await apiRequest(`/api/whatsapp/send-to-chat`, "POST", data);
      console.log('✅ Message sent result:', result);
      return result;
    },
    onSuccess: () => {
      console.log('✅ Message sent successfully, updating queries');
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/messages`, selectedChat] });
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/chats`] });
      refetchMessages(); // تحديث فوري للرسائل
      refetchChats(); // تحديث فوري للمحادثات
      setNewMessage("");
    },
    onError: (error) => {
      console.error('❌ Error sending message:', error);
      toast({
        title: "خطأ في إرسال الرسالة",
        description: error.message || "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  // معالج إرسال الرسائل
  const handleSendMessage = () => {
    console.log('🚀 handleSendMessage called');
    console.log('🚀 selectedChat:', selectedChat);
    console.log('🚀 newMessage:', newMessage);
    console.log('🚀 mutation pending:', sendMessageMutation.isPending);
    
    if (!selectedChat || !newMessage.trim()) {
      console.log('❌ Cannot send: no chat selected or empty message');
      return;
    }

    console.log('✅ Calling mutation with data:', {
      chatId: selectedChat,
      content: newMessage,
      type: 'text',
    });

    sendMessageMutation.mutate({
      chatId: selectedChat,
      content: newMessage,
      type: 'text',
    });
  };

  // معالج تحديث حالة الطلب - استخدام endpoint المنصة الجديد
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    console.log('🔄 Updating order status:', { orderId, newStatus });
    
    try {
      const response = await fetch(`/api/platform/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // استخدام cookies للمصادقة
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Order status updated successfully:', result);

      // إعادة تحميل بيانات الطلبات للعميل
      queryClient.invalidateQueries({ queryKey: [`/api/whatsapp/chat-orders/${selectedChat}`] });
      
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة الطلب بنجاح",
      });
    } catch (error: any) {
      console.error('❌ Error updating order status:', error);
      
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ في تحديث حالة الطلب",
        variant: "destructive",
      });
    }
  };

  // معالج رفع الملفات
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    // رفع الملف وإرسال الرسالة (تنفيذ متقدم)
    console.log('File upload:', file);
  };

  // معالج إنشاء الجلسة
  const handleCreateSession = () => {
    console.log('Starting WhatsApp connection process...');
    console.log('Platform session data:', sessionData);
    
    // جلب البيانات من المنصة أولاً
    const platformPhone = (sessionData as any)?.contactPhone;
    const platformWhatsapp = (sessionData as any)?.whatsappNumber;
    const platformBusinessName = (sessionData as any)?.platformName;
    
    console.log('Platform data - phone:', platformPhone, 'whatsapp:', platformWhatsapp, 'name:', platformBusinessName);
    
    let phoneNumber = (document.getElementById('phoneNumber') as HTMLInputElement)?.value || '';
    let businessName = (document.getElementById('businessName') as HTMLInputElement)?.value || '';

    // إذا لم يتم إدخال رقم، استخدم رقم المنصة
    if (!phoneNumber && (platformWhatsapp || platformPhone)) {
      phoneNumber = platformWhatsapp || platformPhone;
    }
    
    // إذا لم يتم إدخال اسم النشاط، استخدم اسم المنصة
    if (!businessName && platformBusinessName) {
      businessName = platformBusinessName;
    }

    if (!phoneNumber) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الواتساب أو تأكد من وجوده في إعدادات المنصة",
        variant: "destructive",
      });
      return;
    }

    // إضافة +964 تلقائياً إذا لم يكن موجوداً
    if (phoneNumber && !phoneNumber.startsWith('+964') && !phoneNumber.startsWith('964')) {
      if (phoneNumber.startsWith('07') || phoneNumber.startsWith('7')) {
        phoneNumber = '+964' + phoneNumber.substring(phoneNumber.startsWith('0') ? 1 : 0);
      } else {
        phoneNumber = '+964' + phoneNumber;
      }
    } else if (phoneNumber && phoneNumber.startsWith('964') && !phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }

    console.log('Final data to send:', { phoneNumber, businessName: businessName || "نشاط تجاري" });
    
    createSessionMutation.mutate({
      phoneNumber,
      businessName: businessName || "نشاط تجاري",
    });
  };

  // تنسيق الوقت
  const formatTime = (timestamp: string | number) => {
    try {
      let date: Date;
      
      if (typeof timestamp === 'string') {
        // إذا كان string، قد يكون ISO string أو timestamp
        if (timestamp.includes('T')) {
          // ISO string
          date = new Date(timestamp);
        } else {
          // timestamp كstring
          const ts = parseInt(timestamp);
          date = new Date(ts > 1000000000000 ? ts : ts * 1000);
        }
      } else {
        // إذا كان number
        date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
      }
      
      if (isNaN(date.getTime())) {
        return 'الآن';
      }
      
      return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'الآن';
    }
  };

  // دالة لعرض أسماء حالات الطلبات بالعربية
  const getStatusDisplayName = (status: string) => {
    const statusNames: Record<string, string> = {
      'pending': 'معلق',
      'confirmed': 'مؤكد',
      'processing': 'قيد المعالجة',
      'shipped': 'مشحون',
      'delivered': 'مسلم',
      'cancelled': 'ملغي',
      'returned': 'مرتجع',
      'refunded': 'مسترد',
      'no_answer': 'لا يرد',
      'postponed': 'مؤجل'
    };
    return statusNames[status] || status;
  };

  // دالة للحصول على خيارات الحالة للقائمة المنسدلة
  const getStatusOptions = () => [
    { value: 'pending', label: 'معلق' },
    { value: 'confirmed', label: 'مؤكد' },
    { value: 'processing', label: 'قيد المعالجة' },
    { value: 'shipped', label: 'مشحون' },
    { value: 'delivered', label: 'مسلم' },
    { value: 'cancelled', label: 'ملغي' },
    { value: 'returned', label: 'مرتجع' },
    { value: 'refunded', label: 'مسترد' },
    { value: 'no_answer', label: 'لا يرد' },
    { value: 'postponed', label: 'مؤجل' }
  ];

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PlatformSidebar 
        session={sessionData as any}
        currentPath="/platform-whatsapp"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'mr-0 lg:mr-16' : 'mr-0 lg:mr-64'}`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:px-8 py-4">
          <div className="text-right flex items-center justify-between">
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
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">واتساب للأعمال</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">إدارة محادثات العملاء عبر الواتساب</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8">
          {whatsappSession?.isConnected ? (
            // واجهة الواتساب المتصلة
            <div className="h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)]">
              {/* الشاشات الكبيرة */}
              <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-full">
                {/* قائمة المحادثات */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">المحادثات</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        <i className="fab fa-whatsapp ml-1"></i>
                        متصل
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {chats && chats.length > 0 ? (
                      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                        {chats.map((chat: any) => (
                          <div
                            key={chat.id}
                            onClick={() => {
                              setSelectedChat(chat.id);
                              setShowChatList(false); // إخفاء قائمة المحادثات في الشاشات الصغيرة
                            }}
                            className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              selectedChat === chat.id ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border-r-2 border-r-purple-500' : ''
                            } selection:bg-purple-100 dark:selection:bg-purple-900/50 selection:text-purple-900 dark:selection:text-purple-100`}
                          >
                            <div className="flex items-center gap-3">
                              {(() => {
                                // البحث عن الطلبات لهذه المحادثة
                                const phoneNumber = chat.id.replace('@c.us', '');
                                const chatOrdersForThisChat = allChatOrders?.find((co: any) => 
                                  co.phoneNumber === phoneNumber || co.phoneNumber === `+${phoneNumber}`
                                );
                                const latestOrder = chatOrdersForThisChat?.orders?.[0];
                                
                                const borderColor = latestOrder ? (
                                  latestOrder.status === 'delivered' ? 'border-green-500' :
                                  latestOrder.status === 'confirmed' ? 'border-blue-500' :
                                  latestOrder.status === 'processing' ? 'border-purple-500' :
                                  latestOrder.status === 'shipped' ? 'border-orange-500' :
                                  latestOrder.status === 'cancelled' ? 'border-red-500' :
                                  latestOrder.status === 'returned' ? 'border-gray-500' :
                                  latestOrder.status === 'refunded' ? 'border-gray-500' :
                                  latestOrder.status === 'pending' ? 'border-yellow-500' :
                                  latestOrder.status === 'no_answer' ? 'border-pink-500' :
                                  latestOrder.status === 'postponed' ? 'border-indigo-500' :
                                  'border-gray-300'
                                ) : 'border-gray-300';

                                return (chat as any).profilePicUrl ? (
                                  <img 
                                    src={(chat as any).profilePicUrl} 
                                    alt={chat.name}
                                    className={`w-12 h-12 rounded-full object-cover border-2 ${borderColor}`}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = document.createElement('div');
                                      fallback.className = `w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 ${borderColor}`;
                                      fallback.innerHTML = '<i class="fas fa-user text-purple-600 text-base"></i>';
                                      if (e.currentTarget.parentNode) {
                                        (e.currentTarget.parentNode as HTMLElement)?.classList.remove('animate-pulse');
                                        e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className={`w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 ${borderColor}`}>
                                    <i className="fas fa-user text-purple-600 text-base"></i>
                                  </div>
                                );
                              })()}
                              <div className="flex-1 min-w-0 mr-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatTime(chat.lastMessageTime)}
                                  </span>
                                  <div className="text-right">
                                    <p className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                                      {chat.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono" dir="ltr">
                                    +{chat.id.replace('@c.us', '')}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-300 truncate mt-1">
                                  {chat.lastMessage}
                                </p>
                                {chat.unreadCount > 0 && (
                                  <Badge className="mt-2 text-xs bg-green-500 dark:bg-green-600 text-white border-green-600 dark:border-green-700">
                                    {chat.unreadCount} جديد
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i className="fab fa-whatsapp text-4xl mb-4 block"></i>
                        <p>لا توجد محادثات حالياً</p>
                        <p className="text-xs mt-2">المحادثات ستظهر هنا عند استلام رسائل جديدة</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* منطقة المحادثة للشاشات الكبيرة */}
                <Card className="lg:col-span-2">
                {selectedChat ? (
                  <div className="h-[calc(100vh-200px)] flex flex-col">
                    {/* رأس المحادثة */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedChat(null)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <i className="fas fa-times"></i>
                            <span className="text-xs">إغلاق</span>
                          </Button>
                          <Button
                            variant={showOrders ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setShowOrders(!showOrders)}
                            className="relative text-xs p-2"
                          >
                            <i className="fas fa-shopping-cart"></i>
                            {chatOrders?.orders?.length > 0 && (
                              <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 text-xs px-1 py-0 min-w-[1rem] h-4 flex items-center justify-center rounded-full text-[10px]">
                                {chatOrders.orders.length}
                              </Badge>
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          {(() => {
                            const currentChat = chats?.find((c: any) => c.id === selectedChat);
                            const latestOrder = chatOrders?.orders?.[0];
                            const borderColor = latestOrder ? (
                              latestOrder.status === 'delivered' ? 'border-green-500' :
                              latestOrder.status === 'confirmed' ? 'border-blue-500' :
                              latestOrder.status === 'processing' ? 'border-purple-500' :
                              latestOrder.status === 'shipped' ? 'border-orange-500' :
                              latestOrder.status === 'cancelled' ? 'border-red-500' :
                              latestOrder.status === 'returned' ? 'border-gray-500' :
                              latestOrder.status === 'refunded' ? 'border-gray-500' :
                              latestOrder.status === 'pending' ? 'border-yellow-500' :
                              latestOrder.status === 'no_answer' ? 'border-pink-500' :
                              latestOrder.status === 'postponed' ? 'border-indigo-500' :
                              'border-gray-300'
                            ) : 'border-gray-300';
                            
                            return (currentChat as any)?.profilePicUrl ? (
                              <img 
                                src={(currentChat as any).profilePicUrl} 
                                alt="صورة البروفايل"
                                className={`w-10 h-10 rounded-full object-cover border-2 ${borderColor}`}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = document.createElement('div');
                                  fallback.className = `w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 ${borderColor}`;
                                  fallback.innerHTML = '<i class="fas fa-user text-purple-600"></i>';
                                  (e.currentTarget.parentNode as HTMLElement)?.classList.add('animate-pulse');
                                  e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget);
                                }}
                              />
                            ) : (
                              <div className={`w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 ${borderColor}`}>
                                <i className="fas fa-user text-purple-600"></i>
                              </div>
                            );
                          })()}
                          <div className="text-right w-full mr-3">
                            <div className="flex items-center justify-end gap-2">
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-right">
                                  {(() => {
                                    const currentChat = chats?.find((c: any) => c.id === selectedChat);
                                    return currentChat?.name || 'محادثة';
                                  })()}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono" dir="ltr">
                                  +{selectedChat?.replace('@c.us', '') || ''}
                                </p>
                              </div>
                              {/* قائمة منسدلة لحالة الطلب */}
                              {(() => {
                                const latestOrder = chatOrders?.orders?.[0]; // أحدث طلب
                                if (!latestOrder) return null;
                                
                                return (
                                  <select 
                                    value={latestOrder.status}
                                    onChange={(e) => handleStatusUpdate(latestOrder.id, e.target.value)}
                                    className={`text-xs px-1 py-0 rounded text-white border-0 cursor-pointer h-6 text-center ${
                                      latestOrder.status === 'delivered' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                      latestOrder.status === 'confirmed' ? 'bg-blue-500' :
                                      latestOrder.status === 'processing' ? 'bg-purple-500' :
                                      latestOrder.status === 'shipped' ? 'bg-orange-500' :
                                      latestOrder.status === 'cancelled' ? 'bg-red-500' :
                                      latestOrder.status === 'returned' ? 'bg-gray-500' :
                                      latestOrder.status === 'refunded' ? 'bg-gray-500' :
                                      latestOrder.status === 'pending' ? 'bg-yellow-500' :
                                      latestOrder.status === 'no_answer' ? 'bg-pink-500' :
                                      latestOrder.status === 'postponed' ? 'bg-indigo-500' :
                                      'bg-gray-500'
                                    }`}
                                    style={{ fontSize: '10px', lineHeight: '24px', padding: '0 4px' }}
                                  >
                                    <option value="pending">معلق</option>
                                    <option value="confirmed">مؤكد</option>
                                    <option value="processing">قيد التجهيز</option>
                                    <option value="shipped">تم الإرسال</option>
                                    <option value="delivered">تم التسليم</option>
                                    <option value="cancelled">ملغي</option>
                                    <option value="returned">مُرجع</option>
                                    <option value="refunded">مُستَرد</option>
                                    <option value="no_answer">لا يرد</option>
                                    <option value="postponed">مؤجل</option>
                                  </select>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* منطقة الرسائل أو الطلبات */}
                    <div className="flex-1 p-4 overflow-y-auto" ref={messagesContainerRef}>
                      {showOrders ? (
                        // عرض الطلبات
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowOrders(false)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            >
                              <i className="fas fa-arrow-right mr-2"></i>
                              العودة للدردشة
                            </Button>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                              الطلبات المرتبطة بهذا الرقم
                            </h3>
                            <div></div> {/* للتوسيط */}
                          </div>
                          {ordersLoading ? (
                            <div className="flex justify-center items-center h-32">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                            </div>
                          ) : chatOrders?.orders && chatOrders.orders.length > 0 ? (
                            <div className="space-y-3">
                              {chatOrders.orders.map((order: any) => (
                                <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant={order.orderType === 'platform' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {order.orderType === 'platform' ? 'طلب منصة' : 'طلب صفحة'}
                                      </Badge>
                                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        #{order.orderNumber || order.id?.substring(0, 8)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {/* قائمة منسدلة لتحديث حالة الطلب */}
                                      <Select 
                                        value={order.status} 
                                        onValueChange={(value) => handleStatusUpdate(order.id, value)}
                                      >
                                        <SelectTrigger className={`w-auto h-7 px-2 text-xs text-white border-0 ${
                                          order.status === 'delivered' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                          order.status === 'confirmed' ? 'bg-blue-500' :
                                          order.status === 'processing' ? 'bg-purple-500' :
                                          order.status === 'shipped' ? 'bg-orange-500' :
                                          order.status === 'cancelled' ? 'bg-red-500' :
                                          order.status === 'returned' ? 'bg-gray-500' :
                                          order.status === 'refunded' ? 'bg-gray-500' :
                                          order.status === 'pending' ? 'bg-yellow-500' :
                                          order.status === 'no_answer' ? 'bg-pink-500' :
                                          order.status === 'postponed' ? 'bg-indigo-500' :
                                          'bg-gray-500'
                                        }`}>
                                          <SelectValue>
                                            <div className="flex items-center gap-1">
                                              <div className="w-2 h-2 rounded-full bg-white opacity-80"></div>
                                              <span className="text-xs">{getStatusDisplayName(order.status)}</span>
                                            </div>
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                          <SelectItem value="pending" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                              معلق
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="confirmed" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                              مؤكد
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="processing" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                              قيد التجهيز
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="shipped" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                              تم الإرسال
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="delivered" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                              تم التسليم
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="cancelled" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                              ملغي
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="returned" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                              مُرجع
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="refunded" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                              مُستَرد
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="no_answer" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                              لا يرد
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="postponed" className="text-xs">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                              مؤجل
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <p><span className="font-medium">العميل:</span> {order.customerName}</p>
                                    <p><span className="font-medium">المحافظة:</span> {order.customerGovernorate}</p>
                                    {order.total && (
                                      <p><span className="font-medium">المبلغ:</span> {Number(order.total).toLocaleString()} د.ع</p>
                                    )}
                                    {order.totalAmount && (
                                      <p><span className="font-medium">المبلغ:</span> {Number(order.totalAmount).toLocaleString()} د.ع</p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(order.createdAt).toLocaleDateString('ar-IQ')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                              <div className="text-center">
                                <i className="fas fa-shopping-cart text-4xl mb-2 opacity-50"></i>
                                <p>لا توجد طلبات مرتبطة بهذا الرقم</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // عرض الرسائل
                        messages && messages.length > 0 ? (
                          <div className="space-y-3">
                            {messages
                              .slice()
                              .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                              .map((message: any) => (
                              <div
                                key={message.id}
                                className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'} mb-3`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                                    message.fromMe
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-12 rounded-br-sm'
                                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mr-12 border border-gray-200 dark:border-gray-600 rounded-bl-sm'
                                  }`}
                                >
                                  {message.type === 'image' && message.mediaUrl ? (
                                    <div className="space-y-2">
                                      <img 
                                        src={message.mediaUrl} 
                                        alt="صورة" 
                                        className="max-w-full h-auto rounded-lg"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const fallback = document.createElement('div');
                                          fallback.className = 'text-xs text-gray-500 italic';
                                          fallback.textContent = '❌ فشل في تحميل الصورة';
                                          (e.currentTarget.parentNode as HTMLElement)?.classList.add('animate-pulse');
                                          e.currentTarget.parentNode?.appendChild(fallback);
                                        }}
                                      />
                                      {message.content && <p className="text-sm">{message.content}</p>}
                                    </div>
                                  ) : message.type === 'video' && message.mediaUrl ? (
                                    <div className="space-y-2">
                                      <video 
                                        controls 
                                        className="max-w-full h-auto rounded-lg"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const fallback = document.createElement('div');
                                          fallback.className = 'text-xs text-gray-500 italic';
                                          fallback.textContent = '❌ فشل في تحميل الفيديو';
                                          (e.currentTarget.parentNode as HTMLElement)?.classList.add('animate-pulse');
                                          e.currentTarget.parentNode?.appendChild(fallback);
                                        }}
                                      >
                                        <source src={message.mediaUrl} />
                                      </video>
                                      {message.content && <p className="text-sm">{message.content}</p>}
                                    </div>
                                  ) : message.type === 'audio' && message.mediaUrl ? (
                                    <div className="space-y-2">
                                      <audio 
                                        controls 
                                        className="w-full"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const fallback = document.createElement('div');
                                          fallback.className = 'text-xs text-gray-500 italic';
                                          fallback.textContent = '❌ فشل في تحميل الصوت';
                                          (e.currentTarget.parentNode as HTMLElement)?.classList.add('animate-pulse');
                                          e.currentTarget.parentNode?.appendChild(fallback);
                                        }}
                                      >
                                        <source src={message.mediaUrl} />
                                      </audio>
                                      {message.content && <p className="text-sm">{message.content}</p>}
                                    </div>
                                  ) : (
                                    <p className="text-sm">{message.body || message.content}</p>
                                  )}
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs opacity-75">
                                      {formatTime(message.timestamp)}
                                    </p>
                                    {message.fromMe && (
                                      <div className="flex text-xs text-blue-200">
                                        <i className="fas fa-check-double"></i>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                            <p>لا توجد رسائل في هذه المحادثة</p>
                          </div>
                        )
                      )}
                    </div>

                    {/* منطقة إرسال الرسائل - تظهر فقط في وضع الرسائل */}
                    {!showOrders && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="اكتب رسالتك هنا..."
                            className="flex-1 platform-input"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSendMessage();
                              }
                            }}
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                            size="sm"
                            className="platform-button"
                          >
                            {sendMessageMutation.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <i className="fas fa-paper-plane"></i>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <CardContent className="flex items-center justify-center h-[500px]">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <i className="fab fa-whatsapp text-4xl mb-4 block"></i>
                      <h3 className="text-lg font-medium mb-2">واتساب متصل وجاهز</h3>
                      <p className="text-sm">اختر محادثة من القائمة لبدء المراسلة</p>
                    </div>
                  </CardContent>
                )}
              </Card>
              </div>
              
              {/* واجهة الشاشات الصغيرة */}
              <div className="lg:hidden">
                {showChatList ? (
                  // عرض قائمة المحادثات
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">المحادثات</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          <i className="fab fa-whatsapp ml-1"></i>
                          متصل
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {chats && chats.length > 0 ? (
                        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                          {chats.map((chat: any) => (
                            <div
                              key={chat.id}
                              onClick={() => {
                                setSelectedChat(chat.id);
                                setShowChatList(false);
                              }}
                              className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                selectedChat === chat.id ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border-r-2 border-r-purple-500' : ''
                              } selection:bg-purple-100 dark:selection:bg-purple-900/50 selection:text-purple-900 dark:selection:text-purple-100`}
                            >
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const phoneNumber = chat.id.replace('@c.us', '');
                                  const chatOrdersForThisChat = allChatOrders?.find((co: any) => 
                                    co.phoneNumber === phoneNumber || co.phoneNumber === `+${phoneNumber}`
                                  );
                                  const latestOrder = chatOrdersForThisChat?.orders?.[0];
                                  
                                  const borderColor = latestOrder ? (
                                    latestOrder.status === 'delivered' ? 'border-green-500' :
                                    latestOrder.status === 'confirmed' ? 'border-blue-500' :
                                    latestOrder.status === 'processing' ? 'border-purple-500' :
                                    latestOrder.status === 'shipped' ? 'border-orange-500' :
                                    latestOrder.status === 'cancelled' ? 'border-red-500' :
                                    latestOrder.status === 'returned' ? 'border-gray-500' :
                                    latestOrder.status === 'refunded' ? 'border-gray-500' :
                                    latestOrder.status === 'pending' ? 'border-yellow-500' :
                                    latestOrder.status === 'no_answer' ? 'border-pink-500' :
                                    latestOrder.status === 'postponed' ? 'border-indigo-500' :
                                    'border-gray-300'
                                  ) : 'border-gray-300';

                                  return chat.profilePicUrl ? (
                                    <img 
                                      src={chat.profilePicUrl} 
                                      alt={chat.name}
                                      className={`w-10 h-10 rounded-full object-cover border-2 ${borderColor}`}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = `w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 ${borderColor}`;
                                        fallback.innerHTML = '<i class="fas fa-user text-purple-600 text-sm"></i>';
                                        (e.currentTarget.parentNode as HTMLElement)?.classList.remove('animate-pulse');
                                        e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget);
                                      }}
                                    />
                                  ) : (
                                    <div className={`w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 ${borderColor}`}>
                                      <i className="fas fa-user text-purple-600 text-sm"></i>
                                    </div>
                                  );
                                })()}
                                <div className="flex-1 min-w-0 mr-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      {formatTime(chat.lastMessageTime)}
                                    </span>
                                    <div className="text-right">
                                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                        {chat.name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono" dir="ltr">
                                      +{chat.id.replace('@c.us', '')}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-400 dark:text-gray-300 truncate mt-1">
                                    {chat.lastMessage}
                                  </p>
                                  {chat.unreadCount > 0 && (
                                    <Badge className="mt-2 text-xs bg-green-500 dark:bg-green-600 text-white border-green-600 dark:border-green-700">
                                      {chat.unreadCount} جديد
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <i className="fab fa-whatsapp text-4xl mb-4 block"></i>
                          <p>لا توجد محادثات حالياً</p>
                          <p className="text-xs mt-2">المحادثات ستظهر هنا عند استلام رسائل جديدة</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  // عرض المحادثة المحددة مع زر العودة
                  selectedChat && (
                    <Card className="h-full">
                      <div className="h-[calc(100vh-160px)] lg:h-[500px] flex flex-col">
                        {/* رأس المحادثة مع زر العودة */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowChatList(true)}
                                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-2 py-1"
                              >
                                <i className="fas fa-arrow-right text-sm"></i>
                                <span className="text-xs">رجوع</span>
                              </Button>
                              <Button
                                variant={showOrders ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setShowOrders(!showOrders)}
                                className="relative text-xs px-2 py-1"
                              >
                                <i className="fas fa-shopping-cart text-sm mr-1"></i>
                                طلبات
                                {chatOrders?.orders && chatOrders.orders.length > 0 && (
                                  <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1 py-0 min-w-[1rem] h-4 flex items-center justify-center rounded-full text-[9px]">
                                    {chatOrders.orders.length}
                                  </Badge>
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const currentChat = chats?.find((c: any) => c.id === selectedChat);
                                const latestOrder = chatOrders?.orders?.[0];
                                const borderColor = latestOrder ? (
                                  latestOrder.status === 'delivered' ? 'border-green-500' :
                                  latestOrder.status === 'confirmed' ? 'border-blue-500' :
                                  latestOrder.status === 'processing' ? 'border-purple-500' :
                                  latestOrder.status === 'shipped' ? 'border-orange-500' :
                                  latestOrder.status === 'cancelled' ? 'border-red-500' :
                                  latestOrder.status === 'returned' ? 'border-gray-500' :
                                  latestOrder.status === 'refunded' ? 'border-gray-500' :
                                  latestOrder.status === 'pending' ? 'border-yellow-500' :
                                  latestOrder.status === 'no_answer' ? 'border-pink-500' :
                                  latestOrder.status === 'postponed' ? 'border-indigo-500' :
                                  'border-gray-300'
                                ) : 'border-gray-300';
                                
                                return (
                                  <div className="flex items-center gap-2">
                                    {(currentChat as any)?.profilePicUrl ? (
                                      <img 
                                        src={(currentChat as any).profilePicUrl} 
                                        alt={currentChat?.name}
                                        className={`w-8 h-8 rounded-full object-cover border-2 ${borderColor}`}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const fallback = document.createElement('div');
                                          fallback.className = `w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 ${borderColor}`;
                                          fallback.innerHTML = '<i class="fas fa-user text-purple-600 text-xs"></i>';
                                          (e.currentTarget.parentNode as HTMLElement)?.classList.remove('animate-pulse');
                                          e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget);
                                        }}
                                      />
                                    ) : (
                                      <div className={`w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border-2 ${borderColor}`}>
                                        <i className="fas fa-user text-purple-600 text-xs"></i>
                                      </div>
                                    )}
                                    <div className="text-right">
                                      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{currentChat?.name}</h3>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono" dir="ltr">
                                        +{selectedChat?.replace('@c.us', '') || ''}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        {/* منطقة الرسائل أو الطلبات */}
                        <div className="flex-1 flex flex-col min-h-0">
                          {showOrders ? (
                            // عرض الطلبات في الشاشات الصغيرة
                            <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3">
                              <div className="flex items-center justify-between mb-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowOrders(false)}
                                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-2 py-1"
                                >
                                  <i className="fas fa-arrow-right mr-1 text-xs"></i>
                                  <span className="text-xs">دردشة</span>
                                </Button>
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  الطلبات المرتبطة
                                </h3>
                                <div></div> {/* للتوسيط */}
                              </div>
                              {ordersLoading ? (
                                <div className="flex justify-center items-center h-32">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                </div>
                              ) : (() => {
                                // البحث عن الطلبات بطريقة أفضل
                                const phoneNumber = selectedChat?.replace('@c.us', '');
                                console.log('Looking for orders for phone:', phoneNumber);
                                console.log('All chat orders:', allChatOrders);
                                
                                const currentChatOrders = allChatOrders?.find(chatOrder => 
                                  phoneNumber && (
                                    chatOrder.phoneNumber === phoneNumber ||
                                    chatOrder.phoneNumber === `+${phoneNumber}` ||
                                    chatOrder.phoneNumber.replace(/[^0-9]/g, '') === phoneNumber ||
                                    chatOrder.phoneNumber.replace(/[^0-9]/g, '') === phoneNumber.replace(/[^0-9]/g, '')
                                  )
                                );
                                
                                console.log('Found chat orders:', currentChatOrders);
                                return currentChatOrders?.orders && currentChatOrders.orders.length > 0 ? (
                                  <div className="space-y-2">
                                    {currentChatOrders.orders.map((order: any) => (
                                      <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Badge 
                                              variant={order.orderType === 'platform' ? 'default' : 'secondary'}
                                              className="text-xs"
                                            >
                                              {order.orderType === 'platform' ? 'منصة' : 'صفحة'}
                                            </Badge>
                                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                              #{order.orderNumber || order.id?.substring(0, 6)}
                                            </span>
                                          </div>
                                          <div className={`w-2 h-2 rounded-full ${
                                            order.status === 'delivered' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                            order.status === 'confirmed' ? 'bg-blue-500' :
                                            order.status === 'processing' ? 'bg-purple-500' :
                                            order.status === 'shipped' ? 'bg-orange-500' :
                                            order.status === 'cancelled' ? 'bg-red-500' :
                                            order.status === 'returned' ? 'bg-gray-500' :
                                            order.status === 'refunded' ? 'bg-gray-500' :
                                            order.status === 'pending' ? 'bg-yellow-500' :
                                            order.status === 'no_answer' ? 'bg-pink-500' :
                                            order.status === 'postponed' ? 'bg-indigo-500' :
                                            'bg-gray-500'
                                          }`}>
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                                          <p><strong>العميل:</strong> {order.customerName}</p>
                                          <p><strong>المبلغ:</strong> {(order.total || order.totalAmount || 0).toLocaleString()} د.ع</p>
                                          <p><strong>الحالة:</strong> {getStatusDisplayName(order.status)}</p>
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                                          <Select
                                            value={order.status}
                                            onValueChange={(value) => handleStatusUpdate(order.id, value)}
                                          >
                                            <SelectTrigger className="w-full h-8 text-xs">
                                              <SelectValue placeholder="تغيير الحالة" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {getStatusOptions().map((option) => (
                                                <SelectItem key={option.value} value={option.value} className="text-xs">
                                                  {option.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <i className="fas fa-box text-2xl mb-2 block"></i>
                                    <p className="text-xs">لا توجد طلبات</p>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            // عرض الرسائل في الشاشات الصغيرة
                            <div className="flex flex-col h-full">
                              {messages && messages.length > 0 ? (
                                <div className="flex-1 overflow-y-auto p-3">
                                  {messages.slice().reverse().map((message: any, index: number) => (
                                    <div
                                      key={index}
                                      className={`flex flex-col ${message.fromMe ? 'items-end' : 'items-start'} mb-3`}
                                    >
                                      <div
                                        className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                          message.fromMe
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                        }`}
                                      >
                                        {message.type === 'image' && message.mediaUrl ? (
                                          <div className="space-y-2">
                                            <img 
                                              src={message.mediaUrl} 
                                              alt="صورة" 
                                              className="max-w-full h-auto rounded-lg"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallback = document.createElement('div');
                                                fallback.className = 'text-xs text-gray-400 italic';
                                                fallback.textContent = '❌ فشل في تحميل الصورة';
                                                (e.currentTarget.parentNode as HTMLElement)?.classList.add('animate-pulse');
                                                e.currentTarget.parentNode?.appendChild(fallback);
                                              }}
                                            />
                                            {(message.body || message.content) && <div className="break-words">{message.body || message.content}</div>}
                                          </div>
                                        ) : message.type === 'video' && message.mediaUrl ? (
                                          <div className="space-y-2">
                                            <video 
                                              controls 
                                              className="max-w-full h-auto rounded-lg"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallback = document.createElement('div');
                                                fallback.className = 'text-xs text-gray-400 italic';
                                                fallback.textContent = '❌ فشل في تحميل الفيديو';
                                                (e.currentTarget.parentNode as HTMLElement)?.classList.add('animate-pulse');
                                                e.currentTarget.parentNode?.appendChild(fallback);
                                              }}
                                            >
                                              <source src={message.mediaUrl} />
                                            </video>
                                            {(message.body || message.content) && <div className="break-words">{message.body || message.content}</div>}
                                          </div>
                                        ) : message.type === 'audio' && message.mediaUrl ? (
                                          <div className="space-y-2">
                                            <audio 
                                              controls 
                                              className="w-full"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallback = document.createElement('div');
                                                fallback.className = 'text-xs text-gray-400 italic';
                                                fallback.textContent = '❌ فشل في تحميل الصوت';
                                                (e.currentTarget.parentNode as HTMLElement)?.classList.add('animate-pulse');
                                                e.currentTarget.parentNode?.appendChild(fallback);
                                              }}
                                            >
                                              <source src={message.mediaUrl} />
                                            </audio>
                                            {(message.body || message.content) && <div className="break-words">{message.body || message.content}</div>}
                                          </div>
                                        ) : (
                                          <div className="break-words">{message.body || message.content}</div>
                                        )}
                                      </div>
                                      <div className={`text-xs mt-1 px-1 ${
                                        message.fromMe ? 'text-gray-600 dark:text-gray-400 text-right' : 'text-gray-500 dark:text-gray-400 text-left'
                                      }`}>
                                        {formatTime(message.timestamp)}
                                      </div>
                                    </div>
                                  ))}
                                  {/* مرجع للتمرير التلقائي للرسائل الجديدة */}
                                  <div ref={messagesEndRef} />
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <i className="fab fa-whatsapp text-3xl mb-3 block"></i>
                                  <p className="text-sm">ابدأ محادثة جديدة</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* صندوق إدخال الرسالة - يظهر فقط في وضع الرسائل */}
                        {!showOrders && (
                          <div className="p-3 border-t bg-gray-50">
                            <div className="flex gap-2 items-end">
                              <Input
                                type="text"
                                placeholder="اكتب رسالتك..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !sendMessageMutation.isPending && newMessage.trim()) {
                                    handleSendMessage();
                                  }
                                }}
                                className="flex-1 text-sm h-10"
                              />
                              <Button 
                                onClick={handleSendMessage}
                                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                                size="sm"
                                className="px-3 h-10"
                              >
                                {sendMessageMutation.isPending ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                ) : (
                                  <i className="fas fa-paper-plane text-sm"></i>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                )}
              </div>
            </div>
          ) : whatsappSession?.qrCode ? (
            // عرض QR Code للربط
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center gap-2">
                    <i className="fab fa-whatsapp text-green-500 text-xl"></i>
                    امسح رمز QR من واتساب بيزنس
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center space-y-6">
                    <div className="text-purple-600">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
                        </svg>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        رقم الهاتف: <span className="font-medium">{whatsappSession?.phoneNumber}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        النشاط التجاري: <span className="font-medium">{whatsappSession?.businessName}</span>
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 p-6 rounded-lg">
                      <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 text-right">
                        <li>1. افتح تطبيق <strong>واتساب بيزنس</strong> على هاتفك</li>
                        <li>2. اذهب إلى <strong>الإعدادات</strong> {'>'} <strong>الأجهزة المرتبطة</strong></li>
                        <li>3. اضغط على <strong>"ربط جهاز"</strong></li>
                        <li>4. وجه الكاميرا نحو الرمز أدناه</li>
                      </ol>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-green-200 dark:border-green-700">
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
                    
                    <div className="text-xs text-purple-600 bg-green-50 p-3 rounded-lg">
                      <div className="font-semibold">✅ QR Code حقيقي جاهز!</div>
                      <div>امسح الكود بواسطة واتساب على هاتفك لإتمام الربط</div>
                      <div className="mt-2 text-gray-600">
                        <strong>تأكد من:</strong><br/>
                        • فتح واتساب على هاتفك<br/>
                        • الذهاب إلى الإعدادات ← الأجهزة المربوطة<br/>
                        • النقر على "ربط جهاز" ومسح الكود
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // إعدادات الاتصال
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center gap-2">
                    <i className="fab fa-whatsapp text-green-500 text-xl"></i>
                    ربط الواتساب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <i className="fab fa-whatsapp text-green-500 text-3xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">ابدأ بربط حساب الواتساب</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      اربط حساب الواتساب بيزنس الخاص بك لبدء استقبال وإرسال الرسائل من العملاء مباشرة من لوحة التحكم
                    </p>
                    
                    <div className="max-w-lg mx-auto space-y-4">
                      {whatsappSession?.status === 'disconnected' && (
                        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 text-sm">
                          <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">📱 واتساب كان متصل سابقاً</h4>
                          <p className="text-orange-700 dark:text-orange-400 mb-3">
                            يمكنك إعادة الاتصال بدون مسح QR Code جديد
                          </p>
                          <Button
                            onClick={() => reconnectMutation.mutate()}
                            disabled={reconnectMutation.isPending}
                            className="w-full bg-orange-500 hover:bg-orange-600"
                          >
                            {reconnectMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                                إعادة الاتصال...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-sync-alt ml-2"></i>
                                إعادة الاتصال التلقائي
                              </>
                            )}
                          </Button>
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center">
                            أو يمكنك إنشاء اتصال جديد أدناه
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 text-sm">
                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">🚀 نظام WhatsApp Gateway جاهز!</h4>
                        <ul className="text-green-700 dark:text-green-400 space-y-1">
                          <li>• QR Code حقيقي - سيعمل مع واتساب فعلياً</li>
                          <li>• مجاني تماماً - لا توجد رسوم شهرية</li>
                          <li>• إرسال واستقبال الرسائل الحقيقية</li>
                          <li>• دعم جميع أنواع الملفات والصور</li>
                        </ul>
                      </div>
                      
                      <Input
                        type="text"
                        placeholder={(sessionData as any)?.whatsappNumber || (sessionData as any)?.contactPhone ? 
                          `${(sessionData as any).whatsappNumber || (sessionData as any).contactPhone}` : 
                          "رقم الواتساب (مثال: 9647801234567)"}
                        className="text-center"
                        id="phoneNumber"
                        key={`phone-${(sessionData as any)?.whatsappNumber || (sessionData as any)?.contactPhone || 'empty'}`}
                        defaultValue={(sessionData as any)?.whatsappNumber || (sessionData as any)?.contactPhone || ''}
                      />
                      
                      <Input
                        type="text"
                        placeholder={(sessionData as any)?.platformName ? 
                          `${(sessionData as any)?.platformName} (من إعدادات المنصة)` : 
                          "اسم النشاط التجاري (اختياري)"
                        }
                        className="text-center"
                        id="businessName"
                        key={`business-${(sessionData as any)?.platformName || 'empty'}`}
                        defaultValue={(sessionData as any)?.platformName || ''}
                      />
                      
                      <Button
                        onClick={handleCreateSession}
                        disabled={createSessionMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {createSessionMutation.isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            جاري الإنشاء...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <i className="fab fa-whatsapp"></i>
                            ربط الواتساب بيزنس
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}