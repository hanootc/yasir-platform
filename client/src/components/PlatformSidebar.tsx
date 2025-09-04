import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, ChevronUp, User, Settings } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import EmployeeEditModal from "@/components/modals/employee-edit-modal";
import { useCurrentSession } from "@/hooks/useSessionInfo";
import { queryClient } from "@/lib/queryClient";

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

interface EmployeeSession {
  success: boolean;
  employee: {
    id: string;
    platformId: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    department: string;
    position: string;
    salary: string;
    hireDate: string;
    profileImageUrl: string | null;
    username: string;
    lastLoginAt: string;
    permissions: string[];
  };
}

interface SidebarProps {
  session: PlatformSession;
  currentPath: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

// Permission mapping for menu items
const permissionMap: { [key: string]: string } = {
  "/platform-dashboard": "dashboard_view",
  "/employee-dashboard": "dashboard_view", 
  "/employee/dashboard": "dashboard_view",
  "/platform-products": "products_view",
  "/platform-categories": "categories_view", 
  "/platform-landing-pages": "landing_pages_view",
  "/platform-orders": "orders_view",
  "/platform-inventory": "inventory_view",
  "/platform-whatsapp": "whatsapp_view",
  "/platform-employees": "employees_view",
  "/platform-accounting": "accounting_view",
  "/platform-reports": "reports_view",
  "/delivery-settings": "settings_view",
  "/profile": "profile_view",
  "/platform-general-settings": "settings_view",
  "/platform-store-settings": "settings_view",
  "/platform-settings": "ads_view",
  "/my-accounts": "accounts_view",
};

// Navigation menu items - centralized configuration
const menuItems = [
  {
    href: "/platform-dashboard", // Will be dynamically changed to /employee-dashboard for employees
    icon: "fas fa-chart-pie",
    label: "لوحة التحكم",
    permission: "dashboard_view",
  },
  {
    href: "/platform-products",
    icon: "fas fa-box",
    label: "إدارة المنتجات",
    permission: "products_view",
  },
  {
    href: "/platform-categories",
    icon: "fas fa-tags",
    label: "إدارة التصنيفات",
    permission: "categories_view",
  },
  {
    href: "/platform-landing-pages",
    icon: "fas fa-pager",
    label: "صفحات الهبوط",
    permission: "landing_pages_view",
  },
  {
    href: "/platform-orders", 
    icon: "fas fa-shopping-cart",
    label: "إدارة الطلبات",
    badgeVariant: "destructive" as const,
    permission: "orders_view",
  },
  {
    href: "/platform-inventory",
    icon: "fas fa-warehouse",
    label: "إدارة المخزن",
    permission: "inventory_view",
  },
  {
    href: "/platform-whatsapp",
    icon: "fab fa-whatsapp",
    label: "واتساب للأعمال",
    permission: "whatsapp_view",
  },
  {
    href: "/platform-employees",
    icon: "fas fa-users",
    label: "إدارة الموظفين",
    permission: "employees_view",
  },
  {
    href: "/platform-accounting",
    icon: "fas fa-calculator", 
    label: "النظام المحاسبي",
    permission: "accounting_view",
  },
  {
    href: "/platform-reports",
    icon: "fas fa-chart-bar",
    label: "التقارير والإحصائيات",
    permission: "reports_view",
  },
];

// Ads submenu items
const adsSubmenuItems = [
  {
    href: "/platform-ads-tiktok",
    icon: "fab fa-tiktok",
    label: "إعلانات تيك توك",
  },
  {
    href: "/platform-ads-tiktok-management",
    icon: "fas fa-chart-line",
    label: "إدارة إعلانات تيكتوك",
  },
  {
    href: "/platform-ads-meta",
    icon: "fab fa-meta",
    label: "إعلانات ميتا",
  },
  {
    href: "/platform-ads-meta-management",
    icon: "fas fa-chart-line",
    label: "إدارة إعلانات ميتا",
  },
];

// Settings submenu items
const settingsSubmenuItems = [
  {
    href: "/profile",
    icon: "fas fa-user",
    label: "الملف الشخصي",
  },
  {
    href: "/platform-general-settings", 
    icon: "fas fa-cog",
    label: "إعدادات المنصة",
  },
  {
    href: "/platform-store-settings",
    icon: "fas fa-store",
    label: "إعدادات المتجر",
  },
  {
    href: "/platform-settings",
    icon: "fas fa-bullhorn", 
    label: "إعدادات الإعلانات",
  },
  {
    href: "/delivery-settings",
    icon: "fas fa-truck",
    label: "إعدادات التوصيل",
  },
  {
    href: "/whatsapp-settings",
    icon: "fab fa-whatsapp",
    label: "إعدادات واتساب",
  },
];

// Accounting submenu items
const accountingSubmenuItems = [
  {
    href: "/platform-accounting/dashboard",
    icon: "fas fa-chart-pie",
    label: "لوحة المحاسبة",
  },
  {
    href: "/platform-accounting/cash-management",
    icon: "fas fa-money-bill-wave",
    label: "إدارة النقدية",
  },
  {
    href: "/platform-accounting/chart-of-accounts",
    icon: "fas fa-list-alt",
    label: "دليل الحسابات",
  },
  {
    href: "/platform-accounting/expenses",
    icon: "fas fa-receipt",
    label: "إدارة المصروفات",
  },
  {
    href: "/platform-accounting/journal-entries",
    icon: "fas fa-file-invoice",
    label: "القيود المحاسبية",
  },
  {
    href: "/platform-accounting/reports",
    icon: "fas fa-chart-bar",
    label: "التقارير المالية",
  },
];



export default function PlatformSidebar({ session, currentPath, isCollapsed = false, onToggle }: SidebarProps) {
  const [isAdsOpen, setIsAdsOpen] = useState(false);
  // Auto-open accounting section if we're on an accounting page
  const [isAccountingOpen, setIsAccountingOpen] = useState(() => {
    return currentPath?.startsWith('/platform-accounting') || false;
  });
  // Auto-open settings section if we're on a settings page
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    return currentPath?.includes('settings') || currentPath === '/profile' || false;
  });
  const [location, navigate] = useLocation();

  // Get real session info for permission checking
  const { isEmployee, employeePermissions, employeeSession, platformSession } = useCurrentSession();
  
  
  // Use platformSession if available, fallback to passed session
  const currentSession = platformSession || session;

  // Check if user has permission for a menu item
  const hasPermission = (permission: string) => {
    if (!isEmployee) return true; // Admin has all permissions
    return employeePermissions.includes(permission);
  };

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  }).map(item => {
    // Change dashboard href for employees
    if (item.href === "/platform-dashboard" && isEmployee) {
      return { ...item, href: "/employee/dashboard" };
    }
    return item;
  });

  // Keep accounting section open when navigating within accounting pages
  useEffect(() => {
    if (currentPath?.startsWith('/platform-accounting')) {
      setIsAccountingOpen(true);
    }
  }, [currentPath]);

  // Keep settings section open when navigating within settings pages
  useEffect(() => {
    if (currentPath?.includes('settings') || currentPath === '/profile') {
      setIsSettingsOpen(true);
    }
  }, [currentPath]);
  
  // Fetch real counts for products and orders only if session exists
  const { data: productsCount } = useQuery({
    queryKey: [`/api/platforms/${currentSession?.platformId}/products/count`],
    retry: false,
    enabled: !!currentSession?.platformId,
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (isEmployee) {
        const token = localStorage.getItem('employee_session_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      const response = await fetch(`/api/platforms/${currentSession?.platformId}/products/count`, { headers });
      if (!response.ok) throw new Error('Failed to fetch products count');
      return response.json();
    },
  });

  const { data: ordersCount } = useQuery({
    queryKey: [`/api/platforms/${currentSession?.platformId}/orders/count`],
    retry: false,
    enabled: !!currentSession?.platformId,
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (isEmployee) {
        const token = localStorage.getItem('employee_session_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      const response = await fetch(`/api/platforms/${currentSession?.platformId}/orders/count`, { headers });
      if (!response.ok) throw new Error('Failed to fetch orders count');
      return response.json();
    },
  });

  const handleLogout = () => {
    if (isEmployee) {
      localStorage.removeItem('employee_session_token');
      localStorage.removeItem('employeeData');
      // Clear React Query cache
      queryClient.clear();
      navigate('/employee/login');
    } else {
      localStorage.removeItem('platformSession');
      // Clear React Query cache
      queryClient.clear();
      navigate('/platform-login');
    }
  };

  return (
    <>
      {/* Mobile backdrop - only show when sidebar is open on mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full bg-white dark:bg-gray-900 shadow-lg transition-transform duration-300 overflow-y-auto custom-scrollbar ${
        isCollapsed 
          ? 'translate-x-full md:translate-x-0 md:w-16 z-30' 
          : 'translate-x-0 w-80 md:w-64 z-50'
      }`}>
        
        {/* Toggle Button for Desktop */}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="absolute top-2 left-2 z-10 hidden md:flex bg-gray-50 hover:bg-gray-100"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        )}

        {/* Platform Header with Logo */}
        <div className={`p-4 border-b ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            {currentSession?.logoUrl ? (
              <img
                src={currentSession.logoUrl}
                alt={`${currentSession.platformName} Logo`}
                className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg object-cover border`}
                onError={(e) => {
                  console.error("Error loading logo:", currentSession.logoUrl);
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    e.currentTarget.style.display = 'none';
                    const defaultIcon = document.createElement('div');
                    defaultIcon.className = `${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-theme-gradient flex items-center justify-center`;
                    defaultIcon.innerHTML = `<i class="fas fa-store text-white ${isCollapsed ? 'text-sm' : ''}"></i>`;
                    parent.appendChild(defaultIcon);
                  }
                }}
              />
            ) : (
              <div className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-theme-gradient flex items-center justify-center`}>
                <i className={`fas fa-store text-white ${isCollapsed ? 'text-sm' : ''}`}></i>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate text-theme-primary animate-gradient-move" style={{ 
                  background: 'linear-gradient(to right, white, hsl(var(--primary)), hsl(var(--primary)))',
                  backgroundSize: '200% 100%',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  transition: 'all 0.3s ease'
                }}>
                  {currentSession?.platformName || "المنصة"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {currentSession?.subdomain || "النطاق الفرعي"}
                </p>
              </div>
            )}
          </div>
        </div>
      
        <div className={`p-3 ${isCollapsed ? 'p-2' : 'p-3'}`}>
          {/* Employee Profile Section */}
          {isEmployee && employeeSession?.employee && !isCollapsed && (
            <div className="mb-6 p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-lg border border-theme-primary/20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors w-full">
                    <div className="relative">
                      {employeeSession.employee.profileImageUrl ? (
                        <img
                          src={employeeSession.employee.profileImageUrl}
                          alt={employeeSession.employee.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-theme-primary"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-theme-gradient flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {employeeSession.employee.fullName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {employeeSession.employee.position}
                      </p>
                      <p className="text-xs text-theme-primary truncate">
                        {employeeSession.employee.department}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/employee-settings" className="w-full flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      الإعدادات
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <nav className="space-y-1">
            {/* Main Navigation Items */}
            {filteredMenuItems.slice(0, 1).map((item) => {
              const isActive = currentPath === item.href || (item.href === "/employee/dashboard" && currentPath === "/employee/dashboard");
              
              return (
                <div key={item.href}>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full ${isCollapsed ? 'justify-center p-2' : 'justify-start text-right'} transition-all duration-200 ease-in-out sidebar-link ${
                        isActive 
                          ? 'bg-theme-gradient text-white theme-shadow' 
                          : 'sidebar-hover-theme'
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      {isCollapsed ? (
                        <i className={`${item.icon} text-sm`}></i>
                      ) : (
                        <div className="flex items-center gap-3">
                          <i className={item.icon}></i>
                          <span>{item.label}</span>
                        </div>
                      )}
                    </Button>
                  </Link>
                </div>
              );
            })}

            {/* Ads Section with Dropdown */}
            {!isCollapsed && hasPermission("ads_view") && (
              <Collapsible open={isAdsOpen} onOpenChange={setIsAdsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-right sidebar-hover-theme transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <i className="fas fa-ad"></i>
                      <span>الإعلانات</span>
                    </div>
                    {isAdsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mr-6 mt-0.5 space-y-0.5">
                  {adsSubmenuItems.map((subItem) => {
                    const isSubActive = currentPath === subItem.href;
                    
                    return (
                      <Link key={subItem.href} href={subItem.href}>
                        <Button
                          variant={isSubActive ? "default" : "ghost"}
                          className={`w-full justify-start text-right text-sm transition-all duration-200 ease-in-out sidebar-link ${
                            isSubActive 
                              ? 'bg-theme-gradient text-white theme-shadow' 
                              : 'text-gray-600 sidebar-hover-theme'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <i className={`${subItem.icon} text-sm`}></i>
                            <span>{subItem.label}</span>
                          </div>
                        </Button>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* My Accounts - Single Menu Item */}
            {!isCollapsed && hasPermission("accounts_view") && (
              <div>
                <Link href="/my-accounts">
                  <Button
                    variant={currentPath === "/my-accounts" ? "default" : "ghost"}
                    className={`w-full justify-start text-right transition-all duration-200 ease-in-out sidebar-link ${
                      currentPath === "/my-accounts"
                        ? 'bg-theme-gradient text-white theme-shadow' 
                        : 'sidebar-hover-theme'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className="fas fa-user-circle"></i>
                      <span>حساباتي</span>
                    </div>
                  </Button>
                </Link>
              </div>
            )}

            {/* Accounting Section with Dropdown */}
            {!isCollapsed && hasPermission("accounting_view") && (
              <Collapsible open={isAccountingOpen} onOpenChange={setIsAccountingOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-right sidebar-hover-theme transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <i className="fas fa-calculator"></i>
                      <span>النظام المحاسبي</span>
                    </div>
                    {isAccountingOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mr-6 mt-0.5 space-y-0.5">
                  {accountingSubmenuItems.map((subItem) => {
                    const isSubActive = currentPath === subItem.href;
                    
                    return (
                      <Link key={subItem.href} href={subItem.href}>
                        <Button
                          variant={isSubActive ? "default" : "ghost"}
                          className={`w-full justify-start text-right text-sm transition-all duration-200 ease-in-out sidebar-link ${
                            isSubActive 
                              ? 'bg-theme-gradient text-white theme-shadow' 
                              : 'text-gray-600 sidebar-hover-theme'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <i className={`${subItem.icon} text-sm`}></i>
                            <span>{subItem.label}</span>
                          </div>
                        </Button>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Rest of menu items (excluding accounting and settings) */}
            {filteredMenuItems.slice(1).filter(item => 
              item.href !== '/platform-accounting' && 
              !item.href.includes('settings') && 
              item.href !== '/profile' &&
              item.href !== '/platform-reports'
            ).map((item) => {
              const isActive = currentPath === item.href;
              
              // Get real badge count for products and orders
              let badgeCount = (item as any).badge;
              if (item.href === '/platform-products' && productsCount && typeof productsCount === 'object' && 'count' in productsCount) {
                badgeCount = (productsCount as any).count?.toString();
              } else if (item.href === '/platform-orders' && ordersCount && typeof ordersCount === 'object' && 'count' in ordersCount) {
                badgeCount = (ordersCount as any).count?.toString();
              }
              
              return (
                <div key={item.href}>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full ${isCollapsed ? 'justify-center p-2' : 'justify-between text-right'} transition-all duration-200 ease-in-out sidebar-link ${
                        isActive 
                          ? 'bg-theme-gradient text-white theme-shadow' 
                          : 'sidebar-hover-theme'
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      {isCollapsed ? (
                        <i className={`${item.icon} text-sm`}></i>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                          </div>
                          {badgeCount && (
                            <Badge 
                              variant={item.badgeVariant || "secondary"}
                              className="mr-2 px-2 py-1 text-xs badge-theme"
                            >
                              {badgeCount}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              );
            })}

            {/* Reports Item */}
            {filteredMenuItems.filter(item => item.href === '/platform-reports').map((item) => {
              const isActive = currentPath === item.href;
              
              return (
                <div key={item.href}>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full ${isCollapsed ? 'justify-center p-2' : 'justify-between text-right'} transition-all duration-200 ease-in-out sidebar-link ${
                        isActive 
                          ? 'bg-theme-gradient text-white theme-shadow' 
                          : 'sidebar-hover-theme'
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      {isCollapsed ? (
                        <i className={`${item.icon} text-sm`}></i>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                          </div>
                          {(item as any).badge && (
                            <Badge 
                              variant={(item as any).badgeVariant || "secondary"}
                              className="mr-2 px-2 py-1 text-xs badge-theme"
                            >
                              {(item as any).badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              );
            })}

            {/* Settings Section - Based on Permission */}
            {(hasPermission("settings_view") || hasPermission("ads_view")) && (
              <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`w-full ${isCollapsed ? 'justify-center p-2' : 'justify-between text-right'} transition-all duration-200 ease-in-out sidebar-link hover:bg-theme-primary/10 hover:border-r-4 hover:border-r-theme-primary`}
                  >
                    {isCollapsed ? (
                      <i className="fas fa-cogs text-sm"></i>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <i className="fas fa-cogs"></i>
                          <span>الإعدادات</span>
                        </div>
                        {isSettingsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mr-6 mt-0.5 space-y-0.5">
                  {settingsSubmenuItems.map((subItem) => {
                    const isSubActive = currentPath === subItem.href;
                    
                    return (
                      <Link key={subItem.href} href={subItem.href}>
                        <Button
                          variant={isSubActive ? "default" : "ghost"}
                          className={`w-full justify-start text-right text-sm transition-all duration-200 ease-in-out sidebar-link ${
                            isSubActive 
                              ? 'bg-theme-gradient text-white theme-shadow' 
                              : 'text-gray-600 sidebar-hover-theme'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <i className={`${subItem.icon} text-sm`}></i>
                            <span>{subItem.label}</span>
                          </div>
                        </Button>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </nav>

          {/* User Actions */}
          {!isCollapsed && (
            <div className="mt-6 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full text-right text-sm text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:text-red-400 dark:hover:text-red-300 hover:scale-105 hover:shadow-md hover:border-l-4 hover:border-l-red-500 transition-all duration-200"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-2">
                  <i className="fas fa-sign-out-alt"></i>
                  <span>تسجيل الخروج</span>
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export { PlatformSidebar };