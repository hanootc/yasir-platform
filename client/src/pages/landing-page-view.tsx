import { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getTemplateById } from "@/lib/landingPageTemplates";
import { iraqGovernorates } from "@/lib/iraqGovernorates";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertLandingPageOrderSchema } from "@shared/schema";
import { ChevronLeft, ChevronRight, User, Phone, MapPin, Home, MessageSquare, Package, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import PixelTracker from "@/components/PixelTracker";
import { ImageModal } from "@/components/ImageModal";

// دالة لتحويل الروابط الخاصة إلى روابط عامة
function convertToPublicUrls(urls: string[]): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  
  return urls.map(url => {
    if (!url) return url;
    
    // إذا كان الرابط يبدأ بـ /objects/ فحوله إلى /public-objects/
    if (url.startsWith('/objects/')) {
      return url.replace('/objects/', '/public-objects/');
    }
    
    return url;
  });
}

// دالة لحساب العروض المتاحة للمنتج
function getAvailableOffers(product: any) {
  if (!product) return [];
  
  // استخدام نظام العروض الجديد priceOffers إذا كان متوفراً
  if (product.priceOffers && Array.isArray(product.priceOffers) && product.priceOffers.length > 0) {
    return product.priceOffers.map((offer: any, index: number) => ({
      id: `offer-${index}`,
      label: offer.label,
      price: parseFloat(offer.price),
      quantity: offer.quantity,
      savings: 0,
      isDefault: offer.isDefault || false
    })).filter((offer: any) => offer.price > 0);
  }
  
  // النظام القديم كـ fallback
  const offers = [];
  
  // عرض قطعة واحدة (السعر الرئيسي)
  if (product.price) {
    offers.push({
      id: 'single',
      label: 'قطعة واحدة',
      price: parseFloat(product.price),
      quantity: 1,
      savings: 0,
      isDefault: true
    });
  }
  
  // عرض قطعتين
  if (product.twoItemPrice) {
    const regularPrice = product.price ? parseFloat(product.price) * 2 : 0;
    offers.push({
      id: 'two',
      label: 'قطعتان',
      price: parseFloat(product.twoItemPrice),
      quantity: 2,
      savings: regularPrice - parseFloat(product.twoItemPrice),
      isDefault: false
    });
  }
  
  // عرض ثلاث قطع
  if (product.threeItemPrice) {
    const regularPrice = product.price ? parseFloat(product.price) * 3 : 0;
    offers.push({
      id: 'three',
      label: 'ثلاث قطع',
      price: parseFloat(product.threeItemPrice),
      quantity: 3,
      savings: regularPrice - parseFloat(product.threeItemPrice),
      isDefault: false
    });
  }
  
  // العرض الجماعي
  if (product.bulkPrice && product.bulkMinQuantity) {
    const regularPrice = product.price ? parseFloat(product.price) * product.bulkMinQuantity : 0;
    offers.push({
      id: 'bulk',
      label: `${product.bulkMinQuantity} قطع أو أكثر (عرض جماعي)`,
      price: parseFloat(product.bulkPrice),
      quantity: product.bulkMinQuantity,
      savings: regularPrice - parseFloat(product.bulkPrice),
      isDefault: false
    });
  }
  
  return offers.filter(offer => offer.price > 0);
}

// نموذج الطلب مع خصائص إضافية
const orderFormSchema = z.object({
  customerName: z.string().min(2, "يجب أن يكون الاسم حرفين على الأقل"),
  customerPhone: z.string().min(10, "يجب أن يكون رقم الهاتف 10 أرقام على الأقل"),
  customerGovernorate: z.string().min(1, "يرجى اختيار المحافظة"),
  customerAddress: z.string().min(5, "يرجى إدخال العنوان بتفصيل"),
  offer: z.string().min(1, "يرجى اختيار العرض"),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

// مكون عرض الصور الإضافية أسفل الوصف
function AdditionalImages({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null;

  return (
    <div className="bg-white">
      <div className="px-4 py-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">صور إضافية للمنتج</h3>
      </div>
      <div className="space-y-4">
        {images.map((image, index) => (
          <div key={index} className="w-full">
            <img 
              src={image}
              alt={`صورة إضافية ${index + 1}`}
              className="w-full h-auto object-cover shadow-md"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// مكون سلايدر الصور المبسط
function ImageSlider({ images, productName, template }: { images: string[], productName: string, template?: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = () => {
    setSelectedIndex(prev => prev > 0 ? prev - 1 : displayImages.length - 1);
  };

  const scrollNext = () => {
    setSelectedIndex(prev => prev < displayImages.length - 1 ? prev + 1 : 0);
  };

  const scrollTo = (index: number) => {
    setSelectedIndex(index);
  };

  // الصور الافتراضية للنماذج
  const getTemplateDefaultImages = (templateId?: string) => {
    const defaultImages = {
      modern_minimal: [
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      bold_hero: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      product_showcase: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      testimonial_focus: [
        'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      feature_highlight: [
        'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      countdown_urgency: [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ],
      video_intro: [
        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ]
    };
    return defaultImages[templateId as keyof typeof defaultImages] || defaultImages.modern_minimal;
  };

  // تحويل مسارات الصور لمسارات عامة يمكن الوصول إليها بدون مصادقة
  const convertToPublicUrls = (imageUrls: string[]) => {
    return imageUrls.map(url => {
      // تحويل مسار الكائنات المحمية إلى مسار عام للصفحات المقصودة
      if (url.startsWith('/objects/')) {
        return url.replace('/objects/', '/public-objects/');
      }
      return url;
    });
  };

  // استخدم الصور المرفوعة فقط إذا كانت موجودة
  const displayImages = (images && images.length > 0) ? convertToPublicUrls(images) : [];

  // إعادة تعيين المؤشر عند تغيير الصور
  useEffect(() => {
    setSelectedIndex(0);
  }, [displayImages.length]);
  


  // إذا لم تكن هناك صور مرفوعة، لا تعرض شيئاً
  if (!displayImages || displayImages.length === 0) {
    return (
      <div className="w-full max-w-sm mx-auto aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>لا توجد صور للمنتج</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto aspect-square">
      <div className="relative w-full h-full">
        <div className="overflow-hidden rounded-2xl shadow-xl w-full h-full">
          <div className="relative w-full h-full">
            <img 
              src={displayImages[selectedIndex]}
              alt={`${productName} - صورة ${selectedIndex + 1}`}
              className="w-full h-full object-cover block"

            />
          </div>
        </div>
        
        {/* أزرار التنقل */}
        {displayImages.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white/90 hover:bg-white z-10 rounded-full shadow-md"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white/90 hover:bg-white z-10 rounded-full shadow-md"
              onClick={scrollNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* عداد الصور */}
        {displayImages.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}

        {/* نقاط التنقل */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {displayImages.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 border-2 border-white ${
                  index === selectedIndex 
                    ? 'bg-white shadow-lg scale-110' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                onClick={() => scrollTo(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails للشاشات الكبيرة */}
      {displayImages.length > 1 && (
        <div className="hidden md:flex justify-center mt-4 gap-3 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                index === selectedIndex 
                  ? 'border-blue-500 shadow-xl ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg'
              }`}
              onClick={() => scrollTo(index)}
            >
              <img 
                src={image}
                alt={`صورة ${index + 1}`}
                className="w-full h-full object-cover"

              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingPageView() {
  // إضافة حماية ضد الأخطاء على الهاتف المحمول
  const [hasError, setHasError] = useState(false);

  // تسجيل للتشخيص
  useEffect(() => {
    console.log('📱 LandingPageView Component Loaded');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('📱 Screen Size:', window.innerWidth, 'x', window.innerHeight);
    console.log('📱 Device Pixel Ratio:', window.devicePixelRatio);
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Expected slug: jhaz-dght-masmy-574523');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Expected slug: jhaz-dght-masmy-574523');
  }, []);

  // Try different route patterns
  const [matchOldRoute, paramsOld] = useRoute("/view-landing/:slug");
  const [matchPlatformRoute, paramsPlatform] = useRoute("/:platform/:slug");
  const [matchProductRoute, paramsProduct] = useRoute("/product/:slug");
  const [, setLocation] = useLocation();

  // Error boundary للقبض على الأخطاء
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('JavaScript Error:', error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // Determine which route matched and get the slug
  const slug = matchOldRoute ? paramsOld?.slug : 
               matchProductRoute ? paramsProduct?.slug : 
               paramsPlatform?.slug;
  const platform = paramsPlatform?.platform;
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedShape, setSelectedShape] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");

  // تسجيل عند تغير حالة النموذج
  useEffect(() => {
    console.log("Order form state changed:", showOrderForm);
  }, [showOrderForm]);
  const [showFixedButton, setShowFixedButton] = useState(true);
  const { toast } = useToast();

  // إزالة الوضع المظلم من صفحات الهبوط نهائياً
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = 'white';
    document.body.style.color = 'black';
    
    // تجاوز متغيرات CSS للحقول في صفحات الهبوط
    const landingPageStyle = document.createElement('style');
    landingPageStyle.setAttribute('id', 'landing-page-override');
    landingPageStyle.innerHTML = `
      /* تجاوز جذري - أعلى أولوية */
      html,
      html *,
      body,
      body * {
        --select-content-background: white !important;
        --select-item-background: white !important;
      }
      /* تجاوز ألوان الحقول في صفحات الهبوط */
      .landing-page-form input,
      .landing-page-form textarea,
      .landing-page-form [role="combobox"],
      input,
      textarea {
        border-color: #d1d5db !important;
        background-color: #f9fafb !important;
        background: #f9fafb !important;
        color: #374151 !important;
      }
      
      /* تجاوز أقوى للحقول */
      * input,
      * textarea,
      html input,
      html textarea,
      body input,
      body textarea {
        background-color: #f9fafb !important;
        background: #f9fafb !important;
        border-color: #d1d5db !important;
        color: #374151 !important;
      }
      
      .landing-page-form input:focus,
      .landing-page-form textarea:focus,
      .landing-page-form [role="combobox"]:focus,
      input:focus,
      textarea:focus {
        border-color: #3b82f6 !important;
        ring-color: #3b82f6 !important;
        outline: 2px solid transparent !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
        background-color: #f9fafb !important;
        background: #f9fafb !important;
      }
      
      .landing-page-form [data-state="open"] {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
      }
      
      /* تجاوز ألوان العناصر الأخرى */
      .landing-page-form label,
      .landing-page-form .text-sm {
        color: #374151 !important;
      }
      
      .landing-page-form button[type="submit"] {
        background-color: #3b82f6 !important;
        border-color: #3b82f6 !important;
        color: white !important;
      }
      
      .landing-page-form button[type="submit"]:hover {
        background-color: #2563eb !important;
        border-color: #2563eb !important;
      }
      
      /* تجاوز dropdown menu */
      .landing-page-form [data-radix-popper-content-wrapper],
      .landing-page-form [data-side="bottom"],
      .landing-page-form [data-radix-select-content],
      .landing-page-form [role="listbox"] {
        background-color: white !important;
        border: 1px solid #d1d5db !important;
        color: #374151 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        border-radius: 0.375rem !important;
      }
      
      .landing-page-form [role="option"],
      .landing-page-form [data-radix-select-item] {
        color: #374151 !important;
        background-color: white !important;
        padding: 0.5rem 0.75rem !important;
      }
      
      .landing-page-form [role="option"]:hover,
      .landing-page-form [data-radix-select-item]:hover,
      .landing-page-form [data-highlighted] {
        background-color: #f3f4f6 !important;
        color: #374151 !important;
      }
      
      .landing-page-form [data-radix-select-item][data-state="checked"] {
        background-color: #dbeafe !important;
        color: #1d4ed8 !important;
      }
      
      /* إزالة أي شفافية من جميع عناصر القوائم */
      .landing-page-form [data-radix-select-content],
      .landing-page-form [data-radix-select-viewport],
      .landing-page-form [data-radix-collection-item] {
        background-color: white !important;
        opacity: 1 !important;
        backdrop-filter: none !important;
      }
      
      /* تجاوز أي CSS من النظام المظلم */
      body:not(.dark) .landing-page-form [data-radix-select-content] {
        background-color: white !important;
        border-color: #d1d5db !important;
      }
      
      /* ضمان ظهور القوائم فوق العناصر الأخرى */
      .landing-page-form [data-radix-select-content] {
        z-index: 999 !important;
      }
      
      /* استهداف محدد لحقل العرض */
      .landing-page-form .max-h-\\[300px\\],
      .landing-page-form [position="popper"],
      body .landing-page-form [data-radix-select-content] {
        background-color: white !important;
        opacity: 1 !important;
        backdrop-filter: none !important;
        border: 1px solid #d1d5db !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* تجاوز أقوى للقوائم المنسدلة */
      body [data-radix-portal] .landing-page-form [data-radix-select-content],
      body [data-radix-portal] [data-side] {
        background-color: white !important;
        border: 1px solid #d1d5db !important;
        backdrop-filter: none !important;
        opacity: 1 !important;
      }
      
      /* CSS عالمي للقوائم في صفحات الهبوط */
      body:not(.dark) [data-radix-select-content] {
        background-color: #f9fafb !important;
        border: 1px solid #d1d5db !important;
        opacity: 1 !important;
        backdrop-filter: none !important;
        color: #374151 !important;
      }
      
      body:not(.dark) [data-radix-select-item] {
        background-color: #f9fafb !important;
        color: #374151 !important;
      }
      
      body:not(.dark) [data-radix-select-item]:hover,
      body:not(.dark) [data-radix-select-item][data-highlighted] {
        background-color: #f3f4f6 !important;
        color: #374151 !important;
      }
      
      /* إزالة أي تأثيرات شفافية أو مرشحات */
      [data-radix-select-content] {
        filter: none !important;
        backdrop-filter: none !important;
        background-image: none !important;
      }
      
      /* تجاوز شامل لجميع عناصر Select في الصفحة */
      * [data-radix-select-content],
      html [data-radix-select-content],
      html body [data-radix-select-content] {
        background-color: #f9fafb !important;
        border: 1px solid #d1d5db !important;
        opacity: 1 !important;
        backdrop-filter: none !important;
        color: #374151 !important;
        z-index: 9999 !important;
      }
      
      /* تجاوز شامل للعناصر داخل Select */
      * [data-radix-select-item],
      html [data-radix-select-item],
      html body [data-radix-select-item] {
        background-color: #f9fafb !important;
        color: #374151 !important;
        opacity: 1 !important;
      }
      
      * [data-radix-select-item]:hover,
      * [data-radix-select-item][data-highlighted] {
        background-color: #f3f4f6 !important;
        color: #374151 !important;
      }
      
      /* CSS عالمي أقوى - يطبق على كامل الصفحة */
      [data-radix-select-content],
      [data-radix-select-viewport],
      [data-radix-collection-item] {
        background-color: #f9fafb !important;
        background: #f9fafb !important;
        backdrop-filter: none !important;
        opacity: 1 !important;
        border: 1px solid #d1d5db !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }
      
      [data-radix-select-item] {
        background-color: #f9fafb !important;
        background: #f9fafb !important;
        color: #374151 !important;
        padding: 8px 12px !important;
        margin: 4px 3px !important;
        border-radius: 4px !important;
      }
      
      [data-radix-select-item]:hover,
      [data-radix-select-item][data-highlighted],
      [data-radix-select-item][data-state="checked"],
      [data-radix-select-item][aria-selected="true"] {
        background-color: #f3f4f6 !important;
        background: #f3f4f6 !important;
        color: #374151 !important;
      }
      
      /* تجاوز نهائي وشامل لكل شيء */
      * {
        --radix-select-content-background-color: white !important;
        --radix-select-item-background-color: white !important;
      }
      
      *[data-radix-select-content],
      *[data-radix-select-viewport],
      *[data-radix-popper-content-wrapper] > *,
      *[role="listbox"],
      *[data-radix-portal] *[data-radix-select-content] {
        background-color: #f9fafb !important;
        background: #f9fafb !important;
        backdrop-filter: none !important;
        opacity: 1 !important;
        border: 1px solid #d1d5db !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        z-index: 99999 !important;
      }
      
      *[data-radix-select-item],
      *[role="option"] {
        background-color: #f9fafb !important;
        background: #f9fafb !important;
        color: #374151 !important;
        opacity: 1 !important;
        padding: 8px 12px !important;
        margin: 4px 3px !important;
        border-radius: 4px !important;
      }
      
      *[data-radix-select-item]:hover,
      *[data-radix-select-item][data-highlighted],
      *[data-radix-select-item][data-state="checked"],
      *[data-radix-select-item][aria-selected="true"],
      *[role="option"]:hover,
      *[role="option"][data-highlighted],
      *[role="option"][aria-selected="true"] {
        background-color: #f3f4f6 !important;
        background: #f3f4f6 !important;
        color: #374151 !important;
      }
    `;
    document.head.appendChild(landingPageStyle);
    
    // مراقبة التغييرات ومنع تطبيق الوضع المظلم + تطبيق أنماط القوائم
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = 'white';
            document.body.style.color = 'black';
          }
        }
        
        // تطبيق أنماط على العناصر المضافة ديناميكياً
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // استهداف عناصر Select المضافة ديناميكياً
              const selectContent = element.querySelector('[data-radix-select-content]') || 
                                   (element.matches('[data-radix-select-content]') ? element : null);
              
              if (selectContent) {
                (selectContent as HTMLElement).style.backgroundColor = '#f9fafb';
                (selectContent as HTMLElement).style.border = '1px solid #d1d5db';
                (selectContent as HTMLElement).style.opacity = '1';
                (selectContent as HTMLElement).style.backdropFilter = 'none';
                (selectContent as HTMLElement).style.zIndex = '99999';
              }
              
              // استهداف عناصر SelectItem
              const selectItems = element.querySelectorAll('[data-radix-select-item]');
              selectItems.forEach((item) => {
                (item as HTMLElement).style.backgroundColor = '#f9fafb';
                (item as HTMLElement).style.color = '#374151';
                (item as HTMLElement).style.opacity = '1';
                (item as HTMLElement).style.padding = '8px 12px';
                (item as HTMLElement).style.margin = '4px 3px';
                (item as HTMLElement).style.borderRadius = '4px';
                
                // تطبيق أنماط الحالات المميزة
                if (item.hasAttribute('data-highlighted') || 
                    item.hasAttribute('data-state') && item.getAttribute('data-state') === 'checked' ||
                    item.hasAttribute('aria-selected') && item.getAttribute('aria-selected') === 'true') {
                  (item as HTMLElement).style.backgroundColor = '#f3f4f6';
                }
              });
              
              // استهداف الحقول الأساسية المضافة ديناميكياً
              const inputs = element.querySelectorAll('input');
              inputs.forEach((input) => {
                (input as HTMLElement).style.backgroundColor = '#f9fafb';
                (input as HTMLElement).style.borderColor = '#d1d5db';
                (input as HTMLElement).style.color = '#374151';
              });
              
              const textareas = element.querySelectorAll('textarea');
              textareas.forEach((textarea) => {
                (textarea as HTMLElement).style.backgroundColor = '#f9fafb';
                (textarea as HTMLElement).style.borderColor = '#d1d5db';
                (textarea as HTMLElement).style.color = '#374151';
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });
    
    // مراقب إضافي لكامل body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      observer.disconnect();
      document.head.removeChild(landingPageStyle);
    };
  }, []);

  // جلب بيانات صفحة الهبوط
  const { data: landingPage, isLoading, error } = useQuery({
    queryKey: ['/api/landing', slug],
    queryFn: async () => {
      console.log('🔍 Fetching landing page with slug:', slug);
      const response = await fetch(`/api/landing/${slug}`);
      console.log('🔍 Landing page response status:', response.status);
      if (!response.ok) {
        throw new Error('Landing page not found');
      }
      const data = await response.json();
      console.log('✅ Landing page data loaded:', data);
      return data;
    },
    enabled: !!slug,
  });

  // جلب بيانات المنتج المرتبط (بدون مصادقة للعرض العام)
  const { data: product } = useQuery({
    queryKey: ['/api/public/products', landingPage?.productId],
    queryFn: async () => {
      if (!landingPage?.productId) return null;
      const response = await fetch(`/api/public/products/${landingPage.productId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!landingPage?.productId,
  });

  // جلب بيانات المنصة لعرض الشعار واسم المتجر
  const { data: platformData } = useQuery({
    queryKey: ['/api/public/platforms', landingPage?.platformId],
    queryFn: async () => {
      if (!landingPage?.platformId) return null;
      const response = await fetch(`/api/public/platforms/${landingPage.platformId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!landingPage?.platformId,
  });

  // جلب ألوان المنتج
  const { data: productColors = [] } = useQuery({
    queryKey: [`/api/products/${landingPage?.productId}/colors`],
    queryFn: async () => {
      if (!landingPage?.productId) return [];
      console.log('🎨 جاري جلب ألوان المنتج:', landingPage.productId);
      const response = await fetch(`/api/products/${landingPage.productId}/colors`);
      if (!response.ok) {
        console.log('❌ فشل في جلب الألوان:', response.status);
        return [];
      }
      const colors = await response.json();
      console.log('✅ الألوان المُحمّلة:', colors);
      console.log('🖼️ صور الألوان:', colors.map((c: any) => ({ name: c.colorName, imageUrl: c.imageUrl })));
      return colors;
    },
    enabled: !!landingPage?.productId,
  });

  // جلب أشكال المنتج
  const { data: productShapes = [] } = useQuery({
    queryKey: [`/api/products/${landingPage?.productId}/shapes`],
    queryFn: async () => {
      if (!landingPage?.productId) return [];
      console.log('🔷 جاري جلب أشكال المنتج:', landingPage.productId);
      const response = await fetch(`/api/products/${landingPage.productId}/shapes`);
      if (!response.ok) {
        console.log('❌ فشل في جلب الأشكال:', response.status);
        return [];
      }
      const shapes = await response.json();
      console.log('✅ الأشكال المُحمّلة:', shapes);
      console.log('🖼️ صور الأشكال:', shapes.map((s: any) => ({ name: s.shapeName, imageUrl: s.imageUrl })));
      return shapes;
    },
    enabled: !!landingPage?.productId,
  });

  // جلب أحجام المنتج
  const { data: productSizes = [] } = useQuery({
    queryKey: [`/api/products/${landingPage?.productId}/sizes`],
    queryFn: async () => {
      if (!landingPage?.productId) return [];
      console.log('📏 جاري جلب أحجام المنتج:', landingPage.productId);
      const response = await fetch(`/api/products/${landingPage.productId}/sizes`);
      if (!response.ok) {
        console.log('❌ فشل في جلب الأحجام:', response.status);
        return [];
      }
      const sizes = await response.json();
      console.log('✅ الأحجام المُحمّلة:', sizes);
      return sizes;
    },
    enabled: !!landingPage?.productId,
  });

  // تهيئة نموذج الطلب
  // تحديث القيم الافتراضية عند تحميل البيانات
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerGovernorate: "",
      customerAddress: "",
      offer: "",
      notes: "",
    },
  });

  // لا حاجة لتحديث معرف الصفحة ومعرف المنتج لأنها ستتم إضافتها في الخادم

  // حساب العروض المتاحة
  const availableOffers = getAvailableOffers(product);
  
  // إضافة console.log للتشخيص
  useEffect(() => {
    console.log('🔍 Product loaded:', product);
    console.log('🔍 Product priceOffers:', product?.priceOffers);
    console.log('🔍 Available offers:', availableOffers);
  }, [product, availableOffers]);

  // تعيين العرض الافتراضي عند تحميل المنتج
  useEffect(() => {
    if (availableOffers.length > 0 && !form.getValues('offer')) {
      const defaultOffer = availableOffers.find(offer => offer.isDefault) || availableOffers[0];
      form.setValue('offer', `${defaultOffer.label} - ${formatCurrency(defaultOffer.price)}`);
    }
  }, [availableOffers, form]);

  // إرسال الطلب
  const submitOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      try {
        console.log("🚀 بدء إرسال الطلب من landing-page-view");
        console.log("📝 بيانات النموذج:", data);
        
        // حساب الكمية من العرض المختار
        const selectedOffer = availableOffers.find(offer => 
          data.offer.includes(offer.label)
        );
        const quantity = selectedOffer?.quantity || 1;
        
        // العثور على كائن الحجم المحدد بناءً على القيمة
        const selectedSizeObject = productSizes?.find(size => size.sizeValue === selectedSize) || null;
        
        const orderData = {
          ...data,
          landingPageId: landingPage?.id,
          productId: landingPage?.productId,
          quantity: quantity, // إضافة الكمية المحسوبة
          // إضافة معلومات المتغيرات المختارة
          selectedColorId: selectedColor?.id || null,
          selectedShapeId: selectedShape?.id || null,
          selectedSizeId: selectedSizeObject?.id || null,
        };
        
        // Debug: طباعة بيانات المتغيرات المرسلة
        console.log("🛒 Order Data with Variants:", {
          selectedColorId: orderData.selectedColorId,
          selectedShapeId: orderData.selectedShapeId,
          selectedSizeId: orderData.selectedSizeId,
          selectedColor: selectedColor,
          selectedShape: selectedShape,
          selectedSizeValue: selectedSize
        });
        
        console.log("📤 إرسال الطلب إلى الخادم...");
        const response = await apiRequest("/api/landing-page-orders", {
          method: "POST",
          body: orderData
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Server response error:", response.status, errorData);
          throw new Error(`خطأ في الخادم: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (newOrder) => {
      toast({
        title: "تم إرسال الطلب!",
        description: "تم إرسال طلبك بنجاح. سنتواصل معك قريباً.",
      });
      form.reset();
      setShowOrderForm(false);
      
      if (newOrder?.id) {
        setLocation(`/thank-you/${newOrder.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإرسال",
        description: error?.message || "حدث خطأ أثناء إرسال الطلب",
        variant: "destructive",
      });
    },
  });

  // دالة لتصميم نموذج الطلب حسب نوع التصميم
  const getFormStyles = () => {
    const baseFieldClasses = "w-full p-3 border rounded-lg focus:ring-2 focus:outline-none";
    const baseButtonClasses = "w-full py-3 text-white font-bold rounded-lg transition-all duration-300";

    switch(landingPage?.template) {
      case "modern_minimal":
        return {
          container: "bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto",
          field: `${baseFieldClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`,
          button: `${baseButtonClasses} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transform hover:scale-105`
        };
      
      case "bold_hero":
        return {
          container: "bg-black/80 backdrop-blur-md rounded-lg border border-yellow-400/30 p-8 w-full max-w-md max-h-[90vh] overflow-y-auto text-white",
          field: `${baseFieldClasses} bg-black/30 border-yellow-400/50 text-white placeholder-gray-300 focus:ring-yellow-400 focus:border-yellow-400`,
          button: `${baseButtonClasses} bg-yellow-400 text-black hover:bg-yellow-300 font-black text-lg animate-pulse`
        };
      
      case "product_showcase":
        return {
          container: "bg-white rounded-lg shadow-md border border-gray-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto",
          field: `${baseFieldClasses} border-gray-300 focus:ring-green-500 focus:border-green-500`,
          button: `${baseButtonClasses} bg-green-600 hover:bg-green-700`
        };
      
      case "testimonial_focus":
        return {
          container: "bg-white rounded-lg shadow-md p-6 w-full max-w-md max-h-[90vh] overflow-y-auto",
          field: `${baseFieldClasses} border-blue-200 focus:ring-blue-500 focus:border-blue-500`,
          button: `${baseButtonClasses} bg-blue-600 hover:bg-blue-700`
        };
      
      case "feature_highlight":
        return {
          container: "bg-white rounded-lg shadow-md border-l-4 border-green-500 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto",
          field: `${baseFieldClasses} border-green-200 focus:ring-green-500 focus:border-green-500`,
          button: `${baseButtonClasses} bg-green-600 hover:bg-green-700`
        };
      
      case "countdown_urgency":
        return {
          container: "bg-black/80 backdrop-blur-md rounded-lg border-2 border-yellow-400 p-8 w-full max-w-md max-h-[90vh] overflow-y-auto text-white",
          field: `${baseFieldClasses} bg-white border-yellow-400 text-gray-900 placeholder-gray-500 focus:ring-yellow-400 focus:border-yellow-400`,
          button: `${baseButtonClasses} bg-yellow-400 text-black hover:bg-yellow-300 font-black animate-bounce`
        };
      
      case "video_intro":
        return {
          container: "bg-white rounded-lg border border-blue-400/30 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-900",
          field: `${baseFieldClasses} bg-white border-blue-300 text-gray-900 placeholder-gray-500 focus:ring-blue-400 focus:border-blue-400`,
          button: `${baseButtonClasses} bg-blue-600 hover:bg-blue-700`
        };
      
      case "comparison_table":
        return {
          container: "bg-white rounded-lg shadow-lg border-t-4 border-green-500 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto",
          field: `${baseFieldClasses} border-gray-300 focus:ring-green-500 focus:border-green-500`,
          button: `${baseButtonClasses} bg-green-600 hover:bg-green-700 font-bold`
        };
      
      case "benefits_grid":
        return {
          container: "bg-white rounded-lg shadow-lg border border-purple-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto",
          field: `${baseFieldClasses} border-purple-200 focus:ring-purple-500 focus:border-purple-500`,
          button: `${baseButtonClasses} bg-purple-600 hover:bg-purple-700`
        };
      
      case "story_driven":
        return {
          container: "bg-white rounded-lg shadow-lg border-l-4 border-amber-500 p-8 w-full max-w-md max-h-[90vh] overflow-y-auto",
          field: `${baseFieldClasses} border-amber-200 focus:ring-amber-500 focus:border-amber-500`,
          button: `${baseButtonClasses} bg-amber-600 hover:bg-amber-700`
        };
      
      default:
        return {
          container: "bg-white rounded-lg shadow-md p-6 w-full max-w-md max-h-[90vh] overflow-y-auto",
          field: `${baseFieldClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`,
          button: `${baseButtonClasses} bg-blue-600 hover:bg-blue-700`
        };
    }
  };

  // إظهار صفحة خطأ إذا حدث خطأ JavaScript
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">خطأ في التحميل</h1>
          <p className="text-gray-600 mb-6">حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // إظهار شاشة تحميل بسيطة للهاتف المحمول
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">صفحة غير موجودة</h1>
          <p className="text-gray-600 mb-6">عذراً، لا يمكن العثور على صفحة الهبوط المطلوبة</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            العودة للخلف
          </button>
        </div>
      </div>
    );
  }

  // رندر صفحة الهبوط حسب النموذج المحدد
  const renderLandingPage = () => {
    const template = getTemplateById(landingPage.template);
    
    if (!template) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">نموذج غير متوفر</h1>
            <p className="text-gray-600">النموذج المحدد لهذه الصفحة غير متوفر حالياً</p>
          </div>
        </div>
      );
    }

    // الحصول على بيانات المنتج
    const productName = (product as any)?.name || landingPage.title;
    const productPrice = (product as any)?.price || "اتصل للاستفسار";
    const productDescription = (product as any)?.description || landingPage.content;



    switch (landingPage.template) {
      case "modern_minimal":
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-sm mx-auto lg:max-w-2xl xl:max-w-4xl">
            {/* Header */}
            <div className="bg-blue-600 text-white rounded-b-2xl sticky top-0 z-40 mt-2 mx-4">
              <div className="max-w-lg mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-300">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fas fa-star text-xs"></i>
                      ))}
                    </div>
                    <span className="text-xs text-yellow-100 mr-1">4.9</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {platformData?.logoUrl ? (
                      <img
                        src={platformData.logoUrl}
                        alt={`${platformData.platformName} شعار`}
                        className="w-10 h-10 rounded-lg object-cover border-2 border-white/30"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const defaultIcon = document.createElement('div');
                            defaultIcon.className = 'w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center';
                            defaultIcon.innerHTML = '<i class="fas fa-store text-white"></i>';
                            parent.appendChild(defaultIcon);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <i className="fas fa-store text-white"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-lg font-bold">{platformData?.platformName || "متجرنا"}</h1>
                      <p className="text-xs text-blue-100">جودة مضمونة وخدمة ممتازة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="bg-white px-4 pt-2 pb-4">
              <div className="max-w-lg mx-auto">
                <ImageSlider 
                  images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                  productName={productName}
                  template={landingPage.template}
                />
              </div>
            </div>

            {/* Price - أسفل السلايدر مباشرة */}
            {productPrice && parseFloat(productPrice) > 0 && (
              <div className="bg-white px-4 pb-6">
                <div className="max-w-lg mx-auto">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 text-center border border-green-200">
                    {/* اسم المنتج */}
                    <h1 className="text-lg font-semibold text-gray-800 mb-3">{productName}</h1>
                    
                    {/* السعر الحالي - الرئيسي */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-xl font-bold text-green-600">{formatCurrency(parseFloat(productPrice))}</span>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-[buttonPulse_2s_ease-in-out_infinite] shadow-lg shadow-red-500/50">
                        🔥 وفر {formatCurrency(5000)}
                      </span>
                    </div>
                    
                    {/* السعر المشطوب أسفل السعر الأصلي */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-sm text-gray-500 line-through">بدلاً من {formatCurrency(parseFloat(productPrice) + 5000)}</span>
                    </div>
                    
                    {/* نص العرض المحدود */}
                    <p className="text-xs text-gray-500">✨ عرض محدود</p>
                  </div>
                </div>
              </div>
            )}



            {/* Order Section */}
            <div className="product-section bg-white mx-4 rounded-lg shadow-sm border p-6">

              {/* Order Form - Fixed in Page */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">إرسال طلب</h3>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => {
                    console.log("🔥🔥🔥 MODERN MINIMAL FORM - تم الضغط على زر الإرسال!");
                    console.log("📝 بيانات النموذج:", data);
                    console.log("🔍 أخطاء النموذج:", form.formState.errors);
                    submitOrderMutation.mutate(data);
                  })} className="space-y-2 landing-page-form">
                    {/* الاسم */}
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input placeholder="ادخل اسمك الكامل" className="pr-10 placeholder:text-gray-400" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* رقم الهاتف */}
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input placeholder="07XX XXX XXXX" className="pr-10 placeholder:text-gray-400" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* العروض */}
                    <FormField
                      control={form.control}
                      name="offer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العرض *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-9">
                                <div className="flex items-center">
                                  <Package className="ml-2 h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="اختر العرض" className="placeholder:text-gray-400" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] overflow-auto z-50 p-0" position="popper" sideOffset={4}>
                                <div className="flex">
                                  {/* قائمة العروض - في اليسار */}
                                  <div className="flex-1">
                                    {availableOffers.length > 0 ? (
                                      availableOffers.map((offer, index) => {
                                        return (
                                          <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                            <div className="flex items-center justify-between w-full gap-3">
                                              <div className="flex flex-col">
                                                <span className="font-medium text-sm">{offer.label}</span>
                                                {offer.savings > 0 && (
                                                  <span className="text-xs text-red-500">توفير {formatCurrency(offer.savings)}</span>
                                                )}
                                              </div>
                                              <span className="text-green-600 font-bold text-sm">{formatCurrency(offer.price)}</span>
                                            </div>
                                          </SelectItem>
                                        );
                                      })
                                    ) : (
                                      <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                        <div className="flex items-center justify-between w-full gap-3">
                                          <span className="font-medium text-sm">قطعة واحدة</span>
                                          <span className="text-green-600 font-bold text-sm">{formatCurrency(parseFloat(product?.price || 0))}</span>
                                        </div>
                                      </SelectItem>
                                    )}
                                  </div>
                                  
                                  {/* قائمة الملصقات - في اليمين */}
                                  <div className="flex flex-col bg-gray-50 border-r w-16 px-1 py-2 gap-2 mt-1">
                                    {availableOffers.length > 0 ? (
                                      availableOffers.map((offer, index) => {
                                        const badgeText = index === 0 ? 'الأولى' : index === 1 ? 'المخفض' : 'أكثر طلباً';
                                        const badgeStyle = index === 0 
                                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                          : index === 1 
                                          ? 'bg-red-100 text-red-800 border-red-200'
                                          : 'bg-green-100 text-green-800 border-green-200';
                                        
                                        return (
                                          <div key={offer.id} className={`flex items-center py-1.5 px-1 text-xs font-medium ${badgeStyle} text-center justify-center border ${index === 0 ? '-mt-1' : index === 1 ? 'mt-0.5' : index === 2 ? 'mt-2' : ''}`}>
                                            {badgeText}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="flex items-center py-1.5 px-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 text-center justify-center">
                                        الأساسي
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                          {field.value && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <p className="text-sm text-green-700">
                                الكمية: {field.value.split(' - ')[0]} - السعر: {field.value.split(' - ')[1]}
                              </p>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* خيارات المنتج */}
                    {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
                      <div className="space-y-3">
                        
                        {/* الألوان المتاحة */}
                        {productColors.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">الألوان المتاحة</div>
                            <div className="flex flex-wrap gap-2">
                              {productColors.map((color: any) => (
                                <button 
                                  key={color.id} 
                                  type="button"
                                  className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                    selectedColor?.id === color.id 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                  title={color.colorName}
                                  onClick={() => setSelectedColor(color)}
                                >
                                  {color.colorImageUrl ? (
                                    <div className="flex items-center gap-2">
                                      <ImageModal
                                        src={color.colorImageUrl.startsWith('/objects/') ? 
                                          color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                          color.colorImageUrl
                                        }
                                        alt={`${color.colorName} - اللون`}
                                      >
                                        <img 
                                          src={color.colorImageUrl.startsWith('/objects/') ? 
                                            color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                            color.colorImageUrl
                                          }
                                          alt={color.colorName}
                                          className="w-12 h-12 object-cover rounded border-2 hover:scale-105 transition-transform"
                                          style={{ borderColor: color.colorCode }}
                                        />
                                      </ImageModal>
                                      <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                                        style={{ backgroundColor: color.colorCode }}
                                      ></div>
                                      <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* الأشكال المتاحة */}
                        {productShapes.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">الأشكال المتاحة</div>
                            <div className="flex flex-wrap gap-2">
                              {productShapes.map((shape: any) => (
                                <button 
                                  key={shape.id} 
                                  type="button"
                                  className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                    selectedShape?.id === shape.id 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                  title={shape.shapeName}
                                  onClick={() => setSelectedShape(shape)}
                                >
                                  {shape.shapeImageUrl ? (
                                    <div className="flex items-center gap-2">
                                      <ImageModal
                                        src={shape.shapeImageUrl.startsWith('/objects/') ? 
                                          shape.shapeImageUrl.replace('/objects/', '/public-objects/') : 
                                          shape.shapeImageUrl
                                        }
                                        alt={`${shape.shapeName} - الشكل`}
                                      >
                                        <img 
                                          src={shape.shapeImageUrl.startsWith('/objects/') ? 
                                            shape.shapeImageUrl.replace('/objects/', '/public-objects/') : 
                                            shape.shapeImageUrl
                                          }
                                          alt={shape.shapeName}
                                          className="w-12 h-12 object-cover rounded border-2 border-gray-400 hover:scale-105 transition-transform"
                                        />
                                      </ImageModal>
                                      <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* الأحجام المتاحة */}
                        {productSizes.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">الأحجام المتاحة</div>
                            <Select onValueChange={setSelectedSize} value={selectedSize}>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الحجم" className="placeholder:text-gray-400" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                {productSizes.map((size: any) => (
                                  <SelectItem key={size.id} value={size.sizeName} className="min-h-12">
                                    <div className="flex items-center gap-2 w-full min-w-0">
                                      {size.sizeImageUrl && (
                                        <img 
                                          src={size.sizeImageUrl.startsWith('/objects/') ? 
                                            size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                            size.sizeImageUrl
                                          }
                                          alt={size.sizeName}
                                          className="w-8 h-8 object-cover rounded border-2 border-gray-400 flex-shrink-0"
                                        />
                                      )}
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-sm font-normal break-words">{size.sizeName}</span>
                                        {size.sizeValue && (
                                          <span className="text-xs text-gray-500 break-words">{size.sizeValue}</span>
                                        )}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* المحافظة */}
                    <FormField
                      control={form.control}
                      name="customerGovernorate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المحافظة *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <div className="flex items-center">
                                  <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="اختر المحافظة" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] overflow-auto" position="popper" sideOffset={4}>
                                {iraqGovernorates.map((gov) => (
                                  <SelectItem key={gov} value={gov}>
                                    {gov}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* العنوان */}
                    <FormField
                      control={form.control}
                      name="customerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                              <Textarea 
                                placeholder="العنوان التفصيلي"
                                className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                rows={1}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* الملاحظات */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات إضافية</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                              <Textarea 
                                placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                rows={1}
                                {...field}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={submitOrderMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700 h-14 text-lg font-bold animate-[buttonPulse_2s_ease-in-out_infinite] hover:animate-none"
                      >
                        {submitOrderMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            جارٍ الإرسال...
                          </>
                        ) : (
                          "إرسال الطلب"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <i className="fas fa-shipping-fast text-blue-600 text-sm mb-1"></i>
                  <p className="text-xs text-gray-700">شحن مجاني</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <i className="fas fa-shield-alt text-blue-600 text-sm mb-1"></i>
                  <p className="text-xs text-gray-700">ضمان الجودة</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <i className="fas fa-undo text-blue-600 text-sm mb-1"></i>
                  <p className="text-xs text-gray-700">إرجاع مجاني</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <i className="fas fa-headset text-blue-600 text-sm mb-1"></i>
                  <p className="text-xs text-gray-700">دعم 24/7</p>
                </div>
              </div>


            </div>

            {/* Product Description */}
            <div className="bg-white mx-4 my-4 rounded-lg shadow-sm border p-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-3">وصف المنتج</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {productDescription}
                </p>
              </div>
            </div>

            {/* Additional Images */}
            <AdditionalImages images={convertToPublicUrls((product as any)?.additionalImages || [])} />

            {/* Reviews */}
            <div className="reviews-section bg-white mx-4 my-1 rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-star text-yellow-400"></i>
                <h3 className="text-base font-bold text-gray-900">آراء العملاء</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-900">4.9</span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className="fas fa-star text-xs"></i>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">127 تقييم</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">أ.م</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">أحمد محمد</span>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className="fas fa-star text-xs"></i>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">منتج ممتاز وجودة عالية</p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">ف.ع</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">فاطمة علي</span>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className="fas fa-star text-xs"></i>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">تجربة رائعة والخدمة ممتازة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile App Style Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 z-50">
              <div className="max-w-sm mx-auto lg:max-w-2xl xl:max-w-4xl px-4">
                <div className="flex items-center justify-around">
                {/* طلب الآن */}
                <button 
                  onClick={() => setShowOrderForm(true)}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Package className="h-5 w-5" />
                  <span className="text-xs font-medium">طلب الآن</span>
                </button>

                {/* آراء العملاء */}
                <button 
                  onClick={() => {
                    const reviewsElement = document.querySelector('.reviews-section');
                    reviewsElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-xs font-medium">آراء</span>
                </button>

                {/* اتصل بنا */}
                <button 
                  onClick={() => window.open('tel:+964', '_blank')}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  <span className="text-xs font-medium">اتصل</span>
                </button>

                {/* المنتجات */}
                <button 
                  onClick={() => {
                    const productElement = document.querySelector('.product-section');
                    productElement?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Home className="h-5 w-5" />
                  <span className="text-xs font-medium">المنتجات</span>
                </button>
                </div>
              </div>
            </div>

            {/* Add bottom padding to prevent content overlap */}
            <div className="h-8"></div>
            </div>
          </div>
        );

      case "bold_hero":
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header Section */}
            <div className="bg-white shadow-sm">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="bg-green-100 px-2 py-1 rounded-full">
                      <span className="text-green-800 text-xs font-semibold">✅ متجر موثق</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-12 h-12 object-cover rounded-lg border-2 border-orange-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-theme-400 to-theme-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-store text-white text-lg"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-xl font-bold text-gray-900">{platformData?.platformName || "متجرنا المتميز"}</h1>
                      <p className="text-sm text-orange-600">جودة عالية • خدمة ممتازة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="relative bg-theme-gradient-strong text-white overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative container mx-auto px-3 py-8">
                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  <div className="text-center lg:text-right">
                    <div className="inline-block bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold mb-3">
                      🔥 عرض محدود - خصم خاص
                    </div>
                    <h1 className="text-xl lg:text-3xl font-black mb-3 leading-tight">
                      {productName}
                      <br />
                      <span className="text-yellow-300">العرض الأفضل في السوق</span>
                    </h1>
                    <p className="text-sm mb-4 opacity-90 leading-relaxed">{productDescription || "منتج عالي الجودة بأفضل الأسعار"}</p>
                    
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-300">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                        <div className="text-xs line-through opacity-70">{formatCurrency(parseFloat(productPrice || '0') + 10000)}</div>
                      </div>
                      <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                        وفر {formatCurrency(10000)}
                      </div>
                    </div>

                    <Button 
                      className="bg-yellow-400 text-black hover:bg-yellow-300 px-4 py-2 text-sm font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowOrderForm(true);
                      }}
                    >
                      🛒 اطلب الآن • توصيل مجاني
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <ImageSlider 
                        images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                        productName={productName}
                        template={landingPage.template}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-6">
              <div className="container mx-auto px-3">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">لماذا نحن الخيار الأفضل؟</h2>
                  <p className="text-sm text-gray-600 max-w-2xl mx-auto">نقدم لك أفضل تجربة تسوق مع مزايا فريدة تجعلنا الخيار الأول</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <i className="fas fa-shipping-fast text-white text-lg"></i>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">🚀 توصيل سريع</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">توصيل خلال 24-48 ساعة لجميع المحافظات مع إمكانية التتبع المباشر</p>
                    <div className="mt-2 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                      ✅ توصيل مجاني
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <i className="fas fa-shield-alt text-white text-lg"></i>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">🛡️ ضمان الجودة</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">ضمان شامل على جميع المنتجات مع إمكانية الإرجاع والاستبدال</p>
                    <div className="mt-2 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                      ✅ ضمان سنة كاملة
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-theme-500 to-theme-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <i className="fas fa-headset text-white text-lg"></i>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">📞 دعم 24/7</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">فريق دعم متخصص متاح على مدار الساعة لمساعدتك</p>
                    <div className="mt-2 bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-semibold">
                      ✅ استجابة فورية
                    </div>
                  </div>
                </div>
                
                {/* إضافة شهادات العملاء */}
                <div className="mt-6 text-center">
                  <h3 className="text-base font-bold text-gray-900 mb-4">ماذا يقول عملاؤنا؟</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex justify-center mb-2">
                        {[1,2,3,4,5].map((star) => (
                          <i key={star} className="fas fa-star text-yellow-400 text-xs"></i>
                        ))}
                      </div>
                      <p className="text-gray-600 italic text-xs">"منتج ممتاز وتوصيل سريع، أنصح به بقوة"</p>
                      <p className="text-xs text-gray-500 mt-1">- أحمد من بغداد</p>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex justify-center mb-2">
                        {[1,2,3,4,5].map((star) => (
                          <i key={star} className="fas fa-star text-yellow-400 text-xs"></i>
                        ))}
                      </div>
                      <p className="text-gray-600 italic text-xs">"جودة عالية وخدمة عملاء ممتازة"</p>
                      <p className="text-xs text-gray-500 mt-1">- فاطمة من البصرة</p>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex justify-center mb-2">
                        {[1,2,3,4,5].map((star) => (
                          <i key={star} className="fas fa-star text-yellow-400 text-xs"></i>
                        ))}
                      </div>
                      <p className="text-gray-600 italic text-xs">"تجربة تسوق رائعة، سأتسوق مرة أخرى"</p>
                      <p className="text-xs text-gray-500 mt-1">- محمد من أربيل</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="bg-gray-50 py-6">
              <div className="container mx-auto px-3">
                <div className="grid lg:grid-cols-2 gap-4 items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">تفاصيل المنتج</h2>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                        <span className="text-gray-700 text-sm">جودة عالية ومواصفات ممتازة</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                        <span className="text-gray-700 text-sm">مناسب لجميع الاستخدامات</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                        <span className="text-gray-700 text-sm">ضمان لمدة سنة كاملة</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                        <span className="text-gray-700 text-sm">سعر تنافسي ومعقول</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-lg p-4">
                    <div className="text-center mb-3">
                      <h3 className="text-base font-bold text-gray-900 mb-1">احصل على عرضك الآن</h3>
                      <p className="text-gray-600 text-xs">العرض ساري لفترة محدودة</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-2 rounded text-center">
                        <div className="text-lg font-bold">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                        <div className="text-xs">السعر الحالي</div>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-theme-500 to-theme-600 hover:bg-theme-gradient-strong text-white py-2 text-sm font-bold rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowOrderForm(true);
                        }}
                      >
                        اطلب الآن 🚀
                      </Button>
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500">✅ دفع عند الاستلام</p>
                        <p className="text-xs text-gray-500">📦 توصيل مجاني</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white py-6">
              <div className="container mx-auto px-3">
                <h2 className="text-base font-bold text-center text-gray-900 mb-4">الأسئلة الشائعة</h2>
                <div className="max-w-3xl mx-auto space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">كم يستغرق التوصيل؟</h3>
                    <p className="text-gray-600 text-xs">يتم التوصيل خلال 24-48 ساعة داخل بغداد، و3-5 أيام للمحافظات الأخرى.</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">هل يمكنني إرجاع المنتج؟</h3>
                    <p className="text-gray-600 text-xs">نعم، يمكنك إرجاع المنتج خلال 7 أيام من تاريخ الاستلام إذا لم يعجبك.</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">هل الدفع آمن؟</h3>
                    <p className="text-gray-600 text-xs">نعم، نحن نقبل الدفع عند الاستلام لضمان راحتك وأمانك.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6">
              <div className="container mx-auto px-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-yellow-400 mb-1">+5000</div>
                    <div className="text-gray-300 text-xs">عميل راضي</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-400 mb-1">24/7</div>
                    <div className="text-gray-300 text-xs">دعم فني</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-400 mb-1">99%</div>
                    <div className="text-gray-300 text-xs">رضا العملاء</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-400 mb-1">سريع</div>
                    <div className="text-gray-300 text-xs">التوصيل</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Form Section */}
            <div className="bg-white mx-4 rounded-lg shadow-sm border p-6" id="order-form">
              {/* Order Form - Fixed in Page */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4">إرسال طلب</h3>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-2 landing-page-form">
                    {/* الاسم */}
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input placeholder="ادخل اسمك الكامل" className="pr-10 placeholder:text-gray-400" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* رقم الهاتف */}
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input placeholder="07XX XXX XXXX" className="pr-10 placeholder:text-gray-400" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* العروض */}
                    <FormField
                      control={form.control}
                      name="offer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العرض *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <div className="flex items-center">
                                  <Package className="ml-2 h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="اختر العرض" className="placeholder:text-gray-400" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                {availableOffers.length > 0 ? (
                                  availableOffers.map((offer) => (
                                    <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                      <div className="flex justify-between items-start w-full gap-4">
                                        <div className="flex flex-col flex-1">
                                          <span className="font-medium">{offer.label}</span>
                                          {offer.savings > 0 && (
                                            <span className="text-sm text-red-500">توفير {formatCurrency(offer.savings)}</span>
                                          )}
                                        </div>
                                        <span className="text-green-600 font-bold text-left shrink-0">{formatCurrency(offer.price)}</span>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                    قطعة واحدة - {formatCurrency(parseFloat(product?.price || 0))}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                          {field.value && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <p className="text-sm text-green-700">
                                الكمية: {field.value.split(' - ')[0]} - السعر: {field.value.split(' - ')[1]}
                              </p>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* خيارات المنتج */}
                    {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
                      <div className="space-y-3">
                        
                        {/* الألوان المتاحة */}
                        {productColors.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">الألوان المتاحة</div>
                            <div className="flex flex-wrap gap-2">
                              {productColors.map((color: any) => (
                                <button 
                                  key={color.id} 
                                  type="button"
                                  className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                    selectedColor?.id === color.id 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                  title={color.colorName}
                                  onClick={() => setSelectedColor(color)}
                                >
                                  {color.colorImageUrl ? (
                                    <div className="flex items-center gap-2">
                                      <ImageModal
                                        src={color.colorImageUrl.startsWith('/objects/') ? 
                                          color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                          color.colorImageUrl
                                        }
                                        alt={`${color.colorName} - اللون`}
                                      >
                                        <img 
                                          src={color.colorImageUrl.startsWith('/objects/') ? 
                                            color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                            color.colorImageUrl
                                          }
                                          alt={color.colorName}
                                          className="w-12 h-12 object-cover rounded border-2 hover:scale-105 transition-transform"
                                          style={{ borderColor: color.colorCode }}
                                        />
                                      </ImageModal>
                                      <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                                        style={{ backgroundColor: color.colorCode }}
                                      ></div>
                                      <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* الأشكال المتاحة */}
                        {productShapes.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">الأشكال المتاحة</div>
                            <div className="flex flex-wrap gap-2">
                              {productShapes.map((shape: any) => (
                                <button 
                                  key={shape.id} 
                                  type="button"
                                  className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                    selectedShape?.id === shape.id 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                  title={shape.shapeName}
                                  onClick={() => setSelectedShape(shape)}
                                >
                                  {shape.shapeImageUrl ? (
                                    <div className="flex items-center gap-2">
                                      <ImageModal
                                        src={shape.shapeImageUrl.startsWith('/objects/') ? 
                                          shape.shapeImageUrl.replace('/objects/', '/public-objects/') : 
                                          shape.shapeImageUrl
                                        }
                                        alt={`${shape.shapeName} - الشكل`}
                                      >
                                        <img 
                                          src={shape.shapeImageUrl.startsWith('/objects/') ? 
                                            shape.shapeImageUrl.replace('/objects/', '/public-objects/') : 
                                            shape.shapeImageUrl
                                          }
                                          alt={shape.shapeName}
                                          className="w-12 h-12 object-cover rounded border-2 border-gray-400 hover:scale-105 transition-transform"
                                        />
                                      </ImageModal>
                                      <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* الأحجام المتاحة */}
                        {productSizes.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">الأحجام المتاحة</div>
                            <Select onValueChange={setSelectedSize} value={selectedSize}>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الحجم" className="placeholder:text-gray-400" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                {productSizes.map((size: any) => (
                                  <SelectItem key={size.id} value={size.sizeName} className="min-h-12">
                                    <div className="flex items-center gap-2 w-full min-w-0">
                                      {size.sizeImageUrl && (
                                        <img 
                                          src={size.sizeImageUrl.startsWith('/objects/') ? 
                                            size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                            size.sizeImageUrl
                                          }
                                          alt={size.sizeName}
                                          className="w-8 h-8 object-cover rounded border-2 border-gray-400 flex-shrink-0"
                                        />
                                      )}
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-sm font-normal break-words">{size.sizeName}</span>
                                        {size.sizeValue && (
                                          <span className="text-xs text-gray-500 break-words">{size.sizeValue}</span>
                                        )}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* المحافظة */}
                    <FormField
                      control={form.control}
                      name="customerGovernorate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المحافظة *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <div className="flex items-center">
                                  <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="اختر المحافظة" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px] overflow-auto" position="popper" sideOffset={4}>
                                {iraqGovernorates.map((gov) => (
                                  <SelectItem key={gov} value={gov}>
                                    {gov}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* العنوان */}
                    <FormField
                      control={form.control}
                      name="customerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                              <Textarea 
                                placeholder="العنوان التفصيلي"
                                className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                rows={1}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* الملاحظات */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات إضافية</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                              <Textarea 
                                placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                rows={1}
                                {...field}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={submitOrderMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700 h-14 text-lg font-bold animate-[buttonPulse_2s_ease-in-out_infinite] hover:animate-none"
                      >
                        {submitOrderMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            جارٍ الإرسال...
                          </>
                        ) : (
                          "إرسال الطلب"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <i className="fas fa-shipping-fast text-blue-600 text-sm mb-1"></i>
                  <p className="text-xs text-gray-700">شحن مجاني</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <i className="fas fa-shield-alt text-blue-600 text-sm mb-1"></i>
                  <p className="text-xs text-gray-700">ضمان الجودة</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <i className="fas fa-undo text-blue-600 text-sm mb-1"></i>
                  <p className="text-xs text-gray-700">إرجاع مجاني</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <i className="fas fa-headset text-blue-600 text-sm mb-1"></i>
                  <p className="text-xs text-gray-700">دعم 24/7</p>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-4">
              <div className="container mx-auto px-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* معلومات المتجر */}
                  <div className="text-center md:text-right">
                    <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
                      {platformData?.logoUrl ? (
                        <img 
                          src={platformData.logoUrl.startsWith('/objects/') ? 
                            platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                            platformData.logoUrl
                          }
                          alt="شعار المتجر"
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-theme-400 to-theme-500 rounded flex items-center justify-center">
                          <i className="fas fa-store text-white text-sm"></i>
                        </div>
                      )}
                      <div className="text-right">
                        <h3 className="text-sm font-bold">{platformData?.platformName || "متجرنا المتميز"}</h3>
                        <p className="text-xs text-gray-400">جودة عالية • خدمة ممتازة</p>
                      </div>
                    </div>
                    <p className="text-gray-400 leading-relaxed text-right text-xs">
                      نحن نسعى لتقديم أفضل المنتجات بأعلى جودة وأفضل الأسعار لعملائنا الكرام في جميع أنحاء العراق.
                    </p>
                  </div>

                  {/* روابط سريعة */}
                  <div className="text-center">
                    <h4 className="text-sm font-bold mb-2">روابط سريعة</h4>
                    <div className="space-y-1">
                      <div>
                        <a href="#order-form" className="text-gray-400 hover:text-white transition-colors text-xs">اطلب الآن</a>
                      </div>
                      <div>
                        <a href="tel:+964" className="text-gray-400 hover:text-white transition-colors text-xs">اتصل بنا</a>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">سياسة الإرجاع</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">الضمان</span>
                      </div>
                    </div>
                  </div>

                  {/* معلومات التواصل */}
                  <div className="text-center md:text-left">
                    <h4 className="text-sm font-bold mb-2">تواصل معنا</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <Phone className="h-3 w-3 text-green-400" />
                        <span className="text-gray-400 text-xs">متاح 24/7</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <MapPin className="h-3 w-3 text-blue-400" />
                        <span className="text-gray-400 text-xs">توصيل لجميع المحافظات</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <Shield className="h-3 w-3 text-purple-400" />
                        <span className="text-gray-400 text-xs">ضمان الجودة</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Button 
                        onClick={() => window.open('tel:+964', '_blank')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                      >
                        <Phone className="h-3 w-3 ml-1" />
                        اتصل الآن
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-800 mt-3 pt-2 text-center">
                  <p className="text-gray-400 text-xs">
                    جميع الحقوق محفوظة © 2024 {platformData?.platformName || "متجرنا"} | تم التطوير بواسطة sanadi.pro
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Bar للهاتف - زر الطلب فقط */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 md:hidden z-50">
              <div className="flex justify-center">
                <Button 
                  onClick={() => {
                    const orderForm = document.getElementById('order-form');
                    orderForm?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg font-bold rounded-lg"
                >
                  🛒 اطلب الآن
                </Button>
              </div>
            </div>

            {/* Add bottom padding for mobile */}
            <div className="h-16 md:hidden"></div>
          </div>
        );

      case "product_showcase":
        return (
          <div className="min-h-screen bg-gray-50">
            {/* Header Compact */}
            <div className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="bg-green-100 px-2 py-1 rounded-full">
                    <span className="text-green-800 text-xs font-semibold">✅ متجر موثق</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-10 h-10 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-store text-white text-sm"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-gray-900">{platformData?.platformName || "متجرنا"}</h1>
                      <p className="text-xs text-green-600">جودة عالية • خدمة ممتازة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Section */}
            <div className="px-3 py-4">
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{productName}</h2>
                  <div className="text-lg font-bold text-green-600 mb-3">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                </div>
                
                <div className="mb-4">
                  <ImageSlider 
                    images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                    productName={productName}
                    template={landingPage.template}
                  />
                </div>
                
                <p className="text-gray-600 text-sm text-center leading-relaxed">{productDescription || "منتج عالي الجودة بأفضل الأسعار"}</p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-shipping-fast text-blue-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">شحن مجاني</p>
                  <p className="text-xs text-gray-500">توصيل سريع</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-shield-alt text-green-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">ضمان الجودة</p>
                  <p className="text-xs text-gray-500">منتج أصلي</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-undo text-orange-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">إرجاع مجاني</p>
                  <p className="text-xs text-gray-500">7 أيام</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-headset text-purple-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">دعم 24/7</p>
                  <p className="text-xs text-gray-500">خدمة العملاء</p>
                </div>
              </div>

              {/* Order Form Section */}
              <div className="bg-white mx-2 rounded-lg shadow-sm border p-4" id="order-form">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-3">إرسال طلب</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-2">
                      {/* الاسم */}
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* رقم الهاتف */}
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="07XX XXX XXXX" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* العروض */}
                      <FormField
                        control={form.control}
                        name="offer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العرض *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer) => (
                                      <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                        <div className="flex justify-between items-start w-full gap-4">
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium">{offer.label}</span>
                                            {offer.savings > 0 && (
                                              <span className="text-sm text-red-500">توفير {formatCurrency(offer.savings)}</span>
                                            )}
                                          </div>
                                          <span className="text-green-600 font-bold">{formatCurrency(offer.price)}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                      قطعة واحدة - {formatCurrency(parseFloat(product?.price || 0))}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* خيارات المنتج */}
                      {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
                        <div className="space-y-3">
                          {/* الألوان المتاحة */}
                          {productColors.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الألوان المتاحة</div>
                              <div className="flex flex-wrap gap-2">
                                {productColors.map((color: any) => (
                                  <button 
                                    key={color.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-green-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedColor?.id === color.id 
                                        ? 'border-green-500 bg-green-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedColor(color)}
                                  >
                                    {color.colorImageUrl ? (
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={color.colorImageUrl.startsWith('/objects/') ? 
                                            color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                            color.colorImageUrl
                                          }
                                          alt={color.colorName}
                                          className="w-8 h-8 object-cover rounded border-2"
                                          style={{ borderColor: color.colorCode }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                                          style={{ backgroundColor: color.colorCode }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* الأشكال المتاحة */}
                          {productShapes.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الأشكال المتاحة</div>
                              <div className="flex flex-wrap gap-2">
                                {productShapes.map((shape: any) => (
                                  <button 
                                    key={shape.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-green-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedShape?.id === shape.id 
                                        ? 'border-green-500 bg-green-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedShape(shape)}
                                  >
                                    {shape.shapeImageUrl ? (
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={shape.shapeImageUrl.startsWith('/objects/') ? 
                                            shape.shapeImageUrl.replace('/objects/', '/public-objects/') : 
                                            shape.shapeImageUrl
                                          }
                                          alt={shape.shapeName}
                                          className="w-8 h-8 object-cover rounded border-2 border-gray-400"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* الأحجام المتاحة */}
                          {productSizes.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الأحجام المتاحة</div>
                              <Select onValueChange={setSelectedSize} value={selectedSize}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الحجم" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {productSizes.map((size: any) => (
                                    <SelectItem key={size.id} value={size.sizeName}>
                                      <div className="flex items-center gap-2">
                                        {size.sizeImageUrl && (
                                          <img 
                                            src={size.sizeImageUrl.startsWith('/objects/') ? 
                                              size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                              size.sizeImageUrl
                                            }
                                            alt={size.sizeName}
                                            className="w-6 h-6 object-cover rounded"
                                          />
                                        )}
                                        <span>{size.sizeName}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* المحافظة */}
                      <FormField
                        control={form.control}
                        name="customerGovernorate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المحافظة *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-auto" position="popper" sideOffset={4}>
                                  {iraqGovernorates.map((gov) => (
                                    <SelectItem key={gov} value={gov}>
                                      {gov}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* العنوان */}
                      <FormField
                        control={form.control}
                        name="customerAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="العنوان التفصيلي"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* الملاحظات */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ملاحظات إضافية</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={submitOrderMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-base font-bold"
                        >
                          {submitOrderMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              جارٍ الإرسال...
                            </>
                          ) : (
                            "إرسال الطلب"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>

              {/* Product Description */}
              <div className="bg-white mx-2 my-3 rounded-lg shadow-sm border p-4">
                <h3 className="text-base font-bold text-gray-900 mb-2 text-center">وصف المنتج</h3>
                <p className="text-gray-600 text-sm leading-relaxed text-center">
                  {productDescription}
                </p>
              </div>

              {/* Additional Images */}
              <AdditionalImages images={convertToPublicUrls((product as any)?.additionalImages || [])} />

              {/* Reviews Section */}
              <div className="bg-white mx-2 my-3 rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-star text-yellow-400"></i>
                  <h3 className="text-base font-bold text-gray-900">آراء العملاء</h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-gray-900">4.9</span>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className="fas fa-star text-xs"></i>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">127 تقييم</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">أ.م</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm">أحمد محمد</h4>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className="fas fa-star text-xs"></i>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs">منتج ممتاز وجودة عالية، أنصح به بقوة!</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">ف.ع</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm">فاطمة علي</h4>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className="fas fa-star text-xs"></i>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs">توصيل سريع وخدمة عملاء ممتازة</p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">م.ص</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm">محمد صالح</h4>
                          <div className="flex text-yellow-400">
                            {[...Array(4)].map((_, i) => (
                              <i key={i} className="fas fa-star text-xs"></i>
                            ))}
                            <i className="far fa-star text-xs"></i>
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs">سعر مناسب ومنتج جيد</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-lg mx-2 my-3 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded flex items-center justify-center">
                        <i className="fas fa-store text-white text-sm"></i>
                      </div>
                    )}
                    <h3 className="text-sm font-bold">{platformData?.platformName || "متجرنا"}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    جميع الحقوق محفوظة © 2024 | تم التطوير بواسطة sanadi.pro
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Order Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 md:hidden z-50">
              <Button 
                onClick={() => {
                  const orderForm = document.getElementById('order-form');
                  orderForm?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-bold rounded-lg"
              >
                🛒 اطلب الآن • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap */}
            <div className="h-16 md:hidden"></div>
          </div>
        );

      case "testimonial_focus":
        return (
          <div className="min-h-screen bg-blue-50">
            {/* Header Compact */}
            <div className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="bg-blue-100 px-2 py-1 rounded-full">
                    <span className="text-blue-800 text-xs font-semibold">⭐ جودة مُثبتة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-10 h-10 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-star text-white text-sm"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-gray-900">{platformData?.platformName || "متجرنا"}</h1>
                      <p className="text-xs text-blue-600">عملاء راضون • تقييمات عالية</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product & Testimonials Section */}
            <div className="px-3 py-4">
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{productName}</h2>
                  <div className="text-lg font-bold text-blue-600 mb-3">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                </div>
                
                <div className="mb-4">
                  <ImageSlider 
                    images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                    productName={productName}
                    template={landingPage.template}
                  />
                </div>
                
                <p className="text-gray-600 text-sm text-center leading-relaxed">{productDescription || "منتج موثوق مع تقييمات ممتازة"}</p>
              </div>

              {/* Customer Reviews */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-quote-right text-blue-600"></i>
                  <h3 className="text-lg font-bold text-gray-900">آراء عملائنا</h3>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-gray-900">4.9</span>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className="fas fa-star text-xs"></i>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">+200 تقييم إيجابي</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">أ.م</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm">أحمد محمد</h4>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className="fas fa-star text-xs"></i>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs">منتج رائع وجودة فائقة! تجربة ممتازة ونتائج مُذهلة</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">س.أ</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm">سارة أحمد</h4>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className="fas fa-star text-xs"></i>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs">أفضل استثمار! خدمة عملاء رائعة وتوصيل سريع</p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">م.ع</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-sm">محمد علي</h4>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className="fas fa-star text-xs"></i>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-xs">منتج أصلي بسعر ممتاز. سأطلب مرة أخرى بالتأكيد</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Form Section */}
              <div className="bg-white mx-2 rounded-lg shadow-sm border p-4" id="order-form">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-3">إرسال طلب</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-2">
                      {/* الاسم */}
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* رقم الهاتف */}
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="07XX XXX XXXX" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* العروض */}
                      <FormField
                        control={form.control}
                        name="offer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العرض *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer) => (
                                      <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                        <div className="flex justify-between items-start w-full gap-4">
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium">{offer.label}</span>
                                            {offer.savings > 0 && (
                                              <span className="text-sm text-red-500">توفير {formatCurrency(offer.savings)}</span>
                                            )}
                                          </div>
                                          <span className="text-blue-600 font-bold">{formatCurrency(offer.price)}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                      قطعة واحدة - {formatCurrency(parseFloat(product?.price || 0))}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* خيارات المنتج */}
                      {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
                        <div className="space-y-3">
                          
                          {/* الألوان المتاحة */}
                          {productColors.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الألوان المتاحة</div>
                              <div className="flex flex-wrap gap-2">
                                {productColors.map((color: any) => (
                                  <button 
                                    key={color.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedColor?.id === color.id 
                                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedColor(color)}
                                  >
                                    {color.colorImageUrl ? (
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={color.colorImageUrl.startsWith('/objects/') ? 
                                            color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                            color.colorImageUrl
                                          }
                                          alt={color.colorName}
                                          className="w-8 h-8 object-cover rounded border-2"
                                          style={{ borderColor: color.colorCode }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                                          style={{ backgroundColor: color.colorCode }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* الأشكال المتاحة */}
                          {productShapes.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الأشكال المتاحة</div>
                              <div className="flex flex-wrap gap-2">
                                {productShapes.map((shape: any) => (
                                  <button 
                                    key={shape.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedShape?.id === shape.id 
                                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedShape(shape)}
                                  >
                                    {shape.shapeImageUrl ? (
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={shape.shapeImageUrl.startsWith('/objects/') ? 
                                            shape.shapeImageUrl.replace('/objects/', '/public-objects/') : 
                                            shape.shapeImageUrl
                                          }
                                          alt={shape.shapeName}
                                          className="w-8 h-8 object-cover rounded border-2 border-gray-400"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* الأحجام المتاحة */}
                          {productSizes.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الأحجام المتاحة</div>
                              <Select onValueChange={setSelectedSize} value={selectedSize}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الحجم" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {productSizes.map((size: any) => (
                                    <SelectItem key={size.id} value={size.sizeName}>
                                      <div className="flex items-center gap-2">
                                        {size.sizeImageUrl && (
                                          <img 
                                            src={size.sizeImageUrl.startsWith('/objects/') ? 
                                              size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                              size.sizeImageUrl
                                            }
                                            alt={size.sizeName}
                                            className="w-6 h-6 object-cover rounded"
                                          />
                                        )}
                                        <span>{size.sizeName}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* المحافظة */}
                      <FormField
                        control={form.control}
                        name="customerGovernorate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المحافظة *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-auto" position="popper" sideOffset={4}>
                                  {iraqGovernorates.map((gov) => (
                                    <SelectItem key={gov} value={gov}>
                                      {gov}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* العنوان */}
                      <FormField
                        control={form.control}
                        name="customerAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="العنوان التفصيلي"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* الملاحظات */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ملاحظات إضافية</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={submitOrderMutation.isPending}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base font-bold"
                        >
                          {submitOrderMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              جارٍ الإرسال...
                            </>
                          ) : (
                            "إرسال الطلب"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 mx-2 my-3">
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-shipping-fast text-blue-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">شحن مجاني</p>
                  <p className="text-xs text-gray-500">لجميع الطلبات</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-star text-yellow-500 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">تقييم 4.9</p>
                  <p className="text-xs text-gray-500">من العملاء</p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-lg mx-2 my-3 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded flex items-center justify-center">
                        <i className="fas fa-star text-white text-sm"></i>
                      </div>
                    )}
                    <h3 className="text-sm font-bold">{platformData?.platformName || "متجرنا"}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    جميع الحقوق محفوظة © 2024 | تم التطوير بواسطة sanadi.pro
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Order Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 md:hidden z-50">
              <Button 
                onClick={() => {
                  const orderForm = document.getElementById('order-form');
                  orderForm?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-bold rounded-lg"
              >
                ⭐ اطلب الآن • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap */}
            <div className="h-16 md:hidden"></div>
          </div>
        );

      case "feature_highlight":
        return (
          <div className="min-h-screen bg-green-50">
            {/* Header Compact */}
            <div className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="bg-green-100 px-2 py-1 rounded-full">
                    <span className="text-green-800 text-xs font-semibold">🎯 فوائد مؤكدة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-10 h-10 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-star text-white text-sm"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-gray-900">{platformData?.platformName || "متجرنا"}</h1>
                      <p className="text-xs text-green-600">فوائد مميزة • نتائج سريعة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product & Features Section */}
            <div className="px-3 py-4">
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{productName}</h2>
                  <div className="text-lg font-bold text-green-600 mb-3">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                </div>
                
                <div className="mb-4">
                  <ImageSlider 
                    images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                    productName={productName}
                    template={landingPage.template}
                  />
                </div>
                
                <p className="text-gray-600 text-sm text-center leading-relaxed">{productDescription || "منتج بفوائد مميزة ونتائج واضحة"}</p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-leaf text-green-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">طبيعي 100%</p>
                  <p className="text-xs text-gray-500">مكونات خالصة</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-shield-alt text-blue-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">آمن تماماً</p>
                  <p className="text-xs text-gray-500">مختبر ومعتمد</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-bolt text-yellow-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">نتائج سريعة</p>
                  <p className="text-xs text-gray-500">تأثير فوري</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-heart text-red-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">صحة أفضل</p>
                  <p className="text-xs text-gray-500">تحسن الصحة</p>
                </div>
              </div>

              {/* Order Form Section */}
              <div className="bg-white mx-2 rounded-lg shadow-sm border p-4" id="order-form">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-3">إرسال طلب</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-2">
                      {/* Same unified form content as other templates */}
                      {/* Copy the complete form from product_showcase */}
                      {/* الاسم */}
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* رقم الهاتف */}
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="07XX XXX XXXX" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* العروض */}
                      <FormField
                        control={form.control}
                        name="offer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العرض *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer) => (
                                      <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                        <div className="flex justify-between items-start w-full gap-4">
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium">{offer.label}</span>
                                            {offer.savings > 0 && (
                                              <span className="text-sm text-red-500">توفير {formatCurrency(offer.savings)}</span>
                                            )}
                                          </div>
                                          <span className="text-green-600 font-bold">{formatCurrency(offer.price)}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                      قطعة واحدة - {formatCurrency(parseFloat(product?.price || 0))}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* خيارات المنتج */}
                      {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
                        <div className="space-y-3">
                          
                          {/* الألوان المتاحة */}
                          {productColors.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الألوان المتاحة</div>
                              <div className="flex flex-wrap gap-2">
                                {productColors.map((color: any) => (
                                  <button 
                                    key={color.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-green-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedColor?.id === color.id 
                                        ? 'border-green-500 bg-green-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedColor(color)}
                                  >
                                    {color.colorImageUrl ? (
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={color.colorImageUrl.startsWith('/objects/') ? 
                                            color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                            color.colorImageUrl
                                          }
                                          alt={color.colorName}
                                          className="w-8 h-8 object-cover rounded border-2"
                                          style={{ borderColor: color.colorCode }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                                          style={{ backgroundColor: color.colorCode }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* الأشكال المتاحة */}
                          {productShapes.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الأشكال المتاحة</div>
                              <div className="flex flex-wrap gap-2">
                                {productShapes.map((shape: any) => (
                                  <button 
                                    key={shape.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-green-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedShape?.id === shape.id 
                                        ? 'border-green-500 bg-green-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedShape(shape)}
                                  >
                                    {shape.shapeImageUrl ? (
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={shape.shapeImageUrl.startsWith('/objects/') ? 
                                            shape.shapeImageUrl.replace('/objects/', '/public-objects/') : 
                                            shape.shapeImageUrl
                                          }
                                          alt={shape.shapeName}
                                          className="w-8 h-8 object-cover rounded border-2 border-gray-400"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* الأحجام المتاحة */}
                          {productSizes.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الأحجام المتاحة</div>
                              <Select onValueChange={setSelectedSize} value={selectedSize}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الحجم" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {productSizes.map((size: any) => (
                                    <SelectItem key={size.id} value={size.sizeName}>
                                      <div className="flex items-center gap-2">
                                        {size.sizeImageUrl && (
                                          <img 
                                            src={size.sizeImageUrl.startsWith('/objects/') ? 
                                              size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                              size.sizeImageUrl
                                            }
                                            alt={size.sizeName}
                                            className="w-6 h-6 object-cover rounded"
                                          />
                                        )}
                                        <span>{size.sizeName}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* المحافظة */}
                      <FormField
                        control={form.control}
                        name="customerGovernorate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المحافظة *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-auto" position="popper" sideOffset={4}>
                                  {iraqGovernorates.map((gov) => (
                                    <SelectItem key={gov} value={gov}>
                                      {gov}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* العنوان */}
                      <FormField
                        control={form.control}
                        name="customerAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="العنوان التفصيلي"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* الملاحظات */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ملاحظات إضافية</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={submitOrderMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-base font-bold"
                        >
                          {submitOrderMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              جارٍ الإرسال...
                            </>
                          ) : (
                            "إرسال الطلب"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>

              {/* Additional Benefits */}
              <div className="bg-white mx-2 my-3 rounded-lg shadow-sm border p-4">
                <h3 className="text-base font-bold text-gray-900 mb-2 text-center">لماذا منتجنا مميز؟</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-600 text-sm"></i>
                    <span className="text-sm text-gray-700">مكونات طبيعية 100% آمنة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-600 text-sm"></i>
                    <span className="text-sm text-gray-700">نتائج واضحة خلال أيام قليلة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-600 text-sm"></i>
                    <span className="text-sm text-gray-700">مختبر ومعتمد من الخبراء</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-600 text-sm"></i>
                    <span className="text-sm text-gray-700">يحسن الصحة العامة بشكل طبيعي</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-lg mx-2 my-3 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded flex items-center justify-center">
                        <i className="fas fa-leaf text-white text-sm"></i>
                      </div>
                    )}
                    <h3 className="text-sm font-bold">{platformData?.platformName || "متجرنا"}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    جميع الحقوق محفوظة © 2024 | تم التطوير بواسطة sanadi.pro
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Order Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 md:hidden z-50">
              <Button 
                onClick={() => {
                  const orderForm = document.getElementById('order-form');
                  orderForm?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-bold rounded-lg"
              >
                🎯 اطلب الآن • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap */}
            <div className="h-16 md:hidden"></div>
          </div>
        );

      case "countdown_urgency":
        return (
          <div className="min-h-screen bg-red-50">
            {/* Urgent Header */}
            <div className="bg-red-600 text-white text-center py-2 animate-pulse">
              <span className="text-sm font-bold">⚡ عرض محدود • آخر فرصة ⚡</span>
            </div>
            
            {/* Header Compact */}
            <div className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="bg-red-100 px-2 py-1 rounded-full">
                    <span className="text-red-800 text-xs font-semibold">🔥 عرض ساخن</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-10 h-10 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-theme-400 to-theme-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-fire text-white text-sm"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-gray-900">{platformData?.platformName || "متجرنا"}</h1>
                      <p className="text-xs text-red-600">عرض لفترة محدودة • اطلب الآن</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product & Countdown Section */}
            <div className="px-3 py-4">
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{productName}</h2>
                  <div className="text-lg font-bold text-red-600 mb-3">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                </div>
                
                <div className="mb-4">
                  <ImageSlider 
                    images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                    productName={productName}
                    template={landingPage.template}
                  />
                </div>
                
                <p className="text-gray-600 text-sm text-center leading-relaxed">{productDescription || "عرض خاص لفترة محدودة"}</p>
              </div>

              {/* Countdown Timer */}
              <div className="bg-theme-gradient-strong text-white rounded-lg p-4 mb-4">
                <div className="text-center">
                  <h3 className="text-base font-bold mb-2">⏰ ينتهي العرض خلال:</h3>
                  <div className="flex justify-center gap-2 text-sm">
                    <div className="bg-white text-red-600 px-2 py-1 rounded font-bold">23</div>
                    <span>:</span>
                    <div className="bg-white text-red-600 px-2 py-1 rounded font-bold">59</div>
                    <span>:</span>
                    <div className="bg-white text-red-600 px-2 py-1 rounded font-bold">45</div>
                  </div>
                  <div className="flex justify-center gap-4 text-xs mt-1 opacity-90">
                    <span>ساعة</span>
                    <span>دقيقة</span>
                    <span>ثانية</span>
                  </div>
                </div>
              </div>

              {/* Price Comparison */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 text-center">
                <div className="text-sm text-gray-500 line-through mb-1">
                  السعر العادي: {formatCurrency(parseFloat(productPrice || '0') * 1.5)}
                </div>
                <div className="text-lg font-bold text-red-600 mb-1">
                  العرض الخاص: {formatCurrency(parseFloat(productPrice || '0'))}
                </div>
                <div className="text-green-600 text-sm font-semibold">
                  🎯 وفر 50% الآن!
                </div>
              </div>

              {/* Order Form Section */}
              <div className="bg-white mx-2 rounded-lg shadow-sm border p-4" id="order-form">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-3 text-red-600">🚀 احجز مكانك الآن</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-2">
                      {/* Same unified form as other templates */}
                      {/* الاسم */}
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* رقم الهاتف */}
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="07XX XXX XXXX" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* العروض */}
                      <FormField
                        control={form.control}
                        name="offer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العرض *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer) => (
                                      <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                        <div className="flex justify-between items-start w-full gap-4">
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium">{offer.label}</span>
                                            {offer.savings > 0 && (
                                              <span className="text-sm text-red-500">توفير {formatCurrency(offer.savings)}</span>
                                            )}
                                          </div>
                                          <span className="text-red-600 font-bold">{formatCurrency(offer.price)}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                      قطعة واحدة - {formatCurrency(parseFloat(product?.price || 0))}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* خيارات المنتج */}
                      {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
                        <div className="space-y-3">
                          
                          {/* الألوان المتاحة */}
                          {productColors.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الألوان المتاحة</div>
                              <div className="flex flex-wrap gap-2">
                                {productColors.map((color: any) => (
                                  <button 
                                    key={color.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-red-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedColor?.id === color.id 
                                        ? 'border-red-500 bg-red-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedColor(color)}
                                  >
                                    {color.colorImageUrl ? (
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={color.colorImageUrl.startsWith('/objects/') ? 
                                            color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                            color.colorImageUrl
                                          }
                                          alt={color.colorName}
                                          className="w-8 h-8 object-cover rounded border-2"
                                          style={{ borderColor: color.colorCode }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                                          style={{ backgroundColor: color.colorCode }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* الأشكال المتاحة */}
                          {productShapes.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الأشكال المتاحة</div>
                              <div className="flex flex-wrap gap-2">
                                {productShapes.map((shape: any) => (
                                  <button 
                                    key={shape.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-red-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedShape?.id === shape.id 
                                        ? 'border-red-500 bg-red-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedShape(shape)}
                                  >
                                    {shape.shapeImageUrl ? (
                                      <div className="flex items-center gap-2">
                                        <img 
                                          src={shape.shapeImageUrl.startsWith('/objects/') ? 
                                            shape.shapeImageUrl.replace('/objects/', '/public-objects/') : 
                                            shape.shapeImageUrl
                                          }
                                          alt={shape.shapeName}
                                          className="w-8 h-8 object-cover rounded border-2 border-gray-400"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* الأحجام المتاحة */}
                          {productSizes.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-2">الأحجام المتاحة</div>
                              <Select onValueChange={setSelectedSize} value={selectedSize}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الحجم" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {productSizes.map((size: any) => (
                                    <SelectItem key={size.id} value={size.sizeName}>
                                      <div className="flex items-center gap-2">
                                        {size.sizeImageUrl && (
                                          <img 
                                            src={size.sizeImageUrl.startsWith('/objects/') ? 
                                              size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                              size.sizeImageUrl
                                            }
                                            alt={size.sizeName}
                                            className="w-6 h-6 object-cover rounded"
                                          />
                                        )}
                                        <span>{size.sizeName}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* المحافظة */}
                      <FormField
                        control={form.control}
                        name="customerGovernorate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المحافظة *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-auto" position="popper" sideOffset={4}>
                                  {iraqGovernorates.map((gov) => (
                                    <SelectItem key={gov} value={gov}>
                                      {gov}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* العنوان */}
                      <FormField
                        control={form.control}
                        name="customerAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="العنوان التفصيلي"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* الملاحظات */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ملاحظات إضافية</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={submitOrderMutation.isPending}
                          className="flex-1 bg-red-600 hover:bg-red-700 h-12 text-base font-bold animate-pulse"
                        >
                          {submitOrderMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              جارٍ الإرسال...
                            </>
                          ) : (
                            "⚡ اطلب الآن قبل انتهاء العرض!"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>

              {/* Urgency Note */}
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mx-2 my-3 rounded">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-triangle text-yellow-600 ml-2"></i>
                  <div>
                    <p className="text-yellow-800 text-sm font-semibold">تنبيه هام:</p>
                    <p className="text-yellow-700 text-xs">هذا العرض متاح لفترة محدودة جداً. احجز مكانك الآن!</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-lg mx-2 my-3 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-theme-400 to-theme-500 rounded flex items-center justify-center">
                        <i className="fas fa-fire text-white text-sm"></i>
                      </div>
                    )}
                    <h3 className="text-sm font-bold">{platformData?.platformName || "متجرنا"}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    جميع الحقوق محفوظة © 2024 | تم التطوير بواسطة sanadi.pro
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Order Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white border-t shadow-lg p-3 md:hidden z-50 animate-pulse">
              <Button 
                onClick={() => {
                  const orderForm = document.getElementById('order-form');
                  orderForm?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-3 text-base font-bold rounded-lg"
              >
                ⚡ احجز الآن • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap */}
            <div className="h-16 md:hidden"></div>
          </div>
        );

      case "video_intro":
        return (
          <div className="min-h-screen bg-gray-50">
            {/* Header Compact */}
            <div className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="bg-purple-100 px-2 py-1 rounded-full">
                    <span className="text-purple-800 text-xs font-semibold">🎬 فيديو تعريفي</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-10 h-10 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-play text-white text-sm"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-gray-900">{platformData?.platformName || "متجرنا"}</h1>
                      <p className="text-xs text-purple-600">شاهد وتعلم • اختبر بنفسك</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product & Video Section */}
            <div className="px-3 py-4">
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{productName}</h2>
                  <div className="text-lg font-bold text-purple-600 mb-3">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                </div>
                
                <div className="mb-4">
                  <ImageSlider 
                    images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                    productName={productName}
                    template={landingPage.template}
                  />
                </div>
                
                <p className="text-gray-600 text-sm text-center leading-relaxed">{productDescription || "شاهد الفيديو لتتعرف على المنتج"}</p>
              </div>

              {/* Video Placeholder */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 mb-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 text-center shadow-lg text-gray-900">
                  <i className="fas fa-play-circle text-white text-4xl mb-3"></i>
                  <h3 className="text-white text-lg font-bold mb-2">شاهد الفيديو التعريفي</h3>
                  <p className="text-white text-sm opacity-90">تعرف على فوائد ومميزات المنتج</p>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-check-circle text-green-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">سهل الاستخدام</p>
                  <p className="text-xs text-gray-500">بسيط وعملي</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-rocket text-blue-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">نتائج مذهلة</p>
                  <p className="text-xs text-gray-500">تأثير إيجابي</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
                  <i className="fas fa-star text-yellow-600 text-lg mb-2"></i>
                  <p className="text-xs font-semibold text-gray-700">جودة عالية</p>
                  <p className="text-xs text-gray-500">أفضل المواد</p>
                </div>
              </div>

              {/* Order Form Section - Same unified form */}
              <div className="bg-white mx-2 rounded-lg shadow-sm border p-4" id="order-form">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-3">إرسال طلب</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-2">
                      {/* Standard form fields like other templates */}
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="07XX XXX XXXX" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="offer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العرض *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer) => (
                                      <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                        <div className="flex justify-between items-start w-full gap-4">
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium">{offer.label}</span>
                                            {offer.savings > 0 && (
                                              <span className="text-sm text-red-500">توفير {formatCurrency(offer.savings)}</span>
                                            )}
                                          </div>
                                          <span className="text-purple-600 font-bold">{formatCurrency(offer.price)}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                      قطعة واحدة - {formatCurrency(parseFloat(product?.price || 0))}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerGovernorate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المحافظة *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-auto" position="popper" sideOffset={4}>
                                  {iraqGovernorates.map((gov) => (
                                    <SelectItem key={gov} value={gov}>
                                      {gov}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="العنوان التفصيلي"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ملاحظات إضافية</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={submitOrderMutation.isPending}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 h-12 text-base font-bold"
                        >
                          {submitOrderMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              جارٍ الإرسال...
                            </>
                          ) : (
                            "إرسال الطلب"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-lg mx-2 my-3 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded flex items-center justify-center">
                        <i className="fas fa-play text-white text-sm"></i>
                      </div>
                    )}
                    <h3 className="text-sm font-bold">{platformData?.platformName || "متجرنا"}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    جميع الحقوق محفوظة © 2024 | تم التطوير بواسطة sanadi.pro
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Order Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 md:hidden z-50">
              <Button 
                onClick={() => {
                  const orderForm = document.getElementById('order-form');
                  orderForm?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-base font-bold rounded-lg"
              >
                🎬 اطلب الآن • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap */}
            <div className="h-16 md:hidden"></div>
          </div>
        );

      case "comparison_table":
        return (
          <div className="min-h-screen bg-gray-50">
            {/* Header Compact */}
            <div className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="bg-blue-100 px-2 py-1 rounded-full">
                    <span className="text-blue-800 text-xs font-semibold">⚖️ مقارنة المنتجات</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-10 h-10 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-balance-scale text-white text-sm"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-gray-900">{platformData?.platformName || "متجرنا"}</h1>
                      <p className="text-xs text-blue-600">مقارنة شاملة • أفضل اختيار</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product & Comparison Section */}
            <div className="px-3 py-4">
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{productName}</h2>
                  <div className="text-lg font-bold text-blue-600 mb-3">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                </div>
                
                <div className="mb-4">
                  <ImageSlider 
                    images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                    productName={productName}
                    template={landingPage.template}
                  />
                </div>
                
                <p className="text-gray-600 text-sm text-center leading-relaxed">{productDescription || "المنتج الأفضل في السوق"}</p>
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-4">
                <div className="grid grid-cols-3 gap-0 text-xs">
                  {/* Headers */}
                  <div className="bg-gray-100 p-2 font-bold text-center border-b">المميزات</div>
                  <div className="bg-red-100 p-2 font-bold text-center border-b">المنافسون</div>
                  <div className="bg-green-100 p-2 font-bold text-center border-b">منتجنا</div>
                  
                  {/* Rows */}
                  <div className="p-2 border-b border-r">الجودة</div>
                  <div className="p-2 border-b border-r text-center text-red-600">★★★☆☆</div>
                  <div className="p-2 border-b text-center text-green-600">★★★★★</div>
                  
                  <div className="p-2 border-b border-r bg-gray-50">السعر</div>
                  <div className="p-2 border-b border-r bg-gray-50 text-center text-red-600">مرتفع</div>
                  <div className="p-2 border-b bg-gray-50 text-center text-green-600">معقول</div>
                  
                  <div className="p-2 border-b border-r">الضمان</div>
                  <div className="p-2 border-b border-r text-center text-red-600">3 أشهر</div>
                  <div className="p-2 border-b text-center text-green-600">سنة كاملة</div>
                  
                  <div className="p-2 border-r bg-gray-50">التوصيل</div>
                  <div className="p-2 border-r bg-gray-50 text-center text-red-600">بفرق</div>
                  <div className="p-2 bg-gray-50 text-center text-green-600">مجاني</div>
                </div>
              </div>

              {/* Order Form Section */}
              <div className="bg-white mx-2 rounded-lg shadow-sm border p-4" id="order-form">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-3 text-blue-600">🏆 اختر الأفضل</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-2">
                      {/* Standard unified form fields */}
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="07XX XXX XXXX" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="offer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العرض *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer) => (
                                      <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                        <div className="flex justify-between items-start w-full gap-4">
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium">{offer.label}</span>
                                            {offer.savings > 0 && (
                                              <span className="text-sm text-red-500">توفير {formatCurrency(offer.savings)}</span>
                                            )}
                                          </div>
                                          <span className="text-blue-600 font-bold">{formatCurrency(offer.price)}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                      قطعة واحدة - {formatCurrency(parseFloat(product?.price || 0))}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerGovernorate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المحافظة *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-auto" position="popper" sideOffset={4}>
                                  {iraqGovernorates.map((gov) => (
                                    <SelectItem key={gov} value={gov}>
                                      {gov}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="العنوان التفصيلي"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ملاحظات إضافية</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={submitOrderMutation.isPending}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base font-bold"
                        >
                          {submitOrderMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              جارٍ الإرسال...
                            </>
                          ) : (
                            "⚖️ اختر الأفضل الآن"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mx-2 my-3">
                <div className="text-center">
                  <h3 className="text-sm font-bold text-blue-800 mb-2">⭐ لماذا نحن الأفضل؟</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <i className="fas fa-check text-green-600"></i>
                      <span className="text-blue-800">جودة فائقة</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-check text-green-600"></i>
                      <span className="text-blue-800">سعر مناسب</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-check text-green-600"></i>
                      <span className="text-blue-800">ضمان طويل</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-check text-green-600"></i>
                      <span className="text-blue-800">توصيل مجاني</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-lg mx-2 my-3 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded flex items-center justify-center">
                        <i className="fas fa-balance-scale text-white text-sm"></i>
                      </div>
                    )}
                    <h3 className="text-sm font-bold">{platformData?.platformName || "متجرنا"}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    جميع الحقوق محفوظة © 2024 | تم التطوير بواسطة sanadi.pro
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Order Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 md:hidden z-50">
              <Button 
                onClick={() => {
                  const orderForm = document.getElementById('order-form');
                  orderForm?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-bold rounded-lg"
              >
                ⚖️ اختر الأفضل • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap */}
            <div className="h-16 md:hidden"></div>
          </div>
        );

      case "benefits_grid":
        return (
          <div className="min-h-screen bg-orange-50">
            {/* Header Compact */}
            <div className="bg-white shadow-sm border-b">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="bg-orange-100 px-2 py-1 rounded-full">
                    <span className="text-orange-800 text-xs font-semibold">💰 مزايا متعددة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-10 h-10 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-theme-400 to-theme-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-gem text-white text-sm"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-lg font-bold text-gray-900">{platformData?.platformName || "متجرنا"}</h1>
                      <p className="text-xs text-orange-600">فوائد لا تُعد • قيمة حقيقية</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product & Benefits Section */}
            <div className="px-3 py-4">
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{productName}</h2>
                  <div className="text-lg font-bold text-orange-600 mb-3">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                </div>
                
                <div className="mb-4">
                  <ImageSlider 
                    images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                    productName={productName}
                    template={landingPage.template}
                  />
                </div>
                
                <p className="text-gray-600 text-sm text-center leading-relaxed">{productDescription || "منتج بفوائد ومزايا متعددة"}</p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white rounded-lg p-3 shadow-sm border">
                  <i className="fas fa-money-bill-wave text-purple-600 text-lg mb-2 block text-center"></i>
                  <h3 className="text-xs font-bold text-center mb-1">توفير المال</h3>
                  <p className="text-xs text-gray-600 text-center">وفر 70% من التكاليف</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 shadow-sm border">
                  <i className="fas fa-clock text-blue-600 text-lg mb-2 block text-center"></i>
                  <h3 className="text-xs font-bold text-center mb-1">توفير الوقت</h3>
                  <p className="text-xs text-gray-600 text-center">حلول ذكية وسريعة</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 shadow-sm border">
                  <i className="fas fa-heart text-green-600 text-lg mb-2 block text-center"></i>
                  <h3 className="text-xs font-bold text-center mb-1">راحة البال</h3>
                  <p className="text-xs text-gray-600 text-center">حلول مضمونة</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 shadow-sm border">
                  <i className="fas fa-trophy text-yellow-600 text-lg mb-2 block text-center"></i>
                  <h3 className="text-xs font-bold text-center mb-1">نتائج مضمونة</h3>
                  <p className="text-xs text-gray-600 text-center">أهداف محققة</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 shadow-sm border">
                  <i className="fas fa-users text-red-600 text-lg mb-2 block text-center"></i>
                  <h3 className="text-xs font-bold text-center mb-1">دعم فني</h3>
                  <p className="text-xs text-gray-600 text-center">خبراء متاحون 24/7</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 shadow-sm border">
                  <i className="fas fa-shield-alt text-indigo-600 text-lg mb-2 block text-center"></i>
                  <h3 className="text-xs font-bold text-center mb-1">أمان تام</h3>
                  <p className="text-xs text-gray-600 text-center">حماية شاملة</p>
                </div>
              </div>

              {/* Order Form Section */}
              <div className="bg-white mx-2 rounded-lg shadow-sm border p-4" id="order-form">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-3 text-orange-600">💎 استفد من المزايا</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-2">
                      {/* Standard unified form fields */}
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input placeholder="07XX XXX XXXX" className="pr-10 placeholder:text-gray-400" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="offer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العرض *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer) => (
                                      <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                        <div className="flex justify-between items-start w-full gap-4">
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium">{offer.label}</span>
                                            {offer.savings > 0 && (
                                              <span className="text-sm text-red-500">توفير {formatCurrency(offer.savings)}</span>
                                            )}
                                          </div>
                                          <span className="text-orange-600 font-bold">{formatCurrency(offer.price)}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                      قطعة واحدة - {formatCurrency(parseFloat(product?.price || 0))}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerGovernorate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المحافظة *</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-auto" position="popper" sideOffset={4}>
                                  {iraqGovernorates.map((gov) => (
                                    <SelectItem key={gov} value={gov}>
                                      {gov}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>العنوان *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="العنوان التفصيلي"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ملاحظات إضافية</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                                <Textarea 
                                  placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                  className="resize-none pr-10 min-h-[38px] py-2 placeholder:text-gray-400"
                                  rows={1}
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={submitOrderMutation.isPending}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 h-12 text-base font-bold"
                        >
                          {submitOrderMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              جارٍ الإرسال...
                            </>
                          ) : (
                            "💎 استفد من المزايا الآن"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>

              {/* All Benefits Summary */}
              <div className="bg-gradient-to-r from-theme-light to-theme-medium border border-theme-primary rounded-lg p-3 mx-2 my-3">
                <h3 className="text-sm font-bold text-theme-primary mb-2 text-center">🎁 كل هذه المزايا معاً</h3>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <i className="fas fa-check text-green-600"></i>
                    <span className="text-theme-primary">توفير 70% من التكاليف</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="fas fa-check text-green-600"></i>
                    <span className="text-theme-primary">حلول ذكية توفر الوقت</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="fas fa-check text-green-600"></i>
                    <span className="text-theme-primary">راحة بال ونتائج مضمونة</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="fas fa-check text-green-600"></i>
                    <span className="text-theme-primary">دعم فني وأمان شامل</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-lg mx-2 my-3 p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-theme-400 to-theme-500 rounded flex items-center justify-center">
                        <i className="fas fa-gem text-white text-sm"></i>
                      </div>
                    )}
                    <h3 className="text-sm font-bold">{platformData?.platformName || "متجرنا"}</h3>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    جميع الحقوق محفوظة © 2024 | تم التطوير بواسطة sanadi.pro
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Order Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 md:hidden z-50">
              <Button 
                onClick={() => {
                  const orderForm = document.getElementById('order-form');
                  orderForm?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-base font-bold rounded-lg"
              >
                💎 استفد من المزايا • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap */}
            <div className="h-16 md:hidden"></div>
          </div>
        );

      case "story_driven":
        return (
          <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="bg-gradient-to-r from-theme-500 to-theme-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    📖 قصة نجاح
                  </div>
                  <div className="flex items-center gap-2">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-theme-500 to-theme-600 rounded-lg flex items-center justify-center">
                        <i className="fas fa-book text-white text-xs"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-sm font-bold text-gray-900">{platformData?.platformName || "قصتنا"}</h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Story */}
            <div className="bg-theme-gradient-strong text-white py-6">
              <div className="container mx-auto px-3">
                <div className="text-center mb-4">
                  <div className="inline-block bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold mb-2">
                    📚 رحلة إلهام حقيقية
                  </div>
                  <h1 className="text-lg font-bold mb-2">{productName}</h1>
                  <p className="text-sm opacity-90 leading-relaxed max-w-sm mx-auto">
                    قصة نجاح حقيقية بدأت من حلم بسيط وتحولت إلى منتج يغير الحياة
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4">
                  <ImageSlider 
                    images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                    productName={productName}
                    template={landingPage.template}
                  />
                </div>

                <div className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 inline-block mb-3">
                    <div className="text-xl font-bold text-yellow-300">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                    <div className="text-xs opacity-80">استثمار في مستقبل أفضل</div>
                  </div>
                  <br />
                  <Button 
                    className="bg-yellow-400 text-black hover:bg-yellow-300 px-6 py-3 text-sm font-bold rounded-lg shadow-lg"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOrderForm(true);
                    }}
                  >
                    📖 انضم لقصة النجاح
                  </Button>
                </div>
              </div>
            </div>

            {/* Story Timeline - Compact */}
            <div className="py-4 bg-white mx-3 mt-4 rounded-lg shadow-sm">
              <h2 className="text-base font-bold text-center mb-3 text-gray-900">📚 رحلة التطوير</h2>
              <div className="space-y-3 px-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">1</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold mb-1 text-gray-900">🌟 البداية</h3>
                    <p className="text-xs text-gray-600">بدأت الفكرة من مشكلة حقيقية واجهها مؤسسنا</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">2</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold mb-1 text-gray-900">🔬 البحث والتطوير</h3>
                    <p className="text-xs text-gray-600">سنوات من البحث والتجارب لإيجاد الحل الأمثل</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">3</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold mb-1 text-gray-900">✨ التجارب الأولى</h3>
                    <p className="text-xs text-gray-600">نتائج مذهلة مع أول مجموعة من المستخدمين</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">4</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold mb-1 text-gray-900">🎯 النتائج المذهلة</h3>
                    <p className="text-xs text-gray-600">أكثر من 10,000 عميل راضي حققوا نتائج رائعة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Stories */}
            <div className="bg-white mx-3 mt-4 rounded-lg shadow-sm p-3">
              <h3 className="text-base font-bold text-gray-900 mb-3 text-center">🏆 قصص نجاح حقيقية</h3>
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-theme-50 to-theme-100 p-2 rounded-lg border-l-3 border-theme-500">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-medium text-gray-900">أحمد محمد - بغداد</span>
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map((star) => (
                        <i key={star} className="fas fa-star text-xs"></i>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">"غيّر حياتي للأفضل، نتائج مذهلة خلال أسبوعين فقط"</p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded-lg border-l-3 border-green-500">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-medium text-gray-900">فاطمة علي - البصرة</span>
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map((star) => (
                        <i key={star} className="fas fa-star text-xs"></i>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">"قصة نجاح حقيقية، أنصح الجميع بتجربة هذا المنتج"</p>
                </div>
              </div>
            </div>

            {/* Founder Story */}
            <div className="bg-gradient-to-r from-theme-500 to-theme-600 text-white mx-3 mt-4 rounded-lg p-4">
              <h3 className="text-sm font-bold mb-2 text-center">👨‍💼 كلمة المؤسس</h3>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-xs leading-relaxed mb-2">
                  "بدأت هذه الرحلة بحلم بسيط: مساعدة الناس على تحقيق أهدافهم. اليوم، أفتخر بأن منتجنا غيّر حياة الآلاف."
                </p>
                <p className="text-xs font-bold">- المؤسس والمدير التنفيذي</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-white mx-3 mt-4 rounded-lg shadow-sm p-4 text-center">
              <h3 className="text-sm font-bold text-gray-900 mb-2">📖 اكتب قصة نجاحك الآن</h3>
              <p className="text-xs text-gray-600 mb-3">انضم إلى آلاف العملاء الذين غيروا حياتهم للأفضل</p>
              <div className="bg-gradient-to-r from-theme-50 to-theme-100 rounded-lg p-3 mb-3">
                <div className="text-lg font-bold text-amber-600">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                <div className="text-xs text-gray-600">استثمار في مستقبلك</div>
              </div>
              <Button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-sm font-bold rounded-lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOrderForm(true);
                }}
              >
                📚 ابدأ قصة نجاحك الآن
              </Button>
            </div>

            {/* Product Description */}
            <div className="bg-white mx-3 my-4 rounded-lg shadow-sm p-3">
              <h3 className="text-sm font-bold text-gray-900 mb-2 text-center">📖 تفاصيل المنتج</h3>
              <p className="text-xs text-gray-600 leading-relaxed text-center">
                {productDescription || "منتج مطور بعناية فائقة ليساعدك على تحقيق أهدافك وتغيير حياتك للأفضل."}
              </p>
            </div>

            {/* Additional Images */}
            <AdditionalImages images={convertToPublicUrls((product as any)?.additionalImages || [])} />

            {/* Mobile Bottom Padding */}
            <div className="h-20"></div>

            {/* Fixed Bottom Order Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-theme-500 to-theme-600 p-3 z-50">
              <div className="max-w-sm mx-auto">
                <Button 
                  className="w-full bg-yellow-400 text-black hover:bg-yellow-300 py-3 text-sm font-bold rounded-lg shadow-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowOrderForm(true);
                  }}
                >
                  📖 انضم لقصة النجاح • {formatCurrency(parseFloat(productPrice || '0'))}
                </Button>
              </div>
            </div>
          </div>
        );

      case "colorful_vibrant":
        return (
          <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
              <div className="container mx-auto px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    ✨ عرض خاص
                  </div>
                  <div className="flex items-center gap-2">
                    {platformData?.logoUrl ? (
                      <img 
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <i className="fas fa-store text-white text-xs"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <h1 className="text-sm font-bold text-gray-900">{platformData?.platformName || "متجرنا"}</h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 text-white py-6">
              <div className="container mx-auto px-3">
                <div className="text-center mb-4">
                  <div className="inline-block bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold mb-2">
                    🌈 منتج ملوّن ونابض بالحياة
                  </div>
                  <h1 className="text-lg font-bold mb-2">{productName}</h1>
                  <p className="text-sm opacity-90 leading-relaxed max-w-sm mx-auto">
                    {productDescription || "منتج مميز بألوان زاهية وتصميم عصري"}
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4">
                  <ImageSlider 
                    images={convertToPublicUrls((product as any)?.imageUrls || [])} 
                    productName={productName}
                    template={landingPage.template}
                  />
                </div>

                <div className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 inline-block mb-3">
                    <div className="text-xl font-bold text-yellow-300">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                    <div className="text-xs opacity-80">السعر شامل التوصيل</div>
                  </div>
                  <br />
                  <Button 
                    className="bg-yellow-400 text-black hover:bg-yellow-300 px-6 py-3 text-sm font-bold rounded-lg shadow-lg animate-bounce"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOrderForm(true);
                    }}
                  >
                    🛒 اطلب الآن • توصيل مجاني
                  </Button>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="py-4 bg-white mx-3 mt-4 rounded-lg shadow-sm">
              <h2 className="text-base font-bold text-center mb-3 text-gray-900">✨ المميزات الملونة</h2>
              <div className="grid grid-cols-2 gap-2 px-3">
                <div className="bg-theme-gradient-strong text-white p-2 rounded-lg text-center">
                  <i className="fas fa-palette text-sm mb-1"></i>
                  <p className="text-xs font-medium">ألوان زاهية</p>
                </div>
                <div className="bg-gradient-to-br from-blue-400 to-purple-500 text-white p-2 rounded-lg text-center">
                  <i className="fas fa-star text-sm mb-1"></i>
                  <p className="text-xs font-medium">جودة عالية</p>
                </div>
                <div className="bg-gradient-to-br from-green-400 to-teal-500 text-white p-2 rounded-lg text-center">
                  <i className="fas fa-shipping-fast text-sm mb-1"></i>
                  <p className="text-xs font-medium">توصيل سريع</p>
                </div>
                <div className="bg-theme-gradient-strong text-white p-2 rounded-lg text-center">
                  <i className="fas fa-shield-alt text-sm mb-1"></i>
                  <p className="text-xs font-medium">ضمان شامل</p>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white mx-3 mt-4 rounded-lg shadow-sm p-3">
              <h3 className="text-base font-bold text-gray-900 mb-3 text-center">🌟 آراء العملاء الملونة</h3>
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-2 rounded-lg border-l-3 border-pink-500">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-medium text-gray-900">سارة أحمد</span>
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map((star) => (
                        <i key={star} className="fas fa-star text-xs"></i>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">"ألوان رائعة وجودة ممتازة، يضفي حيوية على المكان"</p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-2 rounded-lg border-l-3 border-blue-500">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-medium text-gray-900">محمد علي</span>
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map((star) => (
                        <i key={star} className="fas fa-star text-xs"></i>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">"تصميم عصري وألوان جذابة، أنصح به للجميع"</p>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mx-3 mt-4 rounded-lg p-4 text-center">
              <h3 className="text-sm font-bold mb-2">🎨 عرض الألوان المحدود</h3>
              <p className="text-xs mb-3 opacity-90">احصل على المنتج بألوانه الزاهية الآن</p>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-3 inline-block">
                <div className="text-lg font-bold text-yellow-300">{formatCurrency(parseFloat(productPrice || '0'))}</div>
                <div className="text-xs">وفر {formatCurrency(5000)} اليوم</div>
              </div>
              <br />
              <Button 
                className="bg-yellow-400 text-black hover:bg-yellow-300 px-4 py-2 text-sm font-bold rounded-lg w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOrderForm(true);
                }}
              >
                ⚡ اطلب فوراً • ألوان محدودة
              </Button>
            </div>

            {/* Product Description */}
            <div className="bg-white mx-3 my-4 rounded-lg shadow-sm p-3">
              <h3 className="text-sm font-bold text-gray-900 mb-2 text-center">🎨 وصف المنتج الملون</h3>
              <p className="text-xs text-gray-600 leading-relaxed text-center">
                {productDescription || "منتج مميز بألوان زاهية ونابضة بالحياة، مصمم ليضفي البهجة والحيوية على حياتك اليومية."}
              </p>
            </div>

            {/* Additional Images */}
            <AdditionalImages images={convertToPublicUrls((product as any)?.additionalImages || [])} />

            {/* Mobile Bottom Padding */}
            <div className="h-20"></div>

            {/* Fixed Bottom Order Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-pink-500 to-purple-600 p-3 z-50">
              <div className="max-w-sm mx-auto">
                <Button 
                  className="w-full bg-yellow-400 text-black hover:bg-yellow-300 py-3 text-sm font-bold rounded-lg shadow-lg animate-pulse"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowOrderForm(true);
                  }}
                >
                  🌈 اطلب المنتج الملون الآن • {formatCurrency(parseFloat(productPrice || '0'))}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="min-h-screen bg-white">
            <div className="container mx-auto px-6 py-16 text-center">
              <h1 className="text-4xl font-bold mb-6">{productName}</h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">{productDescription}</p>
              <div className="text-2xl font-bold text-blue-600 mb-6">{productPrice} د.ع</div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                onClick={() => setShowOrderForm(true)}
              >
                اطلب الآن
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" data-updated="2025-08-20-v2">
      {/* Landing Page Content */}
      {renderLandingPage()}
      


      {/* نموذج الطلب */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={getFormStyles()?.container || "bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">إرسال طلب</h3>
              <Button 
                variant="ghost" 
                onClick={() => setShowOrderForm(false)}
                className="p-2"
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-4">
                {/* الاسم */}
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input placeholder="ادخل اسمك الكامل" className={`${getFormStyles()?.field} pr-10`} {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* رقم الهاتف */}
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input placeholder="07XX XXX XXXX" className={`${getFormStyles()?.field} pr-10`} {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* العروض */}
                <FormField
                  control={form.control}
                  name="offer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العرض *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={`${getFormStyles()?.field} h-9`}>
                            <div className="flex items-center">
                              <Package className="ml-2 h-4 w-4 text-gray-400" />
                              <SelectValue placeholder="اختر العرض" />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-auto z-50 p-0" position="popper" sideOffset={4}>
                            <div className="flex">
                              {/* قائمة العروض - في اليسار */}
                              <div className="flex-1">
                                {availableOffers.length > 0 ? (
                                  availableOffers.map((offer, index) => {
                                    return (
                                      <SelectItem key={offer.id} value={`${offer.label} - ${formatCurrency(offer.price)}`}>
                                        <div className="flex items-center justify-between w-full gap-3">
                                          <div className="flex flex-col">
                                            <span className="font-semibold text-gray-800 text-sm">{offer.label}</span>
                                            {offer.savings > 0 && (
                                              <span className="text-xs text-red-500 font-medium">💰 وفر {formatCurrency(offer.savings)}</span>
                                            )}
                                          </div>
                                          <span className="text-green-600 font-bold text-sm">{formatCurrency(offer.price)}</span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })
                                ) : (
                                  <SelectItem value={`قطعة واحدة - ${formatCurrency(parseFloat(product?.price || 0))}`}>
                                    <div className="flex items-center justify-between w-full gap-3">
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-gray-800 text-sm">📦 قطعة واحدة</span>
                                        <span className="text-xs text-gray-500">العرض الأساسي</span>
                                      </div>
                                      <span className="text-green-600 font-bold text-sm">{formatCurrency(parseFloat(product?.price || 0))}</span>
                                    </div>
                                  </SelectItem>
                                )}
                              </div>
                              
                              {/* قائمة الملصقات - في اليمين */}
                              <div className="flex flex-col bg-gray-50 border-r w-16 px-1 py-2 gap-2 mt-1">
                                {availableOffers.length > 0 ? (
                                  availableOffers.map((offer, index) => {
                                    const badgeText = index === 0 ? 'الأولى' : index === 1 ? 'المخفض' : 'أكثر طلباً';
                                    const badgeStyle = index === 0 
                                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                      : index === 1 
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : 'bg-green-100 text-green-800 border-green-200';
                                    
                                    return (
                                      <div key={offer.id} className={`flex items-center py-1.5 px-1 text-xs font-medium ${badgeStyle} text-center justify-center border ${index === 0 ? '-mt-1' : index === 1 ? 'mt-0.5' : index === 2 ? 'mt-2' : ''}`}>
                                        {badgeText}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="flex items-center py-1.5 px-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 text-center justify-center">
                                    الأساسي
                                  </div>
                                )}
                              </div>
                            </div>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✅</span>
                            <p className="text-sm text-green-700 font-medium">
                              الكمية: {field.value.split(' - ')[0]} - السعر: {field.value.split(' - ')[1]}
                            </p>
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* خيارات المنتج */}
                {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-800 mb-3">خيارات المنتج</h4>
                    
                    {/* الألوان */}
                    {productColors.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">الألوان المتاحة</label>
                        <div className="flex flex-wrap gap-2">
                          {productColors.map((color: any) => (
                            <button 
                              key={color.id} 
                              type="button"
                              className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                selectedColor?.id === color.id 
                                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                  : 'border-gray-300 bg-white'
                              }`}
                              title={color.colorName}
                              onClick={() => setSelectedColor(color)}
                            >
                              {color.colorImageUrl ? (
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={color.colorImageUrl.startsWith('/objects/') ? 
                                      color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                      color.colorImageUrl
                                    }
                                    alt={color.colorName}
                                    className="w-6 h-6 object-cover rounded border"
                                    style={{ borderColor: color.colorCode }}
                                  />
                                  <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-6 h-6 rounded border-2 border-gray-300"
                                    style={{ backgroundColor: color.colorCode }}
                                  />
                                  <span className="text-sm font-medium text-gray-700">{color.colorName}</span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        {selectedColor && (
                          <div className="mt-2 text-sm text-blue-600">
                            ✓ تم اختيار اللون: {selectedColor.colorName}
                          </div>
                        )}
                      </div>
                    )}

                    {/* الأشكال */}
                    {productShapes.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">الأشكال المتاحة</label>
                        <div className="flex flex-wrap gap-2">
                          {productShapes.map((shape: any) => (
                            <button 
                              key={shape.id} 
                              type="button"
                              className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                selectedShape?.id === shape.id 
                                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                  : 'border-gray-300 bg-white'
                              }`}
                              title={shape.shapeName}
                              onClick={() => setSelectedShape(shape)}
                            >
                              {shape.shapeImageUrl ? (
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={shape.shapeImageUrl.startsWith('/objects/') ? 
                                      shape.shapeImageUrl.replace('/objects/', '/public-objects/') : 
                                      shape.shapeImageUrl
                                    }
                                    alt={shape.shapeName}
                                    className="w-6 h-6 object-cover rounded border"
                                  />
                                  <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-gray-700">{shape.shapeName}</span>
                              )}
                            </button>
                          ))}
                        </div>
                        {selectedShape && (
                          <div className="mt-2 text-sm text-blue-600">
                            ✓ تم اختيار الشكل: {selectedShape.shapeName}
                          </div>
                        )}
                      </div>
                    )}

                    {/* الأحجام */}
                    {productSizes.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">الأحجام المتاحة</label>
                        <Select 
                          onValueChange={(value) => {
                            const size = productSizes.find((s: any) => s.id === value);
                            setSelectedSize(size);
                          }}
                          value={(selectedSize as any)?.id || ""}
                        >
                          <SelectTrigger className={`${getFormStyles()?.field || "min-h-[38px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"}`}>
                            <SelectValue placeholder="اختر الحجم" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-auto z-50" position="popper" sideOffset={4}>
                            {productSizes.map((size: any) => (
                              <SelectItem key={size.id} value={size.id}>
                                {size.sizeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedSize && (
                          <div className="mt-2 text-sm text-blue-600">
                            ✓ تم اختيار الحجم: {(selectedSize as any).sizeName}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* المحافظة */}
                <FormField
                  control={form.control}
                  name="customerGovernorate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المحافظة *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={getFormStyles()?.field}>
                            <div className="flex items-center">
                              <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                              <SelectValue placeholder="اختر المحافظة" />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="max-h-[400px] overflow-auto z-50" position="popper" sideOffset={4}>
                            {iraqGovernorates.map((governorate) => (
                              <SelectItem key={governorate} value={governorate}>
                                {governorate}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* العنوان */}
                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان التفصيلي *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Home className="absolute right-3 top-3 text-gray-400 h-4 w-4" />
                          <Textarea 
                            placeholder="ادخل عنوانك التفصيلي (الحي، الشارع، رقم البيت، إلخ)"
                            className={`${getFormStyles()?.field} resize-none pr-10`}
                            rows={3}
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* الملاحظات */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات إضافية</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MessageSquare className="absolute right-3 top-3 text-gray-400 h-4 w-4" />
                          <Textarea 
                            placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                            className={`${getFormStyles()?.field} resize-none pr-10`}
                            rows={2}
                            {...field}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowOrderForm(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitOrderMutation.isPending}
                    className={`flex-1 ${getFormStyles()?.button}`}
                  >
                    {submitOrderMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جارٍ الإرسال...
                      </>
                    ) : (
                      "إرسال الطلب"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
      


      {/* PixelTracker Component for Facebook and TikTok tracking */}
      {landingPage && product && (
        <PixelTracker
          platformId={landingPage.platformId}
          eventType="view_content"
          eventData={{
            content_name: product.name,
            content_category: product.category || 'منتجات',
            content_ids: [product.id],
            value: (() => {
              const availableOffers = getAvailableOffers(product);
              if (availableOffers.length > 0) {
                const defaultOffer = availableOffers.find(offer => offer.isDefault) || availableOffers[0];
                return defaultOffer.price.toString();
              }
              return product.price?.toString() || '0';
            })(),
            currency: 'USD',
            landing_page_id: landingPage.id,
            product_id: product.id
          }}
        />
      )}
    </div>
  );
}