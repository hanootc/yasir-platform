import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const getActivityIcon = (type: string) => {
  switch (type) {
    case "product_created":
      return { icon: "fas fa-plus", bg: "bg-theme-gradient", color: "text-white" };
    case "product_updated":
      return { icon: "fas fa-edit", bg: "bg-theme-gradient", color: "text-white" };
    case "product_deleted":
      return { icon: "fas fa-trash", bg: "bg-gradient-to-br from-red-500 to-pink-500", color: "text-white" };
    case "landing_page_created":
      return { icon: "fas fa-file-plus", bg: "bg-theme-gradient", color: "text-white" };
    case "order_status_updated":
      return { icon: "fas fa-shopping-cart", bg: "bg-gradient-to-br from-orange-500 to-amber-500", color: "text-white" };
    case "user_added":
      return { icon: "fas fa-user-plus", bg: "bg-theme-gradient", color: "text-white" };
    default:
      return { icon: "fas fa-info", bg: "bg-theme-primary-light", color: "text-theme-primary" };
  }
};

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const activityDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
  
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

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: {
    firstName?: string;
    email: string;
  };
}

export default function SystemActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/activities"],
    enabled: false, // Disable automatic loading
  });

  return (
    <Card className="theme-border bg-theme-primary-lighter">
      <CardHeader>
        <div className="flex items-center justify-between">
          <button className="text-theme-primary hover:opacity-80 transition-opacity">
            <i className="fas fa-ellipsis-h"></i>
          </button>
          <CardTitle className="text-lg font-semibold text-theme-primary">نشاط النظام</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 space-x-reverse p-3 bg-theme-primary-light rounded-lg">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 bg-theme-primary-lighter" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1 bg-theme-primary-lighter" />
                  <Skeleton className="h-3 w-3/4 bg-theme-primary-lighter" />
                </div>
              </div>
            ))
          ) : activities && activities.length > 0 ? (
            activities.map((activity: any) => {
              const iconInfo = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-3 bg-theme-primary-light hover:bg-theme-primary-lighter transition-colors rounded-lg">
                  <div className={`w-8 h-8 ${iconInfo.bg} rounded-full flex items-center justify-center flex-shrink-0 theme-shadow`}>
                    <i className={`${iconInfo.icon} ${iconInfo.color} text-xs`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimeAgo(activity.createdAt)}
                      {activity.user && ` • بواسطة ${activity.user.firstName || activity.user.email}`}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-theme-primary-light dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-history text-theme-primary"></i>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد أنشطة حديثة</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
