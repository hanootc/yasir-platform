import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  Calculator
} from "lucide-react";
import { AccountingLayout } from "@/components/AccountingLayout";
import { useQuery } from "@tanstack/react-query";

// Types
interface FinancialReport {
  period: {
    from: string;
    to: string;
  };
  revenue: number;
  expenses: {
    total: number;
    byCategory: Array<{
      category_name: string;
      total_amount: number;
    }>;
  };
  netIncome: number;
  profitMargin: string;
}

interface BalanceSheetReport {
  asOfDate: string;
  assets: {
    cash: number;
    byType: Array<{
      account_type: string;
      account_category: string;
      total_balance: number;
    }>;
  };
  liabilities: {
    byType: Array<{
      account_type: string;
      account_category: string;
      total_balance: number;
    }>;
  };
  equity: {
    byType: Array<{
      account_type: string;
      account_category: string;
      total_balance: number;
    }>;
  };
}

interface CashFlowReport {
  period: {
    from: string;
    to: string;
  };
  operating: {
    cashInflows: number;
    cashOutflows: number;
    netCashFlow: number;
  };
  summary: {
    beginningCash: number;
    netCashFlow: number;
    endingCash: number;
  };
}

export default function FinancialReports() {
  const [reportType, setReportType] = useState("profit_loss");
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Get platform session
  const platformSession = JSON.parse(localStorage.getItem('platformSession') || '{}');

  // Get Profit & Loss Report
  const { data: profitLossData, isLoading: plLoading } = useQuery<FinancialReport>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/reports/profit-loss?from=${fromDate}&to=${toDate}`],
  });

  // Get Balance Sheet Report
  const { data: balanceSheetData, isLoading: bsLoading } = useQuery<BalanceSheetReport>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/reports/balance-sheet?asOf=${toDate}`],
  });

  // Get Cash Flow Report
  const { data: cashFlowData, isLoading: cfLoading } = useQuery<CashFlowReport>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/reports/cash-flow?from=${fromDate}&to=${toDate}`],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getAccountCategoryLabel = (category: string) => {
    const labels = {
      current_assets: "الأصول المتداولة",
      fixed_assets: "الأصول الثابتة",
      intangible_assets: "الأصول غير الملموسة",
      current_liabilities: "الخصوم المتداولة",
      long_term_liabilities: "الخصوم طويلة الأجل",
      capital: "رأس المال",
      retained_earnings: "الأرباح المحتجزة",
      drawings: "المسحوبات",
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <AccountingLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline"
            className="theme-border"
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير التقرير
          </Button>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-theme-primary" />
            <div className="text-right">
              <h1 className="text-3xl font-bold text-theme-primary">التقارير المالية</h1>
              <p className="text-muted-foreground">تقارير مالية شاملة ومفصلة</p>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card className="theme-border bg-theme-primary-lighter">
          <CardHeader>
            <CardTitle className="text-theme-primary flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              اختيار الفترة الزمنية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fromDate">من تاريخ</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="theme-input"
                />
              </div>
              <div>
                <Label htmlFor="toDate">إلى تاريخ</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="theme-input"
                />
              </div>
              <div className="flex items-end">
                <Button className="bg-theme-gradient hover:bg-theme-gradient/80 w-full">
                  تحديث التقارير
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-theme-primary-lighter theme-border">
            <TabsTrigger value="profit_loss" className="data-[state=active]:bg-theme-gradient">
              قائمة الدخل
            </TabsTrigger>
            <TabsTrigger value="balance_sheet" className="data-[state=active]:bg-theme-gradient">
              الميزانية العمومية
            </TabsTrigger>
            <TabsTrigger value="cash_flow" className="data-[state=active]:bg-theme-gradient">
              قائمة التدفق النقدي
            </TabsTrigger>
          </TabsList>

          {/* Profit & Loss Report */}
          <TabsContent value="profit_loss" className="space-y-6">
            {plLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">جاري تحميل قائمة الدخل...</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="theme-border bg-theme-primary-lighter">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(profitLossData?.revenue || 0)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="theme-border bg-theme-primary-lighter">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</p>
                          <p className="text-2xl font-bold text-red-600">{formatCurrency(profitLossData?.expenses.total || 0)}</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="theme-border bg-theme-primary-lighter">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">صافي الدخل</p>
                          <p className={`text-2xl font-bold ${(profitLossData?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profitLossData?.netIncome || 0)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-theme-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="theme-border bg-theme-primary-lighter">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">هامش الربح</p>
                          <p className="text-2xl font-bold text-blue-600">{profitLossData?.profitMargin || 0}%</p>
                        </div>
                        <Calculator className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Report */}
                <Card className="theme-border bg-theme-primary-lighter">
                  <CardHeader>
                    <CardTitle className="text-theme-primary">قائمة الدخل المفصلة</CardTitle>
                    <p className="text-muted-foreground">
                      من {formatDate(fromDate)} إلى {formatDate(toDate)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Revenue Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-green-600">الإيرادات</h3>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span>إجمالي الإيرادات</span>
                            <span className="font-bold text-green-600">{formatCurrency(profitLossData?.revenue || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expenses Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-red-600">المصروفات</h3>
                        <div className="space-y-2">
                          {(profitLossData?.expenses.byCategory || []).map((category, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                              <span>{category.category_name}</span>
                              <span className="font-medium text-red-600">{formatCurrency(parseFloat(category.total_amount))}</span>
                            </div>
                          ))}
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mt-4">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">إجمالي المصروفات</span>
                              <span className="font-bold text-red-600">{formatCurrency(profitLossData?.expenses.total || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Net Income */}
                      <div className={`p-4 rounded-lg ${(profitLossData?.netIncome || 0) >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">صافي الدخل</span>
                          <span className={`text-xl font-bold ${(profitLossData?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profitLossData?.netIncome || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Balance Sheet Report */}
          <TabsContent value="balance_sheet" className="space-y-6">
            {bsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">جاري تحميل الميزانية العمومية...</p>
              </div>
            ) : (
              <Card className="theme-border bg-theme-primary-lighter">
                <CardHeader>
                  <CardTitle className="text-theme-primary">الميزانية العمومية</CardTitle>
                  <p className="text-muted-foreground">كما في {formatDate(toDate)}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Assets */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-blue-600">الأصول</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span>النقدية والمعادلات النقدية</span>
                          <span className="font-medium">{formatCurrency(balanceSheetData?.assets.cash || 0)}</span>
                        </div>
                        {(balanceSheetData?.assets.byType || []).map((asset, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                            <span>{getAccountCategoryLabel(asset.account_category)}</span>
                            <span className="font-medium">{formatCurrency(parseFloat(asset.total_balance))}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Liabilities & Equity */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-red-600">الخصوم وحقوق الملكية</h3>
                      <div className="space-y-3">
                        <h4 className="font-medium text-red-500">الخصوم</h4>
                        {(balanceSheetData?.liabilities.byType || []).map((liability, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                            <span>{getAccountCategoryLabel(liability.account_category)}</span>
                            <span className="font-medium">{formatCurrency(parseFloat(liability.total_balance))}</span>
                          </div>
                        ))}
                        
                        <h4 className="font-medium text-green-500 mt-6">حقوق الملكية</h4>
                        {(balanceSheetData?.equity.byType || []).map((equity, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                            <span>{getAccountCategoryLabel(equity.account_category)}</span>
                            <span className="font-medium">{formatCurrency(parseFloat(equity.total_balance))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Cash Flow Report */}
          <TabsContent value="cash_flow" className="space-y-6">
            {cfLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">جاري تحميل قائمة التدفق النقدي...</p>
              </div>
            ) : (
              <Card className="theme-border bg-theme-primary-lighter">
                <CardHeader>
                  <CardTitle className="text-theme-primary">قائمة التدفق النقدي</CardTitle>
                  <p className="text-muted-foreground">
                    من {formatDate(fromDate)} إلى {formatDate(toDate)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Operating Activities */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">الأنشطة التشغيلية</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span>التدفقات النقدية الداخلة</span>
                          <span className="font-medium text-green-600">{formatCurrency(cashFlowData?.operating.cashInflows || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span>التدفقات النقدية الخارجة</span>
                          <span className="font-medium text-red-600">{formatCurrency(cashFlowData?.operating.cashOutflows || 0)}</span>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">صافي التدفق النقدي من الأنشطة التشغيلية</span>
                            <span className={`font-bold ${(cashFlowData?.operating.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(cashFlowData?.operating.netCashFlow || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-theme-primary-lighter p-4 rounded-lg border theme-border">
                      <h3 className="text-lg font-semibold mb-3">ملخص التدفق النقدي</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>النقدية في بداية الفترة</span>
                          <span className="font-medium">{formatCurrency(cashFlowData?.summary.beginningCash || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>صافي التدفق النقدي</span>
                          <span className={`font-medium ${(cashFlowData?.summary.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(cashFlowData?.summary.netCashFlow || 0)}
                          </span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">النقدية في نهاية الفترة</span>
                            <span className="font-bold text-theme-primary">{formatCurrency(cashFlowData?.summary.endingCash || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AccountingLayout>
  );
}