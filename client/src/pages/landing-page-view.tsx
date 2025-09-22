import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import { formatCurrency, formatNumber } from "@/lib/utils";
import PixelTracker from "@/components/PixelTracker";

// Custom CSS for header colors
const headerStyles = `
  .store-name-header {
    color: white !important;
  }
  .store-tagline-header {
    color: #facc15 !important;
  }
`;
import { ImageModal } from "@/components/ImageModal";

// الحصول على Google Product Category من قاعدة البيانات أو الافتراضي
const getGoogleProductCategory = (product: any) => {
  // أولاً: استخدم googleCategory من قاعدة البيانات إذا كان متوفراً
  if (product?.categoryGoogleCategory) {
    return product.categoryGoogleCategory;
  }
  
  // ثانياً: إذا كان هناك googleCategory في بيانات الفئة، استخدمه
  if (product?.categoryData?.googleCategory) {
    return product.categoryData.googleCategory;
  }
  
  // ثالثاً: استخدم الترجمة اليدوية كـ fallback
  const categoryName = product?.category || product?.categoryName || 'منتجات';
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

// دالة لاستخراج الكمية من النص
function extractQuantityFromText(text: string): number {
  if (!text) return 1;
  
  const lowerText = text.toLowerCase();
  
  // البحث عن الأرقام العربية والإنجليزية
  const arabicNumbers: { [key: string]: number } = {
    'واحد': 1, 'واحدة': 1, 'قطعة': 1,
    'اثنين': 2, 'اثنان': 2, 'قطعتين': 2, 'قطعتان': 2,
    'ثلاث': 3, 'ثلاثة': 3, 'ثلاث قطع': 3,
    'أربع': 4, 'أربعة': 4, 'أربع قطع': 4,
    'خمس': 5, 'خمسة': 5, 'خمس قطع': 5,
    'ست': 6, 'ستة': 6, 'ست قطع': 6,
    'سبع': 7, 'سبعة': 7, 'سبع قطع': 7,
    'ثمان': 8, 'ثمانية': 8, 'ثمان قطع': 8,
    'تسع': 9, 'تسعة': 9, 'تسع قطع': 9,
    'عشر': 10, 'عشرة': 10, 'عشر قطع': 10
  };
  
  // البحث عن الكلمات المفتاحية
  for (const [word, number] of Object.entries(arabicNumbers)) {
    if (lowerText.includes(word)) {
      return number;
    }
  }
  
  // البحث عن الأرقام الإنجليزية
  const numberMatch = text.match(/(\d+)/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }
  
  return 1;
}

// دالة لحساب العروض المتاحة للمنتج
function getAvailableOffers(product: any) {
  if (!product) return [];
  
  // استخدام نظام العروض الجديد priceOffers إذا كان متوفراً
  if (product.priceOffers && Array.isArray(product.priceOffers) && product.priceOffers.length > 0) {
    return product.priceOffers.map((offer: any, index: number) => {
      // استخراج الكمية من النص إذا لم تكن محددة بشكل صحيح
      let quantity = offer.quantity || 1;
      
      // البحث عن الكمية في النص
      const label = offer.label || '';
      const quantityFromText = extractQuantityFromText(label);
      
      
      // استخدام الكمية المستخرجة من النص إذا كانت أكبر من الكمية المحفوظة
      if (quantityFromText > quantity) {
        quantity = quantityFromText;
      }
      
      return {
        id: `offer-${index + 1}`, // تبدأ من offer-1 بدلاً من offer-0
        label: offer.label,
        price: parseFloat(offer.price),
        quantity: quantity,
        savings: 0,
        isDefault: offer.isDefault || false
      };
    }).filter((offer: any) => offer.price > 0);
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
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  const scrollPrev = () => {
    setSelectedIndex(prev => prev > 0 ? prev - 1 : displayImages.length - 1);
  };

  const scrollNext = () => {
    setSelectedIndex(prev => prev < displayImages.length - 1 ? prev + 1 : 0);
  };

  const scrollTo = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedIndex(index);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaX = currentX - startX;
    const threshold = 50; // minimum distance to trigger slide
    
    if (deltaX > threshold) {
      scrollPrev();
    } else if (deltaX < -threshold) {
      scrollNext();
    }
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaX = currentX - startX;
    const threshold = 50; // minimum distance to trigger slide
    
    if (deltaX > threshold) {
      scrollPrev();
    } else if (deltaX < -threshold) {
      scrollNext();
    }
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
        <div 
          className="overflow-hidden rounded-2xl w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-full h-full">
            <img 
              src={displayImages[selectedIndex]}
              alt={`${productName} - صورة ${selectedIndex + 1}`}
              className="w-full h-full object-cover block select-none"
              draggable={false}
            />
          </div>
        </div>

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
                className={`w-3 h-3 rounded-full transition-all duration-200 border-2 border-[#757575] ${
                  index === selectedIndex 
                    ? 'bg-white shadow-lg scale-110' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                onClick={(e) => scrollTo(index, e)}
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
              onClick={(e) => scrollTo(index, e)}
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


  // Try different route patterns
  const [matchOldRoute, paramsOld] = useRoute("/view-landing/:slug");
  const [matchSubdomainRoute, paramsSubdomain] = useRoute("/:subdomain/:slug");
  const [matchProductRoute, paramsProduct] = useRoute("/product/:slug");
  const [, setLocation] = useLocation();

  // Extract slug and platform from different route patterns
  const slug = paramsOld?.slug || paramsSubdomain?.slug || paramsProduct?.slug;
  const platform = paramsSubdomain?.subdomain;
  
  // Error boundary للقبض على الأخطاء
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('JavaScript Error:', error);
      // Don't set hasError to true for minor errors that don't affect functionality
      // setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event);
      // Don't set hasError to true for minor promise rejections
      // setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const [viewContentSent, setViewContentSent] = useState(false);
  const viewContentSentRef = useRef(false);
  const [viewContentPixelData, setViewContentPixelData] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // الافتراضي نهاري، سيتم تحديثه من بيانات المنتج
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [variantErrors, setVariantErrors] = useState<string[]>([]);
  const [categoryGoogleCategory, setCategoryGoogleCategory] = useState<string | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [addToCartPixelData, setAddToCartPixelData] = useState<any>(null);
  const [initiateCheckoutData, setInitiateCheckoutData] = useState<any>(null);
  const [leadEventData, setLeadEventData] = useState<any>(null);



  const [showFixedButton, setShowFixedButton] = useState(true);
  const { toast } = useToast();

  // تطبيق النمط الليلي/النهاري حسب الإعداد المحفوظ
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1f2937';
      document.body.style.color = 'white';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = 'white';
      document.body.style.color = 'black';
    }
    
    // تجاوز متغيرات CSS للحقول في صفحات الهبوط حسب النمط
    const existingStyle = document.getElementById('landing-page-override');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const landingPageStyle = document.createElement('style');
    landingPageStyle.setAttribute('id', 'landing-page-override');
    
    const lightModeStyles = `
      /* تجاوز ألوان الحقول في النمط النهاري */
      .landing-page-form input,
      .landing-page-form textarea,
      .landing-page-form [role="combobox"],
      input,
      textarea {
        border-width: 0.5px !important;
        border-color: #757575 !important;
        background-color: #f9fafb !important;
        background: #f9fafb !important;
        color: #374151 !important;
      }
      
      /* ألوان النصوص والعناصر في النمط النهاري */
      .landing-page-form label,
      .landing-page-form .text-sm,
      h1, h2, h3, h4, h5, h6,
      p, span, div {
        color: #374151 !important;
      }
      
      /* خلفيات البطاقات والأقسام */
      .bg-white, .bg-gray-50, .bg-blue-50, .bg-green-50 {
        background-color: white !important;
        color: #374151 !important;
      }`;
    
    const darkModeStyles = `
      /* تجاوز ألوان الحقول في النمط الليلي */
      .landing-page-form input,
      .landing-page-form textarea,
      .landing-page-form [role="combobox"],
      input,
      textarea {
        border-width: 0.5px !important;
        border-color: #757575 !important;
        background-color: #374151 !important;
        background: #374151 !important;
        color: #f9fafb !important;
      }
      
      /* ألوان النصوص والعناصر في النمط الليلي */
      .landing-page-form label,
      .landing-page-form .text-sm,
      h1, h2, h3, h4, h5, h6,
      p, span, div {
        color: #f9fafb !important;
      }
      
      /* خلفيات البطاقات والأقسام في النمط الليلي */
      .bg-white, .bg-gray-50, .bg-blue-50, .bg-green-50 {
        background-color: #374151 !important;
        color: #f9fafb !important;
      }
      
      /* خلفيات خاصة للأسعار والعروض */
      .bg-gradient-to-r, .bg-green-600, .bg-blue-600, .bg-red-600 {
        background-color: #1f2937 !important;
        color: #f9fafb !important;
        border: 1px solid #4b5563 !important;
      }
      
      /* بطاقات المنتجات والمحتوى */
      .shadow, .shadow-sm, .shadow-md, .shadow-lg {
        background-color: #374151 !important;
        border: 1px solid #4b5563 !important;
      }`;
    
    landingPageStyle.innerHTML = `
      /* تجاوز جذري - أعلى أولوية */
      html,
      html *,
      body,
      body * {
        --select-content-background: ${isDarkMode ? '#374151' : 'white'} !important;
        --select-item-background: ${isDarkMode ? '#374151' : 'white'} !important;
      }
      ${isDarkMode ? darkModeStyles : lightModeStyles}
      
      /* تجاوز أقوى للحقول */
      * input,
      * textarea,
      html input,
      html textarea,
      body input,
      body textarea {
        background-color: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
        background: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
        border-color: #757575 !important;
        border-width: 0.5px !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
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
        background-color: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
        background: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
      
      /* تحسين ألوان العناصر التفاعلية */
      .landing-page-form [data-state="open"] {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
        background-color: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
      }
      
      /* ألوان القوائم المنسدلة */
      [data-radix-select-content],
      [data-radix-popper-content-wrapper] {
        background-color: ${isDarkMode ? '#374151' : 'white'} !important;
        border: 0.5px solid #757575 !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
      
      [data-radix-select-item] {
        background-color: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
      
      [data-radix-select-item]:hover,
      [data-radix-select-item][data-highlighted] {
        background-color: ${isDarkMode ? '#4b5563' : '#f3f4f6'} !important;
      }
      
      /* تجاوز شامل لجميع العناصر النصية */
      *:not(.fa-star) {
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
      
      /* استثناء النجوم من التجاوز الشامل */
      .fa-star {
        color: #fbbf24 !important;
      }
      
      /* تجاوز ألوان الأزرار */
      button {
        color: white !important;
      }
      
      /* تجاوز ألوان البطاقات والخلفيات */
      .bg-white, .bg-gray-50, .bg-gray-100, .bg-blue-50, .bg-green-50, .bg-red-50 {
        background-color: ${isDarkMode ? '#374151' : 'white'} !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
      
      /* تجاوز ألوان الحدود */
      .border, .border-gray-200, .border-gray-300 {
        border-color: #757575 !important;
      }
      
      /* تجاوز خاص للعناصر المهمة */
      .text-2xl, .text-xl, .text-lg, .font-bold, .font-semibold {
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
      
      /* تجاوز ألوان الأسعار والعروض */
      .bg-gradient-to-r {
        background: ${isDarkMode ? 'linear-gradient(to right, #374151, #4b5563)' : 'linear-gradient(to right, #dbeafe, #bfdbfe)'} !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
      
      /* تجاوز عناصر القوائم المنسدلة */
      .landing-page-form [role="option"],
      .landing-page-form [data-radix-select-item] {
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
        background-color: ${isDarkMode ? '#374151' : 'white'} !important;
        padding: 0.5rem 0.75rem !important;
      }
      
      .landing-page-form [role="option"]:hover,
      .landing-page-form [data-radix-select-item]:hover,
      .landing-page-form [data-highlighted] {
        background-color: ${isDarkMode ? '#4b5563' : '#f3f4f6'} !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
      
      .landing-page-form [data-radix-select-item][data-state="checked"] {
        background-color: ${isDarkMode ? '#1f2937' : '#dbeafe'} !important;
        color: ${isDarkMode ? '#60a5fa' : '#1d4ed8'} !important;
      }
      
      /* إزالة أي شفافية من جميع عناصر القوائم */
      .landing-page-form [data-radix-select-content],
      .landing-page-form [data-radix-select-viewport],
      .landing-page-form [data-radix-collection-item] {
        background-color: ${isDarkMode ? '#374151' : 'white'} !important;
        opacity: 1 !important;
        backdrop-filter: none !important;
      }
      
      /* تجاوز أي CSS من النظام المظلم */
      body:not(.dark) .landing-page-form [data-radix-select-content] {
        background-color: white !important;
        border-color: #757575 !important;
      }
      
      /* ألوان خاصة لقالب TikTok */
      .tiktok-description-red,
      .tiktok-description-red * {
        color: #ef4444 !important;
        -webkit-text-fill-color: #ef4444 !important;
      }
      
      .tiktok-price-green,
      .tiktok-price-green * {
        color: #10b981 !important;
        -webkit-text-fill-color: #10b981 !important;
      }
      
      .tiktok-arrow-red,
      .tiktok-arrow-red * {
        color: #ef4444 !important;
        -webkit-text-fill-color: #ef4444 !important;
      }
      
      .tiktok-savings-green,
      .tiktok-savings-green * {
        color: #10b981 !important;
        -webkit-text-fill-color: #10b981 !important;
      }
      
      .tiktok-check-blue,
      .tiktok-check-blue * {
        color: #60a5fa !important;
        -webkit-text-fill-color: #60a5fa !important;
      }
      
      /* ضمان بقاء نص زر الإرسال أبيض */
      .tiktok-style .bg-red-600,
      .tiktok-style .bg-red-600 *,
      .tiktok-style button[type="submit"],
      .tiktok-style button[type="submit"] * {
        color: white !important;
        -webkit-text-fill-color: white !important;
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
        border: 0.5px solid #757575 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* تجاوز أقوى للقوائم المنسدلة */
      body [data-radix-portal] .landing-page-form [data-radix-select-content],
      body [data-radix-portal] [data-side] {
        background-color: white !important;
        border: 0.5px solid #757575 !important;
        backdrop-filter: none !important;
        opacity: 1 !important;
      }
      
      /* CSS عالمي للقوائم في صفحات الهبوط */
      body:not(.dark) [data-radix-select-content] {
        background-color: #f9fafb !important;
        border: 0.5px solid #757575 !important;
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
        border: 0.5px solid #757575 !important;
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
        border: 0.5px solid #757575 !important;
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
        --radix-select-content-background-color: ${isDarkMode ? '#374151' : 'white'} !important;
        --radix-select-item-background-color: ${isDarkMode ? '#374151' : 'white'} !important;
      }
      
      *[data-radix-select-content],
      *[data-radix-select-viewport],
      *[data-radix-popper-content-wrapper] > *,
      *[role="listbox"],
      *[data-radix-portal] *[data-radix-select-content] {
        background-color: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
        background: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
        backdrop-filter: none !important;
        opacity: 1 !important;
        border: 0.5px solid #757575 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        z-index: 99999 !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
      
      *[data-radix-select-item],
      *[role="option"] {
        background-color: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
        background: ${isDarkMode ? '#374151' : '#f9fafb'} !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
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
        background-color: ${isDarkMode ? '#4b5563' : '#f3f4f6'} !important;
        background: ${isDarkMode ? '#4b5563' : '#f3f4f6'} !important;
        color: ${isDarkMode ? '#f9fafb' : '#374151'} !important;
      }
    `;
    document.head.appendChild(landingPageStyle);
    
    // مراقبة التغييرات ومنع تطبيق الوضع المظلم + تطبيق أنماط القوائم
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // منع تغيير النمط المظلم إلا إذا كان مطلوباً
          if (!isDarkMode && document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = 'white';
            document.body.style.color = 'black';
          } else if (isDarkMode && !document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#1f2937';
            document.body.style.color = 'white';
          }
        }
        
        // تطبيق أنماط على العناصر المضافة ديناميكياً
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // تطبيق أنماط على العناصر المضافة ديناميكياً
              const selectContent = element.querySelector('[data-radix-select-content]') || 
                                   (element.matches('[data-radix-select-content]') ? element : null);
              
              if (selectContent) {
                (selectContent as HTMLElement).style.backgroundColor = isDarkMode ? '#374151' : '#f9fafb';
                (selectContent as HTMLElement).style.border = `0.5px solid #757575`;
                (selectContent as HTMLElement).style.color = isDarkMode ? '#f9fafb' : '#374151';
                (selectContent as HTMLElement).style.opacity = '1';
                (selectContent as HTMLElement).style.backdropFilter = 'none';
                (selectContent as HTMLElement).style.zIndex = '99999';
              }
              
              // استهداف عناصر SelectItem
              const selectItems = element.querySelectorAll('[data-radix-select-item]');
              selectItems.forEach((item) => {
                (item as HTMLElement).style.backgroundColor = isDarkMode ? '#374151' : '#f9fafb';
                (item as HTMLElement).style.color = isDarkMode ? '#f9fafb' : '#374151';
                (item as HTMLElement).style.opacity = '1';
                (item as HTMLElement).style.padding = '8px 12px';
                (item as HTMLElement).style.margin = '4px 3px';
                (item as HTMLElement).style.borderRadius = '4px';
                
                // تطبيق أنماط الحالات المميزة
                if (item.hasAttribute('data-highlighted') || 
                    item.hasAttribute('data-state') && item.getAttribute('data-state') === 'checked' ||
                    item.hasAttribute('aria-selected') && item.getAttribute('aria-selected') === 'true') {
                  (item as HTMLElement).style.backgroundColor = isDarkMode ? '#4b5563' : '#f3f4f6';
                  (item as HTMLElement).style.color = isDarkMode ? '#f9fafb' : '#374151';
                }
              });
              
              // استهداف الحقول الأساسية المضافة ديناميكياً
              const inputs = element.querySelectorAll('input');
              inputs.forEach((input) => {
                (input as HTMLElement).style.backgroundColor = isDarkMode ? '#374151' : '#f9fafb';
                (input as HTMLElement).style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db';
                (input as HTMLElement).style.color = isDarkMode ? '#f9fafb' : '#374151';
              });
              
              const textareas = element.querySelectorAll('textarea');
              textareas.forEach((textarea) => {
                (textarea as HTMLElement).style.backgroundColor = isDarkMode ? '#374151' : '#f9fafb';
                (textarea as HTMLElement).style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db';
                (textarea as HTMLElement).style.color = isDarkMode ? '#f9fafb' : '#374151';
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
      if (document.head.contains(landingPageStyle)) {
        document.head.removeChild(landingPageStyle);
      }
    };
  }, [isDarkMode]);

  // جلب بيانات صفحة الهبوط بالـ customUrl (الطريقة الأصلية الصحيحة)
  const { data: landingPage, isLoading, error } = useQuery({
    queryKey: ['/api/landing', slug],
    queryFn: async () => {
      
      // جلب صفحة الهبوط بالـ customUrl (الطريقة الأصلية)
      const landingResponse = await fetch(`/api/landing/${slug}`);
      if (!landingResponse.ok) {
        // إذا لم توجد صفحة هبوط، حاول جلب المنتج بالـ slug (للمنتجات المباشرة)
        if (platform) {
          try {
            const productResponse = await fetch(`/api/public/platform/${platform}/products/by-slug/${slug}`);
            if (productResponse.ok) {
              const productData = await productResponse.json();
              
              // إنشاء صفحة هبوط افتراضية للمنتج
              return {
                id: `product-${productData.id}`,
                title: productData.name,
                customUrl: slug,
                template: productData.defaultLandingTemplate || 'modern_minimal',
                productId: productData.id,
                platformId: productData.platformId,
                isActive: true,
                isProductDirect: true,
                product: productData
              };
            }
          } catch (error) {
          }
        }
        throw new Error('Landing page not found');
      }
      
      const landingData = await landingResponse.json();
      return landingData;
    },
    enabled: !!slug,
  });

  // جلب بيانات المنتج المرتبط (بدون مصادقة للعرض العام)
  const { data: product } = useQuery({
    queryKey: ['/api/public/products', landingPage?.productId],
    queryFn: async () => {
      if (!landingPage?.productId) return null;
      
      // إذا كان المنتج مضمناً مباشرة (منتج مباشر بالـ slug)، استخدمه
      if (landingPage?.isProductDirect && landingPage?.product) {
        // Using direct product from landing page
        return landingPage.product;
      }
      
      // وإلا، اجلب المنتج من الـ API
      // Fetching product from API
      const response = await fetch(`/api/public/products/${landingPage.productId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!landingPage?.productId,
  });

  // إرسال ViewContent عند توفر البيانات - مرة واحدة فقط عبر PixelTracker
  useEffect(() => {
    if (landingPage && product && !viewContentSentRef.current) {
      viewContentSentRef.current = true;
      setViewContentSent(true);
      
      // إنشاء معرفات ثابتة ومتطابقة بين Pixel و API
      const timestamp = Date.now();
      const uniqueExternalId = `user_${product.id}_${timestamp.toString().slice(-8)}`;
      
      // إعداد بيانات ViewContent حسب مواصفات Facebook الرسمية
      const standardPixelData = {
        content_name: product.name,
        content_category: getGoogleProductCategory(product),
        content_ids: [product.id],
        content_type: 'product',
        value: parseFloat(product.price),
        currency: 'USD',
        external_id: uniqueExternalId, // معرف خارجي ثابت ومتطابق
        landing_page_id: landingPage.id,
        product_id: product.id,
        // إضافة timestamp للاستخدام في PixelTracker
        _timestamp: timestamp
      };
      
      setViewContentPixelData(standardPixelData);
    }
  }, [landingPage?.id, product?.id]);

  // جلب بيانات مالك المنتج للحصول على السب دومين
  const { data: productOwner } = useQuery({
    queryKey: ['/api/public/users', product?.userId],
    queryFn: async () => {
      if (!product?.userId) return null;
      const response = await fetch(`/api/public/users/${product.userId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!product?.userId,
  });

  // جلب بيانات المنصة لعرض الشعار واسم المتجر
  const { data: platformData } = useQuery({
    queryKey: ['/api/public/platform', platform],
    queryFn: async () => {
      if (!platform) return null;
      const response = await fetch(`/api/public/platform/${platform}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!platform,
  });

  // تحديد الثيم بناءً على إعدادات المنتج/صفحة الهبوط (وليس تفضيلات المستخدم)
  useEffect(() => {
    if (landingPage || product) {
      // أولوية لإعدادات صفحة الهبوط
      const landingPageTheme = (landingPage as any)?.defaultTheme;
      // ثم إعدادات المنتج
      const productTheme = (product as any)?.defaultTheme;
      
      // استخدام الثيم المحدد في صفحة الهبوط أو المنتج
      const selectedTheme = landingPageTheme || productTheme || 'light';
      
      
      setIsDarkMode(selectedTheme === 'dark');
    }
  }, [landingPage, product]);

  // تعيين favicon المخصص للمنصة أولاً
  useEffect(() => {
    if (platformData && platformData.logoUrl) {
      // حذف جميع favicon الموجودة أولاً
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());
      
      // تحويل رابط الشعار إلى رابط عام
      const logoUrl = platformData.logoUrl.startsWith('/objects/') 
        ? platformData.logoUrl.replace('/objects/', '/public-objects/') 
        : platformData.logoUrl;
      
      const fullLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${window.location.origin}${logoUrl}`;
      
      // إضافة timestamp لتجنب التخزين المؤقت
      const timestamp = new Date().getTime();
      const faviconUrl = `${fullLogoUrl}?v=${timestamp}`;
      
      // إنشاء favicon جديد
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/x-icon';
      favicon.href = faviconUrl;
      document.head.appendChild(favicon);
      
      // إضافة shortcut icon
      const shortcutIcon = document.createElement('link');
      shortcutIcon.rel = 'shortcut icon';
      shortcutIcon.type = 'image/x-icon';
      shortcutIcon.href = faviconUrl;
      document.head.appendChild(shortcutIcon);
      
      // إضافة أحجام مختلفة
      const sizes = ['16x16', '32x32', '48x48', '64x64'];
      sizes.forEach(size => {
        const sizedIcon = document.createElement('link');
        sizedIcon.rel = 'icon';
        sizedIcon.type = 'image/png';
        sizedIcon.sizes = size;
        sizedIcon.href = faviconUrl;
        document.head.appendChild(sizedIcon);
      });
      
      // Apple touch icon
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = faviconUrl;
      document.head.appendChild(appleTouchIcon);
      
    }
  }, [platformData]);

  // جلب بيانات الفئة إذا لم توجد googleCategory
  useEffect(() => {
    if (product?.categoryId && !categoryGoogleCategory) {
      fetch(`/api/public/categories/${product.categoryId}`)
        .then(res => res.json())
        .then(categoryData => {
          if (categoryData?.googleCategory) {
            setCategoryGoogleCategory(categoryData.googleCategory);
          }
        })
        .catch(err => {
          // Silent error handling
        });
    }
  }, [product?.categoryId, categoryGoogleCategory]);

  // الحصول على Google Product Category من بيانات الفئة أو الافتراضي
  const getGoogleProductCategory = (productData: any) => {
    // محاولة الحصول على googleCategory من مصادر مختلفة
    let googleCategory = null;
    
    // 1. من categoryData.googleCategory
    if (productData?.categoryData?.googleCategory) {
      googleCategory = productData.categoryData.googleCategory;
    }
    // 2. من category.googleCategory (إذا كانت category كائن)
    else if (productData?.category?.googleCategory) {
      googleCategory = productData.category.googleCategory;
    }
    // 3. من الـ state الذي تم جلبه
    else if (categoryGoogleCategory) {
      googleCategory = categoryGoogleCategory;
    }
    
    if (googleCategory) {
      return googleCategory;
    }
    
    // إذا لم يوجد، استخدم الترجمة اليدوية كـ fallback
    const categoryName = typeof productData?.category === 'string' 
      ? productData.category 
      : productData?.category?.name || 'منتجات';
    
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

  // إضافة Product Schema للـ Facebook Catalog
  useEffect(() => {
    if (product && landingPage && platformData) {
      // إنشاء Product Schema JSON-LD
      const currentUrl = window.location.href;
      const productImage = product.imageUrls && product.imageUrls.length > 0 
        ? (product.imageUrls[0].startsWith('http') ? product.imageUrls[0] : `https://sanadi.pro${product.imageUrls[0]}`)
        : null;
      
      // الحصول على السعر المناسب
      let displayPrice = product.price;
      if (product.priceOffers && Array.isArray(product.priceOffers) && product.priceOffers.length > 0) {
        const defaultOffer = product.priceOffers.find((offer: any) => offer.isDefault) || product.priceOffers[0];
        displayPrice = defaultOffer.price;
      }
      
      // تحديد Google Category مرة واحدة لاستخدامه في أماكن مختلفة
      const googleCategory = getGoogleProductCategory(product);
      
      const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": productImage,
        "description": product.description || product.name,
        "sku": product.id,
        "gtin": product.id, // Global Trade Item Number
        "brand": {
          "@type": "Brand",
          "name": platformData.storeName || "متجر إلكتروني"
        },
        "category": googleCategory,
        "google_product_category": googleCategory,
        "offers": {
          "@type": "Offer",
          "url": currentUrl,
          "priceCurrency": "IQD",
          "price": displayPrice,
          "availability": product.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition",
          "seller": {
            "@type": "Organization",
            "name": platformData.storeName || "متجر إلكتروني"
          }
        }
      };
      
      // إضافة JSON-LD إلى head
      let existingSchema = document.getElementById('product-schema');
      if (existingSchema) {
        existingSchema.remove();
      }
      
      const script = document.createElement('script');
      script.id = 'product-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(productSchema);
      document.head.appendChild(script);
      
      // إضافة Microdata للـ body لضمان قراءة Facebook للبيانات
      let existingMicrodata = document.getElementById('product-microdata');
      if (existingMicrodata) {
        existingMicrodata.remove();
      }
      
      const microdataDiv = document.createElement('div');
      microdataDiv.id = 'product-microdata';
      microdataDiv.style.display = 'none';
      microdataDiv.innerHTML = `
        <div itemscope itemtype="https://schema.org/Product">
          <span itemprop="name">${product.name}</span>
          <span itemprop="sku">${product.id}</span>
          <span itemprop="category">${googleCategory}</span>
          <span itemprop="google_product_category">${googleCategory}</span>
          <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span itemprop="price">${displayPrice}</span>
            <span itemprop="priceCurrency">IQD</span>
            <span itemprop="availability">${product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}</span>
          </div>
        </div>
      `;
      document.body.appendChild(microdataDiv);
      
      // إضافة Meta Tags للـ Facebook Product Catalog (جميع الحقول المطلوبة)
      const metaTags = [
        // الحقول الأساسية المطلوبة
        { property: 'og:type', content: 'product' },
        { property: 'og:title', content: product.name },
        { property: 'og:description', content: product.description || product.name },
        { property: 'og:image', content: productImage },
        { property: 'og:url', content: currentUrl },
        
        // بيانات المنتج المطلوبة
        { name: 'product:id', content: product.id },
        { property: 'product:retailer_item_id', content: product.id },
        { name: 'product:title', content: product.name },
        { name: 'product:description', content: product.description || product.name },
        { name: 'product:link', content: currentUrl },
        { name: 'product:image_link', content: productImage },
        { name: 'product:availability', content: product.isActive ? 'in stock' : 'out of stock' },
        { name: 'product:price', content: `${displayPrice} IQD` },
        { property: 'product:price:amount', content: displayPrice.toString() },
        { property: 'product:price:currency', content: 'IQD' },
        { property: 'product:condition', content: 'new' },
        { property: 'product:category', content: googleCategory },
        { property: 'product:brand', content: platformData.storeName || 'متجر إلكتروني' },
        
        // Google Product Category بطرق مختلفة
        { name: 'google_product_category', content: googleCategory },
        { property: 'product:google_product_category', content: googleCategory },
        { property: 'og:product:category', content: googleCategory },
        { name: 'product_category', content: googleCategory }
      ];
      
      // إزالة Meta Tags القديمة
      const oldProductMetas = document.querySelectorAll('meta[property^="product:"], meta[name^="product:"], meta[name="google_product_category"], meta[property^="og:"]');
      oldProductMetas.forEach(meta => meta.remove());
      
      // إضافة Meta Tags الجديدة (فقط التي لها قيم)
      metaTags
        .filter(tag => tag.content && tag.content.trim() !== '' && tag.content !== 'null' && tag.content !== 'undefined')
        .forEach(tag => {
          const meta = document.createElement('meta');
          if (tag.property) {
            meta.setAttribute('property', tag.property);
          }
          if ((tag as any).name) {
            meta.setAttribute('name', (tag as any).name);
          }
          meta.setAttribute('content', tag.content);
          document.head.appendChild(meta);
        });
    }
  }, [product, landingPage, platformData]);
  
  // تعيين title الصفحة بناءً على بيانات المنتج والمنصة (بعد الـ favicon)
  useEffect(() => {
    if (product && platformData) {
      // الحصول على السعر المناسب
      let displayPrice = product.price;
      
      // إذا كانت هناك عروض، استخدم السعر من العرض الافتراضي
      if (product.priceOffers && Array.isArray(product.priceOffers) && product.priceOffers.length > 0) {
        const defaultOffer = product.priceOffers.find((offer: any) => offer.isDefault) || product.priceOffers[0];
        displayPrice = defaultOffer.price;
      }
      
      // تنسيق السعر
      const formattedPrice = formatCurrency(displayPrice);
      
      // تكوين العنوان: اسم المنتج - السعر | اسم المنصة
      const pageTitle = `${product.name} - ${formattedPrice} | ${platformData.platformName || 'متجرنا'}`;
      
      // تعيين title الصفحة
      document.title = pageTitle;
      
    } else if (product) {
      // إذا كان هناك منتج فقط بدون بيانات المنصة
      const displayPrice = product.price;
      const formattedPrice = formatCurrency(displayPrice);
      const pageTitle = `${product.name} - ${formattedPrice}`;
      document.title = pageTitle;
    }
  }, [product, platformData]);

  // تعيين meta tags للصفحة
  useEffect(() => {
    if (product && platformData) {
      // الحصول على السعر المناسب
      let displayPrice = product.price;
      if (product.priceOffers && Array.isArray(product.priceOffers) && product.priceOffers.length > 0) {
        const defaultOffer = product.priceOffers.find((offer: any) => offer.isDefault) || product.priceOffers[0];
        displayPrice = defaultOffer.price;
      }
      
      const formattedPrice = formatCurrency(displayPrice);
      
      // تعيين أو تحديث meta description
      let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      
      const description = `${product.name} بسعر ${formattedPrice} من ${platformData.platformName}. ${product.description || 'منتج عالي الجودة مع خدمة ممتازة.'}`;
      metaDescription.content = description.substring(0, 160); // حد الـ 160 حرف لـ SEO
      
      // تعيين Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.content = `${product.name} - ${formattedPrice}`;
      
      let ogDescription = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.content = description.substring(0, 160);
      
      // إضافة صورة المنتج إلى Open Graph إذا كانت متوفرة
      if (product.imageUrls && product.imageUrls.length > 0) {
        let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
        if (!ogImage) {
          ogImage = document.createElement('meta');
          ogImage.setAttribute('property', 'og:image');
          document.head.appendChild(ogImage);
        }
        const productImage = convertToPublicUrls(product.imageUrls)[0];
        ogImage.content = productImage.startsWith('http') ? productImage : `${window.location.origin}${productImage}`;
      }
      
    }
  }, [product, platformData]);

  // دالة لتغيير الثيم وحفظه في قاعدة البيانات
  const toggleTheme = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    
    try {
      // حفظ الثيم في صفحة الهبوط إذا كانت موجودة
      if (landingPage && !landingPage.isProductDirect && platformData) {
        const response = await fetch(`/api/platforms/${platformData.id}/landing-pages/${landingPage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ defaultTheme: newTheme })
        });
      }
      // أو حفظه في المنتج إذا كان منتجاً مباشراً
      else if (product && platformData) {
        const response = await fetch(`/api/platforms/${platformData.id}/products/${product.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ defaultTheme: newTheme })
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to save theme:', error);
    }
  };

  // جلب ألوان المنتج
  const { data: productColors = [] } = useQuery({
    queryKey: [`/api/products/${landingPage?.productId}/colors`],
    queryFn: async () => {
      if (!landingPage?.productId) return [];
      const response = await fetch(`/api/products/${landingPage.productId}/colors`);
      if (!response.ok) {
        return [];
      }
      const colors = await response.json();
      return colors;
    },
    enabled: !!landingPage?.productId,
  });

  // جلب أشكال المنتج
  const { data: productShapes = [] } = useQuery({
    queryKey: [`/api/products/${landingPage?.productId}/shapes`],
    queryFn: async () => {
      if (!landingPage?.productId) return [];
      const response = await fetch(`/api/products/${landingPage.productId}/shapes`);
      if (!response.ok) {
        return [];
      }
      const shapes = await response.json();
      return shapes;
    },
    enabled: !!landingPage?.productId,
  });

  // جلب أحجام المنتج
  const { data: productSizes = [] } = useQuery({
    queryKey: [`/api/products/${landingPage?.productId}/sizes`],
    queryFn: async () => {
      if (!landingPage?.productId) return [];
      const response = await fetch(`/api/products/${landingPage.productId}/sizes`);
      if (!response.ok) {
        return [];
      }
      const sizes = await response.json();
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

  // دالة مساعدة لتفعيل AddToCart عبر PixelTracker
  const handleAddToCartFocus = () => {
    if (landingPage && product && !addToCartPixelData) {
      // إنشاء معرفات ثابتة ومتطابقة بين Pixel و API
      const timestamp = Date.now();
      const uniqueExternalId = `user_${product.id}_${timestamp.toString().slice(-8)}`;
      
      // إعداد بيانات AddToCart حسب مواصفات Facebook الرسمية
      const standardPixelData = {
        content_name: product.name,
        content_category: getGoogleProductCategory(product),
        content_ids: [product.id],
        content_type: 'product',
        value: parseFloat(product.price),
        currency: 'USD',
        external_id: uniqueExternalId, // معرف خارجي ثابت ومتطابق
        landing_page_id: landingPage.id,
        product_id: product.id,
        // إضافة timestamp للاستخدام في PixelTracker
        _timestamp: timestamp
      };
      
      setAddToCartPixelData(standardPixelData);
    }
  };

  // Get selected offer quantity
  const getSelectedOfferQuantity = () => {
    
    // أولاً: تحقق من وجود form.watch('offer') للفورم البسيط
    const selectedOfferData = form.watch('offer');
    
    // إذا كان هناك عرض مختار في الفورم، استخدمه (له الأولوية)
    if (selectedOfferData) {
      
      // البحث عن العرض بناءً على النص - تحسين البحث
      let offerData = availableOffers.find((offer: any) => 
        selectedOfferData.includes(offer.label)
      );
      
      // استخراج الكمية من النص مباشرة (سواء وُجد العرض أم لا)
      
      if (selectedOfferData.includes('قطعة واحدة') || (selectedOfferData.includes('قطعة') && !selectedOfferData.includes('قطعتان') && !selectedOfferData.includes('قطعتين'))) {
        return 1;
      } else if (selectedOfferData.includes('قطعتان') || selectedOfferData.includes('قطعتين')) {
        return 2;
      } else if (selectedOfferData.includes('ثلاث قطع') || selectedOfferData.includes('ثلاثة قطع')) {
        return 3;
      } else if (selectedOfferData.includes('أربع قطع') || selectedOfferData.includes('أربعة قطع')) {
        return 4;
      } else if (selectedOfferData.includes('خمس قطع') || selectedOfferData.includes('خمسة قطع')) {
        return 5;
      } else if (selectedOfferData.includes('ست قطع') || selectedOfferData.includes('ستة قطع')) {
        return 6;
      } else if (selectedOfferData.includes('سبع قطع') || selectedOfferData.includes('سبعة قطع')) {
        return 7;
      } else if (selectedOfferData.includes('ثمان قطع') || selectedOfferData.includes('ثمانية قطع')) {
        return 8;
      } else if (selectedOfferData.includes('تسع قطع') || selectedOfferData.includes('تسعة قطع')) {
        return 9;
      } else if (selectedOfferData.includes('عشر قطع') || selectedOfferData.includes('عشرة قطع')) {
        return 10;
      }
      
      // البحث عن الأرقام في النص (تجاهل الأرقام الكبيرة مثل الأسعار)
      const numberMatch = selectedOfferData.match(/(\d+)/);
      if (numberMatch) {
        const extractedQuantity = parseInt(numberMatch[1]);
        // تجاهل الأرقام الكبيرة (الأسعار) - فقط الكميات الصغيرة
        if (extractedQuantity <= 10) {
          return extractedQuantity;
        } else {
        }
      }
      
      // إذا لم نجد أي شيء، نستخدم البيانات من العرض إن وُجد
      if (offerData) {
        const quantity = offerData.quantity || 1;
        return quantity;
      }
      
      return 1;
    }
    
    // ثانياً: للقوالب التي تستخدم selectedOffer (مثل TikTok)
    if (selectedOffer) {
      const offerData = availableOffers.find((offer: any) => offer.id === selectedOffer);
      const quantity = offerData?.quantity || 1;
      return quantity;
    }
    
    // إذا لم يكن هناك أي عرض مختار، ارجع 1
    return 1;
  };

  // Validate variant selections
  const validateVariantSelections = () => {
    const errors: string[] = [];
    const maxSelections = getSelectedOfferQuantity();
    
    if (selectedColorIds.length > maxSelections) {
      errors.push(`لقد اخترت العرض ${maxSelections} قطعة، يجب أن تحدد ${maxSelections} لون فقط (حددت ${selectedColorIds.length})`);
    }
    
    if (selectedShapeIds.length > maxSelections) {
      errors.push(`لقد اخترت العرض ${maxSelections} قطعة، يجب أن تحدد ${maxSelections} شكل فقط (حددت ${selectedShapeIds.length})`);
    }
    
    if (selectedSizeIds.length > maxSelections) {
      errors.push(`لقد اخترت العرض ${maxSelections} قطعة، يجب أن تحدد ${maxSelections} حجم فقط (حددت ${selectedSizeIds.length})`);
    }
    
    return errors;
  };

  // Variant selection handlers
  const handleColorSelection = (colorId: string) => {
    const maxSelections = getSelectedOfferQuantity();
    const currentSelections = selectedColorIds;
    
    if (currentSelections.includes(colorId)) {
      // Remove selection
      setSelectedColorIds(currentSelections.filter(id => id !== colorId));
      setVariantErrors([]);
    } else {
      // Add selection if under limit
      if (currentSelections.length < maxSelections) {
        setSelectedColorIds([...currentSelections, colorId]);
        setVariantErrors([]);
      } else {
        // Show error message when limit is reached
        const currentOffer = availableOffers.find((offer: any) => offer.id === selectedOffer);
        const errorMessage = `لقد اخترت العرض "${currentOffer?.label || 'الحالي'}" الذي يسمح باختيار ${maxSelections} لون فقط. يرجى تغيير العرض لاختيار المزيد من الألوان.`;
        setVariantErrors([errorMessage]);
      }
    }
  };

  const handleShapeSelection = (shapeId: string) => {
    const maxSelections = getSelectedOfferQuantity();
    const currentSelections = selectedShapeIds;
    
    if (currentSelections.includes(shapeId)) {
      // Remove selection
      setSelectedShapeIds(currentSelections.filter(id => id !== shapeId));
      setVariantErrors([]);
    } else {
      // Add selection if under limit
      if (currentSelections.length < maxSelections) {
        setSelectedShapeIds([...currentSelections, shapeId]);
        setVariantErrors([]);
      } else {
        // Show error message when limit is reached
        const currentOffer = availableOffers.find((offer: any) => offer.id === selectedOffer);
        const errorMessage = `لقد اخترت العرض "${currentOffer?.label || 'الحالي'}" الذي يسمح باختيار ${maxSelections} شكل فقط. يرجى تغيير العرض لاختيار المزيد من الأشكال.`;
        setVariantErrors([errorMessage]);
      }
    }
  };

  const handleSizeSelection = (sizeId: string) => {
    const maxSelections = getSelectedOfferQuantity();
    const currentSelections = selectedSizeIds;
    
    if (currentSelections.includes(sizeId)) {
      // Remove selection
      setSelectedSizeIds(currentSelections.filter(id => id !== sizeId));
      setVariantErrors([]);
    } else {
      // Add selection if under limit
      if (currentSelections.length < maxSelections) {
        setSelectedSizeIds([...currentSelections, sizeId]);
        setVariantErrors([]);
      } else {
        // Show error message when limit is reached
        const currentOffer = availableOffers.find((offer: any) => offer.id === selectedOffer);
        const errorMessage = `لقد اخترت العرض "${currentOffer?.label || 'الحالي'}" الذي يسمح باختيار ${maxSelections} حجم فقط. يرجى تغيير العرض لاختيار المزيد من الأحجام.`;
        setVariantErrors([errorMessage]);
      }
    }
  };

  // حساب العروض المتاحة
  const availableOffers = getAvailableOffers(product);
  
  useEffect(() => {
    // فحص تفصيلي للعروض
    if (availableOffers && availableOffers.length > 0) {
      availableOffers.forEach((offer: any, index: number) => {
      });
    }
  }, [product, availableOffers]);

  // تعيين العرض الافتراضي عند تحميل المنتج
  useEffect(() => {
    if (availableOffers.length > 0) {
      const defaultOffer = availableOffers.find((offer: any) => offer.isDefault) || availableOffers[0];
      
      // للقوالب التي تستخدم selectedOffer (مثل TikTok)
      if (!selectedOffer) {
        setSelectedOffer(defaultOffer.id);
      }
      
      // للقوالب الأخرى
      if (!form.getValues('offer')) {
        form.setValue('offer', `${defaultOffer.label} - ${formatCurrency(defaultOffer.price)}`);
      }
    }
  }, [availableOffers, form]);

  // إرسال الطلب
  const submitOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      try {
        
        // حساب الكمية والسعر من العرض المختار
        let selectedOfferData;
        let quantity = 1;
        let offerPrice = 0;
        
        // للقوالب التي تستخدم selectedOffer (مثل TikTok)
        if (selectedOffer) {
          selectedOfferData = availableOffers.find((offer: any) => offer.id === selectedOffer);
          quantity = selectedOfferData?.quantity || 1;
          offerPrice = selectedOfferData?.price || 0;
        } else {
          // للقوالب الأخرى
          selectedOfferData = availableOffers.find((offer: any) => 
            data.offer.includes(offer.label)
          );
          quantity = selectedOfferData?.quantity || 1;
          offerPrice = selectedOfferData?.price || 0;
        }
        
        
        // Validate variant selections before submitting
        const validationErrors = validateVariantSelections();
        if (validationErrors.length > 0) {
          setVariantErrors(validationErrors);
          throw new Error(validationErrors[0]);
        }
        
        const orderData = {
          ...data,
          landingPageId: landingPage?.id,
          productId: landingPage?.productId,
          quantity: quantity, // إضافة الكمية المحسوبة
          price: offerPrice, // إضافة السعر
          totalAmount: offerPrice, // إضافة المبلغ الإجمالي
          subtotal: offerPrice, // إضافة المبلغ الفرعي
          offer: selectedOfferData ? `${selectedOfferData.label} - ${formatCurrency(selectedOfferData.price)}` : data.offer, // تنسيق العرض
          // إضافة معلومات المتغيرات المختارة
          selectedColorIds: selectedColorIds,
          selectedShapeIds: selectedShapeIds,
          selectedSizeIds: selectedSizeIds,
          // إضافة تفاصيل إضافية للتشخيص
          colorCount: selectedColorIds.length,
          shapeCount: selectedShapeIds.length,
          sizeCount: selectedSizeIds.length,
          test: 'test'
        };
        
        
        
        // إنشاء معرفات ثابتة ومتطابقة بين Pixel و API
        const timestamp = Date.now();
        const uniqueExternalId = `user_${product.id}_${timestamp.toString().slice(-8)}`;
        
        // إعداد بيانات InitiateCheckout عبر PixelTracker
        const checkoutData = {
          content_name: product.name,
          content_category: getGoogleProductCategory(product),
          content_ids: [product.id],
          content_type: 'product',
          value: parseFloat(offerPrice.toString()),
          currency: 'USD',
          num_items: quantity,
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          external_id: uniqueExternalId, // معرف خارجي ثابت ومتطابق
          landing_page_id: landingPage.id,
          product_id: product.id,
          // إضافة timestamp للاستخدام في PixelTracker
          _timestamp: timestamp
        };
        
        setInitiateCheckoutData(checkoutData);

        const result = await apiRequest("/api/landing-page-orders", "POST", orderData);
        return result;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (newOrder: any) => {
      // إعداد بيانات Lead عبر PixelTracker
      if (landingPage?.platformId && product) {
        // إنشاء معرفات ثابتة ومتطابقة بين Pixel و API
        const timestamp = Date.now();
        const uniqueExternalId = `user_${product.id}_${timestamp.toString().slice(-8)}`;
        
        const leadData = {
          content_name: product.name,
          content_category: getGoogleProductCategory(product),
          content_ids: [product.id],
          content_type: 'product',
          value: parseFloat(newOrder.totalAmount?.toString() || '0'),
          currency: 'USD',
          customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          external_id: uniqueExternalId, // معرف خارجي ثابت ومتطابق
          landing_page_id: landingPage.id,
          product_id: product.id,
          order_id: newOrder.id,
          // إضافة timestamp للاستخدام في PixelTracker
          _timestamp: timestamp
        };
        
        setLeadEventData(leadData);
      }

      toast({
        title: "تم إرسال الطلب!",
        description: "تم إرسال طلبك بنجاح. سنتواصل معك قريباً.",
      });
      form.reset();
      setSelectedColorIds([]);
      setSelectedShapeIds([]);
      setSelectedSizeIds([]);
      setVariantErrors([]);
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
    const baseFieldClasses = "w-full p-3 rounded-lg focus:ring-2 focus:outline-none";
    const baseButtonClasses = "w-full py-3 text-white font-bold rounded-lg transition-all duration-300";

    switch(landingPage?.template) {
      case "modern_minimal":
        return {
          container: "bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-[#757575]/20 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto",
          field: `${baseFieldClasses} bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border`,
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
      
      case "tiktok_style":
        return {
          container: `${isDarkMode ? 'bg-black/95 text-white border-gray-700' : 'bg-white/95 text-gray-900 border-gray-200'} backdrop-blur-md rounded-xl border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`,
          field: `${baseFieldClasses} ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:ring-red-500 focus:border-red-500`,
          button: `${baseButtonClasses} bg-red-600 hover:bg-red-700 font-bold text-lg shadow-lg transform hover:scale-105`
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">خطأ في التحميل</h1>
            <p className="text-gray-600 mb-6">حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white dark:bg-blue-600 dark:text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // إظهار شاشة تحميل بسيطة للهاتف المحمول
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !landingPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">❌</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">خطأ في تحميل المنتج</h1>
            <p className="text-gray-600 mb-6">لم يتم العثور على المنتج أو حدث خطأ في التحميل</p>
            <div className="text-xs text-gray-500 mb-4">
              Debug: slug={slug}, platform={platform}, error={error?.message}
            </div>
            <button 
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              العودة للخلف
            </button>
          </div>
        </div>
      </div>
    );
  }

  // رندر صفحة الهبوط حسب النموذج المحدد
  const renderLandingPage = () => {
    // التأكد من وجود البيانات قبل الرندر
    if (!landingPage || !product) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      );
    }
    
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
              {/* Spacing */}
              <div className="h-2"></div>
              {/* Header */}
              <div className="bg-blue-600 text-white dark:bg-blue-600 dark:text-white rounded-b-2xl sticky top-0 z-40 mx-4">
                <div className="max-w-lg mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
                        ))}
                      </div>
                      <span className="text-xs text-yellow-400 mr-1">4.9</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {platformData?.logoUrl ? (
                        <img
                          src={platformData.logoUrl}
                          alt={`${platformData.platformName} شعار`}
                          className="w-10 h-10 rounded-lg object-cover border-2 border-[#757575]/30"
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
                        <h1 className="force-white-text">
                          {platformData?.platformName || "متجرنا"}
                        </h1>
                        <p className="force-yellow-text">
                          جودة مضمونة وخدمة ممتازة
                        </p>
                        <style dangerouslySetInnerHTML={{
                          __html: `
                            .force-white-text {
                              color: #ffffff !important;
                              font-size: 18px !important;
                              font-weight: bold !important;
                              line-height: 1.5 !important;
                            }
                            .force-yellow-text {
                              color: #facc15 !important;
                              font-size: 12px !important;
                              font-weight: bold !important;
                              line-height: 1.5 !important;
                            }
                          `
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Image */}
              <div className="px-4 pt-2 pb-2">
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
              <div className="px-4 pb-2">
                <div className="max-w-lg mx-auto">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 text-center border border-gray-700">
                    {/* اسم المنتج مع السعر */}
                    <h1 className="text-base font-semibold text-white mb-3">
                      {productName} <span className="text-base font-normal text-green-600">بـ {formatNumber(parseFloat(productPrice))} <span className="text-xs">د.ع</span></span>
                    </h1>
                    
                    {/* عرض الوفر والسعر المشطوب */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        <span className="line-through force-red-text">بدلاً من</span> 
                        <span className="force-white-discount line-through ml-1">{formatCurrency(parseFloat(productPrice) + 5000)}</span>
                      </span>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-[buttonPulse_2s_ease-in-out_infinite] shadow-lg shadow-red-500/50">
                        <span className="force-white-savings">🔥 وفر {formatCurrency(5000)}</span>
                      </span>
                      <style dangerouslySetInnerHTML={{
                        __html: `
                          .force-red-text {
                            color: #ef4444 !important;
                          }
                          .force-white-discount {
                            color: #ffffff !important;
                          }
                          .force-white-savings {
                            color: #ffffff !important;
                          }
                        `
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Order Section */}
            <div className="product-section bg-white mx-4 rounded-lg shadow-sm border p-6">

              {/* Order Form - Fixed in Page */}
              <div className="mb-6">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-medium flex items-center justify-center gap-2">
                    <i className="fas fa-pen text-xs"></i>
                    املأ بياناتك للطلب
                  </h3>
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => {
                    submitOrderMutation.mutate(data);
                  })} className="space-y-4 landing-page-form">
                    {/* الاسم */}
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input 
                                placeholder="الاسم الكامل *" 
                                className="pr-10 bg-white force-light-placeholder dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-200 dark:placeholder-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 border-[0.5px]" 
                                {...field}
                                onFocus={handleAddToCartFocus}
                              />
                              <style dangerouslySetInnerHTML={{
                                __html: `
                                  .force-light-placeholder::placeholder {
                                    color: #d1d5db !important;
                                  }
                                  .dark .force-light-placeholder::placeholder {
                                    color: #9ca3af !important;
                                  }
                                `
                              }} />
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
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input placeholder="07XX XXX XXXX" className="pr-10 bg-white force-light-placeholder dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-200 dark:placeholder-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 border-[0.5px]" {...field} />
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
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-9 bg-white pr-10 pr-10 dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px] relative">
                                <div className="flex items-center">
                                  <Package className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="اختر العرض" className="placeholder:text-gray-200 text-sm" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] overflow-auto z-50 p-0" position="popper" sideOffset={4}>
                                <div className="flex">
                                  {/* قائمة العروض - في اليسار */}
                                  <div className="flex-1 space-y-1">
                                    {availableOffers.length > 0 ? (
                                      availableOffers.map((offer: any, index: number) => {
                                        return (
                                          <SelectItem key={offer.id} value={offer.label + " - " + formatCurrency(offer.price)} className="h-12 flex items-center data-[highlighted]:bg-gray-800 data-[highlighted]:text-white data-[state=checked]:bg-gray-900 data-[state=checked]:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <div className="flex items-center justify-between w-full gap-3 h-full py-2">
                                              <div className="flex flex-col justify-center h-full">
                                                <span className="font-medium text-sm leading-tight">{offer.label}</span>
                                                {offer.savings > 0 && (
                                                  <span className="text-xs text-red-500 leading-tight">توفير {formatCurrency(offer.savings)}</span>
                                                )}
                                              </div>
                                              <span className="text-green-600 font-bold text-sm">{formatCurrency(offer.price)}</span>
                                            </div>
                                          </SelectItem>
                                        );
                                      })
                                    ) : (
                                      <SelectItem value={"قطعة واحدة - " + formatCurrency(parseFloat(product?.price || 0))} className="h-12 flex items-center data-[highlighted]:bg-gray-800 data-[highlighted]:text-white data-[state=checked]:bg-gray-900 data-[state=checked]:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <div className="flex items-center justify-between w-full gap-3 h-full py-2">
                                          <span className="font-medium text-sm">قطعة واحدة</span>
                                          <span className="text-green-600 font-bold text-sm">{formatCurrency(parseFloat(product?.price || 0))}</span>
                                        </div>
                                      </SelectItem>
                                    )}
                                  </div>
                                  
                                  {/* قائمة الملصقات الجديدة - تصميم جذاب */}
                                  <div className="flex flex-col w-20 px-2 py-1 space-y-1 border-l border-gray-200 dark:border-gray-600">
                                    {availableOffers.length > 0 ? (
                                      availableOffers.map((offer: any, index: number) => {
                                        const badgeText = index === 0 ? '🔥 الأولى' : index === 1 ? '💰 مخفض' : '⭐ مطلوب';
                                        const selectedGradient = index === 0 
                                          ? 'bg-gradient-to-r from-blue-600 to-purple-700' 
                                          : index === 1 
                                          ? 'bg-gradient-to-r from-red-600 to-pink-700'
                                          : 'bg-gradient-to-r from-green-600 to-emerald-700';
                                        const unselectedGradient = index === 0 
                                          ? 'bg-gradient-to-r from-blue-200 to-purple-300' 
                                          : index === 1 
                                          ? 'bg-gradient-to-r from-red-200 to-pink-300'
                                          : 'bg-gradient-to-r from-green-200 to-emerald-300';
                                        
                                        return (
                                          <div key={offer.id} className={"relative overflow-hidden rounded-lg " + unselectedGradient + " text-gray-700 shadow-md transform hover:scale-105 transition-all duration-200 h-12 flex items-center justify-center peer-data-[highlighted]:" + selectedGradient + " peer-data-[highlighted]:text-white peer-data-[state=checked]:" + selectedGradient + " peer-data-[state=checked]:text-white"}>
                                            <div className="px-2 py-1.5 text-center">
                                              <div className="text-xs font-bold leading-tight">{badgeText}</div>
                                            </div>
                                            {/* تأثير لامع */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse opacity-50"></div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 rounded-lg px-2 py-1.5 text-center shadow-md h-12 flex items-center justify-center">
                                        <div className="text-xs font-bold">📦 أساسي</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
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
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              الألوان المتاحة ({selectedColorIds.length}/{getSelectedOfferQuantity()})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {productColors.map((color: any) => (
                                <button 
                                  key={color.id} 
                                  type="button"
                                  className={"inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer relative " + (selectedColorIds.includes(color.id) ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-300 bg-gray-50")}
                                  title={color.colorName}
                                  onClick={() => handleColorSelection(color.id)}
                                >
                                  {color.colorImageUrl ? (
                                    <div className="flex items-center gap-2">
                                      <ImageModal
                                        src={color.colorImageUrl.startsWith('/objects/') ? 
                                          color.colorImageUrl.replace('/objects/', '/public-objects/') : 
                                          color.colorImageUrl
                                        }
                                        alt={color.colorName + " - اللون"}
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
                                  {selectedColorIds.includes(color.id) && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white">✓</span>
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
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              الأشكال المتاحة ({selectedShapeIds.length}/{getSelectedOfferQuantity()})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {productShapes.map((shape: any) => (
                                <button 
                                  key={shape.id} 
                                  type="button"
                                  className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                    selectedShapeIds.includes(shape.id) 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                  title={shape.shapeName}
                                  onClick={() => handleShapeSelection(shape.id)}
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
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              الأحجام المتاحة ({selectedSizeIds.length}/{getSelectedOfferQuantity()})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {productSizes.map((size: any) => (
                                <button 
                                  key={size.id} 
                                  type="button"
                                  className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer relative ${
                                    selectedSizeIds.includes(size.id) 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                  title={size.sizeName}
                                  onClick={() => handleSizeSelection(size.id)}
                                >
                                  {size.sizeImageUrl ? (
                                    <div className="flex items-center gap-2">
                                      <ImageModal
                                        src={size.sizeImageUrl.startsWith('/objects/') ? 
                                          size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                          size.sizeImageUrl
                                        }
                                        alt={`${size.sizeName} - الحجم`}
                                      >
                                        <img 
                                          src={size.sizeImageUrl.startsWith('/objects/') ? 
                                            size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                            size.sizeImageUrl
                                          }
                                          alt={size.sizeName}
                                          className="w-12 h-12 object-cover rounded border-2 border-gray-400 hover:scale-105 transition-transform"
                                        />
                                      </ImageModal>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700">{size.sizeName}</span>
                                        {size.sizeValue && (
                                          <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-gray-700">{size.sizeName}</span>
                                      {size.sizeValue && (
                                        <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                      )}
                                    </div>
                                  )}
                                  {selectedSizeIds.includes(size.id) && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white">✓</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
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
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="bg-white pr-10 dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px] relative">
                                <div className="flex items-center">
                                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="اختر المحافظة" className="text-sm placeholder:text-gray-200" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[400px] overflow-auto" position="popper" sideOffset={4}>
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
                          <FormControl>
                            <div className="relative">
                              <Home className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                              <Textarea 
                                placeholder="العنوان التفصيلي"
                                className="resize-none pr-10 force-light-placeholder min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-200 dark:placeholder-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                          <FormControl>
                            <div className="relative">
                              <MessageSquare className="absolute right-3 top-2 text-gray-400 h-4 w-4" />
                              <Textarea 
                                placeholder="أي ملاحظات أو طلبات خاصة (اختياري)"
                                className="resize-none pr-10 force-light-placeholder min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-200 dark:placeholder-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                        className="flex-1 bg-green-600 hover:bg-green-700 h-14 text-lg font-bold force-white-submit-button animate-[buttonPulse_2s_ease-in-out_infinite] hover:animate-none" style={{color: "white", backgroundColor: "#16a34a", fontWeight: "bold", border: "none"}}
                      >
                        {submitOrderMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#757575] mr-2"></div>
                            <span className="force-white-submit-text">جارٍ الإرسال...</span>
                          </>
                        ) : (
                          <span className="force-white-submit-text">إرسال الطلب</span>
                        )}
                      </Button>
                        <style dangerouslySetInnerHTML={{
                          __html: `
                            .force-white-submit-button {
                              color: #ffffff !important;
                            }
                            .force-white-submit-text {
                              color: #ffffff !important;
                            }
                          `
                        }} />
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
                  <div></div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
                        ))}
                      </div>
                      <span className="text-lg font-bold text-gray-900">4.9</span>
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
                            <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
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
                            <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
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
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 z-50 rounded-t-2xl">
              <div className="max-w-sm mx-auto lg:max-w-2xl xl:max-w-4xl px-4">
                <div className="flex items-center justify-around">
                {/* طلب الآن */}
                <button 
                  onClick={() => setShowOrderForm(true)}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-gray-700 transition-colors"
                >
                  <Package className="h-5 w-5" />
                  <span className="text-xs font-medium">طلب الآن</span>
                </button>

                {/* آراء العملاء */}
                <button 
                  onClick={() => {
                    const reviewsElement = document.querySelector('.reviews-section');
                  }}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-gray-700 transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-xs font-medium">آراء</span>
                </button>

                {/* اتصل بنا */}
                <button 
                  onClick={() => window.open('tel:+964', '_blank')}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-gray-700 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  <span className="text-xs font-medium">اتصل</span>
                </button>

                {/* المنتجات */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const subdomain = productOwner?.subdomain || platformData?.subdomain;
                    if (subdomain) {
                      const url = `https://sanadi.pro/${subdomain}`;
                      // استخدام location.href بدلاً من window.open لتجنب التأخير
                      window.location.href = url;
                    } else {
                      window.location.href = 'https://sanadi.pro';
                    }
                  }}
                  className="flex flex-col items-center gap-1 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200"
                >
                  <Home className="h-5 w-5" />
                  <span className="text-xs font-medium">المنتجات</span>
                </button>
                </div>
              </div>
            </div>

            {/* Add bottom padding to prevent content overlap and privacy policy button */}
            <div className="pb-20">
              {/* Privacy Policy Button */}
              <div className="flex justify-center mt-8 mb-4">
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
                >
                  سياسة الخصوصية
                </a>
              </div>
            </div>
            </div>
          </div>
        );

      case "tiktok_style":
        return (
          <div className={`min-h-screen tiktok-style ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
            {/* Header */}
            <div className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
              <div className="max-w-md mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  {/* النجوم في الجهة اليمنى */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-yellow-400 ml-1">4.9</span>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fas fa-star text-xs"></i>
                      ))}
                    </div>
                  </div>
                  {/* الشعار والاسم في الجهة اليسرى */}
                  <div className="flex items-center gap-2">
                    {platformData?.logoUrl ? (
                      <img
                        src={platformData.logoUrl.startsWith('/objects/') ? 
                          platformData.logoUrl.replace('/objects/', '/public-objects/') : 
                          platformData.logoUrl
                        }
                        alt="شعار المتجر"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <i className="fas fa-store text-white text-sm"></i>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <h1 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{platformData?.platformName || "متجرنا"}</h1>
                        <i 
                          className="fas fa-check-circle text-xs tiktok-check-blue" 
                          style={{
                            color: '#60a5fa !important',
                            WebkitTextFillColor: '#60a5fa !important'
                          }}
                        ></i>
                      </div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ثقة . أمان . جودة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-4">
              {/* Product Image Slider */}
              <div className="mb-4">
                <div className={`relative aspect-square ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                  {/* الصورة الحالية */}
                  <img
                    src={convertToPublicUrls((product as any)?.imageUrls || [])[selectedImageIndex] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}
                    alt={`${productName} ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  
                  {/* مؤشر الصور */}
                  {convertToPublicUrls((product as any)?.imageUrls || []).length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2 py-1">
                      <span className="text-white text-xs">
                        {selectedImageIndex + 1} / {convertToPublicUrls((product as any)?.imageUrls || []).length}
                      </span>
                    </div>
                  )}
                  
                  {/* أسهم التنقل */}
                  {convertToPublicUrls((product as any)?.imageUrls || []).length > 1 && (
                    <>
                      {/* السهم الأيسر */}
                      <button 
                        onClick={() => {
                          const images = convertToPublicUrls((product as any)?.imageUrls || []);
                          setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1);
                        }}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 rounded-full p-2 transition-colors"
                      >
                        <i className="fas fa-chevron-left text-white text-sm"></i>
                      </button>
                      
                      {/* السهم الأيمن */}
                      <button 
                        onClick={() => {
                          const images = convertToPublicUrls((product as any)?.imageUrls || []);
                          setSelectedImageIndex(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 rounded-full p-2 transition-colors"
                      >
                        <i className="fas fa-chevron-right text-white text-sm"></i>
                      </button>
                    </>
                  )}
                </div>
                
                {/* نقاط التنقل السفلية */}
                {convertToPublicUrls((product as any)?.imageUrls || []).length > 1 && (
                  <div className="flex justify-center mt-3 gap-2">
                    {convertToPublicUrls((product as any)?.imageUrls || []).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          selectedImageIndex === index 
                            ? 'bg-red-500' 
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Product Title */}
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{productName}</h2>

              {/* Product Description */}
              {productDescription && (
                <p 
                  className="text-sm mb-4 leading-relaxed font-medium tiktok-description-red" 
                  style={{
                    color: '#ef4444 !important',
                    WebkitTextFillColor: '#ef4444 !important',
                    textShadow: 'none !important'
                  }}
                >
                  {productDescription}
                </p>
              )}

              {/* Offers and Form */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-clock text-yellow-400"></i>
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>أرسل طلبك الآن للاستفادة من العرض</span>
                </div>
                
                {/* Order Form with TikTok Style */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-4">
                    {/* Offers Section */}
                    <div className="space-y-3">
                      {availableOffers.map((offer: any) => (
                        <label key={offer.id} className={`flex items-center gap-3 p-3 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg border cursor-pointer hover:border-red-500 transition-colors`}>
                          <div className="relative">
                            <input
                              type="radio"
                              name="offer"
                              value={offer.id}
                              checked={selectedOffer === offer.id}
                              onChange={(e) => {
                                setSelectedOffer(e.target.value);
                                const selectedOfferData = availableOffers.find((o: any) => o.id === e.target.value);
                                if (selectedOfferData) {
                                  form.setValue('offer', e.target.value);
                                  // إعادة تعيين الاختيارات عند تغيير العرض
                                  setSelectedColorIds([]);
                                  setSelectedShapeIds([]);
                                  setSelectedSizeIds([]);
                                }
                              }}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedOffer === offer.id 
                                ? 'border-red-500 bg-red-500' 
                                : 'border-gray-500'
                            }`}>
                              {selectedOffer === offer.id && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{offer.label}</span>
                              <div className="text-left flex items-center gap-3">
                                <span 
                                  className="font-bold text-lg tiktok-price-green" 
                                  style={{
                                    color: '#10b981 !important',
                                    WebkitTextFillColor: '#10b981 !important',
                                    textShadow: 'none !important'
                                  }}
                                >
                                  {formatCurrency(offer.price)}
                                </span>
                                <i 
                                  className="fas fa-arrow-left tiktok-arrow-red" 
                                  style={{
                                    color: '#ef4444 !important',
                                    WebkitTextFillColor: '#ef4444 !important'
                                  }}
                                ></i>
                                {offer.savings > 0 && (
                                  <div 
                                    className="text-xs tiktok-savings-green" 
                                    style={{
                                      color: '#10b981 !important',
                                      WebkitTextFillColor: '#10b981 !important',
                                      textShadow: 'none !important'
                                    }}
                                  >
                                    وفر {formatCurrency(offer.savings)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Customer Name */}
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="الاسم الكامل"
                              className={`${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:border-red-500`}
                              {...field}
                              onFocus={handleAddToCartFocus}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    {/* Customer Phone */}
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="رقم الهاتف"
                              type="tel"
                              className={`${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:border-red-500`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    {/* Colors */}
                    {productColors && productColors.length > 0 && (
                      <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          الألوان المتاحة ({selectedColorIds.length}/{(() => {
                            const qty = getSelectedOfferQuantity();
                            return qty;
                          })()}) - المتوفر: {productColors.length}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {productColors.map((color: any) => {
                            const isSelected = selectedColorIds.includes(color.id);
                            const isDisabled = !isSelected && selectedColorIds.length >= getSelectedOfferQuantity();
                            
                            return (
                              <button
                                key={color.id}
                                type="button"
                                onClick={() => handleColorSelection(color.id)}
                                disabled={isDisabled}
                                className={`p-2 rounded-lg border text-sm relative transition-all duration-200 ${
                                  isSelected
                                    ? 'border-red-500 bg-red-500/20 text-red-400'
                                    : isDisabled
                                      ? isDarkMode 
                                        ? 'border-gray-700 bg-gray-900 text-gray-600 cursor-not-allowed opacity-50'
                                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : isDarkMode 
                                        ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                {color.colorName || color.name}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white">✓</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Shapes */}
                    {productShapes && productShapes.length > 0 && (
                      <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          الأشكال المتاحة ({selectedShapeIds.length}/{getSelectedOfferQuantity()}) - المتوفر: {productShapes.length}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {productShapes.map((shape: any) => {
                            const isSelected = selectedShapeIds.includes(shape.id);
                            const isDisabled = !isSelected && selectedShapeIds.length >= getSelectedOfferQuantity();
                            
                            return (
                              <button
                                key={shape.id}
                                type="button"
                                onClick={() => handleShapeSelection(shape.id)}
                                disabled={isDisabled}
                                className={`p-2 rounded-lg border text-sm relative transition-all duration-200 ${
                                  isSelected
                                    ? 'border-red-500 bg-red-500/20 text-red-400'
                                    : isDisabled
                                      ? isDarkMode 
                                        ? 'border-gray-700 bg-gray-900 text-gray-600 cursor-not-allowed opacity-50'
                                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : isDarkMode 
                                        ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                {shape.shapeName || shape.name}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white">✓</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sizes */}
                    {productSizes && productSizes.length > 0 && (
                      <div>
                        <label className={`block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          الأحجام المتاحة ({selectedSizeIds.length}/{getSelectedOfferQuantity()}) - المتوفر: {productSizes.length}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {productSizes.map((size: any) => {
                            const isSelected = selectedSizeIds.includes(size.id);
                            const isDisabled = !isSelected && selectedSizeIds.length >= getSelectedOfferQuantity();
                            
                            return (
                              <button
                                key={size.id}
                                type="button"
                                onClick={() => handleSizeSelection(size.id)}
                                disabled={isDisabled}
                                className={`p-2 rounded-lg border text-sm relative transition-all duration-200 ${
                                  isSelected
                                    ? 'border-red-500 bg-red-500/20 text-red-400'
                                    : isDisabled
                                      ? isDarkMode 
                                        ? 'border-gray-700 bg-gray-900 text-gray-600 cursor-not-allowed opacity-50'
                                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : isDarkMode 
                                        ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                                        : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                {size.sizeName || size.name}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white">✓</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Variant Errors */}
                    {variantErrors.length > 0 && (
                      <div className={`${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-4`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <i className="fas fa-exclamation-triangle text-red-500 text-lg"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-800'} mb-1`}>
                              تنبيه: تجاوز الحد المسموح
                            </h4>
                            {variantErrors.map((error, index) => (
                              <p key={index} className={`${isDarkMode ? 'text-red-300' : 'text-red-700'} text-sm leading-relaxed`}>
                                {error}
                              </p>
                            ))}
                          </div>
                          <button
                            onClick={() => setVariantErrors([])}
                            className={`flex-shrink-0 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'} transition-colors`}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Governorate */}
                    <FormField
                      control={form.control}
                      name="customerGovernorate"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className={`${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:border-red-500`}>
                                <SelectValue placeholder="اختر المحافظة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} max-h-60 overflow-y-auto`}>
                              <div className="grid grid-cols-3 gap-1 p-2">
                                {iraqGovernorates.map((gov) => (
                                  <SelectItem 
                                    key={gov} 
                                    value={gov}
                                    className={`${isDarkMode ? 'text-white' : 'text-gray-900'} hover:bg-red-600 focus:bg-red-600 cursor-pointer rounded p-2 text-xs text-center`}
                                  >
                                    {gov}
                                  </SelectItem>
                                ))}
                              </div>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    {/* Address */}
                    <FormField
                      control={form.control}
                      name="customerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="العنوان التفصيلي"
                              className={`${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:border-red-500`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="ملاحظات إضافية (اختياري)"
                              className={`${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:border-red-500 resize-none`}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={submitOrderMutation.isPending}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105"
                      style={{
                        color: 'white !important'
                      }}
                    >
                      {submitOrderMutation.isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <i className="fas fa-spinner fa-spin"></i>
                          جاري الإرسال...
                        </div>
                      ) : (
                        'إرسال الطلب'
                      )}
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  جميع الحقوق محفوظة © 2024 {platformData?.platformName || "متجرنا"}
                </p>
              </div>
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
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{platformData?.platformName || "متجرنا المتميز"}</h1>
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
                    <h1 className="text-lg lg:text-2xl font-black mb-3 leading-tight">
                      {productName} <span className="text-base font-normal text-orange-400">بـ {formatNumber(parseFloat(productPrice || '0'))} <span className="text-xs">د.ع</span></span>
                      <br />
                      <span className="text-orange-400">العرض الأفضل في السوق</span>
                    </h1>
                    <p className="text-sm mb-4 opacity-90 leading-relaxed">{productDescription || "منتج عالي الجودة بأفضل الأسعار"}</p>
                    
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                      <div className="text-center">
                        <div className="text-xs line-through font-medium" style={{color: '#ef4444'}}>بدلاً من {formatCurrency(parseFloat(productPrice || '0') + 10000)}</div>
                      </div>
                      <div className="bg-red-500 px-2 py-1 rounded text-xs font-bold animate-pulse">
                        <span className="text-white">وفر {formatCurrency(10000)}</span>
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
                        <div className="text-lg font-bold !text-white dark:!text-white">{formatCurrency(parseFloat(productPrice || '0'))}</div>
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
                    <div className="text-lg font-bold text-orange-400 mb-1">+5000</div>
                    <div className="text-gray-300 text-xs">عميل راضي</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-400 mb-1">24/7</div>
                    <div className="text-gray-300 text-xs">دعم فني</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-400 mb-1">99%</div>
                    <div className="text-gray-300 text-xs">رضا العملاء</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-400 mb-1">سريع</div>
                    <div className="text-gray-300 text-xs">التوصيل</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Form Section */}
            <div className="bg-white mx-4 rounded-lg shadow-sm border p-6" id="order-form">
              {/* Order Form - Fixed in Page */}
              <div className="mb-6">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-medium flex items-center justify-center gap-2">
                    <i className="fas fa-pen text-xs"></i>
                    املأ بياناتك للطلب
                  </h3>
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-2 landing-page-form">
                    {/* الاسم */}
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input placeholder="الاسم الكامل *" className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500" {...field} onFocus={handleAddToCartFocus} />
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
                              <Input placeholder="07XX XXX XXXX" className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]" {...field} />
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
                              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                <div className="flex items-center">
                                  <Package className="ml-2 h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="اختر العرض" className="placeholder:text-gray-200" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                {availableOffers.length > 0 ? (
                                  availableOffers.map((offer: any) => (
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
                        </FormItem>
                      )}
                    />

                    {/* خيارات المنتج */}
                    {(productColors.length > 0 || productShapes.length > 0 || productSizes.length > 0) && (
                      <div className="space-y-3">
                        
                        {/* الألوان المتاحة */}
                        {productColors.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              الألوان المتاحة ({selectedColorIds.length}/{getSelectedOfferQuantity()})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {productColors.map((color: any) => (
                                <button 
                                  key={color.id} 
                                  type="button"
                                  className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer relative ${
                                    selectedColorIds.includes(color.id) 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                  title={color.colorName}
                                  onClick={() => handleColorSelection(color.id)}
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
                                  {selectedColorIds.includes(color.id) && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white">✓</span>
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
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              الأشكال المتاحة ({selectedShapeIds.length}/{getSelectedOfferQuantity()})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {productShapes.map((shape: any) => (
                                <button 
                                  key={shape.id} 
                                  type="button"
                                  className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                    selectedShapeIds.includes(shape.id) 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                  title={shape.shapeName}
                                  onClick={() => handleShapeSelection(shape.id)}
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
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              الأحجام المتاحة ({selectedSizeIds.length}/{getSelectedOfferQuantity()})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {productSizes.map((size: any) => (
                                <button 
                                  key={size.id} 
                                  type="button"
                                  className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer relative ${
                                    selectedSizeIds.includes(size.id) 
                                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                      : 'border-gray-300 bg-gray-50'
                                  }`}
                                  title={size.sizeName}
                                  onClick={() => handleSizeSelection(size.id)}
                                >
                                  {size.sizeImageUrl ? (
                                    <div className="flex items-center gap-2">
                                      <ImageModal
                                        src={size.sizeImageUrl.startsWith('/objects/') ? 
                                          size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                          size.sizeImageUrl
                                        }
                                        alt={`${size.sizeName} - الحجم`}
                                      >
                                        <img 
                                          src={size.sizeImageUrl.startsWith('/objects/') ? 
                                            size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                            size.sizeImageUrl
                                          }
                                          alt={size.sizeName}
                                          className="w-12 h-12 object-cover rounded border-2 border-gray-400 hover:scale-105 transition-transform"
                                        />
                                      </ImageModal>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700">{size.sizeName}</span>
                                        {size.sizeValue && (
                                          <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-gray-700">{size.sizeName}</span>
                                      {size.sizeValue && (
                                        <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                      )}
                                    </div>
                                  )}
                                  {selectedSizeIds.includes(size.id) && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white">✓</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
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
                              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                <div className="flex items-center">
                                  <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="اختر المحافظة" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[400px] overflow-auto" position="popper" sideOffset={4}>
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
                                className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                                className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                        className="flex-1 bg-green-600 hover:bg-green-700 h-14 text-lg font-bold !text-white dark:!text-white animate-[buttonPulse_2s_ease-in-out_infinite] hover:animate-none" style={{color: "white", backgroundColor: "#16a34a", fontWeight: "bold", border: "none"}}
                      >
                        {submitOrderMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#757575] mr-2"></div>
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
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg font-bold rounded-lg"
                >
                  🛒 اطلب الآن
                </Button>
              </div>
            </div>

            {/* Add bottom padding for mobile and privacy policy button */}
            <div className="pb-20 md:pb-8">
              {/* Privacy Policy Button */}
              <div className="flex justify-center mt-8 mb-4">
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
                >
                  سياسة الخصوصية
                </a>
              </div>
            </div>
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
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    {productName} <span className="text-base font-normal text-green-600">بـ {formatNumber(parseFloat(productPrice || '0'))} <span className="text-xs">د.ع</span></span>
                  </h2>
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
                  <div className="text-center mb-3">
                    <h3 className="text-sm font-medium flex items-center justify-center gap-2">
                      <i className="fas fa-pen text-xs"></i>
                      املأ بياناتك للطلب
                    </h3>
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
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border" {...field} />
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
                                <Input placeholder="07XX XXX XXXX" className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]" {...field} />
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
                                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer: any) => (
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                              الألوان المتاحة ({selectedColorIds.length}/{getSelectedOfferQuantity()})
                            </div>
                              <div className="flex flex-wrap gap-2">
                                {productColors.map((color: any) => (
                                  <button 
                                    key={color.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-green-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedColorIds.includes(color.id) 
                                        ? 'border-green-500 bg-green-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => handleColorSelection(color.id)}
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                              الأشكال المتاحة ({selectedShapeIds.length}/{getSelectedOfferQuantity()})
                            </div>
                              <div className="flex flex-wrap gap-2">
                                {productShapes.map((shape: any) => (
                                  <button 
                                    key={shape.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-green-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedShapeIds.includes(shape.id) 
                                        ? 'border-green-500 bg-green-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => handleShapeSelection(shape.id)}
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                الأحجام المتاحة ({selectedSizeIds.length}/{getSelectedOfferQuantity()}) - المتوفر: {productSizes.length}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {productSizes.map((size: any) => {
                                  const isSelected = selectedSizeIds.includes(size.id);
                                  const isDisabled = !isSelected && selectedSizeIds.length >= getSelectedOfferQuantity();
                                  
                                  return (
                                    <button 
                                      key={size.id} 
                                      type="button"
                                      disabled={isDisabled}
                                      className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md transition-all cursor-pointer relative ${
                                        isSelected
                                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                                          : isDisabled
                                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                            : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:shadow-sm'
                                      }`}
                                      title={size.sizeName}
                                      onClick={() => handleSizeSelection(size.id)}
                                    >
                                      {size.sizeImageUrl ? (
                                        <div className="flex items-center gap-2">
                                          <img 
                                            src={size.sizeImageUrl.startsWith('/objects/') ? 
                                              size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                              size.sizeImageUrl
                                            }
                                            alt={size.sizeName}
                                            className="w-6 h-6 object-cover rounded border"
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium">{size.sizeName}</span>
                                            {size.sizeValue && (
                                              <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium">{size.sizeName}</span>
                                          {size.sizeValue && (
                                            <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                          )}
                                        </div>
                                      )}
                                      {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                          <span className="text-xs text-white">✓</span>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
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
                                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[400px] overflow-auto" position="popper" sideOffset={4}>
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
                                  className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                                  className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#757575] mr-2"></div>
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
                    <div></div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
                          ))}
                        </div>
                        <span className="text-lg font-bold text-gray-900">4.9</span>
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
                              <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
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
                              <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
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
                              <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
                            ))}
                            <i className="far fa-star text-xs text-yellow-400"></i>
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
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-bold rounded-lg"
              >
                🛒 اطلب الآن • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap and privacy policy button */}
            <div className="pb-20 md:pb-8">
              {/* Privacy Policy Button */}
              <div className="flex justify-center mt-8 mb-4">
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
                >
                  سياسة الخصوصية
                </a>
              </div>
            </div>
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
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    {productName} <span className="text-base font-normal text-blue-600">بـ {formatNumber(parseFloat(productPrice || '0'))} <span className="text-xs">د.ع</span></span>
                  </h2>
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
                    <div></div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
                          ))}
                        </div>
                        <span className="text-lg font-bold text-gray-900">4.9</span>
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
                              <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
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
                              <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
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
                              <i key={i} className="fas fa-star text-xs text-yellow-400"></i>
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
                  <div className="text-center mb-3">
                    <h3 className="text-sm font-medium flex items-center justify-center gap-2">
                      <i className="fas fa-pen text-xs"></i>
                      املأ بياناتك للطلب
                    </h3>
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
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border" {...field} />
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
                                <Input placeholder="07XX XXX XXXX" className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]" {...field} />
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
                                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer: any) => (
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                              الألوان المتاحة ({selectedColorIds.length}/{getSelectedOfferQuantity()})
                            </div>
                              <div className="flex flex-wrap gap-2">
                                {productColors.map((color: any) => (
                                  <button 
                                    key={color.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedColorIds.includes(color.id) 
                                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => handleColorSelection(color.id)}
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                              الأشكال المتاحة ({selectedShapeIds.length}/{getSelectedOfferQuantity()})
                            </div>
                              <div className="flex flex-wrap gap-2">
                                {productShapes.map((shape: any) => (
                                  <button 
                                    key={shape.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedShapeIds.includes(shape.id) 
                                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => handleShapeSelection(shape.id)}
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                الأحجام المتاحة ({selectedSizeIds.length}/{getSelectedOfferQuantity()}) - المتوفر: {productSizes.length}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {productSizes.map((size: any) => {
                                  const isSelected = selectedSizeIds.includes(size.id);
                                  const isDisabled = !isSelected && selectedSizeIds.length >= getSelectedOfferQuantity();
                                  
                                  return (
                                    <button 
                                      key={size.id} 
                                      type="button"
                                      disabled={isDisabled}
                                      className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md transition-all cursor-pointer relative ${
                                        isSelected
                                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                                          : isDisabled
                                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                            : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:shadow-sm'
                                      }`}
                                      title={size.sizeName}
                                      onClick={() => handleSizeSelection(size.id)}
                                    >
                                      {size.sizeImageUrl ? (
                                        <div className="flex items-center gap-2">
                                          <img 
                                            src={size.sizeImageUrl.startsWith('/objects/') ? 
                                              size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                              size.sizeImageUrl
                                            }
                                            alt={size.sizeName}
                                            className="w-6 h-6 object-cover rounded border"
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium">{size.sizeName}</span>
                                            {size.sizeValue && (
                                              <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium">{size.sizeName}</span>
                                          {size.sizeValue && (
                                            <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                          )}
                                        </div>
                                      )}
                                      {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                          <span className="text-xs text-white">✓</span>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
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
                                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[400px] overflow-auto" position="popper" sideOffset={4}>
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
                                  className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                                  className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#757575] mr-2"></div>
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
                  <i className="fas fa-star text-yellow-400 text-lg mb-2"></i>
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
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-bold rounded-lg"
              >
                ⭐ اطلب الآن • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap and privacy policy button */}
            <div className="pb-20 md:pb-8">
              {/* Privacy Policy Button */}
              <div className="flex justify-center mt-8 mb-4">
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
                >
                  سياسة الخصوصية
                </a>
              </div>
            </div>
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
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    {productName} <span className="text-base font-normal text-green-600">بـ {formatNumber(parseFloat(productPrice || '0'))} <span className="text-xs">د.ع</span></span>
                  </h2>
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
                  <div className="text-center mb-3">
                    <h3 className="text-sm font-medium flex items-center justify-center gap-2">
                      <i className="fas fa-pen text-xs"></i>
                      املأ بياناتك للطلب
                    </h3>
                  </div>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-4">
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
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border" {...field} />
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
                                <Input placeholder="07XX XXX XXXX" className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]" {...field} />
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
                                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer: any) => (
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                              الألوان المتاحة ({selectedColorIds.length}/{getSelectedOfferQuantity()})
                            </div>
                              <div className="flex flex-wrap gap-2">
                                {productColors.map((color: any) => (
                                  <button 
                                    key={color.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-green-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedColorIds.includes(color.id) 
                                        ? 'border-green-500 bg-green-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => handleColorSelection(color.id)}
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                              الأشكال المتاحة ({selectedShapeIds.length}/{getSelectedOfferQuantity()})
                            </div>
                              <div className="flex flex-wrap gap-2">
                                {productShapes.map((shape: any) => (
                                  <button 
                                    key={shape.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-green-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedShapeIds.includes(shape.id) 
                                        ? 'border-green-500 bg-green-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => handleShapeSelection(shape.id)}
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                الأحجام المتاحة ({selectedSizeIds.length}/{getSelectedOfferQuantity()}) - المتوفر: {productSizes.length}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {productSizes.map((size: any) => {
                                  const isSelected = selectedSizeIds.includes(size.id);
                                  const isDisabled = !isSelected && selectedSizeIds.length >= getSelectedOfferQuantity();
                                  
                                  return (
                                    <button 
                                      key={size.id} 
                                      type="button"
                                      disabled={isDisabled}
                                      className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md transition-all cursor-pointer relative ${
                                        isSelected
                                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                                          : isDisabled
                                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                            : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:shadow-sm'
                                      }`}
                                      title={size.sizeName}
                                      onClick={() => handleSizeSelection(size.id)}
                                    >
                                      {size.sizeImageUrl ? (
                                        <div className="flex items-center gap-2">
                                          <img 
                                            src={size.sizeImageUrl.startsWith('/objects/') ? 
                                              size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                              size.sizeImageUrl
                                            }
                                            alt={size.sizeName}
                                            className="w-6 h-6 object-cover rounded border"
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium">{size.sizeName}</span>
                                            {size.sizeValue && (
                                              <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium">{size.sizeName}</span>
                                          {size.sizeValue && (
                                            <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                          )}
                                        </div>
                                      )}
                                      {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                          <span className="text-xs text-white">✓</span>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
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
                                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[400px] overflow-auto" position="popper" sideOffset={4}>
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
                                  className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                                  className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#757575] mr-2"></div>
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
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-bold rounded-lg"
              >
                🎯 اطلب الآن • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap and privacy policy button */}
            <div className="pb-20 md:pb-8">
              {/* Privacy Policy Button */}
              <div className="flex justify-center mt-8 mb-4">
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
                >
                  سياسة الخصوصية
                </a>
              </div>
            </div>
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
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    {productName} <span className="text-base font-normal text-purple-600">بـ {formatNumber(parseFloat(productPrice || '0'))} <span className="text-xs">د.ع</span></span>
                  </h2>
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
                  <h3 className="text-lg font-bold text-red-600">🚀 احجز مكانك الآن</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => submitOrderMutation.mutate(data))} className="space-y-4">
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
                                <Input placeholder="ادخل اسمك الكامل" className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border" {...field} />
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
                                <Input placeholder="07XX XXX XXXX" className="pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]" {...field} />
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
                                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                  <div className="flex items-center">
                                    <Package className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر العرض" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] overflow-auto z-50" position="popper" sideOffset={4}>
                                  {availableOffers.length > 0 ? (
                                    availableOffers.map((offer: any) => (
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                              الألوان المتاحة ({selectedColorIds.length}/{getSelectedOfferQuantity()})
                            </div>
                              <div className="flex flex-wrap gap-2">
                                {productColors.map((color: any) => (
                                  <button 
                                    key={color.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-red-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedColorIds.includes(color.id) 
                                        ? 'border-red-500 bg-red-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => handleColorSelection(color.id)}
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                              الأشكال المتاحة ({selectedShapeIds.length}/{getSelectedOfferQuantity()})
                            </div>
                              <div className="flex flex-wrap gap-2">
                                {productShapes.map((shape: any) => (
                                  <button 
                                    key={shape.id} 
                                    type="button"
                                    className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md hover:border-red-500 hover:shadow-sm transition-all cursor-pointer ${
                                      selectedShapeIds.includes(shape.id) 
                                        ? 'border-red-500 bg-red-50 shadow-sm' 
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                    onClick={() => handleShapeSelection(shape.id)}
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
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                الأحجام المتاحة ({selectedSizeIds.length}/{getSelectedOfferQuantity()}) - المتوفر: {productSizes.length}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {productSizes.map((size: any) => {
                                  const isSelected = selectedSizeIds.includes(size.id);
                                  const isDisabled = !isSelected && selectedSizeIds.length >= getSelectedOfferQuantity();
                                  
                                  return (
                                    <button 
                                      key={size.id} 
                                      type="button"
                                      disabled={isDisabled}
                                      className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md transition-all cursor-pointer relative ${
                                        isSelected
                                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                                          : isDisabled
                                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                            : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:shadow-sm'
                                      }`}
                                      title={size.sizeName}
                                      onClick={() => handleSizeSelection(size.id)}
                                    >
                                      {size.sizeImageUrl ? (
                                        <div className="flex items-center gap-2">
                                          <img 
                                            src={size.sizeImageUrl.startsWith('/objects/') ? 
                                              size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                              size.sizeImageUrl
                                            }
                                            alt={size.sizeName}
                                            className="w-6 h-6 object-cover rounded border"
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium">{size.sizeName}</span>
                                            {size.sizeValue && (
                                              <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium">{size.sizeName}</span>
                                          {size.sizeValue && (
                                            <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                          )}
                                        </div>
                                      )}
                                      {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                          <span className="text-xs text-white">✓</span>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
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
                                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 border-[0.5px]">
                                  <div className="flex items-center">
                                    <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[400px] overflow-auto" position="popper" sideOffset={4}>
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
                                  className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                                  className="resize-none pr-10 min-h-[38px] py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-[#757575] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:ring-blue-500 focus:border-blue-500 border-[0.5px]"
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
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#757575] mr-2"></div>
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
                }}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-3 text-base font-bold rounded-lg"
              >
                ⚡ احجز الآن • {formatCurrency(parseFloat(productPrice || '0'))}
              </Button>
            </div>

            {/* Add bottom padding to prevent content overlap and privacy policy button */}
            <div className="pb-20 md:pb-8">
              {/* Privacy Policy Button */}
              <div className="flex justify-center mt-8 mb-4">
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
                >
                  سياسة الخصوصية
                </a>
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
              <h3 className="text-sm font-medium flex items-center justify-center gap-2">
                <i className="fas fa-pen text-xs"></i>
                املأ بياناتك للطلب
              </h3>
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
                                  availableOffers.map((offer: any, index: number) => {
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
                                  availableOffers.map((offer: any, index: number) => {
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
                    
                    {/* رسائل الخطأ */}
                    {variantErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <i className="fas fa-exclamation-triangle text-red-500 text-lg"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-red-800 mb-1">
                              تنبيه: تجاوز الحد المسموح
                            </h4>
                            {variantErrors.map((error, index) => (
                              <p key={index} className="text-red-700 text-sm leading-relaxed">
                                {error}
                              </p>
                            ))}
                          </div>
                          <button
                            onClick={() => setVariantErrors([])}
                            className="flex-shrink-0 text-red-600 hover:text-red-500 transition-colors"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* الألوان */}
                    {productColors.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          الألوان المتاحة ({selectedColorIds.length}/{getSelectedOfferQuantity()}) - المتوفر: {productColors.length}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {productColors.map((color: any) => {
                            const isSelected = selectedColorIds.includes(color.id);
                            const isDisabled = !isSelected && selectedColorIds.length >= getSelectedOfferQuantity();
                            
                            return (
                              <button 
                                key={color.id} 
                                type="button"
                                disabled={isDisabled}
                                className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md transition-all cursor-pointer relative ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : isDisabled
                                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : 'border-gray-300 bg-white hover:border-blue-500 hover:shadow-sm'
                                }`}
                                title={color.colorName}
                                onClick={() => handleColorSelection(color.id)}
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
                                    <span className="text-sm font-medium">{color.colorName}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-6 h-6 rounded border-2 border-gray-300"
                                      style={{ backgroundColor: color.colorCode }}
                                    />
                                    <span className="text-sm font-medium">{color.colorName}</span>
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white">✓</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* الأشكال */}
                    {productShapes.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          الأشكال المتاحة ({selectedShapeIds.length}/{getSelectedOfferQuantity()}) - المتوفر: {productShapes.length}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {productShapes.map((shape: any) => {
                            const isSelected = selectedShapeIds.includes(shape.id);
                            const isDisabled = !isSelected && selectedShapeIds.length >= getSelectedOfferQuantity();
                            
                            return (
                              <button 
                                key={shape.id} 
                                type="button"
                                disabled={isDisabled}
                                className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md transition-all cursor-pointer relative ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : isDisabled
                                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : 'border-gray-300 bg-white hover:border-blue-500 hover:shadow-sm'
                                }`}
                                title={shape.shapeName}
                                onClick={() => handleShapeSelection(shape.id)}
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
                                    <span className="text-sm font-medium">{shape.shapeName}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-medium">{shape.shapeName}</span>
                                )}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10">
                                    <span className="text-xs text-white font-bold">✓</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* الأحجام */}
                    {productSizes.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          الأحجام المتاحة ({selectedSizeIds.length}/{getSelectedOfferQuantity()})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {productSizes.map((size: any) => {
                            const isSelected = selectedSizeIds.includes(size.id);
                            const isDisabled = !isSelected && selectedSizeIds.length >= getSelectedOfferQuantity();
                            
                            return (
                              <button 
                                key={size.id} 
                                type="button"
                                disabled={isDisabled}
                                className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-md transition-all cursor-pointer relative ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : isDisabled
                                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : 'border-gray-300 bg-white hover:border-blue-500 hover:shadow-sm'
                                }`}
                                title={size.sizeName}
                                onClick={() => handleSizeSelection(size.id)}
                              >
                                {size.sizeImageUrl ? (
                                  <div className="flex items-center gap-2">
                                    <img 
                                      src={size.sizeImageUrl.startsWith('/objects/') ? 
                                        size.sizeImageUrl.replace('/objects/', '/public-objects/') : 
                                        size.sizeImageUrl
                                      }
                                      alt={size.sizeName}
                                      className="w-6 h-6 object-cover rounded border"
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">{size.sizeName}</span>
                                      {size.sizeValue && (
                                        <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{size.sizeName}</span>
                                    {size.sizeValue && (
                                      <span className="text-xs text-gray-500">{size.sizeValue}</span>
                                    )}
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white">✓</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
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
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#757575] mr-2"></div>
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
      {/* PixelTracker Components - نظيف ومرتب ومطابق للمواصفات */}
      
      {/* ViewContent Event */}
      {viewContentPixelData && landingPage?.platformId && (
        <PixelTracker
          key="view_content"
          platformId={landingPage.platformId}
          eventType="view_content"
          eventData={viewContentPixelData}
        />
      )}
      
      {/* AddToCart Event */}
      {addToCartPixelData && landingPage?.platformId && (
        <PixelTracker
          key="add_to_cart_stable"
          platformId={landingPage.platformId}
          eventType="add_to_cart"
          eventData={addToCartPixelData}
        />
      )}
      
      {/* InitiateCheckout Event */}
      {initiateCheckoutData && landingPage?.platformId && (
        <PixelTracker
          key="initiate_checkout"
          platformId={landingPage.platformId}
          eventType="initiate_checkout"
          eventData={initiateCheckoutData}
        />
      )}
      
      {/* Lead Event */}
      {leadEventData && landingPage?.platformId && (
        <PixelTracker
          key="lead"
          platformId={landingPage.platformId}
          eventType="lead"
          eventData={leadEventData}
        />
      )}
    </div>
  );
}