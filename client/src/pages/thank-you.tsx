import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Phone, MapPin, Package, Clock, MessageCircle, User, Mail, Calendar, DollarSign, Truck, Star, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import PixelTracker from "@/components/PixelTracker";
import { OrderConfirmationModal } from "@/components/OrderConfirmationModal";
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
  };
  product_category?: string;
  category_name?: string;
}

export default function ThankYouPage() {
  const { orderId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageSent, setMessageSent] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const { data: order, isLoading, error } = useQuery<OrderData>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  // الحصول على معلومات المنصة لإعادة التوجيه إلى المتجر
  const { data: platform } = useQuery({
    queryKey: ["/api/public/platforms", order?.platformId],
    enabled: !!order?.platformId,
  });

  // Mutations لتحديث حالة الطلب
  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest(`/api/orders/${orderId}/status`, "PATCH", { status: "confirmed" });
    },
    onSuccess: () => {
      toast({
        title: "تم تأكيد الطلب",
        description: "تم تأكيد طلبك بنجاح وسيتم التوصيل قريباً",
      });
      
      // توجيه العميل إلى واتساب صاحب المنصة بعد التأكيد
      if ((platform as any)?.whatsappNumber) {
        const message = `مرحباً، تم تأكيد طلبي رقم #${order?.orderNumber} بنجاح\n\nتفاصيل الطلب:\nالاسم: ${order?.customerName}\nالهاتف: ${order?.customerPhone}\nالعنوان: ${order?.customerAddress}, ${order?.customerGovernorate}\nالمبلغ: ${parseFloat(order?.totalAmount || order?.total || 0).toLocaleString()} د.ع\n\nشكراً لكم`;
        
        // تنسيق رقم WhatsApp (إزالة الصفر وإضافة كود الدولة إذا لزم الأمر)
        let whatsappNumber = (platform as any).whatsappNumber;
        if (whatsappNumber.startsWith('07')) {
          whatsappNumber = '964' + whatsappNumber.substring(1);
        } else if (whatsappNumber.startsWith('+964')) {
          whatsappNumber = whatsappNumber.substring(1);
        } else if (!whatsappNumber.startsWith('964')) {
          whatsappNumber = '964' + whatsappNumber;
        }
        
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        // فتح WhatsApp بعد تأخير قصير ليتمكن المستخدم من رؤية رسالة النجاح
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1500);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      setShowConfirmationModal(false);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تأكيد الطلب",
        variant: "destructive",
      });
    }
  });

  const requestCallMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest(`/api/orders/${orderId}/status`, "PATCH", { status: "processing" });
    },
    onSuccess: () => {
      // توجيه العميل مباشرة إلى واتساب صاحب المنصة
      if ((platform as any)?.whatsappNumber) {
        const message = `مرحباً، أرجو الاتصال بي بخصوص طلبي رقم #${order?.orderNumber}\n\nتفاصيل الطلب:\nالاسم: ${order?.customerName}\nالهاتف: ${order?.customerPhone}\nالعنوان: ${order?.customerAddress}, ${order?.customerGovernorate}\nالمبلغ: ${parseFloat(order?.totalAmount || order?.total || 0).toLocaleString()} د.ع`;
        
        // تنسيق رقم WhatsApp (إزالة الصفر وإضافة كود الدولة إذا لزم الأمر)
        let whatsappNumber = (platform as any).whatsappNumber;
        if (whatsappNumber.startsWith('07')) {
          whatsappNumber = '964' + whatsappNumber.substring(1);
        } else if (whatsappNumber.startsWith('+964')) {
          whatsappNumber = whatsappNumber.substring(1);
        } else if (!whatsappNumber.startsWith('964')) {
          whatsappNumber = '964' + whatsappNumber;
        }
        
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
      
      toast({
        title: "تم التوجيه إلى WhatsApp",
        description: "تم فتح محادثة WhatsApp مع صاحب المتجر",
      });
      setShowConfirmationModal(false);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في فتح WhatsApp",
        variant: "destructive",
      });
    }
  });

  // إظهار بوب آب التأكيد بعد 5 ثواني
  useEffect(() => {
    if (order && orderId) {
      const timer = setTimeout(() => {
        setShowConfirmationModal(true);
      }, 5000); // 5 ثواني

      return () => clearTimeout(timer);
    }
  }, [order, orderId]);

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
          console.log("WhatsApp message sending failed silently");
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [order, orderId, messageSent, toast]);





  // دالة تتبع حدث الشراء المكتمل
  const trackPurchaseEvent = () => {
    if (!order) return null;

    // استخدام القيمة بالدينار العراقي مباشرة - سيتم التحويل في الخادم
    const orderValueIQD = parseFloat(order.totalAmount || order.total || "0");
    
    console.log("💰 Order value (IQD):", orderValueIQD, "د.ع");

    // استخراج الاسم الأول والأخير من اسم العميل
    const nameParts = order.customerName.split(' ');
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
        const parts = order.offer.split(' - ');
        productName = parts[0] || 'منتج';
      } else {
        productName = 'منتج';
      }
    }
    
    // Fallback إذا لم يتم العثور على اسم منتج
    if (!productName) {
      productName = 'منتج';
    }
    
    const productCategory = order.category_name || order.product_category || order.productDetails?.categoryName || 'منتجات';
    const productId = order.productDetails?.id || order.landingPageId || order.id;
    
    console.log("🎯 Product tracking info:", {
      productName,
      productCategory, 
      productId,
      orderProductDetails: order.productDetails,
      offer: order.offer
    });
    
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
    
    console.log("🔢 Extracted quantity from offer:", offer, "->", quantity);

    return {
      content_name: productName,
      content_category: productCategory,
      content_ids: [productId],
      value: orderValueIQD,
      currency: 'IQD',
      quantity: quantity,
      transaction_id: order.id,
      order_number: order.orderNumber,
      landing_page_id: order.landingPageId,
      customer_email: order.customerEmail || order.email || '',
      customer_phone: order.customerPhone,
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_city: order.customerAddress,
      customer_state: order.customerGovernorate,
      customer_country: 'IQ', // ISO country code for Iraq
      external_id: order.id,
      action_source: 'website'
    };
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
    <div className="min-h-screen bg-gradient-to-br from-theme-primary via-theme-secondary to-theme-accent py-8 px-4">
      {/* تتبع البكسلات لحدث الشراء المكتمل - فقط للطلبات الجديدة */}
      {order && trackPurchaseEvent() && order.status === 'pending' && !localStorage.getItem(`pixel_tracked_${orderId}`) && (
        <PixelTracker 
          platformId={order.platformId}
          eventType="purchase"
          eventData={trackPurchaseEvent()!}
        />
      )}
      
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header - رسالة النجاح الرئيسية */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">تم إرسال طلبك بنجاح!</h1>
            <p className="text-green-100 text-lg">شكراً لثقتك بنا</p>
          </div>
          <CardContent className="p-8 text-center">
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              مرحباً <span className="font-bold text-green-600">{order.customerName}</span>! 
              <br />تم استلام طلبك وسنتواصل معك خلال 24 ساعة لتأكيد الطلب وترتيب التوصيل.
            </p>
            
            {/* رقم الطلب مع إمكانية النسخ */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">رقم طلبك للمتابعة</p>
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <p className="text-3xl font-bold text-gray-800">#{order.orderNumber}</p>
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
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-bold text-gray-800">
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
                  <p className="font-medium text-gray-800">الاسم الكامل</p>
                  <p className="text-gray-600">{order.customerName}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">رقم الهاتف</p>
                  <p className="text-gray-600 font-mono">{order.customerPhone}</p>
                </div>
              </div>
              
              {order.customerEmail && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">البريد الإلكتروني</p>
                    <p className="text-gray-600 text-sm">{order.customerEmail}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">عنوان التوصيل</p>
                  <p className="text-gray-600">{order.customerAddress}</p>
                  <p className="text-gray-500 text-sm font-medium">{order.customerGovernorate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل الطلب المالية */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-bold text-gray-800">
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
                  <p className="font-medium text-gray-800">المنتج المطلوب</p>
                  <p className="text-gray-600">{order.productDetails?.name || 'منتج غير محدد'}</p>
                  {order.offer && (
                    <p className="text-gray-500 text-sm">العرض: {order.offer}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">المبلغ الفرعي</p>
                  <p className="text-gray-600 font-mono">{formatCurrency(parseFloat(order.subtotal || order.totalAmount || order.total))}</p>
                </div>
              </div>
              
              {order.discountAmount && parseFloat(order.discountAmount) > 0 && (
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">خصم</p>
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
                  <p className="font-bold text-gray-800 text-lg">المبلغ الإجمالي</p>
                  <p className="text-green-700 font-bold text-xl font-mono">{formatCurrency(parseFloat(order.totalAmount || order.total))}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">تاريخ الطلب</p>
                  <p className="text-gray-600 text-sm">{new Date(order.createdAt).toLocaleString('ar-IQ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ملاحظات إضافية */}
        {order.notes && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-bold text-gray-800">
                <MessageCircle className="ml-2 text-purple-600" />
                ملاحظات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-gray-700 leading-relaxed">{order.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الخطوات التالية */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg font-bold text-gray-800">
              <Truck className="ml-2 text-orange-600" />
              الخطوات التالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold shrink-0">1</div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">مراجعة وتأكيد الطلب</p>
                  <p className="text-gray-600 text-sm leading-relaxed">سيقوم فريقنا بمراجعة طلبك والتأكد من توفر المنتج خلال الساعات القليلة القادمة</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">2</div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">الاتصال للتأكيد</p>
                  <p className="text-gray-600 text-sm leading-relaxed">سنتصل بك على رقم {order.customerPhone} خلال 24 ساعة لتأكيد تفاصيل الطلب والعنوان</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold shrink-0">3</div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">التوصيل</p>
                  <p className="text-gray-600 text-sm leading-relaxed">سيتم توصيل طلبك إلى العنوان المحدد في {order.customerGovernorate} خلال 2-5 أيام عمل</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold shrink-0">4</div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">الدفع عند الاستلام</p>
                  <p className="text-gray-600 text-sm leading-relaxed">ادفع مبلغ {formatCurrency(parseFloat(order.total))} عند استلام المنتج</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* أزرار الإجراءات */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                onClick={() => {
                  if ((platform as any)?.subdomain) {
                    window.location.href = `/${(platform as any).subdomain}`;
                  } else {
                    window.location.href = "/";
                  }
                }} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
              >
                <ExternalLink className="w-5 h-5 ml-2" />
                تصفح منتجات أخرى
              </Button>
              
              <Button 
                onClick={() => {
                  const shareText = `تم تأكيد طلبي رقم #${order.orderNumber} بقيمة ${formatCurrency(parseFloat(order.total))} د.ع`;
                  if (navigator.share) {
                    navigator.share({ title: "تأكيد الطلب", text: shareText });
                  } else {
                    navigator.clipboard.writeText(shareText);
                    toast({ title: "تم النسخ", description: "تم نسخ تفاصيل الطلب" });
                  }
                }}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
              >
                <Copy className="w-5 h-5 ml-2" />
                مشاركة تفاصيل الطلب
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* بوب آب تأكيد الطلب */}
      <OrderConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        orderNumber={order?.orderNumber || ""}
        customerPhone={order?.customerPhone || ""}
        orderStatus={order?.status || "pending"}
        onConfirmOrder={() => {
          if (orderId) {
            confirmOrderMutation.mutate(orderId);
          }
        }}
        onRequestCall={() => {
          if (orderId) {
            requestCallMutation.mutate(orderId);
          }
        }}
      />
    </div>
  );
}