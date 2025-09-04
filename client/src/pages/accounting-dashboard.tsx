import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AccountingLayout from "@/components/AccountingLayout";
import { 
  Calculator, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  FileText,
  PieChart,
  BarChart3,
  Settings,
  Plus,
  Receipt,
  Banknote,
  Building,
  Target,
  Eye,
  ArrowUpDown
} from "lucide-react";
import { Link } from "wouter";

interface AccountingSummary {
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  netProfit?: number;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  pendingInvoices?: number;
  overdueInvoices?: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  account: string;
}

interface CashAccount {
  id: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
}

export default function AccountingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");

  // Get platform session
  const platformSession = JSON.parse(localStorage.getItem('platformSession') || '{}');

  // Get accounting summary data with automatic refresh
  const { data: accountingSummary, isLoading: summaryLoading } = useQuery<AccountingSummary>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/summary`],
    refetchInterval: 5000, // تحديث كل 5 ثواني
    refetchIntervalInBackground: true,
  });

  // Get recent transactions with automatic refresh
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/transactions/recent`],
    refetchInterval: 5000, // تحديث كل 5 ثواني
    refetchIntervalInBackground: true,
  });

  // Get cash accounts with automatic refresh
  const { data: cashAccounts, isLoading: cashLoading } = useQuery<CashAccount[]>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/cash-accounts`],
    refetchInterval: 5000, // تحديث كل 5 ثواني
    refetchIntervalInBackground: true,
  });

  const quickActions = [
    {
      title: "إضافة قيد محاسبي",
      description: "إنشاء قيد محاسبي جديد",
      icon: FileText,
      href: "/platform-accounting/transactions/new",
      color: "bg-theme-gradient"
    },
    {
      title: "تسجيل مصروف",
      description: "إضافة مصروف جديد",
      icon: Receipt,
      href: "/platform-accounting/expenses",
      color: "bg-theme-gradient"
    },
    {
      title: "حركة صندوق",
      description: "تسجيل حركة نقدية",
      icon: Wallet,
      href: "/platform-accounting/cash-management",
      color: "bg-theme-gradient"
    },
    {
      title: "دليل الحسابات",
      description: "إدارة دليل الحسابات",
      icon: Building,
      href: "/platform-accounting/chart-of-accounts",
      color: "bg-theme-gradient"
    }
  ];

  const modules = [
    {
      title: "إدارة النقدية",
      description: "إدارة الصندوق والحسابات المصرفية",
      icon: Wallet,
      href: "/platform-accounting/cash-management",
      count: (cashAccounts && Array.isArray(cashAccounts)) ? cashAccounts.length : 0
    },
    {
      title: "دليل الحسابات",
      description: "إدارة دليل الحسابات المحاسبي",
      icon: Building,
      href: "/platform-accounting/chart-of-accounts",
      count: 0
    },
    {
      title: "إدارة المصروفات",
      description: "تسجيل ومراقبة المصروفات",
      icon: Receipt,
      href: "/platform-accounting/expenses",
      count: 0
    },
    {
      title: "التقارير المالية",
      description: "تقارير مالية مفصلة",
      icon: BarChart3,
      href: "/platform-accounting/reports",
      count: 0
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AccountingLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="theme-border sidebar-hover-theme">
              <Settings className="h-4 w-4 ml-2" />
              الإعدادات
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-theme-primary">لوحة النظام المحاسبي</h1>
              <p className="text-gray-500 dark:text-gray-400">إدارة شاملة للحسابات والمعاملات المالية</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الأصول</p>
                  <p className="text-2xl font-bold text-theme-primary">
                    {summaryLoading ? "..." : formatCurrency(accountingSummary?.totalAssets || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                  <Building className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                <span className="text-sm text-green-500">+12%</span>
                <span className="text-sm text-gray-500 mr-2">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الخصوم</p>
                  <p className="text-2xl font-bold text-theme-primary">
                    {summaryLoading ? "..." : formatCurrency(accountingSummary?.totalLiabilities || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                <span className="text-sm text-red-500">-5%</span>
                <span className="text-sm text-gray-500 mr-2">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">حقوق الملكية</p>
                  <p className="text-2xl font-bold text-theme-primary">
                    {summaryLoading ? "..." : formatCurrency(accountingSummary?.totalEquity || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                <span className="text-sm text-green-500">+8%</span>
                <span className="text-sm text-gray-500 mr-2">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">صافي الربح</p>
                  <p className="text-2xl font-bold text-theme-primary">
                    {summaryLoading ? "..." : formatCurrency(accountingSummary?.netProfit || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                <span className="text-sm text-green-500">+15%</span>
                <span className="text-sm text-gray-500 mr-2">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="theme-border bg-theme-primary-lighter">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-theme-primary flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-3 theme-border sidebar-hover-theme hover:scale-105 transition-all duration-200">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center theme-shadow`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium text-theme-primary">{action.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
                    </div>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-theme-primary">المعاملات الأخيرة</CardTitle>
                  <Link href="/platform-accounting/transactions">
                    <Button variant="outline" size="sm" className="theme-border sidebar-hover-theme">
                      <Eye className="h-4 w-4 ml-1" />
                      عرض الكل
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                      <p className="text-gray-500 mt-2">جاري التحميل...</p>
                    </div>
                  ) : recentTransactions && Array.isArray(recentTransactions) && recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction: Transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-theme-primary-light rounded-lg hover:bg-theme-primary-lighter transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                          }`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-theme-primary">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.account}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString('ar-IQ')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ArrowUpDown className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">لا توجد معاملات حديثة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Accounts Summary */}
          <div>
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-theme-primary">الحسابات النقدية</CardTitle>
                  <Link href="/platform-accounting/cash-management">
                    <Button variant="outline" size="sm" className="theme-border sidebar-hover-theme">
                      <Eye className="h-4 w-4 ml-1" />
                      إدارة
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cashLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-primary mx-auto"></div>
                    </div>
                  ) : cashAccounts && Array.isArray(cashAccounts) && cashAccounts.length > 0 ? (
                    cashAccounts.map((account: CashAccount) => (
                      <div key={account.id} className="flex items-center justify-between p-3 bg-theme-primary-light rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-theme-gradient rounded-lg flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-theme-primary text-sm">{account.accountName}</p>
                            <Badge variant="secondary" className="text-xs">
                              {account.accountType === 'cash' ? 'نقدي' : 
                               account.accountType === 'bank' ? 'مصرفي' : 'محفظة رقمية'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-theme-primary text-sm">{formatCurrency(account.balance)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Wallet className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">لا توجد حسابات نقدية</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modules */}
        <Card className="theme-border bg-theme-primary-lighter">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-theme-primary">الوحدات المحاسبية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modules.map((module, index) => (
                <Link key={index} href={module.href}>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-3 theme-border sidebar-hover-theme hover:scale-105 transition-all duration-200">
                    <div className="w-12 h-12 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium text-theme-primary">{module.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{module.description}</p>
                      {module.count > 0 && (
                        <Badge variant="secondary" className="mt-2">{module.count}</Badge>
                      )}
                    </div>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AccountingLayout>
  );
}