import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AccountingLayout from "@/components/AccountingLayout";
import { 
  Plus, 
  Building, 
  FolderTree,
  Edit,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Folder
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Interfaces
interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountNameAr: string;
  accountNameEn?: string;
  accountType: string;
  accountCategory: string;
  parentAccountId?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  children?: ChartOfAccount[];
  totalBalance?: number;
}

// Schema for creating chart of accounts
const createAccountSchema = z.object({
  accountCode: z.string().min(1, "رقم الحساب مطلوب"),
  accountNameAr: z.string().min(1, "اسم الحساب بالعربية مطلوب"),
  accountNameEn: z.string().optional(),
  accountType: z.enum(["assets", "liabilities", "equity", "revenue", "expenses", "cost_of_goods"]),
  accountCategory: z.enum([
    "current_assets", "fixed_assets", "intangible_assets",
    "current_liabilities", "long_term_liabilities",
    "capital", "retained_earnings", "drawings",
    "sales_revenue", "service_revenue", "other_revenue",
    "operating_expenses", "administrative_expenses", "selling_expenses", "financial_expenses", "other_expenses"
  ]),
  parentAccountId: z.string().optional(),
  description: z.string().optional(),
});

type CreateAccountForm = z.infer<typeof createAccountSchema>;

export default function ChartOfAccounts() {
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get platform session
  const platformSession = JSON.parse(localStorage.getItem('platformSession') || '{}');

  // Get chart of accounts
  const { data: chartOfAccounts, isLoading } = useQuery<ChartOfAccount[]>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/chart-of-accounts`],
  });

  // Form
  const accountForm = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      accountType: "assets",
      accountCategory: "current_assets",
    },
  });

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountForm) => {
      return apiRequest(`/api/platforms/${platformSession.platformId}/accounting/chart-of-accounts`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/chart-of-accounts`] });
      setShowCreateAccount(false);
      accountForm.reset();
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "تم إضافة حساب جديد إلى دليل الحسابات",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return apiRequest(`/api/platforms/${platformSession.platformId}/accounting/chart-of-accounts/${accountId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/chart-of-accounts`] });
      toast({
        title: "تم حذف الحساب بنجاح",
        description: "تم حذف الحساب من دليل الحسابات",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف الحساب",
        description: error.message || "حدث خطأ أثناء حذف الحساب",
        variant: "destructive",
      });
    },
  });

  // Handle delete account
  const handleDeleteAccount = (account: ChartOfAccount) => {
    if (window.confirm(`هل أنت متأكد من حذف الحساب "${account.accountNameAr}"؟`)) {
      deleteAccountMutation.mutate(account.id);
    }
  };

  // Filter accounts
  const filteredAccounts = (chartOfAccounts || []).filter((account: ChartOfAccount) => {
    const matchesSearch = searchTerm === "" || 
      account.accountNameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountCode.includes(searchTerm);
    const matchesType = selectedType === "all" || account.accountType === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Toggle expanded accounts
  const toggleExpanded = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  // Get account type label
  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'assets': return 'الأصول';
      case 'liabilities': return 'الخصوم';
      case 'equity': return 'حقوق الملكية';
      case 'revenue': return 'الإيرادات';
      case 'expenses': return 'المصروفات';
      case 'cost_of_goods': return 'تكلفة البضاعة المباعة';
      default: return type;
    }
  };

  // Get account category label
  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      current_assets: 'الأصول المتداولة',
      fixed_assets: 'الأصول الثابتة',
      intangible_assets: 'الأصول غير الملموسة',
      current_liabilities: 'الخصوم المتداولة',
      long_term_liabilities: 'الخصوم طويلة الأجل',
      capital: 'رأس المال',
      retained_earnings: 'الأرباح المحتجزة',
      drawings: 'المسحوبات',
      sales_revenue: 'إيرادات المبيعات',
      service_revenue: 'إيرادات الخدمات',
      other_revenue: 'إيرادات أخرى',
      operating_expenses: 'مصروفات التشغيل',
      administrative_expenses: 'مصروفات إدارية',
      selling_expenses: 'مصروفات البيع',
      financial_expenses: 'مصروفات مالية',
      other_expenses: 'مصروفات أخرى'
    };
    return labels[category] || category;
  };

  // Get category options based on account type
  const getCategoryOptions = (accountType: string) => {
    switch (accountType) {
      case 'assets':
        return [
          { value: 'current_assets', label: 'الأصول المتداولة' },
          { value: 'fixed_assets', label: 'الأصول الثابتة' },
          { value: 'intangible_assets', label: 'الأصول غير الملموسة' }
        ];
      case 'liabilities':
        return [
          { value: 'current_liabilities', label: 'الخصوم المتداولة' },
          { value: 'long_term_liabilities', label: 'الخصوم طويلة الأجل' }
        ];
      case 'equity':
        return [
          { value: 'capital', label: 'رأس المال' },
          { value: 'retained_earnings', label: 'الأرباح المحتجزة' },
          { value: 'drawings', label: 'المسحوبات' }
        ];
      case 'revenue':
        return [
          { value: 'sales_revenue', label: 'إيرادات المبيعات' },
          { value: 'service_revenue', label: 'إيرادات الخدمات' },
          { value: 'other_revenue', label: 'إيرادات أخرى' }
        ];
      case 'expenses':
        return [
          { value: 'operating_expenses', label: 'مصروفات التشغيل' },
          { value: 'administrative_expenses', label: 'مصروفات إدارية' },
          { value: 'selling_expenses', label: 'مصروفات البيع' },
          { value: 'financial_expenses', label: 'مصروفات مالية' },
          { value: 'other_expenses', label: 'مصروفات أخرى' }
        ];
      default:
        return [];
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Group accounts by type
  const groupedAccounts = (filteredAccounts || []).reduce((groups: { [key: string]: ChartOfAccount[] }, account: ChartOfAccount) => {
    if (!groups[account.accountType]) {
      groups[account.accountType] = [];
    }
    groups[account.accountType].push(account);
    return groups;
  }, {});

  // Calculate totals by type
  const typeTotals = Object.keys(groupedAccounts).reduce((totals: { [key: string]: number }, type: string) => {
    totals[type] = groupedAccounts[type].reduce((sum: number, account: ChartOfAccount) => sum + (account.totalBalance || 0), 0);
    return totals;
  }, {});

  return (
    <AccountingLayout>
      <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => setShowCreateAccount(true)}
              className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة حساب جديد
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-theme-primary">دليل الحسابات</h1>
                <p className="text-gray-500 dark:text-gray-400">إدارة دليل الحسابات المحاسبي</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(typeTotals).map(([type, total]) => (
              <Card key={type} className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-theme-gradient rounded-lg flex items-center justify-center mx-auto mb-2 theme-shadow">
                      <Building className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {getAccountTypeLabel(type)}
                    </p>
                    <p className="text-sm font-bold text-theme-primary">
                      {formatCurrency(total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {groupedAccounts[type]?.length || 0} حساب
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="theme-border bg-theme-primary-lighter">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="البحث في دليل الحسابات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 theme-input"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-48 theme-select-trigger">
                      <SelectValue placeholder="نوع الحساب" />
                    </SelectTrigger>
                    <SelectContent className="bg-theme-primary-lighter">
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="assets">الأصول</SelectItem>
                      <SelectItem value="liabilities">الخصوم</SelectItem>
                      <SelectItem value="equity">حقوق الملكية</SelectItem>
                      <SelectItem value="revenue">الإيرادات</SelectItem>
                      <SelectItem value="expenses">المصروفات</SelectItem>
                      <SelectItem value="cost_of_goods">تكلفة البضاعة المباعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart of Accounts */}
          <Card className="theme-border bg-theme-primary-lighter">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                دليل الحسابات ({(chartOfAccounts || []).length} حساب)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                  <p className="text-gray-500 mt-2">جاري التحميل...</p>
                </div>
              ) : Object.keys(groupedAccounts).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedAccounts).map(([type, accounts]) => (
                    <div key={type} className="border theme-border rounded-lg p-4 bg-theme-primary-light">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                            <Building className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-theme-primary">{getAccountTypeLabel(type)}</h3>
                            <p className="text-sm text-gray-500">{accounts.length} حساب</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-theme-primary">{formatCurrency(typeTotals[type] || 0)}</p>
                          <p className="text-sm text-gray-500">الإجمالي</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {accounts.map((account: ChartOfAccount) => (
                          <div key={account.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border theme-border hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                  <span className="text-sm font-mono text-theme-primary">{account.accountCode}</span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-theme-primary">{account.accountNameAr}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {getCategoryLabel(account.accountCategory)}
                                    </Badge>
                                    {account.accountNameEn && (
                                      <span className="text-sm text-gray-500">{account.accountNameEn}</span>
                                    )}
                                  </div>
                                  {account.description && (
                                    <p className="text-sm text-gray-500 mt-1">{account.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-left">
                                  <p className="font-semibold text-theme-primary">
                                    {formatCurrency(account.totalBalance || 0)}
                                  </p>
                                  <p className="text-xs text-gray-500">الرصيد</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => handleDeleteAccount(account)}
                                    disabled={deleteAccountMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderTree className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد حسابات</h3>
                  <p className="text-gray-500 mb-4">ابدأ ببناء دليل الحسابات الخاص بك</p>
                  <Button 
                    onClick={() => setShowCreateAccount(true)}
                    className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة حساب جديد
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Account Dialog */}
          <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
            <DialogContent className="bg-white dark:bg-gray-900 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-theme-primary">إضافة حساب جديد</DialogTitle>
              </DialogHeader>
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit((data) => createAccountMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={accountForm.control}
                    name="accountCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">رقم الحساب</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="مثل: 1001" className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="accountNameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">اسم الحساب (عربي)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="أدخل اسم الحساب" className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="accountNameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">اسم الحساب (إنجليزي - اختياري)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Account name in English" className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">نوع الحساب</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="theme-select-trigger">
                              <SelectValue placeholder="اختر نوع الحساب" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-theme-primary-lighter">
                            <SelectItem value="assets">الأصول</SelectItem>
                            <SelectItem value="liabilities">الخصوم</SelectItem>
                            <SelectItem value="equity">حقوق الملكية</SelectItem>
                            <SelectItem value="revenue">الإيرادات</SelectItem>
                            <SelectItem value="expenses">المصروفات</SelectItem>
                            <SelectItem value="cost_of_goods">تكلفة البضاعة المباعة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="accountCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">فئة الحساب</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="theme-select-trigger">
                              <SelectValue placeholder="اختر فئة الحساب" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-theme-primary-lighter">
                            {getCategoryOptions(accountForm.watch("accountType")).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={accountForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">الوصف (اختياري)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="أدخل وصف الحساب" className="theme-textarea" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createAccountMutation.isPending}
                      className="flex-1 bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                    >
                      {createAccountMutation.isPending ? "جاري الحفظ..." : "حفظ الحساب"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateAccount(false)}
                      className="theme-border"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
      </div>
    </AccountingLayout>
  );
}