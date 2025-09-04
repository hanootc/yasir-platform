import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import type { Product } from "@shared/schema";

// مكون سلايدر الصور للعرض النظيف
function ProductImageSlider({ images, productName }: { images: string[], productName: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages = images && images.length > 0 ? images : ['/placeholder-image.png'];

  const scrollPrev = () => {
    setSelectedIndex(prev => prev > 0 ? prev - 1 : displayImages.length - 1);
  };

  const scrollNext = () => {
    setSelectedIndex(prev => prev < displayImages.length - 1 ? prev + 1 : 0);
  };

  return (
    <div className="space-y-4">
      {/* الصورة الرئيسية */}
      <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
        <img 
          src={displayImages[selectedIndex]} 
          alt={`${productName} - صورة ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-image.png';
          }}
        />
        
        {displayImages.length > 1 && (
          <>
            <button 
              onClick={scrollPrev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={scrollNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* مؤشر الصور */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {displayImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* الصور المصغرة */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                index === selectedIndex ? 'border-green-500' : 'border-gray-200'
              }`}
            >
              <img 
                src={image} 
                alt={`${productName} - صورة مصغرة ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PublicProductView() {
  const [match, params] = useRoute("/public-product/:id");
  const productId = params?.id;

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/public/products", productId],
    enabled: !!productId,
  });

  if (!match || !productId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">معرف المنتج غير صحيح</h3>
          <p className="text-gray-600">لم يتم العثور على المنتج المطلوب</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Skeleton className="aspect-square w-full rounded-lg mb-4" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="w-20 h-20 rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل المنتج</h3>
          <p className="text-gray-600">لم يتم العثور على المنتج أو حدث خطأ في التحميل</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* قسم الصور */}
            <div>
              <ProductImageSlider 
                images={product.imageUrls || []} 
                productName={product.name}
              />
            </div>

            {/* قسم تفاصيل المنتج */}
            <div className="space-y-6">
              {/* عنوان المنتج */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                {product.isActive && (
                  <Badge variant="default" className="bg-green-500 text-white">
                    متوفر الآن
                  </Badge>
                )}
              </div>

              {/* السعر */}
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {formatCurrency(product.price)}
                </div>
                <p className="text-green-700 text-sm">شامل التوصيل المجاني</p>
              </div>

              {/* الوصف */}
              {product.description && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">وصف المنتج</h3>
                  <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {product.description}
                  </div>
                </div>
              )}

              {/* معلومات إضافية */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">معلومات مهمة</span>
                </div>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• توصيل مجاني لجميع المحافظات</li>
                  <li>• دفع عند الاستلام</li>
                  <li>• ضمان استرداد المال</li>
                  <li>• متوفر على مدار الساعة</li>
                </ul>
              </div>

              {/* زر الطلب */}
              <div className="space-y-4">
                <Button 
                  className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl"
                  onClick={() => {
                    // يمكن إضافة وظيفة الطلب هنا
                    alert('يمكنك الطلب من خلال صفحة الهبوط المخصصة للمنتج');
                  }}
                >
                  اطلب الآن
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  أو اتصل بنا على الرقم المباشر
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}