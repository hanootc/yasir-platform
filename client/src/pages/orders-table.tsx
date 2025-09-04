import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CreateOrderModal from "@/components/modals/create-order-modal";
import ViewOrderModal from "@/components/modals/view-order-modal";
import { PlatformSelector } from "@/components/PlatformSelector";

export default function OrdersTable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [governorateFilter, setGovernorateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<any>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState<any>(null);
  const [showViewOrder, setShowViewOrder] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: selectedPlatform ? ["/api/orders", { platformId: selectedPlatform }] : ["/api/orders"],
    queryFn: async () => {
      const url = selectedPlatform 
        ? `/api/orders?platformId=${selectedPlatform}`
        : '/api/orders';
      
      console.log("🔍 Fetching orders from:", url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    }
  });

  // Fetch user info for date range functionality
  const { data: userInfo } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Fetch products for filtering
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    enabled: !!userInfo,
  });

  // Status colors and labels
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
    no_answer: "bg-pink-100 text-pink-800",
    postponed: "bg-indigo-100 text-indigo-800",
  };

  const statusLabels = {
    pending: "في الانتظار",
    confirmed: "مؤكد",
    processing: "قيد المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
    refunded: "مسترد",
    no_answer: "لا يرد",
    postponed: "مؤجل",
  };

  // Get unique governorates from orders
  const uniqueGovernorates = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    const governorates = orders.map((order: any) => order.customerGovernorate).filter(Boolean);
    return Array.from(new Set(governorates)).sort();
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return (orders as any[]).filter((order: any) => {
      const matchesSearch = !searchTerm || 
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      const matchesProduct = productFilter === "all" || 
        (order.productId && order.productId === productFilter) ||
        (order.productName && products && Array.isArray(products) && 
         products.find((p: any) => p.id === productFilter)?.name === order.productName);

      const matchesGovernorate = governorateFilter === "all" || 
        order.customerGovernorate === governorateFilter;

      const matchesDate = (!dateFrom || new Date(order.createdAt) >= new Date(dateFrom)) &&
                         (!dateTo || new Date(order.createdAt) <= new Date(dateTo + "T23:59:59"));

      return matchesSearch && matchesStatus && matchesProduct && matchesGovernorate && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, productFilter, governorateFilter, products, dateFrom, dateTo]);

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/orders/${id}/status`, 'PUT', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      // تحديث cache المخزون لأن تغيير حالة الطلب يؤثر على الكميات
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory/summary"] });
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة الطلب بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const formatCurrency = (amount: number) => {
    const formattedNumber = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return (
      <span className="whitespace-nowrap">
        {formattedNumber}
        <span className="text-xs text-gray-500"> د.ع</span>
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-IQ');
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "منذ أقل من ساعة";
    if (diffInHours < 24) return `منذ ${Math.floor(diffInHours)} ساعة`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "منذ يوم واحد";
    return `منذ ${diffInDays} أيام`;
  };

  const extractQuantityFromOffer = (offer: string): number => {
    if (offer.includes('واحدة') || offer.includes('قطعة واحدة')) return 1;
    if (offer.includes('قطعتان') || offer.includes('اثنتان')) return 2;
    if (offer.includes('ثلاث') || offer.includes('3')) return 3;
    if (offer.includes('أربع') || offer.includes('4')) return 4;
    if (offer.includes('خمس') || offer.includes('5')) return 5;
    return 1;
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handlePrintInvoice = (order: any) => {
    setSelectedOrderForPrint(order);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrderForView(order);
    setShowViewOrder(true);
  };

  // Function to create WhatsApp link
  const createWhatsAppLink = (phone: string, customerName: string, orderNumber: string) => {
    // Remove any non-numeric characters and format phone number
    const cleanPhone = phone.replace(/\D/g, '');
    // Add Iraq country code if not present
    const formattedPhone = cleanPhone.startsWith('964') ? cleanPhone : `964${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
    
    const message = encodeURIComponent(`مرحباً ${customerName}، بخصوص طلبكم رقم #${orderNumber}`);
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  // Checkbox functions
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map((order: any) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      for (const orderId of selectedOrders) {
        await apiRequest(`/api/orders/${orderId}/status`, 'PUT', { status: newStatus });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrders([]);
      toast({
        title: "تم تحديث الحالات",
        description: `تم تحديث حالة ${selectedOrders.length} طلب`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث بعض الطلبات",
        variant: "destructive",
      });
    }
  };

  const handleBulkPrint = () => {
    const ordersToPrint = filteredOrders.filter((order: any) => selectedOrders.includes(order.id));
    // Here you can implement bulk printing logic
    toast({
      title: "طباعة الطلبات",
      description: `سيتم طباعة ${ordersToPrint.length} طلب`,
    });
  };

  // دالة لتحديد لون حالة الطلب
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500'; // أصفر للانتظار
      case 'confirmed':
        return 'bg-blue-500'; // أزرق للتأكيد
      case 'processing':
        return 'bg-purple-500'; // بنفسجي للمعالجة
      case 'shipped':
        return 'bg-orange-500'; // برتقالي للشحن
      case 'delivered':
        return 'bg-green-500'; // أخضر للتسليم
      case 'cancelled':
        return 'bg-red-500'; // أحمر للإلغاء
      case 'refunded':
        return 'bg-gray-500'; // رمادي للاسترداد
      case 'no_answer':
        return 'bg-pink-500'; // وردي لعدم الرد
      case 'postponed':
        return 'bg-indigo-500'; // نيلي للتأجيل
      default:
        return 'bg-gray-500'; // رمادي للحالات الأخرى
    }
  };

  // دالة لتحديد نص الحالة باللغة العربية
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'processing':
        return 'قيد المعالجة';
      case 'shipped':
        return 'تم الشحن';
      case 'delivered':
        return 'تم التسليم';
      case 'cancelled':
        return 'ملغي';
      case 'refunded':
        return 'مسترد';
      case 'no_answer':
        return 'لا يرد';
      case 'postponed':
        return 'مؤجل';
      default:
        return 'غير محدد';
    }
  };

  // Update order numbers function
  const updateOrderNumbersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/landing-page-orders/update-numbers', 'POST');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "تم تحديث أرقام الطلبات",
        description: "تم تحويل جميع أرقام الطلبات إلى أرقام بسيطة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث أرقام الطلبات",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="جدول الطلبات"
          subtitle="عرض جميع الطلبات في جدول ثابت"
          onCreateProduct={() => {}}
          onCreateLandingPage={() => {}}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 
                className="text-3xl font-bold text-gray-900 cursor-pointer"
                onDoubleClick={() => updateOrderNumbersMutation.mutate()}
              >
                الطلبات
              </h1>
              <Button 
                className="bg-primary-600 hover:bg-primary-700"
                onClick={() => setShowCreateOrder(true)}
              >
                <i className="fas fa-plus mr-2"></i>
                إنشاء طلب جديد
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>تصفية البحث</span>
                  {orders && (
                    <Badge 
                      variant="secondary" 
                      className="bg-theme-primary/10 text-theme-primary border-theme-primary/30 px-3 py-1"
                    >
                      {(orders as any[])?.length} طلب
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform Selector */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PlatformSelector 
                      value={selectedPlatform || undefined}
                      onValueChange={setSelectedPlatform}
                    />
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {selectedPlatform === null ? "جميع المنصات" : 
                       selectedPlatform === 'all' ? "جميع المنصات" : "منصة محددة"}
                    </p>
                  </div>
                </div>
                
                {/* Date Range Filter */}
                <div className="flex flex-col md:flex-row gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">من تاريخ:</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">إلى تاريخ:</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setDateFrom(today);
                        setDateTo(today);
                      }}
                    >
                      اليوم
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setDateFrom(lastWeek.toISOString().split('T')[0]);
                        setDateTo(today.toISOString().split('T')[0]);
                      }}
                    >
                      آخر أسبوع
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setDateFrom(lastMonth.toISOString().split('T')[0]);
                        setDateTo(today.toISOString().split('T')[0]);
                      }}
                    >
                      آخر شهر
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                    >
                      إزالة التصفية
                    </Button>
                  </div>
                </div>
                
                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="البحث..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Select value={productFilter} onValueChange={setProductFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="تصفية بالمنتج" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المنتجات</SelectItem>
                        {products && Array.isArray(products) && products.map((product: any) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Select value={governorateFilter} onValueChange={setGovernorateFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="المحافظة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المحافظات</SelectItem>
                        {uniqueGovernorates.map((governorate: string) => (
                          <SelectItem key={governorate} value={governorate}>
                            {governorate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="pending">في الانتظار</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="processing">قيد المعالجة</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                        <SelectItem value="refunded">مسترد</SelectItem>
                        <SelectItem value="no_answer">لا يرد</SelectItem>
                        <SelectItem value="postponed">مؤجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedOrders.length > 0 && (
                  <div className="flex items-center gap-4 mt-4 p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">
                      تم تحديد {selectedOrders.length} طلب
                    </span>
                    <Select onValueChange={handleBulkStatusChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="نقل إلى حالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">في الانتظار</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="processing">قيد المعالجة</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                        <SelectItem value="refunded">مسترد</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBulkPrint} variant="outline">
                      طباعة المحدد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>إدارة الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                    <p className="mt-2 text-gray-600">جاري تحميل الطلبات...</p>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4">رقم الطلب</th>
                          <th className="text-right py-3 px-4">العميل</th>
                          <th className="text-right py-3 px-4">المنتج</th>
                          <th className="text-right py-3 px-4">الكمية</th>
                          <th className="text-right py-3 px-4">المبلغ الإجمالي</th>
                          <th className="text-right py-3 px-4">المحافظة</th>
                          <th className="text-right py-3 px-4">الحالة</th>
                          <th className="text-right py-3 px-4">التاريخ</th>
                          <th className="text-center py-3 px-4">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order: any) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            {/* رقم الطلب */}
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm font-medium text-blue-600">
                                #{order.orderNumber}
                              </span>
                            </td>
                            
                            {/* العميل */}
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{order.customerName}</p>
                                <p className="text-sm text-gray-500">{order.customerPhone}</p>
                              </div>
                            </td>
                            
                            {/* المنتج */}
                            <td className="py-3 px-4">
                              {(() => {
                                // Check if orderItems has product data
                                const firstItem = order.orderItems && order.orderItems[0];
                                
                                if (firstItem && firstItem.productId && products) {
                                  // Find product by ID from the products list
                                  const product = products.find((p: any) => p.id === firstItem.productId);
                                  
                                  if (product) {
                                    return (
                                      <div className="flex items-center gap-2">
                                        {product.imageUrls && product.imageUrls[0] && (
                                          <img 
                                            src={product.imageUrls[0]} 
                                            alt={product.name}
                                            className="w-8 h-8 object-cover rounded border"
                                          />
                                        )}
                                        <div>
                                          <div className="font-medium text-sm truncate">{product.name}</div>
                                          <div className="text-xs text-gray-500">
                                            {formatCurrency(Number(firstItem.price || product.price))}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                }
                                
                                // Fallback: show offer if available
                                if (firstItem && firstItem.offer) {
                                  return (
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">{firstItem.offer}</span>
                                      <div className="text-xs text-gray-500">
                                        {formatCurrency(Number(firstItem.price || 0))}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return <span className="text-gray-400 text-sm">غير محدد</span>;
                              })()}
                            </td>
                            
                            {/* الكمية */}
                            <td className="py-3 px-4">
                              <span className="font-medium">{order.quantity || extractQuantityFromOffer(order.offer || "")}</span>
                            </td>
                            
                            {/* المبلغ الإجمالي */}
                            <td className="py-3 px-4">
                              <div className="font-medium text-green-600">
                                {formatCurrency(order.total)}
                              </div>
                            </td>
                            
                            {/* المحافظة */}
                            <td className="py-3 px-4">{order.customerGovernorate}</td>
                            
                            {/* الحالة */}
                            <td className="py-3 px-4">
                              <Badge className={`text-white ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </Badge>
                            </td>
                            
                            {/* التاريخ */}
                            <td className="py-3 px-4">
                              <div className="text-sm">
                                <p>{formatDate(order.createdAt).split(' ')[0]}</p>
                                <p className="text-gray-500 text-xs">{formatDate(order.createdAt).split(' ')[1]}</p>
                              </div>
                            </td>
                            
                            {/* الإجراءات */}
                            <td className="py-3 px-4">
                              <div className="flex justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewOrder(order)}
                                >
                                  <i className="fas fa-eye"></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintInvoice(order)}
                                >
                                  <i className="fas fa-print"></i>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(createWhatsAppLink(order.customerPhone, order.customerName, order.orderNumber), '_blank')}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <i className="fab fa-whatsapp"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-shopping-cart text-2xl text-gray-400"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h3>
                    <p className="text-gray-500 mb-4">لم يتم العثور على طلبات تتطابق مع البحث الحالي</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateOrder}
        onClose={(open) => setShowCreateOrder(open)}
      />
      
      {/* View Order Modal */}
      <ViewOrderModal
        isOpen={showViewOrder}
        onClose={() => setShowViewOrder(false)}
        order={selectedOrderForView}
      />
    </div>
  );
}