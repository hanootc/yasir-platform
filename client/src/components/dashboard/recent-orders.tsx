import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";

const getStatusVariant = (status: string) => {
  switch (status) {
    case "pending":
      return "secondary";
    case "confirmed":
      return "default";
    case "processing":
      return "default";
    case "shipped":
      return "default";
    case "delivered":
      return "default";
    case "cancelled":
      return "destructive";
    case "refunded":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "قيد المراجعة";
    case "confirmed":
      return "مؤكد";
    case "processing":
      return "قيد التنفيذ";
    case "shipped":
      return "تم الشحن";
    case "delivered":
      return "تم التسليم";
    case "cancelled":
      return "ملغي";
    case "refunded":
      return "مسترد";
    default:
      return status;
  }
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const orderDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `منذ ${diffInMinutes} دقيقة`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `منذ ${hours} ساعة`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `منذ ${days} يوم`;
  }
};

export default function RecentOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-orders"],
  });

  return (
    <Card className="theme-border bg-theme-primary-lighter">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Link href="/orders" className="text-theme-primary text-sm hover:opacity-80 transition-opacity">
            عرض جميع الطلبات
          </Link>
          <CardTitle className="text-lg font-semibold text-theme-primary">الطلبات الأخيرة</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-theme-primary-light rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Skeleton className="w-10 h-10 rounded-lg bg-theme-primary-lighter" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-1 bg-theme-primary-lighter" />
                    <Skeleton className="h-3 w-16 bg-theme-primary-lighter" />
                  </div>
                </div>
                <div className="text-left">
                  <Skeleton className="h-4 w-16 mb-1 bg-theme-primary-lighter" />
                  <Skeleton className="h-5 w-12 bg-theme-primary-lighter" />
                </div>
              </div>
            ))
          ) : orders && (orders as any[])?.length > 0 ? (
            (orders as any[]).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-theme-primary-light hover:bg-theme-primary-lighter transition-colors rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                    <span className="text-white font-semibold text-sm">
                      #{order.orderNumber?.slice(-4) || order.id.slice(-4)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(order.createdAt)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-theme-primary">{formatCurrency(order.total)}</p>
                  <Badge variant={getStatusVariant(order.status)} className="text-xs">
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-theme-primary-light dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-shopping-cart text-theme-primary"></i>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد طلبات حديثة</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
