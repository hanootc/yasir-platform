import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { getTemplateDisplayName } from "@/lib/landingPageTemplates";
import type { Product } from "@shared/schema";

export default function ProductPreview() {
  const [match, params] = useRoute("/product-preview/:id");
  const productId = params?.id;

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/public/products", productId],
    enabled: !!productId,
  });

  if (!match || !productId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">معرف المنتج غير صحيح</h3>
            <p className="text-gray-600 mb-4">لم يتم العثور على المنتج المطلوب</p>
            <Button onClick={() => window.close()} variant="outline">
              إغلاق النافذة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Skeleton className="h-80 w-full rounded-lg" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-1/3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل المنتج</h3>
            <p className="text-gray-600 mb-4">لم يتم العثور على المنتج أو حدث خطأ في التحميل</p>
            <Button onClick={() => window.close()} variant="outline">
              إغلاق النافذة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Product Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Product Images */}
              <div>
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <div className="space-y-2">
                    {product.imageUrls.map((url: string, index: number) => (
                      <img 
                        key={index}
                        src={url} 
                        alt={`${product.name} - صورة ${index + 1}`}
                        className="w-full h-80 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <i className="fas fa-image text-4xl mb-2"></i>
                      <p>لا توجد صور للمنتج</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                {/* Title and Status */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                  {product.categoryId && (
                    <p className="text-sm text-gray-500">
                      معرف التصنيف: {product.categoryId}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="bg-primary-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-primary-600">
                    {formatCurrency(product.price)}
                  </div>
                  {product.cost && (
                    <div className="text-sm text-gray-500 mt-1">
                      التكلفة: {formatCurrency(product.cost)}
                    </div>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">الوصف</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Stock */}
                {product.stock !== null && product.stock !== undefined && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">المخزون:</span>
                    <span className={`font-medium text-sm px-2 py-1 rounded ${
                      product.stock > 10 ? 'bg-green-100 text-green-700' : 
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.stock} قطعة
                    </span>
                  </div>
                )}

                {/* Landing Page Template */}
                {product.defaultLandingTemplate && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">نموذج صفحة الهبوط</h3>
                    <p className="text-sm text-gray-600">
                      {getTemplateDisplayName(product.defaultLandingTemplate)}
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="border-t pt-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3">إجراءات سريعة</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        try {
                          // البحث عن صفحة الهبوط المرتبطة بهذا المنتج
                          const response = await fetch(`/api/landing-pages`);
                          const landingPages = await response.json();
                          const productLandingPage = landingPages.find((page: any) => page.productId === product.id);
                          
                          if (productLandingPage && productLandingPage.customUrl) {
                            const url = `/view-landing/${productLandingPage.customUrl}`;
                            window.open(url, '_blank');
                          } else {
                            // إنشاء صفحة هبوط تلقائية للمنتج
                            alert('لا توجد صفحة هبوط لهذا المنتج. يرجى إنشاء صفحة هبوط أولاً من قسم صفحات الهبوط.');
                          }
                        } catch (error) {
                          console.error('Error finding landing page:', error);
                          alert('حدث خطأ في البحث عن صفحة الهبوط');
                        }
                      }}
                    >
                      <i className="fas fa-external-link-alt ml-1"></i>
                      عرض صفحة الهبوط
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        window.opener?.focus();
                        window.close();
                      }}
                    >
                      <i className="fas fa-edit ml-1"></i>
                      العودة للتحرير
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {/* Creation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">تاريخ الإنشاء:</span>
                <span className="font-medium">
                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'غير محدد'}
                </span>
              </div>
              {product.updatedAt && product.updatedAt !== product.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">آخر تحديث:</span>
                  <span className="font-medium">
                    {new Date(product.updatedAt).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">معرف المنتج:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {product.id}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معاينة SEO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-blue-600 font-medium">{product.name}</span>
                </div>
                <div className="text-xs text-green-600">
                  موقعك.com/product/{product.id}
                </div>
                <div className="text-xs text-gray-600 line-clamp-2">
                  {product.description ? 
                    product.description.substring(0, 160) + (product.description.length > 160 ? "..." : "") :
                    "اكتشف منتجاتنا عالية الجودة بأفضل الأسعار. اطلب الآن واستمتع بخدمة التوصيل السريع."
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}