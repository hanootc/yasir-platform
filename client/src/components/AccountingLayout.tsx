import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PlatformSidebar from "@/components/PlatformSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";

interface AccountingLayoutProps {
  children: ReactNode;
}

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

export function AccountingLayout({ children }: AccountingLayoutProps) {
  // Get current path
  const [currentPath] = useLocation();
  
  // Get platform session from API instead of localStorage
  const { data: session } = useQuery<PlatformSession>({
    queryKey: ['/api/platform-session'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="min-h-screen bg-theme-primary-lightest pageSlideIn">
      {/* Sidebar */}
      <PlatformSidebar session={session!} currentPath={currentPath} />
      
      {/* Main Content Area - Responsive margin for sidebar (RTL layout) */}
      <div className="main-content flex flex-col min-h-screen transition-all duration-300 mr-60">
        {/* Header - Same style as platform dashboard */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-4">
          <div className="text-right flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ColorThemeSelector />
              <ThemeToggle />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">النظام المحاسبي</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">إدارة شاملة للحسابات والموارد المالية</p>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-900 border-t theme-border px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>© 2025 {session?.platformName || 'المنصة'}</span>
              <span>|</span>
              <span>النظام المحاسبي الشامل</span>
            </div>
            <div className="flex items-center gap-4">
              <span>إصدار 1.0</span>
              <span>|</span>
              <span>جميع الحقوق محفوظة</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AccountingLayout;