import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Activity, 
  TrendingUp,
  RefreshCw,
  Clock,
  Zap
} from "lucide-react";
import { usePageTitle } from '@/hooks/usePageTitle';
import Sidebar from "@/components/layout/sidebar";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

interface RateLimitData {
  success: boolean;
  summary: {
    totalClients: number;
    totalUsage: number;
    totalLimit: number;
    totalUsagePercentage: number;
    metaGlobalLimit: number;
    metaUsagePercentage: number;
    activeClients: number;
  };
  clients: Array<{
    platformId: string;
    platformName: string;
    subscriptionPlan: string;
    currentUsage: number;
    maxRequests: number;
    usagePercentage: number;
    resetTime: string | null;
    status: 'normal' | 'warning' | 'critical';
    hasMetaConnection: boolean;
  }>;
  alerts: Array<{
    type: 'warning' | 'critical';
    message: string;
    platformId?: string;
    global?: boolean;
  }>;
  lastUpdated: string;
}

export default function AdminRateLimitMonitor() {
  usePageTitle('مراقبة معدل الاستخدام - لوحة الإدارة');
  const isMobile = useIsMobile();

  const { data: rateLimitData, isLoading, refetch } = useQuery<RateLimitData>({
    queryKey: ["/api/admin/rate-limit-status"],
    queryFn: async () => {
      const response = await fetch('/api/admin/rate-limit-status');
      if (!response.ok) throw new Error('Failed to fetch rate limit data');
      return response.json();
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatResetTime = (resetTime: string | null) => {
    if (!resetTime) return 'غير محدد';
    const date = new Date(resetTime);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return 'انتهى';
    if (diffMins < 60) return `${diffMins} دقيقة`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}س ${mins}د`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-theme-primary-lighter">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2 space-x-reverse">
            <RefreshCw className="h-8 w-8 animate-spin text-theme-primary" />
            <span className="text-theme-primary font-medium">جاري تحميل بيانات المراقبة...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!rateLimitData) {
    return (
      <div className="flex h-screen bg-theme-primary-lighter">
        <Sidebar />
        <div className="flex-1 p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>فشل في تحميل بيانات المراقبة</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-theme-primary-lighter" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b theme-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-8 h-8 bg-theme-gradient rounded-lg flex items-center justify-center">
                  <i className="fas fa-tachometer-alt text-white text-sm"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-theme-primary">مراقبة معدل الاستخدام</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    آخر تحديث: {new Date(rateLimitData.lastUpdated).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <ColorThemeSelector />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* Alerts */}
      {rateLimitData.alerts.length > 0 && (
        <div className="space-y-2">
          {rateLimitData.alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              {alert.type === 'critical' ? 
                <AlertTriangle className="h-4 w-4" /> : 
                <AlertCircle className="h-4 w-4" />
              }
              <AlertTitle>
                {alert.type === 'critical' ? 'تنبيه حرج' : 'تحذير'}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rateLimitData.summary.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {rateLimitData.summary.activeClients} نشط حالياً
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاستخدام الإجمالي</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rateLimitData.summary.totalUsage}/{rateLimitData.summary.totalLimit}
            </div>
            <Progress 
              value={rateLimitData.summary.totalUsagePercentage} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {rateLimitData.summary.totalUsagePercentage}% مستخدم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حد Meta الإجمالي</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rateLimitData.summary.totalUsage}/{rateLimitData.summary.metaGlobalLimit}
            </div>
            <Progress 
              value={rateLimitData.summary.metaUsagePercentage} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {rateLimitData.summary.metaUsagePercentage}% من حد Meta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حالة النظام</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rateLimitData.summary.metaUsagePercentage < 70 ? 'مستقر' : 
               rateLimitData.summary.metaUsagePercentage < 90 ? 'تحذير' : 'حرج'}
            </div>
            <p className="text-xs text-muted-foreground">
              {rateLimitData.alerts.length} تنبيه نشط
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل استخدام العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المنصة</TableHead>
                <TableHead>الاشتراك</TableHead>
                <TableHead>الاستخدام</TableHead>
                <TableHead>النسبة</TableHead>
                <TableHead>إعادة التعيين</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>Meta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateLimitData.clients.map((client) => (
                <TableRow key={client.platformId}>
                  <TableCell className="font-medium">
                    {client.platformName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {client.subscriptionPlan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.currentUsage}/{client.maxRequests}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={client.usagePercentage} 
                        className="w-16"
                      />
                      <span className="text-sm">
                        {client.usagePercentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 ml-1" />
                      {formatResetTime(client.resetTime)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusIcon(client.status)}
                      <Badge 
                        variant={getStatusColor(client.status) as any}
                        className="mr-2"
                      >
                        {client.status === 'critical' ? 'حرج' :
                         client.status === 'warning' ? 'تحذير' : 'طبيعي'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.hasMetaConnection ? 
                      <CheckCircle className="h-4 w-4 text-green-500" /> :
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
