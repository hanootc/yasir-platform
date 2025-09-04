import { useEffect, useState, useRef } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw, 
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import PixelTracker from '@/components/PixelTracker';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrls: string[];
  category?: string;
  stock?: number;
  specifications?: Record<string, string>;
  priceOffers?: Array<{
    label: string;
    price: number;
    quantity: number;
    isDefault: boolean;
  }>;
}

interface ProductColor {
  id: string;
  colorName: string;
  colorCode: string;
  colorImageUrl?: string;
  isActive: boolean;
}

interface ProductShape {
  id: string;
  shapeName: string;
  shapeDescription: string;
  shapeImageUrl?: string;
  isActive: boolean;
}

interface ProductSize {
  id: string;
  sizeName: string;
  sizeValue: string;
  sizeDescription?: string;
  isActive: boolean;
}

interface LandingPage {
  id: string;
  slug: string;
  productId: string;
  templateId: string;
  businessName: string;
  businessLogo?: string;
  contactPhone: string;
  contactEmail: string;
  whatsappNumber: string;
  address: string;
  workingHours: string;
  deliveryInfo: string;
  returnPolicy: string;
  warrantyInfo: string;
  paymentMethods: string[];
  socialLinks?: Record<string, string>;
  testimonials?: Array<{
    name: string;
    rating: number;
    comment: string;
    avatar?: string;
  }>;
  offers?: Array<{
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    discount?: number;
  }>;
  platformId: string;
}

interface OrderFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerGovernorate: string;
  customerAddress: string;
  selectedOffer: string;
  quantity: number;
  notes: string;
  selectedColorId: string;
  selectedShapeId: string;
  selectedSizeId: string;
}

export default function ProductLanding() {
  const [match, params] = useRoute('/product/:slug');
  const slug = params?.slug;
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerGovernorate: '',
    customerAddress: '',
    selectedOffer: '',
    quantity: 1,
    notes: '',
    selectedColorId: '',
    selectedShapeId: '',
    selectedSizeId: ''
  });

  const { toast } = useToast();

  // جلب بيانات صفحة الهبوط
  const { data: landingPage, isLoading: landingLoading } = useQuery<LandingPage>({
    queryKey: ['/api/landing', slug],
    enabled: !!slug,
  });

  // جلب بيانات المنتج
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['/api/products', landingPage?.productId],
    enabled: !!landingPage?.productId,
  });

  // تعيين العرض الافتراضي عند تحميل المنتج
  useEffect(() => {
    if (product?.priceOffers && Array.isArray(product.priceOffers) && product.priceOffers.length > 0 && !formData.selectedOffer) {
      const defaultOffer = product.priceOffers.find(offer => offer.isDefault) || product.priceOffers[0];
      setFormData(prev => ({
        ...prev,
        selectedOffer: `${defaultOffer.label} - ${formatCurrency(defaultOffer.price)}`
      }));
    }
  }, [product, formData.selectedOffer]);

  // جلب ألوان المنتج
  const { data: productColors = [], isLoading: colorsLoading } = useQuery<ProductColor[]>({
    queryKey: [`/api/products/${landingPage?.productId}/colors`],
    enabled: !!landingPage?.productId,
  });

  // جلب أشكال المنتج
  const { data: productShapes = [], isLoading: shapesLoading } = useQuery<ProductShape[]>({
    queryKey: [`/api/products/${landingPage?.productId}/shapes`],
    enabled: !!landingPage?.productId,
  });

  // جلب أحجام المنتج
  const { data: productSizes = [], isLoading: sizesLoading } = useQuery<ProductSize[]>({
    queryKey: [`/api/products/${landingPage?.productId}/sizes`],
    enabled: !!landingPage?.productId,
  });

  const isLoading = landingLoading || productLoading;

  // تصحيح الأخطاء - طباعة البيانات في وحدة التحكم
  useEffect(() => {
    console.log('🔍 Debug Info:', {
      slug,
      landingPage: landingPage?.id,
      productId: landingPage?.productId,
      productColors: productColors?.length,
      productShapes: productShapes?.length,
      productSizes: productSizes?.length,
      colorsLoading,
      shapesLoading,
      sizesLoading,
      actualColors: productColors,
      actualShapes: productShapes,
      actualSizes: productSizes
    });
  }, [slug, landingPage, productColors, productShapes, productSizes, colorsLoading, shapesLoading, sizesLoading]);

  // تتبع مشاهدة الصفحة
  useEffect(() => {
    if (landingPage && product) {
      // تتبع مشاهدة المحتوى
      trackEvent('view_content');
    }
  }, [landingPage, product]);

  // دالة تتبع الأحداث
  const trackEvent = (eventType: any, additionalData = {}) => {
    if (!landingPage || !product) return;

    const eventData = {
      content_name: product.name,
      content_category: product.category,
      content_ids: [product.id],
      value: product.price,
      currency: 'IQD',
      landing_page_id: landingPage.id,
      product_id: product.id,
      ...additionalData
    };

    // لا نحتاج للتشغيل اليدوي، PixelTracker سيعمل تلقائياً

    return eventData;
  };



  // التعامل مع إضافة للسلة
  const handleAddToCart = () => {
    setShowOrderForm(true);
    trackEvent('add_to_cart', { quantity: formData.quantity });
  };

  // التعامل مع تقديم الطلب
  const handleSubmitOrder = async () => {
    console.log("🚀 بدء تشغيل handleSubmitOrder");
    console.log("🔍 بيانات النموذج الحالية:", formData);
    console.log("📄 صفحة الهبوط:", landingPage?.id);
    console.log("📦 المنتج:", product?.id);
    
    if (!landingPage || !product) {
      console.log("❌ فشل: لا توجد صفحة هبوط أو منتج");
      return;
    }

    // التحقق من صحة البيانات
    if (!formData.customerName.trim() || !formData.customerPhone.trim() || 
        !formData.customerAddress.trim() || !formData.selectedOffer ||
        !formData.customerGovernorate) {
      
      console.log("❌ فشل التحقق من البيانات:", {
        name: !!formData.customerName.trim(),
        phone: !!formData.customerPhone.trim(), 
        address: !!formData.customerAddress.trim(),
        offer: !!formData.selectedOffer,
        governorate: !!formData.customerGovernorate
      });
      
      toast({
        title: "خطأ في البيانات",
        description: "يرجى تعبئة جميع الحقول المطلوبة (الاسم، الهاتف، المحافظة، العنوان، واختيار العرض)",
        variant: "destructive"
      });
      return;
    }

    console.log("✅ تم التحقق من البيانات بنجاح، جاري إرسال الطلب...");

    setIsSubmitting(true);
    
    try {
      // تتبع بداية عملية الشراء
      trackEvent('initiate_checkout', { quantity: formData.quantity });

      // إرسال الطلب
      const orderResponse = await apiRequest('/api/landing-page-orders', {
        method: 'POST',
        body: {
          productId: product.id,
          landingPageId: landingPage.id,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          customerGovernorate: formData.customerGovernorate,
          customerAddress: formData.customerAddress,
          offer: formData.selectedOffer,
          quantity: formData.quantity,
          notes: formData.notes,
          selectedColorId: formData.selectedColorId || null,
          selectedShapeId: formData.selectedShapeId || null,
          selectedSizeId: formData.selectedSizeId || null,
          platformId: landingPage.platformId
        }
      });

      // تتبع إتمام الشراء
      // البحث عن العرض المختار من نظام العروض الجديد
      const selectedOfferData = product?.priceOffers?.find(offer => 
        formData.selectedOffer.includes(offer.label)
      );
      trackEvent('purchase', { 
        quantity: selectedOfferData?.quantity || formData.quantity,
        value: selectedOfferData?.price || product.price,
        transaction_id: Date.now().toString()
      });

      // تتبع الليد
      trackEvent('lead', {
        lead_type: 'product_order',
        contact_method: 'form'
      });

      toast({
        title: "تم إرسال الطلب",
        description: "سيتم التواصل معك خلال 24 ساعة لتأكيد الطلب",
      });

      // إعادة تعيين النموذج
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerGovernorate: '',
        customerAddress: '',
        selectedOffer: '',
        quantity: 1,
        notes: '',
        selectedColorId: '',
        selectedShapeId: '',
        selectedSizeId: ''
      });
      setShowOrderForm(false);

    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "خطأ في إرسال الطلب",
        description: "حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // التعامل مع الاتصال بالواتساب
  const handleWhatsAppContact = () => {
    if (landingPage?.whatsappNumber && product) {
      const message = `مرحباً، أنا مهتم بـ ${product.name} من موقعكم`;
      const whatsappUrl = `https://wa.me/${landingPage.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      trackEvent('lead', {
        lead_type: 'whatsapp_contact',
        contact_method: 'whatsapp'
      });
    }
  };

  // التعامل مع الاتصال الهاتفي
  const handlePhoneContact = () => {
    if (landingPage?.contactPhone) {
      window.location.href = `tel:${landingPage.contactPhone}`;
      
      trackEvent('lead', {
        lead_type: 'phone_contact',
        contact_method: 'phone'
      });
    }
  };

  if (!match || !slug) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">رابط غير صحيح</h3>
            <p className="text-gray-600">لم يتم العثور على الصفحة المطلوبة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-300 rounded-lg"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-300 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!landingPage || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل المنتج</h3>
            <p className="text-gray-600">تعذر العثور على المنتج أو صفحة الهبوط</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* تتبع البكسلات */}
      <PixelTracker 
        platformId={landingPage.platformId}
        eventType="view_content"
        eventData={{
          content_name: product.name,
          content_category: product.category,
          content_ids: [product.id],
          value: (() => {
            const defaultOffer = product?.priceOffers?.find((offer: any) => offer.isDefault) || product?.priceOffers?.[0];
            return defaultOffer ? defaultOffer.price : product.price;
          })(),
          currency: 'USD',
          landing_page_id: landingPage.id,
          product_id: product.id
        }}
      />

      {/* Header */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-300">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm text-yellow-100">4.9</span>
            </div>
            <div className="flex items-center gap-3">
              {landingPage.businessLogo && (
                <img 
                  src={landingPage.businessLogo} 
                  alt="شعار المتجر"
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <div className="text-right">
                <h1 className="text-lg font-bold">{landingPage.businessName}</h1>
                <p className="text-sm text-blue-100">جودة مضمونة وخدمة ممتازة</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-white">
                  {product.imageUrls.length > 0 ? (
                    <img
                      src={product.imageUrls[selectedImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span>لا توجد صورة</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Thumbnail Images */}
            {product.imageUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index 
                        ? 'border-blue-500' 
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center gap-1">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">(4.9)</span>
                </div>
              </div>
              
              {product.category && (
                <Badge variant="secondary" className="mb-4">
                  {product.category}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {/* عرض سعر العرض الافتراضي أو السعر الأساسي */}
              {(() => {
                const defaultOffer = product?.priceOffers?.find((offer: any) => offer.isDefault) || product?.priceOffers?.[0];
                const displayPrice = defaultOffer ? defaultOffer.price : product.price;
                
                return (
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(displayPrice)}
                  </div>
                );
              })()}
              
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="flex items-center gap-2">
                  <span className="text-lg text-gray-500 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <Badge variant="destructive">
                    وفر {Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </Badge>
                </div>
              )}
            </div>

            <div className="prose text-gray-700">
              <p>{product.description}</p>
            </div>

            {/* Offers - نظام العروض الجديد */}
            {product?.priceOffers && Array.isArray(product.priceOffers) && product.priceOffers.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">العروض المتاحة</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.priceOffers.map((offer, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg transition-all ${
                        offer.isDefault 
                          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300' 
                          : 'bg-green-50 border-green-200 hover:bg-green-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-semibold ${offer.isDefault ? 'text-blue-800' : 'text-green-800'}`}>
                            {offer.label}
                          </h4>
                          <p className={`text-sm mt-1 ${offer.isDefault ? 'text-blue-700' : 'text-green-700'}`}>
                            كمية: {offer.quantity} قطعة
                          </p>
                          {offer.isDefault && (
                            <span className="inline-block mt-1 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                              العرض الافتراضي
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${offer.isDefault ? 'text-blue-600' : 'text-green-600'}`}>
                            {formatCurrency(offer.price)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(Math.round(offer.price / offer.quantity))} للقطعة الواحدة
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* خيارات المنتج */}
            {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">خيارات المنتج</h3>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* اختيار اللون */}
                  {productColors.length > 0 && (
                    <div>
                      <Label className="text-base font-medium mb-3 block">اللون المتاح</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {productColors
                          .filter(color => color.isActive)
                          .map((color) => (
                          <div
                            key={color.id}
                            className="p-3 border rounded-lg text-center bg-white hover:shadow-md transition-all cursor-pointer"
                          >
                            {color.colorImageUrl && (
                              <img
                                src={color.colorImageUrl}
                                alt={color.colorName}
                                className="w-8 h-8 rounded-full mx-auto mb-2 object-cover"
                              />
                            )}
                            <div 
                              className="w-6 h-6 rounded-full mx-auto mb-2 border border-gray-300"
                              style={{ backgroundColor: color.colorCode }}
                            />
                            <span className="text-sm font-medium">{color.colorName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* اختيار الشكل */}
                  {productShapes.length > 0 && (
                    <div>
                      <Label className="text-base font-medium mb-3 block">الشكل المتاح</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {productShapes
                          .filter(shape => shape.isActive)
                          .map((shape) => (
                          <div
                            key={shape.id}
                            className="p-4 border rounded-lg text-center bg-white hover:shadow-md transition-all cursor-pointer"
                          >
                            {shape.shapeImageUrl && (
                              <img
                                src={shape.shapeImageUrl}
                                alt={shape.shapeName}
                                className="w-12 h-12 rounded mx-auto mb-2 object-cover"
                              />
                            )}
                            <div className="text-sm font-medium">{shape.shapeName}</div>
                            {shape.shapeDescription && (
                              <div className="text-xs text-gray-500 mt-1">{shape.shapeDescription}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* اختيار الحجم */}
                  {productSizes.length > 0 && (
                    <div>
                      <Label className="text-base font-medium mb-3 block">الحجم المتاح</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {productSizes
                          .filter(size => size.isActive)
                          .map((size) => (
                          <div
                            key={size.id}
                            className="p-3 border rounded-lg text-center bg-white hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="text-sm font-medium">{size.sizeName}</div>
                            <div className="text-xs text-gray-500 uppercase">{size.sizeValue}</div>
                            {size.sizeDescription && (
                              <div className="text-xs text-gray-400 mt-1" title={size.sizeDescription}>
                                {size.sizeDescription.substring(0, 20)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <strong>ملاحظة:</strong> يمكنك اختيار الخيارات المرغوبة عند الطلب في النموذج التالي
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button 
                onClick={handleAddToCart}
                size="lg" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                اطلب الآن
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleWhatsAppContact}
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <MessageCircle className="w-4 h-4 ml-2" />
                  واتساب
                </Button>
                <Button
                  onClick={handlePhoneContact}
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Phone className="w-4 h-4 ml-2" />
                  اتصل بنا
                </Button>
              </div>
            </div>

            {/* Business Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-green-600" />
                  <span>{landingPage.deliveryInfo}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>{landingPage.returnPolicy}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>{landingPage.warrantyInfo}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>{landingPage.workingHours}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{landingPage.address}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testimonials */}
        {landingPage.testimonials && landingPage.testimonials.length > 0 && (
          <Card className="mt-12">
            <CardHeader>
              <h3 className="text-xl font-bold text-center">آراء العملاء</h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {landingPage.testimonials.map((testimonial, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="flex text-yellow-400">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{testimonial.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Form Modal/Overlay */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <h3 className="text-xl font-bold">اطلب {product.name}</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">الاسم الكامل *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">رقم الهاتف *</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    placeholder="07XX-XXX-XXXX"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerEmail">البريد الإلكتروني</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerGovernorate">المحافظة *</Label>
                  <Select
                    value={formData.customerGovernorate}
                    onValueChange={(value) => setFormData({...formData, customerGovernorate: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المحافظة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="بغداد">بغداد</SelectItem>
                      <SelectItem value="البصرة">البصرة</SelectItem>
                      <SelectItem value="أربيل">أربيل</SelectItem>
                      <SelectItem value="النجف">النجف</SelectItem>
                      <SelectItem value="كركوك">كركوك</SelectItem>
                      <SelectItem value="السليمانية">السليمانية</SelectItem>
                      <SelectItem value="الأنبار">الأنبار</SelectItem>
                      <SelectItem value="دهوك">دهوك</SelectItem>
                      <SelectItem value="كربلاء">كربلاء</SelectItem>
                      <SelectItem value="بابل">بابل</SelectItem>
                      <SelectItem value="نينوى">نينوى</SelectItem>
                      <SelectItem value="واسط">واسط</SelectItem>
                      <SelectItem value="صلاح الدين">صلاح الدين</SelectItem>
                      <SelectItem value="القادسية">القادسية</SelectItem>
                      <SelectItem value="ذي قار">ذي قار</SelectItem>
                      <SelectItem value="المثنى">المثنى</SelectItem>
                      <SelectItem value="ديالى">ديالى</SelectItem>
                      <SelectItem value="ميسان">ميسان</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerAddress">العنوان التفصيلي *</Label>
                <Textarea
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                  placeholder="أدخل عنوانك التفصيلي (المنطقة، الشارع، رقم البيت)"
                  rows={3}
                />
              </div>

              {/* خيارات المنتج: الألوان والأشكال والأحجام */}
              {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">خيارات المنتج</Label>
                  
                  {/* اختيار اللون */}
                  {productColors.length > 0 && (
                    <div>
                      <Label htmlFor="selectedColor">اللون</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                        {productColors
                          .filter(color => color.isActive)
                          .map((color) => (
                          <div
                            key={color.id}
                            onClick={() => setFormData({...formData, selectedColorId: color.id})}
                            className={`
                              cursor-pointer p-3 border-2 rounded-lg text-center transition-all
                              ${formData.selectedColorId === color.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            {color.colorImageUrl && (
                              <img
                                src={color.colorImageUrl}
                                alt={color.colorName}
                                className="w-8 h-8 rounded-full mx-auto mb-2 object-cover"
                              />
                            )}
                            <div 
                              className="w-6 h-6 rounded-full mx-auto mb-2 border border-gray-300"
                              style={{ backgroundColor: color.colorCode }}
                            />
                            <span className="text-sm font-medium">{color.colorName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* اختيار الشكل */}
                  {productShapes.length > 0 && (
                    <div>
                      <Label htmlFor="selectedShape">الشكل</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {productShapes
                          .filter(shape => shape.isActive)
                          .map((shape) => (
                          <div
                            key={shape.id}
                            onClick={() => setFormData({...formData, selectedShapeId: shape.id})}
                            className={`
                              cursor-pointer p-3 border-2 rounded-lg text-center transition-all
                              ${formData.selectedShapeId === shape.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            {shape.shapeImageUrl && (
                              <img
                                src={shape.shapeImageUrl}
                                alt={shape.shapeName}
                                className="w-12 h-12 rounded mx-auto mb-2 object-cover"
                              />
                            )}
                            <div className="text-sm font-medium">{shape.shapeName}</div>
                            {shape.shapeDescription && (
                              <div className="text-xs text-gray-500 mt-1">{shape.shapeDescription}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* اختيار الحجم */}
                  {productSizes.length > 0 && (
                    <div>
                      <Label htmlFor="selectedSize">الحجم</Label>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-2">
                        {productSizes
                          .filter(size => size.isActive)
                          .map((size) => (
                          <div
                            key={size.id}
                            onClick={() => setFormData({...formData, selectedSizeId: size.id})}
                            className={`
                              cursor-pointer p-3 border-2 rounded-lg text-center transition-all
                              ${formData.selectedSizeId === size.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <div className="text-sm font-medium">{size.sizeName}</div>
                            <div className="text-xs text-gray-500 uppercase">{size.sizeValue}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {product?.priceOffers && Array.isArray(product.priceOffers) && product.priceOffers.length > 0 && (
                <div>
                  <Label htmlFor="selectedOffer">اختر العرض *</Label>
                  <Select
                    value={formData.selectedOffer}
                    onValueChange={(value) => setFormData({...formData, selectedOffer: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العرض المناسب" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.priceOffers.map((offer, index) => (
                        <SelectItem key={index} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                          <div className="flex items-center justify-between w-full">
                            <span>{offer.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">({offer.quantity} قطعة)</span>
                              <span className="font-semibold">{formatCurrency(offer.price)}</span>
                              {offer.isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">افتراضي</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="أي ملاحظات أو طلبات خاصة"
                  rows={2}
                />
              </div>

              <Separator />

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderForm(false)}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => {
                    console.log("🔥 تم الضغط على زر إرسال الطلب!");
                    handleSubmitOrder();
                  }}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      تأكيد الطلب
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}