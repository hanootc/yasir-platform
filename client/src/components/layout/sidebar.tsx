import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSessionInfo } from "@/hooks/useSessionInfo";
import { apiRequest } from "@/lib/queryClient";

// Component to display admin profile in sidebar
function AdminProfileDisplay() {
  const { data: adminProfile, isError } = useQuery({
    queryKey: ["/api/admin/profile"],
    queryFn: async () => {
      return await apiRequest(`/api/admin/profile`);
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refetch every 3 seconds for faster updates
    retry: 1,
  });

  const { user } = useAuth();

  // Get the avatar URL, prioritizing admin profile over user profile
  const avatarUrl = (adminProfile as any)?.avatarUrl || (user as any)?.profileImageUrl;
  
  // Get the display name, prioritizing admin profile over user profile
  const displayName = (adminProfile as any)?.adminName || 
                     ((user as any)?.firstName && (user as any)?.lastName ? 
                      `${(user as any).firstName} ${(user as any).lastName}` : 
                      (user as any)?.firstName) || 
                     (user as any)?.email || 
                     "مدير النظام";

  console.log('Sidebar AdminProfile data:', { adminProfile, avatarUrl, displayName });

  return (
    <div className="flex items-center mb-3">
      {avatarUrl ? (
        <img 
          className="h-8 w-8 rounded-full object-cover border-2 border-theme-primary/20" 
          src={`https://sanadi.pro${avatarUrl}`} 
          alt="صورة المدير"
          onError={(e) => {
            console.log('Sidebar image failed to load:', avatarUrl);
            // Hide image if it fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
          onLoad={() => {
            console.log('Sidebar image loaded successfully:', avatarUrl);
          }}
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-theme-gradient flex items-center justify-center">
          <i className="fas fa-user text-white text-sm"></i>
        </div>
      )}
      <div className="mr-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {displayName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">مدير النظام</p>
      </div>
    </div>
  );
}

const menuItems = [
  {
    href: "/dashboard",
    icon: "fas fa-chart-pie",
    label: "لوحة التحكم",
    exact: true,
    permission: "dashboard_view",
  },

  {
    href: "/admin-dashboard",
    icon: "fas fa-crown",
    label: "إدارة المدفوعات",
    badge: "مدير",
    badgeVariant: "destructive" as const,
    adminOnly: true, // Only show for non-employees
  },
  {
    href: "/products",
    icon: "fas fa-box",
    label: "إدارة المنتجات",
    permission: "products_view",
  },
  {
    href: "/categories",
    icon: "fas fa-tags",
    label: "إدارة التصنيفات",
    permission: "categories_view",
  },
  {
    href: "/landing-pages",
    icon: "fas fa-rocket",
    label: "صفحات الهبوط",
    permission: "landing_pages_view",
  },
  {
    href: "/orders",
    icon: "fas fa-shopping-cart",
    label: "إدارة الطلبات",
    permission: "orders_view",
  },

  {
    href: "/settings",
    icon: "fas fa-cog",
    label: "ربط المنصات والتطبيقات",
    permission: "settings_view",
  },
  {
    href: "/direct-access",
    icon: "fas fa-external-link-alt",
    label: "زر مباشر",
    badge: "سريع",
    badgeVariant: "destructive" as const,
    permission: "dashboard_view",
  },
  {
    href: "/admin-profile",
    icon: "fas fa-user-cog",
    label: "الملف الشخصي",
    badge: "مدير",
    badgeVariant: "destructive" as const,
    adminOnly: true,
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hasPermission, isEmployee } = useSessionInfo();


  // Remove unnecessary API calls that cause 404 errors
  // const { data: pendingOrdersData } = useQuery<{ count: number }>({
  //   queryKey: ["/api/orders/pending-count"],
  //   enabled: isAuthenticated,
  //   refetchInterval: 30000,
  // });

  // const { data: productsCountData } = useQuery<{ count: number }>({
  //   queryKey: ["/api/products/count"],
  //   enabled: isAuthenticated,
  //   refetchInterval: 60000,
  // });

  const handleLogout = () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      // Clear admin session from localStorage
      localStorage.removeItem('sanadi-admin-session');
      // Redirect to admin login page
      window.location.href = "/system-admin-login";
    }
  };

  return (
    <div className="w-64 bg-theme-primary-lighter dark:bg-gray-800 shadow-lg theme-border overflow-y-auto">
      {/* System Header */}
      <div className="p-6 border-b theme-border">
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* شعار النظام */}
          <div className="w-12 h-12 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
            <i className="fas fa-cogs text-white text-lg"></i>
          </div>
          
          {/* معلومات النظام */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-theme-primary truncate">
              نظام الإدارة
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              لوحة التحكم الرئيسية
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = item.exact ? location === item.href : location.startsWith(item.href);
            
            // Check permissions
            if (item.adminOnly && isEmployee) {
              console.log('🚫 Hiding admin-only item:', item.label);
              return null; // Hide admin-only items for employees
            }
            
            if (item.permission && !hasPermission(item.permission)) {
              console.log('🚫 Hiding item due to permission:', item.label, item.permission);
              return null; // Hide if user doesn't have required permission
            }
            
            console.log('✅ Showing item:', item.label, { adminOnly: item.adminOnly, permission: item.permission, isEmployee });
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out sidebar-link cursor-pointer ${
                    isActive
                      ? "bg-theme-gradient text-white shadow-lg"
                      : "text-gray-700 dark:text-gray-300 hover:bg-theme-primary-light hover:text-theme-primary"
                  }`}
                >
                  <i className={`${item.icon} ml-3 h-5 w-5`}></i>
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <Badge 
                      variant={item.badgeVariant || "secondary"}
                      className="ml-auto px-2 py-1 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4">
            <AdminProfileDisplay />
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full text-right text-sm text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:from-red-900 dark:hover:to-pink-900"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt ml-2"></i>
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}