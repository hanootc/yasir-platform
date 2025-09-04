import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";

export default function TopProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/dashboard/top-products"],
  });

  return (
    <Card className="theme-border bg-theme-primary-lighter">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Link href="/products" className="text-theme-primary text-sm hover:opacity-80 transition-opacity">
            إدارة المنتجات
          </Link>
          <CardTitle className="text-lg font-semibold text-theme-primary">أفضل المنتجات مبيعاً</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-theme-primary-light rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Skeleton className="w-12 h-12 rounded-lg bg-theme-primary-lighter" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1 bg-theme-primary-lighter" />
                    <Skeleton className="h-3 w-16 bg-theme-primary-lighter" />
                  </div>
                </div>
                <div className="text-left">
                  <Skeleton className="h-4 w-20 mb-1 bg-theme-primary-lighter" />
                  <Skeleton className="h-3 w-12 bg-theme-primary-lighter" />
                </div>
              </div>
            ))
          ) : products && (products as any[])?.length > 0 ? (
            (products as any[]).map((product: any) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-theme-primary-light hover:bg-theme-primary-lighter transition-colors rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 rounded-lg bg-theme-gradient flex items-center justify-center overflow-hidden theme-shadow">
                    {product.imageUrls && product.imageUrls.length > 0 ? (
                      <img 
                        src={product.imageUrls[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-box text-white"></i>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.salesCount} مبيعة</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-theme-primary">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">+15%</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-theme-primary-light dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-box text-theme-primary"></i>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد بيانات مبيعات</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
