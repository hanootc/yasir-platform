import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, lazy } from "react";
import { useThemeInitializer } from "@/hooks/useThemeInitializer";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";

// Import components directly for faster loading
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Categories from "@/pages/categories";
import LandingPages from "@/pages/landing-pages";
import OrdersTable from "@/pages/orders-table";
import Accounting from "@/pages/accounting";
import Employees from "@/pages/employees";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import LandingPageView from "@/pages/landing-page-view";
import ProductPreview from "@/pages/product-preview";
import PublicProductView from "@/pages/public-product-view";
import ThankYou from "@/pages/thank-you";
import PlatformRegistration from "@/pages/platform-registration";
import PlatformSuccess from "@/pages/platform-success";
import PlatformAdminLogin from "@/pages/platform-admin-login";
import PlatformDashboard from "@/pages/platform-dashboard";
import PlatformProducts from "@/pages/platform-products";
import PlatformCategories from "@/pages/platform-categories";
import PlatformLandingPages from "@/pages/platform-landing-pages";
import PlatformOrders from "@/pages/platform-orders";
import PlatformInventory from "@/pages/platform-inventory";
import PlatformWhatsApp from "@/pages/platform-whatsapp";
import PlatformAdsTikTok from "@/pages/platform-ads-tiktok";
import PlatformAdsTikTokManagement from "@/pages/platform-ads-tiktok-management";
import PlatformAdsMeta from "@/pages/platform-ads-meta";
import PlatformAdsMetaManagement from "@/pages/platform-ads-meta-management";
import Profile from "@/pages/profile";
import PlatformSettings from "@/pages/platform-settings";
import PlatformGeneralSettings from "@/pages/platform-general-settings";
import DeliverySettings from "@/pages/delivery-settings";
import Login from "@/pages/login";
import AccountingDashboard from "@/pages/accounting-dashboard";
import CashManagement from "@/pages/cash-management";
import ChartOfAccounts from "@/pages/chart-of-accounts";
import ExpenseManagement from "@/pages/expense-management";
import CreateJournalEntry from "@/pages/create-journal-entry";
import JournalEntries from "@/pages/journal-entries";
import FinancialReports from "@/pages/financial-reports";
import PrivacyPolicy from "@/pages/privacy-policy";
import SubscriptionExpired from "@/pages/subscription-expired";
import PlatformReports from "@/pages/platform-reports";
import ProductLanding from "@/pages/product-landing";
import PlatformEmployees from "@/pages/platform-employees";
import EmployeeLogin from "@/pages/employee-login";
import EmployeeDashboard from "@/pages/employee-dashboard";
import { MyAccounts } from "@/pages/my-accounts";
import MarketingLanding from "@/pages/marketing-landing";
import MarketingHome from "@/pages/marketing-home";
import CustomerStore from "@/pages/customer-store";
import WhatsAppSettings from "@/pages/whatsapp-settings";
import EmployeeSettings from "@/pages/employee-settings";
import PlatformStoreSettings from "@/pages/platform-store-settings";

import SubscriptionRenewal from "@/pages/subscription-renewal";
import Payment from "@/pages/payment";
import AdminDashboard from "@/pages/admin-dashboard";
import DirectAccess from "@/pages/direct-access";
import AdminProfile from "@/pages/admin-profile";
import SystemAdminLogin from "@/pages/system-admin-login";

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-theme-primary-lighter">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
      <p className="text-theme-primary font-medium">جاري التحميل...</p>
    </div>
  </div>
);

function Router() {
  // Don't call useAuth in Router - causes unnecessary API calls on all pages
  return (
    <Switch>
      <Route path="/thank-you/:orderId" component={ThankYou} />
      <Route path="/:platform/thank-you/:orderId" component={ThankYou} />
      <Route path="/view-landing/:slug" component={LandingPageView} />
      <Route path="/product-preview/:id" component={ProductPreview} />
      <Route path="/public-product/:id" component={PublicProductView} />

      <Route path="/platform-success" component={PlatformSuccess} />
      <Route path="/platform-login" component={PlatformAdminLogin} />
      
      {/* Protected platform routes - MUST come before /:subdomain/:slug */}
      <Route path="/admin/:subdomain" component={() => <AuthGuard><PlatformDashboard /></AuthGuard>} />
      <Route path="/admin/:subdomain/products" component={() => <AuthGuard><PlatformProducts /></AuthGuard>} />
      <Route path="/admin/:subdomain/orders" component={() => <AuthGuard><PlatformOrders /></AuthGuard>} />
      <Route path="/platform/:subdomain" component={() => <AuthGuard><PlatformDashboard /></AuthGuard>} />
      <Route path="/platform/:subdomain/dashboard" component={() => <AuthGuard><PlatformDashboard /></AuthGuard>} />
      <Route path="/platform/:subdomain/products" component={() => <AuthGuard><PlatformProducts /></AuthGuard>} />
      <Route path="/platform/:subdomain/categories" component={() => <AuthGuard><PlatformCategories /></AuthGuard>} />
      <Route path="/platform/:subdomain/landing-pages" component={() => <AuthGuard><PlatformLandingPages /></AuthGuard>} />
      <Route path="/platform/:subdomain/orders" component={() => <AuthGuard><PlatformOrders /></AuthGuard>} />
      <Route path="/platform/:subdomain/inventory" component={() => <AuthGuard><PlatformInventory /></AuthGuard>} />
      <Route path="/platform/:subdomain/whatsapp" component={() => <AuthGuard><PlatformWhatsApp /></AuthGuard>} />
      <Route path="/platform/:subdomain/employees" component={() => <AuthGuard><PlatformEmployees /></AuthGuard>} />
      <Route path="/platform/:subdomain/ads-tiktok" component={() => <AuthGuard><PlatformAdsTikTok /></AuthGuard>} />
      <Route path="/platform/:subdomain/ads-meta" component={() => <AuthGuard><PlatformAdsMeta /></AuthGuard>} />
      <Route path="/platform/:subdomain/accounting" component={() => <AuthGuard><AccountingDashboard /></AuthGuard>} />
      <Route path="/platform/:subdomain/accounting/dashboard" component={() => <AuthGuard><AccountingDashboard /></AuthGuard>} />
      <Route path="/platform/:subdomain/accounting/cash-management" component={() => <AuthGuard><CashManagement /></AuthGuard>} />
      <Route path="/platform/:subdomain/accounting/chart-of-accounts" component={() => <AuthGuard><ChartOfAccounts /></AuthGuard>} />
      <Route path="/platform/:subdomain/accounting/expenses" component={() => <AuthGuard><ExpenseManagement /></AuthGuard>} />
      <Route path="/platform/:subdomain/accounting/journal-entries" component={() => <AuthGuard><JournalEntries /></AuthGuard>} />
      <Route path="/platform/:subdomain/accounting/journal-entries/new" component={() => <AuthGuard><CreateJournalEntry /></AuthGuard>} />
      <Route path="/platform/:subdomain/accounting/reports" component={() => <AuthGuard><FinancialReports /></AuthGuard>} />
      <Route path="/platform/:subdomain/reports" component={() => <AuthGuard><PlatformReports /></AuthGuard>} />
      <Route path="/platform/:subdomain/settings" component={() => <AuthGuard><PlatformSettings /></AuthGuard>} />
      <Route path="/platform/:subdomain/general-settings" component={() => <AuthGuard><PlatformGeneralSettings /></AuthGuard>} />
      <Route path="/platform/:subdomain/store-settings" component={() => <AuthGuard><PlatformStoreSettings /></AuthGuard>} />
      <Route path="/platform/:subdomain/delivery-settings" component={() => <AuthGuard><DeliverySettings /></AuthGuard>} />
      <Route path="/platform/:subdomain/whatsapp-settings" component={() => <AuthGuard><WhatsAppSettings /></AuthGuard>} />
      <Route path="/platform/:subdomain/profile" component={() => <AuthGuard><Profile /></AuthGuard>} />
      <Route path="/platform/:subdomain/my-accounts" component={() => <AuthGuard><MyAccounts /></AuthGuard>} />
      <Route path="/platform/:subdomain/ads-tiktok-management" component={() => <AuthGuard><PlatformAdsTikTokManagement /></AuthGuard>} />
      <Route path="/platform/:subdomain/ads-meta-management" component={() => <AuthGuard><PlatformAdsMetaManagement /></AuthGuard>} />
      <Route path="/platform" component={() => <AuthGuard><PlatformDashboard /></AuthGuard>} />
      <Route path="/platform-dashboard" component={() => <AuthGuard><PlatformDashboard /></AuthGuard>} />
      <Route path="/platform-products" component={() => <AuthGuard><PlatformProducts /></AuthGuard>} />
      <Route path="/platform-categories" component={PlatformCategories} />
      <Route path="/platform-landing-pages" component={PlatformLandingPages} />
      <Route path="/platform-orders" component={PlatformOrders} />
      <Route path="/platform-inventory" component={PlatformInventory} />
      <Route path="/platform-whatsapp" component={PlatformWhatsApp} />
      <Route path="/platform-employees" component={PlatformEmployees} />
      <Route path="/platform-ads" component={PlatformAdsTikTok} />
      <Route path="/platform-ads-tiktok" component={PlatformAdsTikTok} />
      <Route path="/platform-ads-tiktok-management" component={PlatformAdsTikTokManagement} />
      <Route path="/platform-ads-meta" component={PlatformAdsMeta} />
      <Route path="/platform-ads-meta-management" component={PlatformAdsMetaManagement} />
      <Route path="/platform-accounting" component={AccountingDashboard} />
      <Route path="/platform-accounting/dashboard" component={AccountingDashboard} />
      <Route path="/platform-accounting/cash-management" component={CashManagement} />
      <Route path="/platform-accounting/chart-of-accounts" component={ChartOfAccounts} />
      <Route path="/platform-accounting/expenses" component={ExpenseManagement} />
      <Route path="/platform-accounting/journal-entries" component={JournalEntries} />
      <Route path="/platform-accounting/journal-entries/new" component={CreateJournalEntry} />
      <Route path="/platform-accounting/reports" component={FinancialReports} />
      <Route path="/platform-reports" component={PlatformReports} />
      <Route path="/my-accounts" component={MyAccounts} />
      <Route path="/employee-settings" component={EmployeeSettings} />
      <Route path="/accounting-dashboard" component={AccountingDashboard} />
      <Route path="/accounting/cash-management" component={CashManagement} />
      <Route path="/accounting/chart-of-accounts" component={ChartOfAccounts} />
      <Route path="/accounting/expenses" component={ExpenseManagement} />
      <Route path="/employee-login" component={EmployeeLogin} />
      <Route path="/employee/login" component={EmployeeLogin} />
      <Route path="/employee/dashboard" component={EmployeeDashboard} />
      <Route path="/employee-dashboard" component={EmployeeDashboard} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/privacy/:slug" component={PrivacyPolicy} />
      <Route path="/product/:slug" component={LandingPageView} />
      <Route path="/profile" component={Profile} />
      <Route path="/platform-settings" component={PlatformSettings} />
      <Route path="/marketing" component={MarketingLanding} />
      <Route path="/platform-general-settings" component={PlatformGeneralSettings} />
      <Route path="/platform-store-settings" component={PlatformStoreSettings} />
      <Route path="/delivery-settings" component={DeliverySettings} />
      <Route path="/whatsapp-settings" component={WhatsAppSettings} />
      <Route path="/login" component={Login} />
      <Route path="/system-admin-login" component={SystemAdminLogin} />
      <Route path="/dashboard" component={() => <AdminAuthGuard><Dashboard /></AdminAuthGuard>} />
      <Route path="/admin-dashboard" component={() => <AdminAuthGuard><AdminDashboard /></AdminAuthGuard>} />
      <Route path="/payment" component={() => <AdminAuthGuard><AdminDashboard /></AdminAuthGuard>} />
      <Route path="/direct-access" component={() => <AdminAuthGuard><DirectAccess /></AdminAuthGuard>} />
      <Route path="/admin-profile" component={() => <AdminAuthGuard><AdminProfile /></AdminAuthGuard>} />
      <Route path="/register-platform" component={PlatformRegistration} />
      <Route path="/platform-registration" component={PlatformRegistration} />
      <Route path="/subscription-expired" component={SubscriptionExpired} />
      <Route path="/subscription-renewal" component={SubscriptionRenewal} />
      
      {/* Admin sidebar routes - must be before parametric routes */}
      <Route path="/products" component={Products} />
      <Route path="/categories" component={Categories} />
      <Route path="/landing-pages" component={LandingPages} />
      <Route path="/orders" component={OrdersTable} />
      <Route path="/orders-table" component={OrdersTable} />
      <Route path="/accounting" component={Accounting} />
      <Route path="/employees" component={Employees} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      
      {/* Employee routes using subdomain format */}
      <Route path="/souqnaiq/dashboard" component={EmployeeDashboard} />
      <Route path="/souqnaiq/products" component={PlatformProducts} />
      <Route path="/souqnaiq/landing-pages" component={PlatformLandingPages} />
      <Route path="/souqnaiq/orders" component={PlatformOrders} />
      <Route path="/souqnaiq/inventory" component={PlatformInventory} />
      <Route path="/souqnaiq/whatsapp" component={PlatformWhatsApp} />
      <Route path="/souqnaiq/ads-tiktok" component={PlatformAdsTikTok} />
      <Route path="/souqnaiq/employees" component={PlatformEmployees} />
      <Route path="/souqnaiq/reports" component={PlatformReports} />
      <Route path="/souqnaiq/settings" component={PlatformSettings} />
      
      
      <Route path="/" component={MarketingLanding} />
      
      {/* Landing page routes - must come before /:subdomain to avoid conflicts */}
      <Route path="/:subdomain/:slug" component={LandingPageView} />
      
      {/* Customer store route - should be at the end to avoid conflicts */}
      <Route path="/:subdomain" component={CustomerStore} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // تطبيق الثيمات عند بداية التطبيق
  useThemeInitializer();
  
  // Force scrollbar styling with theme colors using JavaScript
  useEffect(() => {
    const updateScrollbarTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const style = document.createElement('style');
      style.id = 'scrollbar-theme-style';
      
      // Remove existing style if present
      const existingStyle = document.getElementById('scrollbar-theme-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent');
      
      style.textContent = `
        ::-webkit-scrollbar {
          width: 20px !important;
          height: 20px !important;
        }
        ::-webkit-scrollbar-track {
          background: ${isDark ? 'hsl(222 84% 5%)' : 'hsl(210 40% 95%)'} !important;
          border-radius: 10px !important;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, hsl(${primaryColor}) 0%, hsl(${accentColor}) 100%) !important;
          border-radius: 10px !important;
          border: 2px solid ${isDark ? 'hsl(222 84% 5%)' : 'hsl(0 0% 100%)'} !important;
          transition: all 0.3s ease !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, hsl(${primaryColor} / 0.8) 0%, hsl(${accentColor} / 0.8) 100%) !important;
          transform: scale(1.05) !important;
        }
        html {
          scrollbar-width: thick !important;
          scrollbar-color: hsl(${primaryColor}) ${isDark ? 'hsl(222 84% 5%)' : 'hsl(210 40% 95%)'} !important;
        }
      `;
      document.head.appendChild(style);
    };
    
    // Initial theme application
    updateScrollbarTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateScrollbarTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Force browser to recognize scrollbar changes
    document.body.style.overflow = 'overlay';
    setTimeout(() => {
      document.body.style.overflow = 'auto';
    }, 100);
    
    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div dir="rtl" className="font-arabic">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
