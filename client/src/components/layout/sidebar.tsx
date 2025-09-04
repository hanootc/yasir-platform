import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSessionInfo } from "@/hooks/useSessionInfo";

const menuItems = [
  {
    href: "/",
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
    badge: "24",
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
    badge: "12",
    badgeVariant: "destructive" as const,
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


  // Get pending orders count
  const { data: pendingOrdersData } = useQuery<{ count: number }>({
    queryKey: ["/api/orders/pending-count"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get products count
  const { data: productsCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/products/count"],
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refresh every minute
  });

  const handleLogout = () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      window.location.href = "/api/logout";
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
                  {item.href === "/orders" && pendingOrdersData?.count > 0 ? (
                    <Badge 
                      variant="destructive"
                      className="ml-auto px-2 py-1 text-xs"
                    >
                      {pendingOrdersData.count}
                    </Badge>
                  ) : item.href === "/products" && productsCountData?.count > 0 ? (
                    <Badge 
                      variant="secondary"
                      className="ml-auto px-2 py-1 text-xs bg-theme-primary-light text-theme-primary"
                    >
                      {productsCountData.count}
                    </Badge>
                  ) : item.badge && item.href !== "/orders" && item.href !== "/products" ? (
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
            {user && (
              <div className="flex items-center mb-3">
                <img 
                  className="h-8 w-8 rounded-full object-cover" 
                  src={(user as any).profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"} 
                  alt="صورة المستخدم"
                />
                <div className="mr-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {(user as any).firstName || (user as any).lastName ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() : (user as any).email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(user as any).role === "admin" ? "مدير النظام" : "موظف"}</p>
                </div>
              </div>
            )}
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