import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, BarChart3 } from "lucide-react";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: false, // Disable automatic loading
  });

  // Log stats data for debugging
  console.log("Stats data received:", stats);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="theme-border bg-theme-primary-lighter">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 bg-theme-primary-light" />
                  <Skeleton className="h-6 w-20 bg-theme-primary-light" />
                  <Skeleton className="h-3 w-24 bg-theme-primary-light" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl bg-theme-primary-light" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalSales = (stats as any)?.totalSales || 0;
  const totalOrders = (stats as any)?.totalOrders || 0;
  const pendingOrders = (stats as any)?.pendingOrders || 0;
  const activeProducts = (stats as any)?.activeProducts || 0;
  const conversionRate = (stats as any)?.conversionRate || 0;

  const statsData = [
    {
      title: "إجمالي المبيعات",
      value: formatCurrency(totalSales),
      subtitle: totalSales > 0 ? "من الطلبات المسلمة" : "لا توجد طلبات مسلمة",
      trend: totalSales > 0 ? "up" : "neutral",
      percentage: totalSales > 0 ? "+12.5%" : "0%",
      icon: DollarSign,
      gradient: "bg-theme-gradient",
      bgGradient: "bg-theme-primary-lighter",
      darkBgGradient: "dark:bg-theme-primary-lighter",
    },
    {
      title: "إجمالي الطلبات",
      value: totalOrders.toLocaleString(),
      subtitle: pendingOrders > 0 ? `${pendingOrders} قيد الانتظار` : "جميع الطلبات مكتملة",
      trend: totalOrders > 0 ? "up" : "neutral",
      percentage: totalOrders > 0 ? "+8.3%" : "0%",
      icon: ShoppingBag,
      gradient: "bg-theme-gradient",
      bgGradient: "bg-theme-primary-lighter", 
      darkBgGradient: "dark:bg-theme-primary-lighter",
    },
    {
      title: "المنتجات النشطة",
      value: activeProducts.toString(),
      subtitle: activeProducts > 0 ? "متاحة للعرض" : "أضف منتجات جديدة",
      trend: activeProducts > 0 ? "up" : "neutral",
      percentage: activeProducts > 0 ? "+5.2%" : "0%",
      icon: Package,
      gradient: "bg-theme-gradient",
      bgGradient: "bg-theme-primary-lighter",
      darkBgGradient: "dark:bg-theme-primary-lighter",
    },
    {
      title: "معدل التحويل",
      value: `${conversionRate}%`,
      subtitle: totalOrders > 0 ? "نسبة النجاح" : "لا توجد طلبات",
      trend: conversionRate >= 50 ? "up" : conversionRate > 0 ? "neutral" : "down",
      percentage: conversionRate >= 50 ? "+15.8%" : conversionRate > 0 ? "+3.2%" : "0%",
      icon: BarChart3,
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-50 to-rose-50",
      darkBgGradient: "from-pink-900/20 to-rose-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Card 
            key={index} 
            className="theme-border bg-theme-primary-lighter"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header with trend indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{stat.title}</h3>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-1.5 py-0.5 ml-2 ${
                        stat.trend === 'up' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                          : stat.trend === 'down'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {stat.trend === 'up' && <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
                      {stat.trend === 'down' && <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                      {stat.percentage}
                    </Badge>
                  </div>
                  
                  {/* Main value - positioned to the left below title */}
                  <div className="flex justify-start mb-1">
                    <p className="text-xl font-bold text-theme-primary group-hover:scale-105 transition-transform duration-200">
                      {stat.value}
                    </p>
                  </div>
                  
                  {/* Subtitle */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {stat.subtitle}
                  </p>
                </div>
                
                {/* Icon with gradient background */}
                <div className={`relative p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} theme-shadow group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                  <IconComponent className="w-5 h-5 text-white" />
                  
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-30 blur transition-opacity duration-300`} />
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000 ease-out`}
                    style={{ 
                      width: stat.trend === 'up' ? '75%' : stat.trend === 'neutral' ? '45%' : '25%'
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
