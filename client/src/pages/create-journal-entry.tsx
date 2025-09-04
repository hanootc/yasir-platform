import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, FileText, Calculator, Check, ChevronsUpDown, Search } from "lucide-react";
import { AccountingLayout } from "@/components/AccountingLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Types
interface ChartAccount {
  id: string;
  accountCode: string;
  accountNameAr: string;
  accountType: string;
  accountCategory: string;
}

interface JournalEntry {
  id: string;
  referenceNumber: string;
  entryDate: string;
  description: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  entries: JournalEntryLine[];
}

interface JournalEntryLine {
  id: string;
  accountId: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  account?: ChartAccount;
}

// Schema
const journalEntryLineSchema = z.object({
  accountId: z.string().min(1, "الحساب مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  debitAmount: z.number().min(0, "يجب أن يكون المبلغ موجب"),
  creditAmount: z.number().min(0, "يجب أن يكون المبلغ موجب"),
}).refine((data) => {
  return (data.debitAmount > 0 && data.creditAmount === 0) || 
         (data.creditAmount > 0 && data.debitAmount === 0);
}, {
  message: "يجب إدخال مبلغ في خانة المدين أو الدائن وليس كلاهما",
  path: ["debitAmount"],
});

const createJournalEntrySchema = z.object({
  referenceNumber: z.string().min(1, "رقم المرجع مطلوب"),
  entryDate: z.string().min(1, "التاريخ مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  entries: z.array(journalEntryLineSchema)
    .min(2, "يجب إضافة سطرين على الأقل")
    .refine((entries) => {
      const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
      const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
      return Math.abs(totalDebit - totalCredit) < 0.01; // Allow for floating point precision
    }, {
      message: "إجمالي المدين يجب أن يساوي إجمالي الدائن",
      path: ["entries"],
    }),
});

type CreateJournalEntryForm = z.infer<typeof createJournalEntrySchema>;

export default function CreateJournalEntry() {
  const [, navigate] = useLocation();
  const [accountSearchTerms, setAccountSearchTerms] = useState<{[key: number]: string}>({});
  const [openPopovers, setOpenPopovers] = useState<{[key: number]: boolean}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get platform session
  const platformSession = JSON.parse(localStorage.getItem('platformSession') || '{}');

  // Get chart of accounts
  const { data: chartAccounts, isLoading: accountsLoading } = useQuery<ChartAccount[]>({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/chart-of-accounts`],
  });

  // Form setup
  const form = useForm<CreateJournalEntryForm>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: {
      referenceNumber: `JE-${Date.now()}`,
      entryDate: new Date().toISOString().split('T')[0],
      description: "",
      entries: [
        { accountId: "", description: "", debitAmount: 0, creditAmount: 0 },
        { accountId: "", description: "", debitAmount: 0, creditAmount: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateJournalEntryForm) => {
      return apiRequest(`/api/platforms/${platformSession.platformId}/accounting/journal-entries`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء القيد المحاسبي",
        description: "تم إنشاء القيد المحاسبي بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformSession.platformId}/accounting/journal-entries`] });
      navigate("/platform-accounting/journal-entries");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "فشل في إنشاء القيد المحاسبي",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateJournalEntryForm) => {
    createMutation.mutate(data);
  };

  // Calculate totals
  const watchedEntries = form.watch("entries");
  const totalDebit = watchedEntries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
  const totalCredit = watchedEntries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AccountingLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/platform-accounting/journal-entries")}
          >
            العودة للقيود
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-theme-primary" />
            <div className="text-right">
              <h1 className="text-3xl font-bold text-theme-primary">إنشاء قيد محاسبي</h1>
              <p className="text-muted-foreground">إضافة قيد محاسبي جديد</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-theme-primary">معلومات القيد الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم المرجع</FormLabel>
                      <FormControl>
                        <Input placeholder="JE-001" {...field} className="theme-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ القيد</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="theme-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>وصف القيد</FormLabel>
                      <FormControl>
                        <Input placeholder="وصف القيد المحاسبي" {...field} className="theme-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Journal Entry Lines */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-theme-primary">بنود القيد المحاسبي</CardTitle>
                <Button
                  type="button"
                  onClick={() => append({ accountId: "", description: "", debitAmount: 0, creditAmount: 0 })}
                  size="sm"
                  className="bg-theme-gradient hover:bg-theme-gradient/80"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة بند
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الحساب</TableHead>
                        <TableHead className="text-right">الوصف</TableHead>
                        <TableHead className="text-right">مدين</TableHead>
                        <TableHead className="text-right">دائن</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell className="w-1/4">
                            <FormField
                              control={form.control}
                              name={`entries.${index}.accountId`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <Popover 
                                    open={openPopovers[index] || false} 
                                    onOpenChange={(open) => 
                                      setOpenPopovers(prev => ({...prev, [index]: open}))
                                    }
                                  >
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className={`w-full justify-between theme-border bg-theme-primary-lighter hover:bg-theme-primary-light ${
                                            !field.value && "text-muted-foreground"
                                          }`}
                                        >
                                          {field.value
                                            ? (() => {
                                                const selectedAccount = (chartAccounts || []).find(
                                                  (account) => account.id === field.value
                                                );
                                                return selectedAccount 
                                                  ? `${selectedAccount.accountCode} - ${selectedAccount.accountNameAr}`
                                                  : "اختر الحساب";
                                              })()
                                            : "اختر الحساب"}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 account-dropdown">
                                      <Command className="account-dropdown">
                                        <div className="flex items-center border-b border-gray-600 px-3">
                                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-gray-400" />
                                          <CommandInput 
                                            placeholder="البحث في الحسابات..." 
                                            className="flex-1 py-3 text-right bg-transparent border-0 focus:outline-none focus:ring-0"
                                          />
                                        </div>
                                        <CommandList className="max-h-[300px] overflow-auto">
                                          <CommandEmpty className="py-6 text-center text-sm">
                                            لا توجد حسابات
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {(chartAccounts || [])
                                              .filter(account => account && account.id && account.id.trim() !== '')
                                              .map((account) => (
                                              <CommandItem
                                                value={`${account.accountCode} ${account.accountNameAr}`}
                                                key={account.id}
                                                onSelect={() => {
                                                  field.onChange(account.id);
                                                  setOpenPopovers(prev => ({...prev, [index]: false}));
                                                }}
                                                className="text-right cursor-pointer py-3 px-4 flex items-center justify-between"
                                              >
                                                <div className="flex items-center">
                                                  <Check
                                                    className={`mr-2 h-4 w-4 ${
                                                      account.id === field.value
                                                        ? "opacity-100 text-theme-primary"
                                                        : "opacity-0"
                                                    }`}
                                                  />
                                                  <div className="text-right">
                                                    <div className="font-medium">{account.accountNameAr}</div>
                                                    <div className="text-sm opacity-70">{account.accountCode}</div>
                                                  </div>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="w-1/4">
                            <FormField
                              control={form.control}
                              name={`entries.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="وصف البند" {...field} className="theme-input" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="w-1/6">
                            <FormField
                              control={form.control}
                              name={`entries.${index}.debitAmount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="theme-input"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="w-1/6">
                            <FormField
                              control={form.control}
                              name={`entries.${index}.creditAmount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="theme-input"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            {fields.length > 2 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <Card className={`theme-border p-4 ${isBalanced ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-8">
                        <span className="font-medium">إجمالي المدين:</span>
                        <span className="font-bold">{formatCurrency(totalDebit)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-8">
                        <span className="font-medium">إجمالي الدائن:</span>
                        <span className="font-bold">{formatCurrency(totalCredit)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center gap-8">
                          <span className="font-medium">الفرق:</span>
                          <span className={`font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(totalDebit - totalCredit))}
                          </span>
                        </div>
                      </div>
                      {isBalanced && (
                        <div className="text-center text-green-600 font-medium flex items-center justify-center gap-2">
                          <Calculator className="h-4 w-4" />
                          القيد متوازن
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/platform-accounting/journal-entries")}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={!isBalanced || createMutation.isPending}
                className="bg-theme-gradient hover:bg-theme-gradient/80"
              >
                {createMutation.isPending ? "جاري الحفظ..." : "حفظ القيد"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AccountingLayout>
  );
}