import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountingLayout from "@/components/AccountingLayout";
import { 
  Plus, 
  Receipt, 
  Filter,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Upload,
  FolderOpen,
  Tag
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
interface Expense {
  id: string;
  amount: number;
  description: string;
  expenseDate: string;
  categoryId?: string;
  paymentMethod: string;
  cashAccountId?: string;
  vendorName?: string;
  vendorContact?: string;
  receiptUrl?: string;
  status: string;
  createdAt: string;
  category?: {
    categoryName: string;
  };
  cashAccount?: {
    accountName: string;
  };
}

interface ExpenseCategory {
  id: string;
  categoryName: string;
  description?: string;
  parentCategoryId?: string;
  isActive: boolean;
  createdAt: string;
  children?: ExpenseCategory[];
  expenseCount?: number;
  totalAmount?: number;
}

interface CashAccount {
  id: string;
  accountName: string;
  accountType: string;
  balance: number;
}

// Schema for creating expense
const createExpenseSchema = z.object({
  amount: z.string().min(1, "المبلغ مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  expenseDate: z.string().min(1, "التاريخ مطلوب"),
  categoryId: z.string().optional(),
  paymentMethod: z.enum(["cash", "bank_transfer", "card", "check", "other"]),
  cashAccountId: z.string().optional(),
  vendorName: z.string().optional(),
  vendorContact: z.string().optional(),
  receiptUrl: z.string().optional(),
});

// Schema for creating expense category
const createCategorySchema = z.object({
  categoryName: z.string().min(1, "اسم الفئة مطلوب"),
  description: z.string().optional(),
  parentCategoryId: z.string().optional(),
});

type CreateExpenseForm = z.infer<typeof createExpenseSchema>;
type CreateCategoryForm = z.infer<typeof createCategorySchema>;

export default function ExpenseManagement() {
  const [activeTab, setActiveTab] = useState("expenses");
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("this_month");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get platform session
  const platformSession = JSON.parse(localStorage.getItem('platformSession') || '{}');

  // Get expenses
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/expenses`],
  });

  // Extract expenses array from the response
  const expenses = (expensesData as any)?.expenses || [];

  // Get expense categories
  const { data: expenseCategories, isLoading: categoriesLoading } = useQuery<ExpenseCategory[]>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/expense-categories`],
  });

  // Get cash accounts
  const { data: cashAccounts, isLoading: cashAccountsLoading } = useQuery<CashAccount[]>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/cash-accounts`],
  });

  // Calculate summary data
  const totalExpenses = (expenses || []).reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
  const approvedExpenses = (expenses || []).filter((expense: Expense) => expense.status === 'approved').reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
  const pendingExpenses = (expenses || []).filter((expense: Expense) => expense.status === 'pending').reduce((sum: number, expense: Expense) => sum + expense.amount, 0);

  // Filter expenses
  const filteredExpenses = (expenses || []).filter((expense: Expense) => {
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || expense.categoryId === categoryFilter;
    const matchesSearch = searchTerm === "" || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.vendorName && expense.vendorName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Forms
  const expenseForm = useForm<CreateExpenseForm>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      paymentMethod: "cash",
      expenseDate: new Date().toISOString().split('T')[0],
    },
  });

  const categoryForm = useForm<CreateCategoryForm>({
    resolver: zodResolver(createCategorySchema),
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: CreateExpenseForm) => {
      return apiRequest(`/api/platforms/${platformSession.platformId}/accounting/expenses`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/expenses`] });
      setShowCreateExpense(false);
      expenseForm.reset();
      toast({
        title: "تم تسجيل المصروف بنجاح",
        description: "تم إضافة مصروف جديد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل المصروف",
        description: error.message || "حدث خطأ أثناء تسجيل المصروف",
        variant: "destructive",
      });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CreateCategoryForm) => {
      return apiRequest(`/api/platforms/${platformSession.platformId}/accounting/expense-categories`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/expense-categories`] });
      setShowCreateCategory(false);
      categoryForm.reset();
      toast({
        title: "تم إنشاء الفئة بنجاح",
        description: "تم إضافة فئة مصروفات جديدة",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء الفئة",
        description: error.message || "حدث خطأ أثناء إنشاء الفئة",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'نقدي';
      case 'bank_transfer': return 'تحويل مصرفي';
      case 'card': return 'بطاقة';
      case 'check': return 'شيك';
      case 'other': return 'أخرى';
      default: return method;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'معلق';
      case 'approved': return 'موافق عليه';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'approved': return 'text-green-600 dark:text-green-400';
      case 'rejected': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <AccountingLayout>
      <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowCreateCategory(true)}
                variant="outline"
                className="theme-border"
              >
                <Tag className="h-4 w-4 mr-2" />
                إضافة فئة
              </Button>
              <Button 
                onClick={() => setShowCreateExpense(true)}
                className="bg-theme-gradient hover:bg-theme-gradient/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة مصروف
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-theme-primary">إدارة المصروفات</h1>
                <p className="text-gray-500 dark:text-gray-400">تسجيل ومراقبة المصروفات والنفقات</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المصروفات</p>
                    <p className="text-2xl font-bold text-theme-primary">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="w-12 h-12 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                  <span className="text-sm text-green-500">+5%</span>
                  <span className="text-sm text-gray-500 mr-2">من الشهر الماضي</span>
                </div>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المصروفات المعتمدة</p>
                    <p className="text-2xl font-bold text-theme-primary">{formatCurrency(approvedExpenses)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center theme-shadow">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المصروفات المعلقة</p>
                    <p className="text-2xl font-bold text-theme-primary">{formatCurrency(pendingExpenses)}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center theme-shadow">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card className="theme-border bg-theme-primary-lighter">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expenses" className="text-theme-primary">المصروفات</TabsTrigger>
                  <TabsTrigger value="categories" className="text-theme-primary">فئات المصروفات</TabsTrigger>
                </TabsList>

                {/* Expenses Tab */}
                <TabsContent value="expenses" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-theme-primary">المصروفات</h2>
                    <Button 
                      onClick={() => setShowCreateExpense(true)}
                      className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة مصروف جديد
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-4 p-4 bg-theme-primary-light rounded-lg">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 theme-border">
                          <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent className="bg-theme-primary-lighter">
                          <SelectItem value="all">جميع الحالات</SelectItem>
                          <SelectItem value="pending">معلق</SelectItem>
                          <SelectItem value="approved">موافق عليه</SelectItem>
                          <SelectItem value="rejected">مرفوض</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-gray-500" />
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-48 theme-select-trigger">
                          <SelectValue placeholder="الفئة" />
                        </SelectTrigger>
                        <SelectContent className="bg-theme-primary-lighter">
                          <SelectItem value="all">جميع الفئات</SelectItem>
                          {(expenseCategories || []).map((category: ExpenseCategory) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.categoryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <Search className="h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="البحث في المصروفات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="theme-input"
                      />
                    </div>

                    <Button variant="outline" className="theme-border sidebar-hover-theme">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                  </div>

                  {/* Expenses List */}
                  {expensesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                      <p className="text-gray-500 mt-2">جاري التحميل...</p>
                    </div>
                  ) : filteredExpenses.length > 0 ? (
                    <div className="space-y-3">
                      {filteredExpenses.map((expense: Expense) => (
                        <Card key={expense.id} className="theme-border bg-theme-primary-light hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                                  <Receipt className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-theme-primary">{expense.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {getPaymentMethodLabel(expense.paymentMethod)}
                                    </Badge>
                                    {expense.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {expense.category.categoryName}
                                      </Badge>
                                    )}
                                    <div className={`flex items-center gap-1 ${getStatusColor(expense.status)}`}>
                                      {getStatusIcon(expense.status)}
                                      <span className="text-xs">{getStatusLabel(expense.status)}</span>
                                    </div>
                                  </div>
                                  {expense.vendorName && (
                                    <p className="text-sm text-gray-500 mt-1">المورد: {expense.vendorName}</p>
                                  )}
                                  {expense.cashAccount && (
                                    <p className="text-sm text-gray-500">الحساب: {expense.cashAccount.accountName}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-lg text-red-600 dark:text-red-400">
                                  -{formatCurrency(expense.amount)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(expense.expenseDate).toLocaleDateString('ar-IQ')}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {expense.receiptUrl && (
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد مصروفات</h3>
                      <p className="text-gray-500 mb-4">ابدأ بتسجيل مصروف جديد</p>
                      <Button 
                        onClick={() => setShowCreateExpense(true)}
                        className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة مصروف جديد
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-theme-primary">فئات المصروفات</h2>
                    <Button 
                      onClick={() => setShowCreateCategory(true)}
                      className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة فئة جديدة
                    </Button>
                  </div>

                  {categoriesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                      <p className="text-gray-500 mt-2">جاري التحميل...</p>
                    </div>
                  ) : expenseCategories && expenseCategories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {expenseCategories.map((category: ExpenseCategory) => (
                        <Card key={category.id} className="theme-border bg-theme-primary-light hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-8 h-8 bg-theme-gradient rounded-lg flex items-center justify-center">
                                <FolderOpen className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h3 className="font-semibold text-theme-primary">{category.categoryName}</h3>
                              {category.description && (
                                <p className="text-sm text-gray-500">{category.description}</p>
                              )}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm text-gray-500">المصروفات:</span>
                                <span className="font-medium text-theme-primary">{category.expenseCount || 0}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">الإجمالي:</span>
                                <span className="font-bold text-theme-primary">{formatCurrency(category.totalAmount || 0)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد فئات</h3>
                      <p className="text-gray-500 mb-4">ابدأ بإنشاء فئات للمصروفات</p>
                      <Button 
                        onClick={() => setShowCreateCategory(true)}
                        className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة فئة جديدة
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Create Expense Dialog */}
          <Dialog open={showCreateExpense} onOpenChange={setShowCreateExpense}>
            <DialogContent className="bg-white dark:bg-gray-900 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-theme-primary">إضافة مصروف جديد</DialogTitle>
              </DialogHeader>
              <Form {...expenseForm}>
                <form onSubmit={expenseForm.handleSubmit((data) => createExpenseMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={expenseForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">المبلغ</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expenseForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">الوصف</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="أدخل وصف المصروف" className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expenseForm.control}
                    name="expenseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">تاريخ المصروف</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expenseForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">الفئة (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="theme-select-trigger">
                              <SelectValue placeholder="اختر الفئة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-theme-primary-lighter">
                            {(expenseCategories || []).map((category: ExpenseCategory) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.categoryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expenseForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">طريقة الدفع</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="theme-select-trigger">
                              <SelectValue placeholder="اختر طريقة الدفع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-theme-primary-lighter">
                            <SelectItem value="cash">نقدي</SelectItem>
                            <SelectItem value="bank_transfer">تحويل مصرفي</SelectItem>
                            <SelectItem value="card">بطاقة</SelectItem>
                            <SelectItem value="check">شيك</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expenseForm.control}
                    name="cashAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">الحساب النقدي (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="theme-select-trigger">
                              <SelectValue placeholder="اختر الحساب" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-theme-primary-lighter">
                            {(cashAccounts || []).map((account: CashAccount) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.accountName} - {formatCurrency(account.balance)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expenseForm.control}
                    name="vendorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">اسم المورد (اختياري)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="اسم المورد أو التاجر" className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createExpenseMutation.isPending}
                      className="flex-1 bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                    >
                      {createExpenseMutation.isPending ? "جاري الحفظ..." : "حفظ المصروف"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateExpense(false)}
                      className="theme-border"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Create Category Dialog */}
          <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
            <DialogContent className="bg-white dark:bg-gray-900 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-theme-primary">إضافة فئة مصروفات جديدة</DialogTitle>
              </DialogHeader>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="categoryName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">اسم الفئة</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="أدخل اسم الفئة" className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={categoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-theme-primary">الوصف (اختياري)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="أدخل وصف الفئة" className="theme-textarea" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createCategoryMutation.isPending}
                      className="flex-1 bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                    >
                      {createCategoryMutation.isPending ? "جاري الحفظ..." : "حفظ الفئة"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateCategory(false)}
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