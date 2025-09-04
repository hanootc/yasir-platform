import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Package, Eye, MessageCircle, Phone, Home, Menu, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  isActive: boolean;
  stock: number;
  priceOffers?: Array<{
    quantity: number;
    price: number;
    label: string;
  }>;
}

interface LandingPage {
  id: string;
  title: string;
  customUrl: string;
  template: string;
  productId: string;
  isActive: boolean;
}

interface Platform {
  id: string;
  platformName: string;
  ownerName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  logoUrl?: string;
  subdomain: string;
  storeTemplate?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  productCount: number;
}

export default function CustomerStore() {
  const params = useParams() as { subdomain: string };
  const subdomain = params.subdomain;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // جلب معلومات المنصة
  const { data: platform, isLoading: platformLoading } = useQuery<Platform>({
    queryKey: ['/api/public/platform', subdomain],
    enabled: !!subdomain && subdomain !== 'platform-registration' && subdomain !== 'register-platform',
  });

  // تجاهل مسارات النظام المحددة
  if (subdomain === 'platform-registration' || subdomain === 'register-platform') {
    return null;
  }

  // جلب المنتجات النشطة مع فلتر التصنيف
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [`/api/public/platform/${subdomain}/products`, selectedCategory],
    queryFn: async () => {
      const url = `/api/public/platform/${subdomain}/products${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!subdomain,
  });

  // جلب التصنيفات
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: [`/api/public/platform/${subdomain}/categories`],
    enabled: !!subdomain,
  });

  // جلب جميع صفحات الهبوط للمنصة
  const { data: allLandingPages } = useQuery<LandingPage[]>({
    queryKey: [`/api/platforms/${platform?.id}/landing-pages`],
    queryFn: async () => {
      if (!platform?.id) return [];
      const response = await fetch(`/api/platforms/${platform.id}/landing-pages`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!platform?.id,
  });

  // إزالة الوضع المظلم من صفحة المتجر نهائياً
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = 'white';
    document.body.style.color = 'black';
    
    // إضافة CSS لضمان عدم شفافية القوائم في صفحة المتجر
    const storePageStyle = document.createElement('style');
    storePageStyle.innerHTML = `
      /* تجاوز شامل لجميع العناصر في صفحة المتجر */
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
      
      * input:focus,
      * textarea:focus {
        background-color: #f9fafb !important;
        background: #f9fafb !important;
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
      }
      
      /* تجاوز شامل لجميع عناصر Select في صفحة المتجر */
      * [data-radix-select-content],
      html [data-radix-select-content],
      html body [data-radix-select-content] {
        background-color: #f9fafb !important;
        border: 1px solid #d1d5db !important;
        opacity: 1 !important;
        backdrop-filter: none !important;
        color: #374151 !important;
        z-index: 9999 !important;
        filter: none !important;
      }
      
      * [data-radix-select-item],
      html [data-radix-select-item],
      html body [data-radix-select-item] {
        background-color: #f9fafb !important;
        color: #374151 !important;
        opacity: 1 !important;
        padding: 8px 12px !important;
        margin: 4px 3px !important;
        border-radius: 4px !important;
      }
      
      * [data-radix-select-item]:hover,
      * [data-radix-select-item][data-highlighted],
      * [data-radix-select-item][data-state="checked"],
      * [data-radix-select-item][aria-selected="true"] {
        background-color: #f3f4f6 !important;
        color: #374151 !important;
      }
    `;
    document.head.appendChild(storePageStyle);
    
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
      document.head.removeChild(storePageStyle);
    };
  }, []);

  const formatPrice = (price: number) => {
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
    }).format(price);
    return `${formattedNumber} د.ع`;
  };

  const formatMainPrice = (price: number) => {
    const formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
    }).format(price);
    return (
      <span>
        <span className="text-xl sm:text-2xl font-bold">{formattedNumber}</span>
        <span className="text-xs text-gray-500 mr-1">د.ع</span>
      </span>
    );
  };

  // دالة لتحديد تخطيط العرض حسب النموذج
  const getDisplayLayout = (template: string) => {
    switch (template) {
      case 'grid':
        return 'grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4';
      case 'list':
        return 'flex flex-col gap-4 sm:gap-6';
      case 'catalog':
        return 'grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6';
      case 'dark_elegant':
      case 'dark_simple':
      case 'dark_premium':
        return 'grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4';
      default:
        return 'grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4';
    }
  };

  // دالة لاستخراج اللون المهيمن من الصورة
  const useDominantColor = (imageUrl: string) => {
    const [color, setColor] = useState('hsl(var(--primary))'); // اللون الافتراضي من النظام
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!imageUrl || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          let r = 0, g = 0, b = 0;
          let count = 0;
          
          // أخذ عينة من البكسلات كل 10 بكسل لتحسين الأداء
          for (let i = 0; i < data.length; i += 40) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
          
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          
          // تعديل السطوع إذا كان اللون فاتح جداً أو غامق جداً
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > 200) {
            r = Math.max(0, r - 60);
            g = Math.max(0, g - 60);
            b = Math.max(0, b - 60);
          } else if (brightness < 50) {
            r = Math.min(255, r + 60);
            g = Math.min(255, g + 60);
            b = Math.min(255, b + 60);
          }
          
          setColor(`rgb(${r}, ${g}, ${b})`);
        } catch (error) {
          console.log('Could not extract color from image, using default');
          setColor('hsl(var(--primary))');
        }
      };

      img.onerror = () => {
        setColor('hsl(var(--primary))');
      };

      img.src = imageUrl;
    }, [imageUrl]);

    return { color, canvasRef };
  };

  const handleProductClick = (product: Product) => {
    // البحث عن صفحة هبوط نشطة للمنتج
    const productLandingPage = allLandingPages?.find(
      (page: LandingPage) => page.productId === product.id && page.isActive
    );

    if (productLandingPage) {
      // التوجه لصفحة الهبوط ضمن المتجر
      window.location.href = `/${subdomain}/${productLandingPage.customUrl}`;
    } else {
      // إذا لم توجد صفحة هبوط، يمكن فتح صفحة المنتج العامة أو عرض رسالة
      alert('لا توجد صفحة هبوط متاحة لهذا المنتج');
    }
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("مرحباً، لقد أتيت من صفحة المنتجات");
    const whatsappUrl = `https://wa.me/${platform.phoneNumber.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = () => {
    window.location.href = `tel:${platform.phoneNumber}`;
  };

  const handleHomeClick = () => {
    window.location.href = `/${subdomain}`;
  };

  if (platformLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">المتجر غير موجود</h1>
          <p className="text-gray-600">لم يتم العثور على المتجر المطلوب</p>
        </div>
      </div>
    );
  }

  const storeTemplate = platform?.storeTemplate || 'grid';
  const isDarkTheme = storeTemplate?.startsWith('dark_');

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`} dir="rtl">
      {/* Header مع معلومات المتجر */}
      <header className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-start py-3 sm:py-4 lg:py-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                {platform.logoUrl ? (
                  <img 
                    src={platform.logoUrl} 
                    alt={platform.platformName}
                    className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary rounded-full flex items-center justify-center shadow-sm">
                    <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                )}
              </div>
              <div className="text-right">
                <h1 className={`text-lg sm:text-xl lg:text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'} leading-tight`}>
                  {platform.platformName}
                </h1>
                <p className={`text-sm sm:text-base ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'} mt-0.5`}>
                  {platform.subdomain}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* فلتر التصنيفات */}
      <div className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
          {/* Desktop Categories */}
          <div className="hidden md:flex items-center justify-center gap-1 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedCategory === null
                  ? `${isDarkTheme ? 'bg-cyan-600 text-white' : 'bg-gray-900 text-white'} shadow-sm`
                  : `${isDarkTheme ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
              }`}
            >
              جميع المنتجات
            </button>
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedCategory === category.id
                    ? `${isDarkTheme ? 'bg-cyan-600 text-white' : 'bg-gray-900 text-white'} shadow-sm`
                    : `${isDarkTheme ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden relative">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="flex items-center gap-2"
              >
                <Menu className="w-4 h-4" />
                التصنيفات
                {selectedCategory && (
                  <Badge variant="default" className="rounded-full">
                    {categories?.find(c => c.id === selectedCategory)?.name}
                  </Badge>
                )}
              </Button>
              
              <Badge variant="secondary" className="text-xs">
                {products?.length || 0} منتج
              </Badge>
            </div>

            {/* Mobile Category Menu */}
            {showCategoryMenu && (
              <div className={`absolute top-full left-0 right-0 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-lg z-50 py-3`}>
                <div className="max-w-7xl mx-auto px-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>اختر التصنيف</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCategoryMenu(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(null);
                        setShowCategoryMenu(false);
                      }}
                      className="justify-start"
                    >
                      جميع المنتجات
                      <Badge variant="secondary" className="mr-auto">
                        {categories?.reduce((total, cat) => total + cat.productCount, 0) || 0}
                      </Badge>
                    </Button>
                    {categories?.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setShowCategoryMenu(false);
                        }}
                        className="justify-start"
                      >
                        {category.name}
                        <Badge variant="secondary" className="mr-auto">
                          {category.productCount}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* المنتجات */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {!products || products.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">لا توجد منتجات متاحة</h2>
            <p className="text-sm sm:text-base text-gray-600">لم يتم إضافة أي منتجات بعد</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">منتجاتنا</h2>
            </div>
            
            {/* عرض المنتجات حسب النموذج المختار */}
            <div className={getDisplayLayout(platform?.storeTemplate || 'grid')}>
              {products.map((product: Product) => {
                const storeTemplate = platform?.storeTemplate || 'grid';
                
                // النموذج القائمة - تصميم أفقي أنيق
                if (storeTemplate === 'list') {
                  return (
                    <Card 
                      key={product.id}
                      className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-theme-primary-lighter hover:bg-theme-primary-light"
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-0">
                          {/* صورة المنتج - في النموذج القائمة */}
                          <div className="relative overflow-hidden w-24 sm:w-32 h-24 sm:h-32 flex-shrink-0">
                            <img
                              src={product.imageUrls?.[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
                            {product.stock <= 5 && product.stock > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="absolute top-1 right-1 text-xs px-1 py-0.5 bg-red-500 hover:bg-red-600 shadow-lg"
                              >
                                آخر {product.stock}
                              </Badge>
                            )}
                          </div>
                          
                          {/* تفاصيل المنتج - في النموذج القائمة */}
                          <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-base sm:text-lg text-theme-primary mb-1 line-clamp-1">
                                {product.name}
                              </h3>
                              
                              {product.description && (
                                <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-1 sm:line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-theme-primary font-bold">
                                  <span className="text-lg sm:text-xl">{new Intl.NumberFormat('en-US').format(parseFloat(product.price))}</span>
                                  <span className="text-xs text-gray-500 mr-1">د.ع</span>
                                </div>
                                <Badge variant="outline" className="text-xs border-primary/20 text-theme-primary">
                                  {product.stock} متوفر
                                </Badge>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => handleProductClick(product)}
                              className="w-full bg-theme-gradient text-white shadow-lg"
                              disabled={product.stock === 0}
                              size="sm"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                              <span className="text-xs sm:text-sm">{product.stock === 0 ? 'نفد المخزون' : 'عرض المنتج'}</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                // النموذج الكتالوج - تصميم فاخر مع تدرجات جذابة
                if (storeTemplate === 'catalog') {
                  return (
                    <Card 
                      key={product.id}
                      className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800 text-white border-0"
                    >
                      <CardContent className="p-0 relative">
                        {/* صورة المنتج */}
                        <div className="relative overflow-hidden">
                          <div className="w-full aspect-square">
                            <img
                              src={product.imageUrls?.[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>
                          </div>
                          
                          {product.stock <= 5 && product.stock > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute top-3 right-3 text-xs px-2 py-1 bg-red-600 hover:bg-red-700 shadow-xl animate-pulse"
                            >
                              آخر {product.stock} قطع
                            </Badge>
                          )}
                          
                          {/* شارة فاخرة */}
                          <div className="absolute top-3 left-3 bg-theme-gradient text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                            مميز
                          </div>
                        </div>
                        
                        {/* تفاصيل المنتج */}
                        <div className="p-3 sm:p-4">
                          <h3 className="font-bold text-sm sm:text-base text-white mb-2 line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                          
                          {product.description && (
                            <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          
                          {/* السعر بتصميم مضغوط */}
                          <div className="mb-3 text-center">
                            <div className="bg-theme-gradient text-white rounded-md px-2 py-1 text-sm shadow-md">
                              <span className="text-base font-bold">{new Intl.NumberFormat('en-US').format(parseFloat(product.price))}</span>
                              <span className="text-xs mr-1">د.ع</span>
                            </div>
                          </div>
                          
                          {/* شارة المخزون */}
                          <div className="text-center mb-3">
                            <Badge variant="outline" className="border-primary/30 text-theme-primary bg-theme-primary-light text-xs px-2 py-0.5">
                              متوفر: {product.stock}
                            </Badge>
                          </div>
                          
                          {/* زر عرض المنتج */}
                          <Button 
                            onClick={() => handleProductClick(product)}
                            className="w-full bg-theme-gradient text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 text-xs py-1.5"
                            disabled={product.stock === 0}
                            size="sm"
                          >
                            <Eye className="w-3 h-3 ml-1" />
                            {product.stock === 0 ? 'نفد المخزون' : 'عرض المنتج'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // النماذج الليلية الجديدة

                // النمط الليلي الأنيق - تصميم ليلي مع تأثيرات متوهجة
                if (storeTemplate === 'dark_elegant') {
                  return (
                    <Card 
                      key={product.id}
                      className="group hover:shadow-2xl hover:shadow-primary/25 hover:-translate-y-1 transition-all duration-500 overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white border border-primary/20 hover:border-primary/40"
                    >
                      <CardContent className="p-0 relative">
                        {/* صورة المنتج */}
                        <div className="relative overflow-hidden">
                          <div className="w-full aspect-square">
                            <img
                              src={product.imageUrls?.[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent group-hover:from-primary/60"></div>
                          </div>
                          
                          {/* شارات التنبيه مع توهج */}
                          {product.stock <= 5 && product.stock > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute top-2 right-2 text-xs px-2 py-1 bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/25 animate-pulse"
                            >
                              آخر {product.stock} قطع
                            </Badge>
                          )}
                          
                          {/* شارة متوهجة */}
                          <div className="absolute top-2 left-2 bg-theme-gradient text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg shadow-primary/25">
                            مميز
                          </div>
                        </div>
                        
                        {/* تفاصيل المنتج */}
                        <div className="p-3 sm:p-4">
                          <h3 className="font-bold text-sm sm:text-base text-white mb-2 line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                          
                          {product.description && (
                            <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          
                          {/* السعر مع توهج */}
                          <div className="mb-3 text-center">
                            <div className="bg-theme-gradient text-white rounded-lg px-3 py-2 text-sm shadow-lg shadow-primary/25">
                              <span className="text-base font-bold">{new Intl.NumberFormat('en-US').format(parseFloat(product.price))}</span>
                              <span className="text-xs mr-1">د.ع</span>
                            </div>
                          </div>
                          
                          {/* شارة المخزون */}
                          <div className="text-center mb-3">
                            <Badge variant="outline" className="border-primary/40 text-primary bg-slate-900 text-xs px-2 py-0.5">
                              متوفر: {product.stock}
                            </Badge>
                          </div>
                          
                          {/* زر متوهج */}
                          <Button 
                            onClick={() => handleProductClick(product)}
                            className="w-full bg-theme-gradient text-white font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 text-xs py-1.5"
                            disabled={product.stock === 0}
                            size="sm"
                          >
                            <Eye className="w-3 h-3 ml-1" />
                            {product.stock === 0 ? 'نفد المخزون' : 'عرض'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // النمط الليلي البسيط - تصميم نظيف ومبسط
                if (storeTemplate === 'dark_simple') {
                  return (
                    <Card 
                      key={product.id}
                      className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-gray-900 text-white border border-gray-700 hover:border-gray-600"
                    >
                      <CardContent className="p-0">
                        {/* صورة المنتج */}
                        <div className="relative overflow-hidden">
                          <div className="w-full aspect-square">
                            <img
                              src={product.imageUrls?.[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                          </div>
                        </div>
                        
                        {/* تفاصيل بسيطة */}
                        <div className="p-3 sm:p-4 space-y-2">
                          <h3 className="font-medium text-sm sm:text-base text-gray-100 line-clamp-2">
                            {product.name}
                          </h3>
                          
                          {product.description && (
                            <p className="text-xs text-gray-400 line-clamp-1">
                              {product.description}
                            </p>
                          )}
                          
                          {/* سعر بسيط بدون خلفية */}
                          <div className="text-center">
                            <div className="text-white">
                              <span className="text-lg font-bold">{new Intl.NumberFormat('en-US').format(parseFloat(product.price))}</span>
                              <span className="text-sm text-gray-400 mr-1">د.ع</span>
                            </div>
                          </div>
                          
                          {/* زر بسيط */}
                          <Button 
                            onClick={() => handleProductClick(product)}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white border-0 text-xs py-1.5"
                            disabled={product.stock === 0}
                            size="sm"
                          >
                            <Eye className="w-3 h-3 ml-1" />
                            {product.stock === 0 ? 'نفد المخزون' : 'عرض'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // النمط الليلي المميز - تصميم فاخر مع عناصر ذهبية
                if (storeTemplate === 'dark_premium') {
                  return (
                    <Card 
                      key={product.id}
                      className="group hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden bg-gradient-to-br from-gray-900 via-primary/20 to-black text-white border border-primary/30 hover:border-primary/50"
                    >
                      <CardContent className="p-0 relative">
                        {/* صورة المنتج مع إطار ذهبي */}
                        <div className="relative overflow-hidden">
                          <div className="w-full aspect-square p-1 bg-theme-gradient">
                            <img
                              src={product.imageUrls?.[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-sm"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          </div>
                          
                          {/* شارات ذهبية */}
                          {product.stock <= 5 && product.stock > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute top-3 right-3 text-xs px-2 py-1 bg-red-600 hover:bg-red-700 shadow-xl animate-pulse"
                            >
                              آخر {product.stock} قطع
                            </Badge>
                          )}
                          
                          {/* شارة فاخرة ذهبية */}
                          <div className="absolute top-3 left-3 bg-theme-gradient text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-primary/25">
                            ⭐ فاخر
                          </div>
                        </div>
                        
                        {/* تفاصيل فاخرة */}
                        <div className="p-3 sm:p-4 bg-gradient-to-b from-transparent to-primary/10">
                          <h3 className="font-bold text-sm sm:text-base text-white mb-2 line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                          
                          {product.description && (
                            <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          
                          {/* سعر فاخر مع إطار ذهبي */}
                          <div className="mb-3 text-center">
                            <div className="bg-theme-gradient text-white rounded-lg px-3 py-2 text-sm shadow-lg shadow-primary/25 border border-primary/40">
                              <span className="text-base font-bold">{new Intl.NumberFormat('en-US').format(parseFloat(product.price))}</span>
                              <span className="text-xs mr-1">د.ع</span>
                            </div>
                          </div>
                          
                          {/* شارة المخزون الذهبية */}
                          <div className="text-center mb-3">
                            <Badge variant="outline" className="border-primary/40 text-primary bg-slate-900 text-xs px-2 py-0.5">
                              متوفر: {product.stock}
                            </Badge>
                          </div>
                          
                          {/* زر فاخر */}
                          <Button 
                            onClick={() => handleProductClick(product)}
                            className="w-full bg-theme-gradient text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 text-xs py-1.5 border border-primary/50"
                            disabled={product.stock === 0}
                            size="sm"
                          >
                            <Eye className="w-3 h-3 ml-1" />
                            {product.stock === 0 ? 'نفد المخزون' : 'عرض'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                
                // النموذج الشبكة - تصميم عصري ونظيف (الافتراضي)
                return (
                  <Card 
                    key={product.id}
                    className="group hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden bg-white border-2 border-gray-100 hover:border-primary/40"
                  >
                    <CardContent className="p-0">
                      {/* صورة المنتج */}
                      <div className="relative overflow-hidden">
                        <div className="w-full aspect-square">
                          <img
                            src={product.imageUrls?.[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          {/* شارات التنبيه */}
                          {product.stock <= 5 && product.stock > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute top-2 right-2 text-xs px-2 py-1 bg-red-500 hover:bg-red-600 shadow-md"
                            >
                              آخر {product.stock} قطع
                            </Badge>
                          )}
                          {product.stock === 0 && (
                            <Badge 
                              variant="secondary" 
                              className="absolute top-2 right-2 text-xs px-2 py-1 bg-gray-500 text-white shadow-md"
                            >
                              نفد المخزون
                            </Badge>
                          )}
                          
                          {/* شارة خصم */}
                          <div className="absolute top-2 left-2 bg-theme-gradient text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                            خصم 25%
                          </div>
                        </div>
                      </div>
                      
                      {/* تفاصيل المنتج */}
                      <div className="p-2 sm:p-3 bg-gradient-to-b from-white to-theme-primary-lighter">
                        <h3 className="font-bold text-sm sm:text-base text-theme-primary mb-1 line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        
                        {product.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        {/* السعر بتصميم مضغوط */}
                        <div className="mb-2 text-center">
                          <div className="bg-theme-gradient text-white rounded-md px-2 py-1 text-sm shadow-sm">
                            <span className="text-base font-bold">{new Intl.NumberFormat('en-US').format(parseFloat(product.price))}</span>
                            <span className="text-xs mr-1">د.ع</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1 line-through">
                            {new Intl.NumberFormat('en-US').format(parseFloat(product.price) + 5000)} د.ع
                          </div>
                        </div>
                        
                        {/* معلومات المخزون */}
                        <div className="text-center mb-2">
                          <Badge variant="outline" className="border-primary/20 text-theme-primary bg-theme-primary-light text-xs px-1.5 py-0.5">
                            متوفر: {product.stock}
                          </Badge>
                        </div>
                        
                        {/* زر عرض المنتج */}
                        <Button 
                          onClick={() => handleProductClick(product)}
                          className="w-full bg-theme-gradient text-white font-medium shadow-sm hover:shadow-md transition-all duration-300 text-xs py-1.5"
                          disabled={product.stock === 0}
                          size="sm"
                        >
                          <Eye className="w-3 h-3 ml-1" />
                          {product.stock === 0 ? 'نفد المخزون' : 'عرض'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
                })}
              </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t mt-8 sm:mt-12 pb-20`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className={`text-center text-xs sm:text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
            <p>© 2024 {platform.platformName} - جميع الحقوق محفوظة</p>
            <p className="mt-1">للاستفسار: {platform.whatsappNumber}</p>
          </div>
        </div>
      </footer>

      {/* شريط التطبيق السفلي */}
      <div className={`fixed bottom-0 left-0 right-0 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t shadow-lg z-50 rounded-t-3xl`}>
        <div className="grid grid-cols-3 max-w-sm mx-auto">
          {/* زر الرئيسية */}
          <button
            onClick={handleHomeClick}
            className={`flex flex-col items-center justify-center py-3 px-4 transition-colors ${
              isDarkTheme 
                ? 'text-gray-300 hover:text-primary hover:bg-gray-700' 
                : 'text-gray-600 hover:text-primary hover:bg-primary/10'
            }`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs">الرئيسية</span>
          </button>

          {/* زر WhatsApp */}
          <button
            onClick={handleWhatsAppClick}
            className={`flex flex-col items-center justify-center py-3 px-4 transition-colors ${
              isDarkTheme 
                ? 'text-gray-300 hover:text-green-400 hover:bg-gray-700' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            <MessageCircle className="w-6 h-6 mb-1" />
            <span className="text-xs">واتساب</span>
          </button>

          {/* زر الاتصال */}
          <button
            onClick={handleCallClick}
            className={`flex flex-col items-center justify-center py-3 px-4 transition-colors ${
              isDarkTheme 
                ? 'text-gray-300 hover:text-red-400 hover:bg-gray-700' 
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Phone className="w-6 h-6 mb-1" />
            <span className="text-xs">اتصال</span>
          </button>
        </div>
      </div>
    </div>
  );
}