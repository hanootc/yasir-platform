import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Calculator,
  Trash2
} from "lucide-react";
import { AccountingLayout } from "@/components/AccountingLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types
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
  account?: {
    accountCode: string;
    accountNameAr: string;
  };
}

export default function JournalEntries() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("this_month");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get platform session
  const platformSession = JSON.parse(localStorage.getItem('platformSession') || '{}');

  // Get journal entries
  const { data: journalEntriesData, isLoading } = useQuery({
    queryKey: [`/api/platforms/${platformSession.platformId}/accounting/journal-entries`],
  });

  const journalEntries = (journalEntriesData as any)?.entries || [];

  // Delete journal entry mutation
  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/platforms/${platformSession.platformId}/accounting/journal-entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete journal entry');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/platforms/${platformSession.platformId}/accounting/journal-entries`],
      });
      toast({
        title: "تم حذف القيد المحاسبي",
        description: "تم حذف القيد المحاسبي بنجاح",
      });
    },
    onError: (error) => {
      console.error('Error deleting journal entry:', error);
      toast({
        title: "خطأ في حذف القيد",
        description: "حدث خطأ أثناء حذف القيد المحاسبي",
        variant: "destructive",
      });
    },
  });

  const handleDeleteEntry = (entryId: string) => {
    deleteJournalEntryMutation.mutate(entryId);
  };

  // Filter entries
  const filteredEntries = journalEntries.filter((entry: JournalEntry) => {
    const matchesSearch = searchTerm === "" || 
      entry.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "مسودة", variant: "secondary" as const, icon: Clock },
      pending: { label: "في الانتظار", variant: "outline" as const, icon: Clock },
      approved: { label: "معتمد", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "مرفوض", variant: "destructive" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Calculate summary stats
  const totalEntries = filteredEntries.length;
  const totalDebit = filteredEntries.reduce((sum: number, entry: JournalEntry) => sum + entry.totalDebit, 0);
  const totalCredit = filteredEntries.reduce((sum: number, entry: JournalEntry) => sum + entry.totalCredit, 0);
  const approvedEntries = filteredEntries.filter((entry: JournalEntry) => entry.status === 'approved').length;

  return (
    <AccountingLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => navigate("/platform-accounting/journal-entries/new")}
            className="bg-theme-gradient hover:bg-theme-gradient/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            إنشاء قيد جديد
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-theme-primary" />
            <div className="text-right">
              <h1 className="text-3xl font-bold text-theme-primary">القيود المحاسبية</h1>
              <p className="text-muted-foreground">إدارة القيود المحاسبية والمعاملات</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="theme-border bg-theme-primary-lighter">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي القيود</p>
                  <p className="text-2xl font-bold text-theme-primary">{totalEntries}</p>
                </div>
                <FileText className="h-8 w-8 text-theme-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">القيود المعتمدة</p>
                  <p className="text-2xl font-bold text-green-600">{approvedEntries}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المدين</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDebit)}</p>
                </div>
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="theme-border bg-theme-primary-lighter">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الدائن</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCredit)}</p>
                </div>
                <Calculator className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="theme-border bg-theme-primary-lighter">
          <CardHeader>
            <CardTitle className="text-theme-primary flex items-center gap-2">
              <Filter className="h-5 w-5" />
              البحث والتصفية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث برقم المرجع أو الوصف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 theme-input"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="theme-select-trigger bg-theme-primary-lighter">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent className="bg-theme-primary-lighter theme-border">
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="theme-select-trigger bg-theme-primary-lighter">
                  <SelectValue placeholder="الفترة الزمنية" />
                </SelectTrigger>
                <SelectContent className="bg-theme-primary-lighter theme-border">
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="this_week">هذا الأسبوع</SelectItem>
                  <SelectItem value="this_month">هذا الشهر</SelectItem>
                  <SelectItem value="last_month">الشهر الماضي</SelectItem>
                  <SelectItem value="this_year">هذا العام</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="theme-border">
                <Filter className="h-4 w-4 mr-2" />
                تطبيق المرشحات
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Journal Entries Table */}
        <Card className="theme-border bg-theme-primary-lighter">
          <CardHeader>
            <CardTitle className="text-theme-primary">قائمة القيود المحاسبية</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">جاري تحميل القيود...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد قيود محاسبية</h3>
                <p className="text-muted-foreground mb-4">ابدأ بإنشاء قيد محاسبي جديد</p>
                <Button 
                  onClick={() => navigate("/platform-accounting/journal-entries/new")}
                  className="bg-theme-gradient hover:bg-theme-gradient/80"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  إنشاء قيد جديد
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم المرجع</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">إجمالي المدين</TableHead>
                      <TableHead className="text-right">إجمالي الدائن</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry: JournalEntry) => (
                      <TableRow key={entry.id} className="hover:bg-theme-primary-lighter/50">
                        <TableCell className="font-medium">{entry.referenceNumber}</TableCell>
                        <TableCell>{formatDate(entry.entryDate)}</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                        <TableCell className="font-medium text-blue-600">{formatCurrency(entry.totalDebit)}</TableCell>
                        <TableCell className="font-medium text-purple-600">{formatCurrency(entry.totalCredit)}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/platform-accounting/journal-entries/${entry.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {entry.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/platform-accounting/journal-entries/${entry.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {(entry.status === 'draft' || entry.status === 'rejected') && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-theme-primary-lighter theme-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-theme-primary">
                                      تأكيد حذف القيد المحاسبي
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل أنت متأكد من رغبتك في حذف القيد المحاسبي رقم "{entry.referenceNumber}"؟
                                      هذا الإجراء لا يمكن التراجع عنه.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="theme-border">
                                      إلغاء
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteEntry(entry.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      disabled={deleteJournalEntryMutation.isPending}
                                    >
                                      {deleteJournalEntryMutation.isPending ? "جاري الحذف..." : "حذف"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AccountingLayout>
  );
}