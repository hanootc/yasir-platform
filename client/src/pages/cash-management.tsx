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
  Wallet, 
  Building, 
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  Search,
  Calendar
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
interface CashAccount {
  id: string;
  accountName: string;
  accountType: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  currentBalance: string;
  initialBalance: string;
  currency: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface CashTransaction {
  id: string;
  cashAccountId: string;
  transactionType: string;
  amount: number;
  description: string;
  reference?: string;
  category?: string;
  partyName?: string;
  partyType?: string;
  transactionDate: string;
  createdAt: string;
  cashAccount: {
    accountName: string;
  };
}

// Schema for creating cash account
const createCashAccountSchema = z.object({
  accountName: z.string().min(1, "اسم الحساب مطلوب"),
  accountType: z.enum(["cash", "bank", "digital_wallet"]),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  initialBalance: z.string().min(1, "الرصيد الابتدائي مطلوب"),
  currency: z.string().default("IQD"),
  description: z.string().optional(),
});

// Schema for cash transaction
const createCashTransactionSchema = z.object({
  cashAccountId: z.string().min(1, "الحساب مطلوب"),
  transactionType: z.enum(["income", "expense", "transfer"]),
  amount: z.string().min(1, "المبلغ مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  reference: z.string().optional(),
  category: z.string().optional(),
  partyName: z.string().optional(),
  partyType: z.enum(["customer", "supplier", "employee", "other"]).optional(),
  transactionDate: z.string().min(1, "التاريخ مطلوب"),
});

type CreateCashAccountForm = z.infer<typeof createCashAccountSchema>;
type CreateCashTransactionForm = z.infer<typeof createCashTransactionSchema>;

export default function CashManagement() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get platform session
  const platformSession = JSON.parse(localStorage.getItem('platformSession') || '{}');

  // Get cash accounts
  const { data: cashAccounts, isLoading: accountsLoading } = useQuery<CashAccount[]>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/cash-accounts`],
  });

  // Get cash transactions
  const { data: cashTransactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/cash-transactions`],
  });

  // Extract transactions array from the response
  const cashTransactions = (cashTransactionsData as any)?.transactions || [];

  // Calculate totals
  const totalBalance = (cashAccounts || []).reduce((total: number, account: CashAccount) => total + (parseFloat(account.currentBalance) || 0), 0);
  const cashBalance = (cashAccounts || []).filter((account: CashAccount) => account.accountType === 'cash').reduce((total: number, account: CashAccount) => total + (parseFloat(account.currentBalance) || 0), 0);
  const bankBalance = (cashAccounts || []).filter((account: CashAccount) => account.accountType === 'bank').reduce((total: number, account: CashAccount) => total + (parseFloat(account.currentBalance) || 0), 0);

  // Filter transactions
  const filteredTransactions = (cashTransactions || []).filter((transaction: CashTransaction) => {
    const matchesFilter = transactionFilter === "all" || transaction.transactionType === transactionFilter;
    const matchesSearch = searchTerm === "" || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.cashAccount.accountName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = selectedAccount === "all" || selectedAccount === "" || transaction.cashAccountId === selectedAccount;
    
    return matchesFilter && matchesSearch && matchesAccount;
  });

  // Forms
  const accountForm = useForm<CreateCashAccountForm>({
    resolver: zodResolver(createCashAccountSchema),
    defaultValues: {
      accountType: "cash",
      currency: "IQD",
    },
  });

  const transactionForm = useForm<CreateCashTransactionForm>({
    resolver: zodResolver(createCashTransactionSchema),
    defaultValues: {
      transactionType: "income",
      transactionDate: new Date().toISOString().split('T')[0],
    },
  });

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateCashAccountForm) => {
      return apiRequest(`/api/platforms/${platformSession.platformId}/accounting/cash-accounts`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/cash-accounts`] });
      setShowCreateAccount(false);
      accountForm.reset();
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "تم إضافة حساب نقدي جديد",
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

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: CreateCashTransactionForm) => {
      return apiRequest(`/api/platforms/${platformSession.platformId}/accounting/cash-transactions`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/cash-transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/cash-accounts`] });
      setShowCreateTransaction(false);
      transactionForm.reset();
      toast({
        title: "تم تسجيل المعاملة بنجاح",
        description: "تم إضافة معاملة نقدية جديدة",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل المعاملة",
        description: error.message || "حدث خطأ أثناء تسجيل المعاملة",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return apiRequest(`/api/platforms/${platformSession.platformId}/accounting/cash-accounts/${accountId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/cash-accounts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/cash-transactions`] });
      toast({
        title: "تم حذف الحساب بنجاح",
        description: "تم حذف الحساب النقدي من النظام",
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

  const handleDeleteAccount = (accountId: string, accountName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الحساب "${accountName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      deleteAccountMutation.mutate(accountId);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'نقدي';
      case 'bank': return 'مصرفي';
      case 'digital_wallet': return 'محفظة رقمية';
      default: return type;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'income': return 'إيراد';
      case 'expense': return 'مصروف';
      case 'transfer': return 'تحويل';
      default: return type;
    }
  };

  return (
    <AccountingLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCreateAccount(true)}
              className="bg-theme-gradient hover:bg-theme-gradient/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة حساب
            </Button>
            <Button 
              onClick={() => setShowCreateTransaction(true)}
              variant="outline"
              className="theme-border"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة معاملة
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-theme-primary">إدارة النقدية</h1>
              <p className="text-gray-500 dark:text-gray-400">إدارة الحسابات النقدية والمصرفية</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الرصيد</p>
                  <p className="text-2xl font-bold text-theme-primary">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="w-12 h-12 bg-theme-gradient rounded-lg flex items-center justify-center theme-shadow">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الرصيد النقدي</p>
                  <p className="text-2xl font-bold text-theme-primary">{formatCurrency(cashBalance)}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center theme-shadow">
                  <Building className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الرصيد المصرفي</p>
                  <p className="text-2xl font-bold text-theme-primary">{formatCurrency(bankBalance)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center theme-shadow">
                  <CreditCard className="h-6 w-6 text-white" />
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
                <TabsTrigger value="accounts" className="text-theme-primary">الحسابات النقدية</TabsTrigger>
                <TabsTrigger value="transactions" className="text-theme-primary">المعاملات النقدية</TabsTrigger>
              </TabsList>

              {/* Accounts Tab */}
              <TabsContent value="accounts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-theme-primary">الحسابات النقدية</h2>
                  <Button 
                    onClick={() => setShowCreateAccount(true)}
                    className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة حساب جديد
                  </Button>
                </div>

                {accountsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                    <p className="text-gray-500 mt-2">جاري التحميل...</p>
                  </div>
                ) : cashAccounts && cashAccounts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cashAccounts.map((account: CashAccount) => (
                      <Card key={account.id} className="theme-border bg-theme-primary-light hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-theme-gradient rounded-lg flex items-center justify-center">
                                {account.accountType === 'cash' ? (
                                  <Wallet className="h-4 w-4 text-white" />
                                ) : account.accountType === 'bank' ? (
                                  <Building className="h-4 w-4 text-white" />
                                ) : (
                                  <CreditCard className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {getAccountTypeLabel(account.accountType)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteAccount(account.id, account.accountName)}
                                disabled={deleteAccountMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="font-semibold text-theme-primary">{account.accountName}</h3>
                            {account.accountNumber && (
                              <p className="text-sm text-gray-500">رقم الحساب: {account.accountNumber}</p>
                            )}
                            {account.bankName && (
                              <p className="text-sm text-gray-500">البنك: {account.bankName}</p>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-sm text-gray-500">الرصيد:</span>
                              <span className="font-bold text-theme-primary">{formatCurrency(parseFloat(account.currentBalance))}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد حسابات نقدية</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإضافة حساب نقدي جديد</p>
                    <Button 
                      onClick={() => setShowCreateAccount(true)}
                      className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة حساب جديد
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-theme-primary">المعاملات النقدية</h2>
                  <Button 
                    onClick={() => setShowCreateTransaction(true)}
                    className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة معاملة جديدة
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 p-4 bg-theme-primary-light rounded-lg">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                      <SelectTrigger className="w-40 theme-select-trigger">
                        <SelectValue placeholder="نوع المعاملة" />
                      </SelectTrigger>
                      <SelectContent className="bg-theme-primary-lighter">
                        <SelectItem value="all">جميع المعاملات</SelectItem>
                        <SelectItem value="income">الإيرادات</SelectItem>
                        <SelectItem value="expense">المصروفات</SelectItem>
                        <SelectItem value="transfer">التحويلات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger className="w-48 theme-select-trigger">
                        <SelectValue placeholder="اختر الحساب" />
                      </SelectTrigger>
                      <SelectContent className="bg-theme-primary-lighter">
                        <SelectItem value="all">جميع الحسابات</SelectItem>
                        {(cashAccounts || []).map((account: CashAccount) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="البحث في المعاملات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="theme-input"
                    />
                  </div>
                </div>

                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                    <p className="text-gray-500 mt-2">جاري التحميل...</p>
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction: CashTransaction) => (
                      <Card key={transaction.id} className="theme-border bg-theme-primary-light hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                transaction.transactionType === 'income' ? 'bg-green-100 dark:bg-green-900' : 
                                transaction.transactionType === 'expense' ? 'bg-red-100 dark:bg-red-900' : 
                                'bg-blue-100 dark:bg-blue-900'
                              }`}>
                                {transaction.transactionType === 'income' ? (
                                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : transaction.transactionType === 'expense' ? (
                                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                ) : (
                                  <ArrowUpDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-theme-primary">{transaction.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {getTransactionTypeLabel(transaction.transactionType)}
                                  </Badge>
                                  <span className="text-sm text-gray-500">{transaction.cashAccount.accountName}</span>
                                </div>
                                {transaction.partyName && (
                                  <p className="text-sm text-gray-500 mt-1">الطرف: {transaction.partyName}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-left">
                              <p className={`font-bold text-lg ${
                                transaction.transactionType === 'income' ? 'text-green-600 dark:text-green-400' : 
                                transaction.transactionType === 'expense' ? 'text-red-600 dark:text-red-400' : 
                                'text-blue-600 dark:text-blue-400'
                              }`}>
                                {transaction.transactionType === 'income' ? '+' : transaction.transactionType === 'expense' ? '-' : ''}
                                {formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.transactionDate).toLocaleDateString('ar-IQ')}
                              </p>
                              {transaction.reference && (
                                <p className="text-xs text-gray-400">مرجع: {transaction.reference}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ArrowUpDown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد معاملات</h3>
                    <p className="text-gray-500 mb-4">ابدأ بتسجيل معاملة نقدية جديدة</p>
                    <Button 
                      onClick={() => setShowCreateTransaction(true)}
                      className="bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة معاملة جديدة
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Create Account Dialog */}
        <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
          <DialogContent className="bg-white dark:bg-gray-900 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-theme-primary">إضافة حساب نقدي جديد</DialogTitle>
            </DialogHeader>
            <Form {...accountForm}>
              <form onSubmit={accountForm.handleSubmit((data) => createAccountMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={accountForm.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">اسم الحساب</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل اسم الحساب" className="theme-input" />
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
                          <SelectItem value="cash">نقدي</SelectItem>
                          <SelectItem value="bank">مصرفي</SelectItem>
                          <SelectItem value="digital_wallet">محفظة رقمية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={accountForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">رقم الحساب (اختياري)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل رقم الحساب" className="theme-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={accountForm.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">اسم البنك (اختياري)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل اسم البنك" className="theme-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={accountForm.control}
                  name="initialBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">الرصيد الابتدائي</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0" className="theme-input" />
                      </FormControl>
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

        {/* Create Transaction Dialog */}
        <Dialog open={showCreateTransaction} onOpenChange={setShowCreateTransaction}>
          <DialogContent className="bg-white dark:bg-gray-900 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-theme-primary">إضافة معاملة نقدية جديدة</DialogTitle>
            </DialogHeader>
            <Form {...transactionForm}>
              <form onSubmit={transactionForm.handleSubmit((data) => createTransactionMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={transactionForm.control}
                  name="cashAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">الحساب النقدي</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="theme-select-trigger">
                            <SelectValue placeholder="اختر الحساب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-theme-primary-lighter">
                          {(cashAccounts || []).map((account: CashAccount) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountName} - {formatCurrency(parseFloat(account.currentBalance))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">نوع المعاملة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="theme-select-trigger">
                            <SelectValue placeholder="اختر نوع المعاملة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-theme-primary-lighter">
                          <SelectItem value="income">إيراد</SelectItem>
                          <SelectItem value="expense">مصروف</SelectItem>
                          <SelectItem value="transfer">تحويل</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
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
                  control={transactionForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">الوصف</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل وصف المعاملة" className="theme-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">تاريخ المعاملة</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="theme-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="partyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">اسم الطرف (اختياري)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="اسم العميل أو المورد" className="theme-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-theme-primary">المرجع (اختياري)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="رقم المرجع أو الفاتورة" className="theme-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createTransactionMutation.isPending}
                    className="flex-1 bg-theme-gradient text-white hover:opacity-90 theme-shadow"
                  >
                    {createTransactionMutation.isPending ? "جاري الحفظ..." : "حفظ المعاملة"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateTransaction(false)}
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