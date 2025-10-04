import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Phone, MapPin, Package, Clock, MessageCircle, User, Mail, Calendar, DollarSign, Truck, Star, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import PixelTracker from '@/components/PixelTracker';
import { apiRequest } from "@/lib/queryClient";

interface OrderData {
  id: string;
  orderNumber: string;
  landingPageId: string;
  platformId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerGovernorate: string;
  customerAddress: string;
  status: string;
  total: string;
  subtotal: string;
  discountAmount: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  offer?: string;
  email?: string;
  totalAmount?: string;
  productDetails?: {
    id: string;
    name: string;
    description: string;
    price: string;
    categoryId?: string;
    categoryName?: string;
    categoryData?: {
      googleCategory: string;
    }
  };
  product_category?: string;
  category_name?: string;
}

// إنشاء معرف خارجي ثابت ومحسن للمستخدم
const createStableExternalId = (productId: string, orderData: any): string => {
  // استخدام بيانات ثابتة لإنشاء معرف مستقر
  const phone = orderData?.customerPhone || orderData?.phone || '';
  const email = orderData?.customerEmail || orderData?.email || '';
  const orderTimestamp = new Date(orderData.createdAt).getTime();
  
  // إنشاء hash بسيط من البيانات الثابتة
  const stableData = `${phone}_${email}_${productId}`.replace(/[^a-zA-Z0-9]/g, '');
  
  if (stableData.length > 3) {
    // استخدام أول وآخر أحرف + طول النص لإنشاء معرف ثابت
    const hash = stableData.slice(0, 4) + stableData.slice(-4) + stableData.length.toString();
    return `user_${hash}_${orderTimestamp.toString().slice(-8)}`;
  }
  
  // fallback للمعرف المبني على وقت الطلب
  return `user_${productId}_${orderTimestamp.toString().slice(-8)}`;
};

// الحصول على Google Product Category من بيانات الفئة أو الافتراضي
const getGoogleProductCategory = (orderData: any) => {
  // إذا كان هناك googleCategory في بيانات الفئة، استخدمه
  if (orderData?.productDetails?.categoryData?.googleCategory) {
    return orderData.productDetails.categoryData.googleCategory;
  }
  
  // إذا لم يوجد، استخدم الترجمة اليدوية كـ fallback
  const categoryName = orderData?.category_name || orderData?.product_category || orderData?.productDetails?.categoryName || 'منتجات';
  const fallbackMap: { [key: string]: string } = {
    'أجهزة منزلية': 'Home & Garden > Kitchen & Dining > Kitchen Appliances',
    'أدوات مطبخ': 'Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils',
    'ديكور منزلي': 'Home & Garden > Decor',
    'أدوات تنظيف': 'Home & Garden > Household Supplies',
    'منسوجات منزلية': 'Home & Garden > Linens & Bedding',
    'أدوات حديقة': 'Home & Garden > Yard, Garden & Outdoor Living > Gardening',
    'الأطفال والأسرة': 'Baby & Toddler',
    'صحة ورياضة': 'Sporting Goods > Exercise & Fitness'
  };
  return fallbackMap[categoryName] || 'Home & Garden';
};

// إنشاء معرفات فريدة للمستخدم (لتحسين تسجيل التحويلات)
const getUserIdentifiers = () => {
  // معرف تسجيل الدخول إلى فيسبوك
  let facebookLoginId = null;
  try {
    facebookLoginId = localStorage.getItem('facebook_user_id') || 
                     sessionStorage.getItem('facebook_user_id') || 
                     localStorage.getItem('fb_user_id') ||
                     null;
    
    if (!facebookLoginId) {
      facebookLoginId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('facebook_user_id', facebookLoginId);
    }
  } catch (e) {
    facebookLoginId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // المعرف الخارجي
  let externalId = null;
  try {
    externalId = localStorage.getItem('user_external_id') || 
                sessionStorage.getItem('user_external_id') ||
                localStorage.getItem('customer_id') ||
                null;
    
    if (!externalId) {
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        window.location.hostname
      ].join('|');
      
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      externalId = `ext_${Math.abs(hash)}_${Date.now().toString().slice(-6)}`;
      localStorage.setItem('user_external_id', externalId);
    }
  } catch (e) {
    externalId = `temp_ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return {
    facebook_login_id: facebookLoginId,
    external_id: externalId
  };
};

export default function ThankYouPage() {
  const { orderId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageSent, setMessageSent] = useState(false);
  // تم إزالة popup التأكيد - الأزرار تفتح WhatsApp مباشرة

  const { data: order, isLoading, error } = useQuery<OrderData>({
    queryKey: ["/api/landing-page-orders", orderId],
    enabled: !!orderId,
  });
  
  // تسجيل بيانات الطلب عند استلامها
  useEffect(() => {
    if (order) {
      // Order data received
    }
    if (error) {
      console.error('❌ Error fetching order:', error);
    }
  }, [order, error]);

  // الحصول على معلومات المنصة لإعادة التوجيه إلى المتجر
  const { data: platform } = useQuery({
    queryKey: ["/api/public/platforms", order?.platformId],
    enabled: !!order?.platformId,
  });

  // توجيه تلقائي إلى WhatsApp مع انتظار حدث شراء TikTok أو مهلة قصوى
  useEffect(() => {
    if (order && (platform as any)?.whatsappNumber) {
      let redirected = false;
      const doRedirect = () => {
        if (redirected) return;
        redirected = true;
        const message = `مرحباً، تم تأكيد طلبي رقم #${order?.orderNumber} بنجاح\n\نتفاصيل الطلب:\nالاسم: ${order?.customerName}\nالهاتف: ${order?.customerPhone}\nالعنوان: ${order?.customerAddress}, ${order?.customerGovernorate}\nالمبلغ: ${parseFloat(order?.totalAmount || order?.total || "0").toLocaleString()} د.ع\n\nشكراً لكم`;

        // تنسيق رقم WhatsApp
        let whatsappNumber = (platform as any).whatsappNumber;
        if (whatsappNumber.startsWith('07')) {
          whatsappNumber = '964' + whatsappNumber.substring(1);
        } else if (whatsappNumber.startsWith('+964')) {
          whatsappNumber = whatsappNumber.substring(1);
        } else if (!whatsappNumber.startsWith('964')) {
          whatsappNumber = '964' + whatsappNumber;
        }

        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = whatsappUrl;
        } else {
          window.open(whatsappUrl, '_blank');
        }
      };

      // إذا كان حدث الشراء قد تم إرساله سابقاً فقم بالتوجيه مباشرة بعد تأخير بسيط
      if (localStorage.getItem('tiktok_purchase_sent') === 'true') {
        const quickTimer = setTimeout(doRedirect, 400);
        return () => clearTimeout(quickTimer);
      }

      // استمع لحدث الشراء، أو انتظر مهلة قصوى ثم وجّه
      const onPurchase = () => {
        window.removeEventListener('tiktok_purchase_sent', onPurchase as any);
        doRedirect();
      };
      window.addEventListener('tiktok_purchase_sent', onPurchase as any, { once: true });

      // مهلة قصوى (3.5 ثواني) حتى لا نعلق إذا لم يصل الحدث
      const maxTimeout = setTimeout(() => {
        window.removeEventListener('tiktok_purchase_sent', onPurchase as any);
        doRedirect();
      }, 3500);

      return () => {
        window.removeEventListener('tiktok_purchase_sent', onPurchase as any);
        clearTimeout(maxTimeout);
      };
    }
  }, [order, platform]);

  // تم إزالة mutations - الأزرار تفتح WhatsApp مباشرة

  // تم إزالة popup التأكيد - الأزرار تفتح WhatsApp مباشرة

  // إرسال رسالة تأكيد الطلب عبر WhatsApp مع عرض تنبيه النجاح فقط (مرة واحدة فقط)
  useEffect(() => {
    if (order && orderId && !messageSent) {
      // التحقق من localStorage إذا تم إرسال الرسالة من قبل
      const messageKey = `whatsapp_sent_${orderId}`;
      const pixelKey = `pixel_tracked_${orderId}`;
      const alreadySent = localStorage.getItem(messageKey);
      
      if (alreadySent) {
        setMessageSent(true);
        return;
      }
      
      // تسجيل أن البكسل تم تتبعه لهذا الطلب
      if (order.status === 'pending') {
        localStorage.setItem(pixelKey, 'true');
      }
      
      // تأخير بسيط لضمان عرض الصفحة أولاً
      const timer = setTimeout(async () => {
        try {
          const response = await fetch("/api/whatsapp/send-order-confirmation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId }),
          });
          
          if (response.ok) {
            setMessageSent(true);
            // حفظ حالة الإرسال في localStorage
            localStorage.setItem(messageKey, 'true');
            toast({
              title: "تم إرسال الرسالة",
              description: "تم إرسال رسالة تأكيد الطلب عبر WhatsApp بنجاح",
            });
          }
          // لا نعرض رسائل خطأ للعميل
        } catch (error) {
          // لا نعرض أي رسائل خطأ للعميل
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [order, orderId, messageSent, toast]);





  // دالة تتبع حدث الشراء المكتمل
  const trackPurchaseEvent = () => {
    if (!order) return null;

    // استخدام القيمة بالدينار العراقي مباشرة بدون تحويل لتطابق الكتالوج
    const orderValueIQD = parseFloat(order.totalAmount || order.total || "0");
    

    // استخراج الاسم الأول والأخير من اسم العميل
    const nameParts = (order.customerName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // استخراج اسم المنتج من تفاصيل المنتج أولاً، ثم من العرض
    let productName = order.productDetails?.name;
    
    if (!productName && order.offer) {
      // محاولة استخراج اسم المنتج من نص العرض
      const offerText = order.offer.toLowerCase();
      if (offerText.includes('جهاز ضغط') || offerText.includes('ضغط معصمي')) {
        productName = 'جهاز ضغط معصمي';
      } else if (offerText.includes('منتج') || offerText.includes('قطع')) {
        // استخراج الجزء الأول من العرض كاسم منتج
        const parts = (order.offer || '').split(' - ');
        productName = parts[0] || 'منتج';
      } else {
        productName = 'منتج';
      }
    }
    
    // Fallback إذا لم يتم العثور على اسم منتج
    if (!productName) {
      productName = 'منتج';
    }
    
    // استخدام Google Product Category بدلاً من الفئة العربية
    const productCategory = getGoogleProductCategory(order);
    const productId = order.productDetails?.id || order.landingPageId || order.id;
    
    // Extract quantity from offer text
    let quantity = 1; // default quantity
    const offer = order.offer || '';
    
    // Look for quantity patterns in Arabic and English
    const quantityPatterns = [
      /(\d+)\s*قطع/,           // "2 قطع" pattern
      /(\d+)\s*قطعة/,          // "2 قطعة" pattern  
      /(\d+)\s*pieces?/i,      // "2 pieces" pattern
      /(\d+)\s*pcs?/i,         // "2 pcs" pattern
      /قطعتين/,               // "قطعتين" = 2 pieces
      /قطعتان/                // "قطعتان" = 2 pieces
    ];
    
    for (const pattern of quantityPatterns) {
      const match = offer.match(pattern);
      if (match) {
        if (match[1]) {
          quantity = parseInt(match[1]);
          break;
        } else if (pattern.source.includes('قطعتين') || pattern.source.includes('قطعتان')) {
          quantity = 2;
          break;
        }
      }
    }
    
    
    // الحصول على معرفات المستخدم لتحسين تسجيل التحويلات
    const userIdentifiers = getUserIdentifiers();
    

    // استخدام معرف ثابت محسن مبني على بيانات المستخدم والطلب
    const orderTimestamp = new Date(order.createdAt).getTime();
    const stableExternalId = createStableExternalId(productId, order);
    
    // إنشاء event_id ثابت للـ Purchase باستخدام نفس النمط
    const purchaseEventId = `purchase_${productId}_${orderTimestamp.toString().slice(-8)}`;

    // إعداد البيانات الأساسية
    const eventData: any = {
      content_name: productName,
      content_category: productCategory,
      content_ids: [productId],
      content_type: 'product',
      value: orderValueIQD,
      currency: 'IQD',
      quantity: quantity,
      transaction_id: order.id,
      order_number: order.orderNumber,
      landing_page_id: order.landingPageId,
      customer_phone: order.customerPhone,
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_city: order.customerAddress,
      customer_state: order.customerGovernorate,
      customer_country: 'IQ', // ISO country code for Iraq
      external_id: stableExternalId, // معرف خارجي ثابت مبني على وقت الطلب
      facebook_login_id: userIdentifiers.facebook_login_id, // +19.71% تحسين
      login_id: userIdentifiers.facebook_login_id, // نفس قيمة facebook_login_id
      action_source: 'website',
      // إضافة timestamp ثابت للاستخدام في PixelTracker
      _timestamp: orderTimestamp,
      // إضافة event_id ثابت لمنع التكرار
      _eventId: purchaseEventId
    };

    // إضافة الإيميل فقط إذا كان صحيحاً
    const email = order.customerEmail || order.email;
    if (email && email.includes('@') && email.includes('.')) {
      eventData.customer_email = email;
    }

    return eventData;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">✗</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              لا يمكن العثور على الطلب
            </h1>
            <p className="text-gray-600 mb-4">
              عذراً، لا يمكننا العثور على الطلب المحدد.
            </p>
            <Button 
              onClick={() => window.location.href = "/"} 
              className="w-full gradient-danger"
            >
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // دالة نسخ رقم الطلب
  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber).then(() => {
      toast({
        title: "تم النسخ",
        description: "تم نسخ رقم الطلب إلى الحافظة",
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 py-8 px-4">
      {/* تتبع البكسلات لحدث الشراء المكتمل */}
      {(() => {
        const purchaseEventData = order ? trackPurchaseEvent() : null;
        return purchaseEventData && (
          <PixelTracker 
            platformId={order.platformId}
            eventType="purchase"
            eventData={purchaseEventData}
          />
        );
      })()}
      
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header - رسالة النجاح الرئيسية */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-teal-600/20"></div>
            <div className="relative z-10">
              <div className="w-28 h-28 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-lg">
                <CheckCircle className="w-16 h-16 text-white drop-shadow-lg" />
              </div>
              <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">تم إرسال طلبك بنجاح!</h1>
              <p className="text-green-100 text-xl font-medium">شكراً لثقتك بنا</p>
            </div>
          </div>
          <CardContent className="p-8 text-center">
            <p className="text-xl text-black mb-6 leading-relaxed">
              مرحباً <span className="font-bold text-green-600">{order.customerName}</span>! 
              <br />تم استلام طلبك وسنتواصل معك خلال 24 ساعة لتأكيد الطلب وترتيب التوصيل.
            </p>
            
            {/* رقم الطلب مع إمكانية النسخ */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-6 mb-6 border-2 border-blue-300 shadow-lg">
              <p className="text-sm text-black mb-2 font-semibold">رقم طلبك للمتابعة</p>
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <p className="text-3xl font-bold text-green-700">#{order.orderNumber}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyOrderNumber}
                  className="mr-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* حالة الطلب */}
            <div className="flex justify-center">
              <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm font-medium">
                <Clock className="w-4 h-4 ml-1" />
                {order.status === 'pending' ? 'في انتظار التأكيد' : order.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* معلومات العميل */}
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
              <CardTitle className="flex items-center text-xl font-bold text-blue-800">
                <User className="ml-2 text-blue-600" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-black">الاسم الكامل</p>
                  <p className="text-black">{order.customerName}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-black">رقم الهاتف</p>
                  <p className="text-black font-mono">{order.customerPhone}</p>
                </div>
              </div>
              
              {order.customerEmail && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-black">البريد الإلكتروني</p>
                    <p className="text-black text-sm">{order.customerEmail}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-black">عنوان التوصيل</p>
                  <p className="text-black">{order.customerAddress}</p>
                  <p className="text-black text-sm font-medium">{order.customerGovernorate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل الطلب المالية */}
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200">
              <CardTitle className="flex items-center text-xl font-bold text-green-800">
                <DollarSign className="ml-2 text-green-600" />
                تفاصيل الفاتورة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* عرض المنتج المطلوب */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-black">المنتج المطلوب</p>
                  <p className="text-black">{order.productDetails?.name || 'منتج غير محدد'}</p>
                  {order.offer && (
                    <p className="text-black text-sm">العرض: {order.offer}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-black">المبلغ الفرعي</p>
                  <p className="text-green-700 font-mono">{formatCurrency(parseFloat(order.subtotal || order.totalAmount || order.total))}</p>
                </div>
              </div>
              
              {order.discountAmount && parseFloat(order.discountAmount) > 0 && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-black">خصم</p>
                    <p className="text-green-600 font-mono">-{formatCurrency(parseFloat(order.discountAmount))}</p>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="flex items-center space-x-3 space-x-reverse bg-green-50 p-3 rounded-lg">
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-black text-lg">المبلغ الإجمالي</p>
                  <p className="text-green-700 font-bold text-xl font-mono">{formatCurrency(parseFloat(order.totalAmount || order.total))}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-black">تاريخ الطلب</p>
                  <p className="text-black text-sm">{new Date(order.createdAt).toLocaleString('ar-IQ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ملاحظات إضافية */}
        {order.notes && (
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
              <CardTitle className="flex items-center text-xl font-bold text-purple-800">
                <MessageCircle className="ml-2 text-purple-600" />
                ملاحظات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-black leading-relaxed font-medium">{order.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الخطوات التالية */}
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-orange-100 to-yellow-100 border-b border-orange-200">
            <CardTitle className="flex items-center text-xl font-bold text-orange-800">
              <Truck className="ml-2 text-orange-600" />
              الخطوات التالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold shrink-0">1</div>
                <div>
                  <p className="font-semibold text-black mb-1">مراجعة وتأكيد الطلب</p>
                  <p className="text-black text-sm leading-relaxed">سيقوم فريقنا بمراجعة طلبك والتأكد من توفر المنتج خلال الساعات القليلة القادمة</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">2</div>
                <div>
                  <p className="font-semibold text-black mb-1">الاتصال للتأكيد</p>
                  <p className="text-black text-sm leading-relaxed">سنتصل بك على رقم {order.customerPhone} خلال 24 ساعة لتأكيد تفاصيل الطلب والعنوان</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold shrink-0">3</div>
                <div>
                  <p className="font-semibold text-black mb-1">التوصيل</p>
                  <p className="text-black text-sm leading-relaxed">سيتم توصيل طلبك إلى العنوان المحدد في {order.customerGovernorate} خلال 2-5 أيام عمل</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold shrink-0">4</div>
                <div>
                  <p className="font-semibold text-black mb-1">الدفع عند الاستلام</p>
                  <p className="text-black text-sm leading-relaxed">ادفع مبلغ <span className="text-green-700 font-bold">{formatCurrency(parseFloat(order.total))}</span> عند استلام المنتج</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* رسالة التوجيه إلى WhatsApp */}
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-600 mb-1">سيتم توجيهك إلى WhatsApp</h3>
                <p className="text-green-600">لتأكيد طلبك ومتابعة التوصيل</p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-center space-x-2 space-x-reverse">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span className="text-sm text-gray-500">جارٍ التوجيه...</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تم إزالة popup التأكيد - الأزرار تفتح WhatsApp مباشرة */}
    </div>
  );
}