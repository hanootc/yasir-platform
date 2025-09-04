import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import CompactOrderModal from "@/components/modals/compact-order-modal";
import OrderInvoicePrintModal from "@/components/OrderInvoicePrintModal";
import CustomExcelBuilderModal from "@/components/CustomExcelBuilderModal";
import CreateOrderModal from "@/components/modals/create-order-modal";
import { apiRequest } from "@/lib/queryClient";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";

const formatTimeAgo = (date: string | Date) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'منذ أقل من دقيقة';
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0
  }).format(amount);
};

const statusLabels: { [key: string]: string } = {
  pending: 'في الانتظار',
  confirmed: 'مؤكد',
  processing: 'قيد المعالجة',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  refunded: 'مسترد',
  no_answer: 'لا يرد',
  postponed: 'مؤجل',
  returned: 'مرتجع'
};

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200',
  no_answer: 'bg-pink-100 text-pink-800 border-pink-200',
  postponed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  returned: 'bg-amber-100 text-amber-800 border-amber-200'
};

const statusIconColors: { [key: string]: string } = {
  pending: 'text-yellow-500',
  confirmed: 'text-purple-500',
  processing: 'text-purple-500',
  shipped: 'text-orange-500',
  delivered: 'text-green-500',
  cancelled: 'text-red-500',
  refunded: 'text-gray-500',
  no_answer: 'text-pink-500',
  postponed: 'text-indigo-500',
  returned: 'text-red-600'
};

// Order source labels - أسماء مصادر الطلبات باللغة العربية
const orderSourceLabels: { [key: string]: string } = {
  manual: 'إدخال يدوي',
  landing_page: 'صفحة هبوط',
  tiktok_ad: 'إعلان TikTok',
  facebook_ad: 'إعلان Facebook',
  instagram_ad: 'إعلان Instagram',
  website_direct: 'موقع مباشر',
  whatsapp_message: 'رسالة واتساب',
  phone_call: 'مكالمة هاتفية',
  other: 'أخرى'
};

// Order source colors - ألوان مصادر الطلبات
const orderSourceColors: { [key: string]: string } = {
  manual: 'bg-gray-100 text-gray-800 border-gray-200',
  landing_page: 'bg-blue-100 text-blue-800 border-blue-200',
  tiktok_ad: 'bg-black text-white border-gray-800',
  facebook_ad: 'bg-blue-600 text-white border-blue-700',
  instagram_ad: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-600',
  website_direct: 'bg-green-100 text-green-800 border-green-200',
  whatsapp_message: 'bg-green-500 text-white border-green-600',
  phone_call: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
};

// Order source icons - أيقونات مصادر الطلبات
const orderSourceIcons: { [key: string]: string } = {
  manual: 'fas fa-hand-pointer',
  landing_page: 'fas fa-globe',
  tiktok_ad: 'fab fa-tiktok',
  facebook_ad: 'fab fa-facebook',
  instagram_ad: 'fab fa-instagram',
  website_direct: 'fas fa-laptop',
  whatsapp_message: 'fab fa-whatsapp',
  phone_call: 'fas fa-phone',
  other: 'fas fa-question'
};

const extractQuantityFromOffer = (offer: string) => {
  if (!offer) return 1;
  const match = offer.match(/(\d+)\s*(قطعة|قطع|piece|pieces)/i);
  if (match) return parseInt(match[1]);
  if (offer.includes('قطعتين') || offer.includes('2')) return 2;
  if (offer.includes('ثلاث قطع') || offer.includes('3')) return 3;
  return 1;
};

const getStatusColorForIcon = (status: string) => {
  return statusIconColors[status] || 'text-gray-500';
};

const getStatusColor = (status: string) => {
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusIconSymbol = (status: string) => {
  const positiveStates = ['confirmed', 'processing', 'shipped', 'delivered'];
  const negativeStates = ['cancelled', 'refunded', 'no_answer', 'returned'];
  const neutralStates = ['pending', 'postponed'];

  if (positiveStates.includes(status)) {
    return { icon: 'fa-solid fa-check' };
  } else if (negativeStates.includes(status)) {
    return { icon: 'fa-solid fa-times' };
  } else {
    return { icon: 'fa-solid fa-clock' };
  }
};

// Convert object URLs to public URLs for image display
const convertToPublicUrls = (imageUrls: string[] | null): string[] => {
  if (!imageUrls) return [];
  return imageUrls.map(url => {
    if (typeof url === 'string' && url.startsWith('/objects/')) {
      return url.replace('/objects/', '/public-objects/');
    }
    return url;
  });
};

export default function PlatformOrders() {
  const params = useParams();
  // Get platformId from session or URL params
  const [platformId, setPlatformId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  // Get session data from session storage for backup
  const sessionData = typeof window !== 'undefined' 
    ? JSON.parse(sessionStorage.getItem('platformSession') || '{}')
    : {};

  // Fetch platform session to get platformId
  const { data: platformSession } = useQuery({
    queryKey: ['/api/platform-session'],
  });

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (params.platformId) {
      setPlatformId(params.platformId);
    } else if (platformSession?.platformId) {
      setPlatformId(platformSession.platformId);
    }
  }, [params.platformId, platformSession]);


  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [productFilter, setProductFilter] = useState("all");
  const [governorateFilter, setGovernorateFilter] = useState("all");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showViewOrder, setShowViewOrder] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState<any>(null);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [ordersPerPage, setOrdersPerPage] = useState(() => {
    // استرجاع القيمة المحفوظة من localStorage أو استخدام القيمة الافتراضية
    return localStorage.getItem('ordersPerPage') || "25";
  });
  const [showCustomExcelBuilder, setShowCustomExcelBuilder] = useState(false);
  const [customExcelTemplate, setCustomExcelTemplate] = useState<any>(null);
  const [showAddManualOrder, setShowAddManualOrder] = useState(false);

  // تحميل النموذج المحفوظ عندما يكون platformId متاحًا
  useEffect(() => {
    if (platformId) {
      const saved = localStorage.getItem(`customExcelTemplate_${platformId}`);
      if (saved) {
        try {
          setCustomExcelTemplate(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading custom Excel template:', error);
        }
      }
    }
  }, [platformId]);

  // ترتيب الأعمدة القابل للتخصيص
  const defaultColumnOrder = [
    'actions', 'orderNumber', 'customer', 'product', 'color', 'shape', 'size', 'offer', 'quantity', 'amount', 'discount', 'total', 'orderSource', 'governorate', 'address', 'phone', 'notes', 'status', 'createdAt'
  ];

  const [columnOrder, setColumnOrder] = useState(defaultColumnOrder);

  // تحديث ترتيب الأعمدة عند تغيير platformId
  useEffect(() => {
    if (platformId) {
      const saved = localStorage.getItem(`tableColumnOrder_${platformId}`);
      if (saved) {
        try {
          const savedOrder = JSON.parse(saved);
          // التحقق من وجود أعمدة جديدة في defaultColumnOrder غير موجودة في الترتيب المحفوظ
          const newColumns = defaultColumnOrder.filter(col => !savedOrder.includes(col));
          if (newColumns.length > 0) {
            // إضافة الأعمدة الجديدة في مواضعها الصحيحة
            const updatedOrder = [...savedOrder];
            newColumns.forEach(newCol => {
              const defaultIndex = defaultColumnOrder.indexOf(newCol);
              // البحث عن أفضل موضع لإدراج العمود الجديد
              let insertIndex = updatedOrder.length;
              for (let i = defaultIndex + 1; i < defaultColumnOrder.length; i++) {
                const nextCol = defaultColumnOrder[i];
                const nextColIndex = updatedOrder.indexOf(nextCol);
                if (nextColIndex !== -1) {
                  insertIndex = nextColIndex;
                  break;
                }
              }
              updatedOrder.splice(insertIndex, 0, newCol);
            });
            // حفظ الترتيب المحدث
            localStorage.setItem(`tableColumnOrder_${platformId}`, JSON.stringify(updatedOrder));
            setColumnOrder(updatedOrder);
          } else {
            setColumnOrder(savedOrder);
          }
        } catch (error) {
          console.error('Error parsing saved column order:', error);
          setColumnOrder(defaultColumnOrder);
        }
      } else {
        setColumnOrder(defaultColumnOrder);
      }
    }
  }, [platformId]);

  // حفظ ترتيب الأعمدة
  useEffect(() => {
    if (platformId && columnOrder !== defaultColumnOrder) {
      localStorage.setItem(`tableColumnOrder_${platformId}`, JSON.stringify(columnOrder));
    }
  }, [columnOrder, platformId]);

  // السحب والإفلات
  const [draggedColumn, setDraggedColumn] = useState<any>(null);

  const handleDragStart = (e: any, columnKey: any) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: any, targetColumnKey: any) => {
    e.preventDefault();
    
    if (!draggedColumn || draggedColumn === targetColumnKey) {
      setDraggedColumn(null);
      return;
    }

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnKey);

    // إزالة العنصر المسحوب وإدراجه في الموضع الجديد
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);

    setColumnOrder(newOrder);
    setDraggedColumn(null);
  };

  // خريطة الأعمدة
  const columnsMap: { [key: string]: any } = {
    actions: {
      key: 'actions',
      label: 'إجراءات',
      icon: 'fas fa-cog',
      width: 'min-w-[100px]',
      fixed: true // عمود ثابت لا يمكن نقله
    },
    orderNumber: {
      key: 'orderNumber',
      label: '# الطلب',
      icon: 'fas fa-hashtag',
      width: 'min-w-[80px]'
    },
    customer: {
      key: 'customer',
      label: 'العميل',
      icon: 'fas fa-user',
      width: 'min-w-[90px]'
    },
    product: {
      key: 'product',
      label: 'المنتج',
      icon: 'fas fa-box',
      width: 'min-w-[110px]'
    },
    color: {
      key: 'color',
      label: 'اللون',
      icon: 'fas fa-palette',
      width: 'min-w-[70px]'
    },
    shape: {
      key: 'shape',
      label: 'الشكل',
      icon: 'fas fa-shapes',
      width: 'min-w-[70px]'
    },
    size: {
      key: 'size',
      label: 'القياس',
      icon: 'fas fa-ruler',
      width: 'min-w-[70px]'
    },
    offer: {
      key: 'offer',
      label: 'العرض',
      icon: 'fas fa-tags',
      width: 'min-w-[100px]'
    },
    quantity: {
      key: 'quantity',
      label: 'الكمية',
      icon: 'fas fa-sort-numeric-up',
      width: 'min-w-[60px]'
    },
    amount: {
      key: 'amount',
      label: 'المبلغ',
      icon: 'fas fa-coins',
      width: 'min-w-[90px]'
    },
    discount: {
      key: 'discount',
      label: 'الخصم',
      icon: 'fas fa-percent',
      width: 'min-w-[70px]'
    },
    orderSource: {
      key: 'orderSource',
      label: 'مصدر الطلب',
      icon: 'fas fa-route',
      width: 'min-w-[100px]'
    },
    total: {
      key: 'total',
      label: 'الإجمالي',
      icon: 'fas fa-calculator',
      width: 'min-w-[100px]'
    },
    governorate: {
      key: 'governorate',
      label: 'المحافظة',
      icon: 'fas fa-map-marker-alt',
      width: 'min-w-[90px]'
    },
    address: {
      key: 'address',
      label: 'العنوان',
      icon: 'fas fa-map-pin',
      width: 'min-w-[120px]'
    },
    phone: {
      key: 'phone',
      label: 'الهاتف',
      icon: 'fas fa-phone',
      width: 'min-w-[100px]'
    },
    notes: {
      key: 'notes',
      label: 'الملاحظات',
      icon: 'fas fa-sticky-note',
      width: 'min-w-[120px]'
    },
    status: {
      key: 'status',
      label: 'الحالة',
      icon: 'fas fa-info-circle',
      width: 'min-w-[80px]'
    },
    createdAt: {
      key: 'createdAt',
      label: 'التاريخ',
      icon: 'fas fa-calendar-alt',
      width: 'min-w-[90px]'
    }
  };

  // إعادة تعيين ترتيب الأعمدة للافتراضي
  const resetColumnOrder = () => {
    setColumnOrder(defaultColumnOrder);
    localStorage.removeItem(`tableColumnOrder_${platformId}`);
  };

  // دالة لعرض محتوى الخلية بناءً على نوع العمود
  const renderCellContent = (order: any, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintInvoice(order)}
              className="h-7 w-7 p-0"
            >
              <i className="fas fa-print text-xs"></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewOrder(order)}
              className="h-7 w-7 p-0"
            >
              <i className="fas fa-eye text-xs"></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (order.customerPhone) {
                  const whatsappUrl = createWhatsAppLink(order.customerPhone, order.customerName, order.orderNumber);
                  window.open(whatsappUrl, '_blank');
                }
              }}
              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <i className="fab fa-whatsapp text-xs"></i>
            </Button>
          </div>
        );
      
      case 'orderNumber':
        return (
          <div className="flex items-center justify-center gap-0.5">
            <div className="relative flex items-center justify-center w-4 h-4 rounded-full overflow-hidden" style={{ backgroundColor: getStatusIconSymbol(order.status).color }}>
              <i className={`${getStatusIconSymbol(order.status).icon} text-white text-[4px] relative z-10`}></i>
            </div>
            <span className="font-mono text-xs font-medium text-blue-600 dark:text-white">
              {order.orderNumber}
            </span>
          </div>
        );
      
      case 'customer':
        const nameParts = order.customerName ? order.customerName.trim().split(' ') : [];
        const firstName = nameParts[0] || '';
        const restOfName = nameParts.slice(1).join(' ');
        
        return (
          <div className="text-xs min-w-[100px]">
            <div className="text-white font-medium text-sm leading-tight break-words" title={order.customerName}>
              {firstName}
            </div>
            {restOfName && (
              <div className="text-gray-400 text-xs mt-1 leading-tight break-words">
                {restOfName}
              </div>
            )}
          </div>
        );
      
      case 'product':
        return (
          <div className="flex flex-col items-center gap-0.5">
            {order.imageUrls && order.imageUrls.length > 0 ? (
              <div className="relative group cursor-pointer">
                <img 
                  src={convertToPublicUrls(order.imageUrls)[0]} 
                  alt={order.productName || order.product_name || 'منتج'} 
                  className="w-8 h-8 object-cover rounded border flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextSibling) {
                      nextSibling.style.display = 'flex';
                    }
                  }}
                />
                {/* صورة مكبرة عند الـ hover */}
                <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none">
                  <img 
                    src={convertToPublicUrls(order.imageUrls)[0]} 
                    alt={order.productName || order.product_name || 'منتج'} 
                    className="max-w-xs max-h-xs object-contain rounded-lg shadow-2xl transform scale-110"
                  />
                </div>
                {/* أيقونة احتياطية في حالة فشل تحميل الصورة */}
                <div className="w-8 h-8 bg-gray-100 border rounded flex items-center justify-center flex-shrink-0" style={{ display: 'none' }}>
                  <i className="fas fa-box text-gray-400 text-xs"></i>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-100 border rounded flex items-center justify-center flex-shrink-0">
                <i className="fas fa-box text-gray-400 text-xs"></i>
              </div>
            )}
            <div className="text-center min-w-0">
              <div className="text-[10px] font-medium text-gray-900 truncate max-w-[80px]" title={order.productName || order.product_name}>
                {order.productName || order.product_name || 'غير محدد'}
              </div>
            </div>
          </div>
        );
      
      case 'color':
        return (order.selectedColor || order.color) ? (
          <div className="flex flex-col items-center gap-0.5">
            {order.selectedColorImageUrl ? (
              <div className="relative group cursor-pointer">
                <img 
                  src={order.selectedColorImageUrl}
                  alt={typeof order.selectedColor === 'object' ? order.selectedColor?.name : order.selectedColor}
                  className="w-6 h-6 object-cover rounded-full border border-gray-300 transition-transform duration-300 group-hover:scale-125"
                />
              </div>
            ) : order.selectedColorCode ? (
              <div 
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: order.selectedColorCode }}
              ></div>
            ) : null}
            <span className="text-[10px] text-gray-600 truncate max-w-[60px] font-medium">
              {typeof order.selectedColor === 'object' ? order.selectedColor?.name : (order.selectedColor || order.color)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );
      
      case 'shape':
        return (order.selectedShape || order.shape) ? (
          <div className="flex flex-col items-center gap-0.5">
            {(typeof order.selectedShape === 'object' ? order.selectedShape?.imageUrl : order.selectedShapeImageUrl) ? (
              <div className="relative group cursor-pointer">
                <img 
                  src={typeof order.selectedShape === 'object' ? order.selectedShape?.imageUrl : order.selectedShapeImageUrl}
                  alt={typeof order.selectedShape === 'object' ? order.selectedShape?.name : order.selectedShape}
                  className="w-6 h-6 object-cover rounded border border-gray-300"
                />
              </div>
            ) : null}
            <span className="text-[10px] text-gray-600 truncate max-w-[60px] font-medium">
              {typeof order.selectedShape === 'object' ? order.selectedShape?.name : (order.selectedShape || order.shape)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );
      
      case 'size':
        return (order.selectedSize || order.size) ? (
          <div className="text-[11px] text-gray-600 text-center">
            <div className="truncate max-w-[60px] font-medium">
              {typeof order.selectedSize === 'object' ? order.selectedSize?.sizeValue : (order.selectedSize || order.size)}
            </div>
            {order.selectedSizeValue && order.selectedSizeValue !== order.selectedSize && (
              <div className="text-[9px] text-gray-400 truncate max-w-[60px]">
                ({order.selectedSizeValue})
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );
      
      case 'offer':
        return order.offer ? (
          <span className="text-xs text-theme-primary truncate max-w-[90px]" title={order.offer}>
            {order.offer}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );
      
      case 'quantity':
        return (
          <span className="text-xs font-medium text-theme-primary">
            {formatEnglishNumbers(order.quantity)}
          </span>
        );
      
      case 'amount':
        return (
          <span className="text-xs font-medium text-green-600">
            {(() => {
              // أولوية عرض المبلغ: totalAmount، offer، ثم حساب من الكمية والسعر
              if (order.totalAmount && Number(order.totalAmount) > 0) {
                return formatCurrency(Number(order.totalAmount));
              }
              if (order.offer) {
                const priceText = extractPriceFromOffer(order.offer);
                if (priceText) {
                  const priceNumber = Number(priceText.replace(/[^\d]/g, ''));
                  const quantity = order.quantity || 1;
                  return formatCurrency(priceNumber * quantity);
                }
              }
              // محاولة حساب من سعر المنتج والكمية
              if (order.price && order.quantity) {
                return formatCurrency(Number(order.price) * Number(order.quantity));
              }
              return "غير محدد";
            })()}
          </span>
        );
      
      case 'discount':
        return ((order.discountAmount || order.discount_amount) && Number(order.discountAmount || order.discount_amount) > 0) ? (
          <span className="text-xs text-red-600">
            -{formatCurrency(Number(order.discountAmount || order.discount_amount))}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        );
      
      case 'total':
        return (
          <span className="text-xs font-bold text-green-700">
            {(() => {
              // حساب المبلغ الأصلي
              let originalTotal = 0;
              
              if (order.totalAmount && Number(order.totalAmount) > 0) {
                originalTotal = Number(order.totalAmount);
              } else if (order.offer) {
                const priceText = extractPriceFromOffer(order.offer);
                if (priceText) {
                  const priceNumber = Number(priceText.replace(/[^\d]/g, ''));
                  const quantity = order.quantity || 1;
                  originalTotal = priceNumber * quantity;
                }
              } else if (order.price && order.quantity) {
                originalTotal = Number(order.price) * Number(order.quantity);
              }
              
              // خصم الخصم إن وجد
              const discount = order.discountAmount ? Number(order.discountAmount) : 0;
              const finalTotal = Math.max(originalTotal - discount, 0);
              
              return finalTotal > 0 ? formatCurrency(finalTotal) : "غير محدد";
            })()}
          </span>
        );
      
      case 'governorate':
        return (
          <span className="text-xs text-theme-primary">{order.customerGovernorate || order.governorate || "غير محدد"}</span>
        );
      
      case 'address':
        return (
          <span className="text-xs text-gray-900 dark:text-white truncate max-w-[100px]" title={order.customerAddress || order.address}>
            {order.customerAddress || order.address || "غير محدد"}
          </span>
        );
      
      case 'phone':
        return (
          <span className="text-xs font-mono text-gray-900 dark:text-white" dir="ltr">
            {formatEnglishNumbers(order.customerPhone)}
          </span>
        );
      
      case 'notes':
        return (
          <span className="text-xs text-gray-900 dark:text-white truncate max-w-[100px]" title={order.notes || order.notes_field}>
            {order.notes || order.notes_field || "لا توجد ملاحظات"}
          </span>
        );
      
      case 'orderSource':
        // تحديد مصدر الطلب: landing_page للطلبات من صفحات الهبوط، manual للطلبات العادية
        const orderSource = order.orderSource || (order.orderType === 'landing_page' ? 'landing_page' : 'manual');
        return (
          <div className="flex items-center justify-center gap-1">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border ${orderSourceColors[orderSource] || orderSourceColors.other}`}>
              <i className={`${orderSourceIcons[orderSource] || orderSourceIcons.other} text-[8px]`}></i>
              <span>{orderSourceLabels[orderSource] || orderSourceLabels.other}</span>
            </div>
          </div>
        );
      
      case 'status':
        return (
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} text-white`}>
              {getStatusText(order.status)}
            </span>
          </div>
        );
      
      case 'createdAt':
        return (
          <span className="text-xs text-theme-primary">
            {formatEnglishNumbers(new Date(order.createdAt).toLocaleDateString('ar-IQ'))}
          </span>
        );
      
      default:
        return null;
    }
  };
  const { toast } = useToast();

  // دالة لتحويل الأرقام للإنجليزية
  const formatEnglishNumbers = (value: any) => {
    if (!value) return value;
    return value.toString().replace(/[\u0660-\u0669]/g, (d: string) => {
      return String.fromCharCode(d.charCodeAt(0) - 1584);
    });
  };
  const queryClient = useQueryClient();

  // Fetch platform data
  const { data: platformData } = useQuery({
    queryKey: [`/api/platforms/${platformId}`],
    enabled: !!platformId,
  });

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/platforms/${platformId}/orders`],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    enabled: !!platformId,
    retry: 1,
    retryDelay: 1000,
    refetchInterval: 5000, // تحديث كل 5 ثواني
    refetchIntervalInBackground: true,
  });






  const { data: products } = useQuery({
    queryKey: [`/api/platforms/${platformId}/products`],
    enabled: !!platformId,
  });

  // Force refetch every time component mounts
  useEffect(() => {
    if (platformId) {
      refetch();
    }
  }, [refetch, platformId]);

  // Calculate date statistics
  const dateStats = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
    
    const filtered = orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
      
      let dateMatch = true;
      if (fromDate && orderDate < fromDate) dateMatch = false;
      if (toDate && orderDate > toDate) dateMatch = false;
      
      return dateMatch;
    });
    
    const totalOrders = filtered.length;
    const totalRevenue = filtered.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return { totalOrders, totalRevenue, avgOrderValue };
  }, [orders, dateFrom, dateTo]);

  // Filter orders based on search and filter criteria
  const allFilteredOrders = orders && Array.isArray(orders) ? orders.filter((order: any) => {

    const matchesSearch = !searchTerm || 
      (order.orderNumber && order.orderNumber.toString().includes(searchTerm)) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customerEmail && order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customerPhone && order.customerPhone.includes(searchTerm)) ||
      (order.phone && order.phone.includes(searchTerm));

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    const matchesProduct = productFilter === "all" || 
      (order.productId && order.productId === productFilter);

    const matchesGovernorate = governorateFilter === "all" || 
      (order.customerGovernorate && order.customerGovernorate === governorateFilter);



    const orderDate = new Date(order.created_at || order.createdAt);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    
    let matchesDate = true;
    if (fromDate && orderDate < fromDate) matchesDate = false;
    if (toDate && orderDate > toDate) matchesDate = false;

    return matchesSearch && matchesStatus && matchesProduct && matchesGovernorate && matchesDate;
  }) : [];

  // Apply pagination limit to filtered orders
  const filteredOrders = useMemo(() => {
    if (ordersPerPage === "all") {
      return allFilteredOrders;
    }
    const limit = parseInt(ordersPerPage);
    return allFilteredOrders.slice(0, limit);
  }, [allFilteredOrders, ordersPerPage]);

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest(`/api/platforms/${platformId}/orders/${orderId}/status`, {
        method: "PUT",
        body: { status }
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // تحديث cache الطلبات
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/orders`] });
      // تحديث cache عداد الطلبات
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/orders/count`] });
      // تحديث cache المخزون لأن تغيير حالة الطلب يؤثر على الكميات
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory/summary"] });
      
      // ✨ تحديث النظام المحاسبي والإحصائيات تلقائياً
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/accounts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/orders/recent`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/sales-chart"] });
      
      const isConfirmed = variables.status === 'confirmed';
      toast({
        title: "تم التحديث",
        description: isConfirmed 
          ? "تم تأكيد الطلب بنجاح وإرسال رسالة للعميل عبر WhatsApp"
          : "تم تحديث حالة الطلب والنظام المحاسبي بنجاح",
      });
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  // Update complete order data
  const updateCompleteOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/orders/${data.id}`, 'PATCH', data);
    },
    onSuccess: () => {
      // تحديث cache الطلبات
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/orders`] });
      // تحديث cache عداد الطلبات
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/orders/count`] });
      // تحديث cache المخزون لأن تحديث الطلب قد يؤثر على الكميات
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-inventory/summary"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث الطلب بنجاح",
      });
    },
    onError: (error: any) => {
      console.error("Update order error:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الطلب",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus });
  };

  // دالة لإرسال رسائل تأكيد لجميع الطلبات المعلقة
  const sendBulkPendingMessages = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/platforms/${platformId}/orders/bulk-pending-messages`, {
        method: "POST"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Bulk message response:', data);
      toast({
        title: "تم الإرسال",
        description: `تم إرسال ${data?.sent || 0} رسائل للطلبات المعلقة`,
      });
    },
    onError: (error) => {
      console.error('Error sending bulk pending messages:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الرسائل",
        variant: "destructive",
      });
    }
  });

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOrdersForPrint, setSelectedOrdersForPrint] = useState<any[]>([]);

  const handlePrintInvoice = (order: any) => {
    // Get the full order data with product details
    const orderWithProduct = {
      ...order,
      product: {
        name: order.productName || 'منتج غير محدد',
        id: order.productId
      },
      quantity: order.quantity || 1,
      total: order.total || order.total_amount || 0
    };
    setSelectedOrdersForPrint([orderWithProduct]);
    setShowPrintModal(true);
  };

  const handleBulkPrintInvoices = () => {
    const ordersWithProducts = selectedOrders.map(orderId => {
      const order = Array.isArray(orders) ? orders.find((o: any) => o.id === orderId) : null;
      return order ? {
        ...order,
        product: {
          name: order.productName || 'منتج غير محدد',
          id: order.productId
        },
        quantity: order.quantity || 1,
        total: order.total || order.total_amount || 0
      } : null;
    }).filter((order): order is any => order !== null);
    setSelectedOrdersForPrint(ordersWithProducts);
    setShowPrintModal(true);
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

  const handleViewOrder = (order: any) => {
    setSelectedOrderForView(order);
    setShowViewOrder(true);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      if (!selectedOrders.length) {
        toast({
          title: "خطأ",
          description: "لم يتم اختيار أي طلبات للتحويل",
          variant: "destructive",
        });
        return;
      }

      if (!platformId) {
        toast({
          title: "خطأ",
          description: "معرف المنصة غير متوفر",
          variant: "destructive",
        });
        return;
      }

      for (const orderId of selectedOrders) {
        await updateOrderMutation.mutateAsync({ orderId, status: newStatus });
      }
      
      setSelectedOrders([]);
      toast({
        title: "تم تحديث الحالات",
        description: `تم تحديث حالة ${selectedOrders.length} طلب`,
      });
    } catch (error) {
      console.error('خطأ في التحويل الجماعي:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث بعض الطلبات",
        variant: "destructive",
      });
    }
  };

  // تحويل URLs الصور إلى مسارات عامة
  const convertToPublicUrls = (urls: string[]): string[] => {
    if (!urls || !Array.isArray(urls)) return [];
    
    return urls.map(url => {
      if (!url) return url;
      
      // إذا كان الرابط يبدأ بـ /objects/ فحوله إلى /public-objects/
      if (url.startsWith('/objects/')) {
        return url.replace('/objects/', '/public-objects/');
      }
      
      return url;
    });
  };

  // Status helper functions for table
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-gradient-to-r from-purple-500 to-blue-500',
      processing: 'bg-purple-500',
      shipped: 'bg-orange-500',
      delivered: 'bg-gradient-to-r from-green-500 to-emerald-500',
      cancelled: 'bg-red-500',
      refunded: 'bg-gray-500',
      no_answer: 'bg-pink-500',
      postponed: 'bg-indigo-500',
      returned: 'bg-red-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getStatusText = (status: string) => {
    const labels = {
      pending: 'في الانتظار',
      confirmed: 'مؤكد',
      processing: 'قيد المعالجة',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
      refunded: 'مسترد',
      no_answer: 'لا يرد',
      postponed: 'مؤجل',
      returned: 'مرتجع'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColorForIcon = (status: string) => {
    const colors = {
      pending: 'text-yellow-500',
      confirmed: 'text-purple-500',
      processing: 'text-purple-500',
      shipped: 'text-orange-500',
      delivered: 'text-green-500',
      cancelled: 'text-red-500',
      refunded: 'text-gray-500',
      no_answer: 'text-pink-500',
      postponed: 'text-indigo-500',
      returned: 'text-red-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-400';
  };

  const getStatusIconSymbol = (status: string) => {
    const symbols = {
      pending: { icon: 'fa-solid fa-clock', color: 'text-yellow-500' },
      confirmed: { icon: 'fa-solid fa-check', color: 'text-purple-500' },
      processing: { icon: 'fa-solid fa-cog', color: 'text-purple-500' },
      shipped: { icon: 'fa-solid fa-truck', color: 'text-orange-500' },
      delivered: { icon: 'fa-solid fa-check', color: 'text-green-500' },
      cancelled: { icon: 'fa-solid fa-times', color: 'text-red-500' },
      refunded: { icon: 'fa-solid fa-times', color: 'text-gray-500' },
      no_answer: { icon: 'fa-solid fa-times', color: 'text-pink-500' },
      postponed: { icon: 'fa-solid fa-clock', color: 'text-indigo-500' },
      returned: { icon: 'fa-solid fa-times', color: 'text-red-600' },
    };
    return symbols[status as keyof typeof symbols] || { icon: 'fa-solid fa-question', color: 'text-gray-400' };
  };

  // Formatting helper functions for table  
  const formatCurrency = (amount: number) => {
    const formattedNumber = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return `${formattedNumber} د.ع`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-IQ');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ar-IQ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const extractQuantityFromOffer = (offer: string, priceOffers?: any) => {
    if (!offer) return '1';
    
    // أولاً محاولة مطابقة العرض مع نظام العروض الجديد
    if (priceOffers && Array.isArray(priceOffers)) {
      const cleanOffer = offer.replace(/\s*-\s*\d+[,\d]*\s*د\.ع\s*$/, '');
      const matchingOffer = priceOffers.find((po: any) => 
        cleanOffer.includes(po.label) || po.label.includes(cleanOffer)
      );
      if (matchingOffer) {
        return matchingOffer.quantity.toString();
      }
    }
    
    // النظام القديم
    const match = offer.match(/(\d+)\s*(قطعة|قطع|piece|pieces)/i);
    return match ? match[1] : '1';
  };

  // دالة للحصول على تفاصيل العرض من نظام العروض الجديد
  const getOfferDetails = (offer: string, priceOffers?: any) => {
    if (!offer) return null;
    
    if (priceOffers && Array.isArray(priceOffers)) {
      const cleanOffer = offer.replace(/\s*-\s*\d+[,\d]*\s*د\.ع\s*$/, '');
      const matchingOffer = priceOffers.find((po: any) => 
        cleanOffer.includes(po.label) || po.label.includes(cleanOffer)
      );
      if (matchingOffer) {
        return {
          label: matchingOffer.label,
          quantity: matchingOffer.quantity,
          price: matchingOffer.price,
          isFromNewSystem: true
        };
      }
    }
    
    return {
      label: offer.replace(/\s*-\s*\d+[,\d]*\s*د\.ع\s*$/, ''),
      quantity: extractQuantityFromOffer(offer),
      price: null,
      isFromNewSystem: false
    };
  };

  const extractPriceFromOffer = (offer: string) => {
    if (!offer) return '0';
    const priceMatch = offer.match(/(\d{1,3}(?:,\d{3})*)\s*د\.ع/);
    return priceMatch ? priceMatch[1].replace(/,/g, '') : '0';
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

  // Function to create WhatsApp link
  const createWhatsAppLink = (phone: string, customerName: string, orderNumber: string) => {
    // Remove any non-numeric characters and format phone number
    const cleanPhone = phone.replace(/\D/g, '');
    // Add Iraq country code if not present
    const formattedPhone = cleanPhone.startsWith('964') ? cleanPhone : `964${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
    
    const message = encodeURIComponent(`مرحباً ${customerName}، بخصوص طلبكم رقم #${orderNumber}`);
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  // Function to handle Shipping Excel export
  const handleExportShipping = async () => {
    // Get platform ID from session or URL params
    const currentPlatformId = platformSession?.id || platformSession?.platformId || platformId || params.platformId;
    
    if (!currentPlatformId) {
      toast({
        title: "خطأ في التصدير",
        description: "لا يمكن العثور على معرف المنصة",
        variant: "destructive",
      });
      return;
    }
    
    // Check if there are selected orders
    if (selectedOrders.length === 0) {
      toast({
        title: "لم يتم اختيار طلبات",
        description: "يرجى اختيار الطلبات التي تريد تصديرها باستخدام الصناديق",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      // Add selected order IDs to export
      selectedOrders.forEach(orderId => {
        params.append('orderIds', orderId);
      });
      
      const url = `/api/platforms/${currentPlatformId}/orders/export-shipping?${params.toString()}`;
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = `شحنات-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "تم تصدير البيانات بنجاح",
        description: `تم تصدير ${selectedOrders.length} طلب بتنسيق الشحن`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting shipping data:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // Function to handle Excel export
  const handleExportToExcel = async () => {
    // Get platform ID from session or URL params
    const currentPlatformId = platformSession?.id || platformSession?.platformId || platformId || params.platformId;
    
    if (!currentPlatformId) {
      toast({
        title: "خطأ في التصدير",
        description: "لا يمكن العثور على معرف المنصة",
        variant: "destructive",
      });
      return;
    }
    
    // Check if there are selected orders
    if (selectedOrders.length === 0) {
      toast({
        title: "لم يتم اختيار طلبات",
        description: "يرجى اختيار الطلبات التي تريد تصديرها باستخدام الصناديق",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      // Add selected order IDs
      selectedOrders.forEach(orderId => {
        params.append('orderIds', orderId);
      });
      
      const exportUrl = `/api/platforms/${currentPlatformId}/orders/export?${params.toString()}`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `طلبات_محددة_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تنزيل ملف Excel بـ ${selectedOrders.length} طلبات محددة`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير الطلبات",
        variant: "destructive",
      });
    }
  };

  // Function to handle Store Custom Excel export
  const handleExportStoreCustom = async () => {
    // Get platform ID from session or URL params
    const currentPlatformId = platformSession?.id || platformSession?.platformId || platformId || params.platformId;
    
    if (!currentPlatformId) {
      toast({
        title: "خطأ في التصدير",
        description: "لا يمكن العثور على معرف المنصة",
        variant: "destructive",
      });
      return;
    }
    
    // Check if there are selected orders
    if (selectedOrders.length === 0) {
      toast({
        title: "لم يتم اختيار طلبات",
        description: "يرجى اختيار الطلبات التي تريد تصديرها باستخدام الصناديق",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      // Add selected order IDs
      selectedOrders.forEach(orderId => {
        params.append('orderIds', orderId);
      });
      
      const exportUrl = `/api/platforms/${currentPlatformId}/orders/export-store?${params.toString()}`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `اكسل_جيني_محدد_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تنزيل ملف اكسل جيني بـ ${selectedOrders.length} طلبات محددة`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting store custom to Excel:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التنسيق المخصص",
        variant: "destructive",
      });
    }
  };

  if (!platformSession) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PlatformSidebar 
        session={platformSession} 
        currentPath="/platform-orders" 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-4">
          <div className="text-right flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ColorThemeSelector />
              <ThemeToggle />
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="md:hidden bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <i className="fas fa-bars h-4 w-4"></i>
              </Button>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">إدارة الطلبات</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">تتبع ومعالجة طلبات العملاء</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">




            {/* Filters */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader className="border-b border-theme-primary bg-theme-primary-light">
                <div className="flex items-center justify-end">
                  {/* Status Cards in Header */}
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {/* Total Orders */}
                    <div 
                      className="bg-theme-gradient px-2 py-1 text-center theme-shadow cursor-pointer hover:opacity-90 transition-all duration-300 rounded-sm"
                      onClick={() => {
                        setSelectedStatus('all');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-list text-[10px]"></i>
                        إجمالي
                        <span className="bg-gradient-to-br from-purple-800 to-blue-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.length : 0}
                        </span>
                      </div>
                    </div>

                    {/* Pending Orders */}
                    <div 
                      className="bg-yellow-500 hover:bg-yellow-600 px-2 py-1 text-center theme-shadow cursor-pointer transition-all duration-300 rounded-sm"
                      onClick={() => {
                        setSelectedStatus('pending');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-clock text-[10px]"></i>
                        انتظار
                        <span className="bg-yellow-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.filter(order => order.status === 'pending').length : 0}
                        </span>
                      </div>
                    </div>

                    {/* Confirmed Orders */}
                    <div 
                      className="bg-theme-gradient px-2 py-1 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow rounded-sm"
                      onClick={() => {
                        setSelectedStatus('confirmed');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-check-circle text-[10px]"></i>
                        مؤكد
                        <span className="bg-gradient-to-br from-purple-800 to-blue-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.filter(order => order.status === 'confirmed').length : 0}
                        </span>
                      </div>
                    </div>

                    {/* Processing Orders */}
                    <div 
                      className="bg-purple-500 px-2 py-1 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow rounded-sm"
                      onClick={() => {
                        setSelectedStatus('processing');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-cog text-[10px]"></i>
                        معالجة
                        <span className="bg-purple-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.filter(order => order.status === 'processing').length : 0}
                        </span>
                      </div>
                    </div>

                    {/* Shipped Orders */}
                    <div 
                      className="bg-orange-500 px-2 py-1 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow rounded-sm"
                      onClick={() => {
                        setSelectedStatus('shipped');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-truck text-[10px]"></i>
                        مرسل
                        <span className="bg-orange-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.filter(order => order.status === 'shipped').length : 0}
                        </span>
                      </div>
                    </div>

                    {/* Delivered Orders */}
                    <div 
                      className="bg-theme-gradient px-2 py-1 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow rounded-sm"
                      onClick={() => {
                        setSelectedStatus('delivered');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-check-double text-[10px]"></i>
                        مسلّم
                        <span className="bg-gradient-to-br from-purple-800 to-blue-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.filter(order => order.status === 'delivered').length : 0}
                        </span>
                      </div>
                    </div>

                    {/* Cancelled Orders */}
                    <div 
                      className="bg-red-500 px-2 py-1 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow rounded-sm"
                      onClick={() => {
                        setSelectedStatus('cancelled');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-times-circle text-[10px]"></i>
                        ملغي
                        <span className="bg-red-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.filter(order => order.status === 'cancelled').length : 0}
                        </span>
                      </div>
                    </div>

                    {/* Refunded Orders */}
                    <div 
                      className="bg-gray-500 px-2 py-1 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow rounded-sm"
                      onClick={() => {
                        setSelectedStatus('refunded');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-undo text-[10px]"></i>
                        مسترد
                        <span className="bg-gray-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.filter(order => order.status === 'refunded').length : 0}
                        </span>
                      </div>
                    </div>

                    {/* No Answer Orders */}
                    <div 
                      className="bg-pink-500 px-2 py-1 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow rounded-sm"
                      onClick={() => {
                        setSelectedStatus('no_answer');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-phone-slash text-[10px]"></i>
                        لا يرد
                        <span className="bg-pink-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.filter(order => order.status === 'no_answer').length : 0}
                        </span>
                      </div>
                    </div>

                    {/* Postponed Orders */}
                    <div 
                      className="bg-indigo-500 px-2 py-1 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow rounded-sm"
                      onClick={() => {
                        setSelectedStatus('postponed');
                        setShowStatusPopup(true);
                      }}
                    >
                      <div className="text-xs text-white font-medium flex items-center justify-center gap-1">
                        <i className="fas fa-pause-circle text-[10px]"></i>
                        مؤجل
                        <span className="bg-indigo-800 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center mr-1">
                          {filteredOrders ? filteredOrders.filter(order => order.status === 'postponed').length : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Date Range Filter with Manual Order Button */}
                  <div className="flex flex-col md:flex-row gap-2 items-center">
                    <Button
                      onClick={() => setShowAddManualOrder(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      إضافة طلب يدوي
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">من تاريخ:</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-32 platform-input"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">إلى تاريخ:</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-32 platform-input"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setDateFrom(today);
                          setDateTo(today);
                        }}
                        className="platform-button"
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
                        className="platform-button"
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
                        className="platform-button"
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
                        className="platform-button"
                      >
                        إزالة التصفية
                      </Button>

                    </div>
                  </div>
                  
                  {/* Search and Filters */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-1">
                        <Select value={ordersPerPage} onValueChange={(value) => {
                          setOrdersPerPage(value);
                          localStorage.setItem('ordersPerPage', value);
                        }}>
                          <SelectTrigger className="w-full platform-select">
                            <SelectValue placeholder="عدد الطلبات" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25 طلب</SelectItem>
                            <SelectItem value="50">50 طلب</SelectItem>
                            <SelectItem value="100">100 طلب</SelectItem>
                            <SelectItem value="200">200 طلب</SelectItem>
                            <SelectItem value="all">جميع الطلبات</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        <Input
                          placeholder="البحث..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1 platform-input text-sm"
                        />
                        <Button
                          onClick={() => sendBulkPendingMessages.mutate()}
                          disabled={sendBulkPendingMessages.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-xs whitespace-nowrap"
                          title="إرسال رسائل تأكيد لجميع الطلبات المعلقة"
                        >
                          {sendBulkPendingMessages.isPending ? (
                            <i className="fas fa-spinner fa-spin text-xs"></i>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane text-xs mr-1"></i>
                              إرسال جماعي
                            </>
                          )}
                        </Button>
                      </div>

                      <Select value={governorateFilter} onValueChange={setGovernorateFilter}>
                        <SelectTrigger className="w-full platform-select">
                          <SelectValue placeholder="جميع المحافظات" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع المحافظات</SelectItem>
                          <SelectItem value="بغداد">بغداد</SelectItem>
                          <SelectItem value="البصرة">البصرة</SelectItem>
                          <SelectItem value="نينوى">نينوى</SelectItem>
                          <SelectItem value="الأنبار">الأنبار</SelectItem>
                          <SelectItem value="أربيل">أربيل</SelectItem>
                          <SelectItem value="كركوك">كركوك</SelectItem>
                          <SelectItem value="النجف">النجف</SelectItem>
                          <SelectItem value="كربلاء">كربلاء</SelectItem>
                          <SelectItem value="واسط">واسط</SelectItem>
                          <SelectItem value="صلاح الدين">صلاح الدين</SelectItem>
                          <SelectItem value="القادسية">القادسية</SelectItem>
                          <SelectItem value="ذي قار">ذي قار</SelectItem>
                          <SelectItem value="المثنى">المثنى</SelectItem>
                          <SelectItem value="بابل">بابل</SelectItem>
                          <SelectItem value="ديالى">ديالى</SelectItem>
                          <SelectItem value="ميسان">ميسان</SelectItem>
                          <SelectItem value="السليمانية">السليمانية</SelectItem>
                          <SelectItem value="دهوك">دهوك</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={productFilter} onValueChange={setProductFilter}>
                        <SelectTrigger className="w-full platform-select">
                          <SelectValue placeholder="جميع المنتجات" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع المنتجات</SelectItem>
                          {products && Array.isArray(products) && products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {String(product.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full platform-select">
                          <SelectValue placeholder="جميع الحالات" />
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
                          <SelectItem value="returned">مرتجع</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions Section */}
            {selectedOrders.length > 0 && (
              <Card className="theme-border bg-theme-primary-light">
                <CardContent className="p-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-theme-primary">
                        تم اختيار {selectedOrders.length} طلب
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrders([])}
                        className="platform-button h-7 px-2 text-xs"
                      >
                        إلغاء التحديد
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-theme-primary">تغيير الحالة:</span>
                        <Select onValueChange={handleBulkStatusChange}>
                          <SelectTrigger className="w-28 platform-select h-7 text-xs">
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64 overflow-y-auto">
                            <SelectItem value="pending">في الانتظار</SelectItem>
                            <SelectItem value="confirmed">مؤكد</SelectItem>
                            <SelectItem value="processing">قيد المعالجة</SelectItem>
                            <SelectItem value="shipped">تم الشحن</SelectItem>
                            <SelectItem value="delivered">تم التسليم</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                            <SelectItem value="refunded">مسترد</SelectItem>
                            <SelectItem value="no_answer">لا يرد</SelectItem>
                            <SelectItem value="postponed">مؤجل</SelectItem>
                            <SelectItem value="returned">مرتجع</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        onClick={handleBulkPrintInvoices}
                        className="theme-border text-theme-primary dark:text-white hover:bg-theme-primary-light bg-theme-primary-lighter h-7 px-2 text-xs"
                      >
                        <i className="fa-solid fa-print mr-1 text-xs"></i>
                        طباعة الطلبات
                        <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs mr-1 min-w-[18px] h-[18px] flex items-center justify-center">
                          {selectedOrders.length}
                        </span>
                      </Button>
                      
                      {/* Export Buttons */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportToExcel}
                        className="platform-button bg-green-50 hover:bg-green-100 text-green-700 dark:text-white dark:bg-green-900 dark:hover:bg-green-800 border-green-300 dark:border-green-600 flex items-center gap-1 h-7 px-2 text-xs"
                        data-testid="button-export-excel"
                      >
                        <i className="fas fa-file-excel text-xs"></i>
                        إكسل
                        <span className="bg-green-600 text-white rounded-full px-1.5 py-0.5 text-xs mr-1 min-w-[18px] h-[18px] flex items-center justify-center">
                          {selectedOrders.length}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportStoreCustom}
                        className="platform-button bg-blue-50 hover:bg-blue-100 text-blue-700 dark:text-white dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-300 dark:border-blue-600 flex items-center gap-1 h-7 px-2 text-xs"
                        data-testid="button-export-store-custom"
                      >
                        <i className="fas fa-store text-xs"></i>
                        اكسل جيني
                        <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-xs mr-1 min-w-[18px] h-[18px] flex items-center justify-center">
                          {selectedOrders.length}
                        </span>
                      </Button>
                      
                      {/* Shipping Export Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportShipping}
                        className="platform-button bg-sky-50 hover:bg-sky-100 text-sky-700 dark:text-white dark:bg-sky-900 dark:hover:bg-sky-800 border-sky-300 dark:border-sky-600 flex items-center gap-1 h-7 px-2 text-xs"
                        data-testid="button-export-shipping"
                      >
                        🐬
                        المحيط
                        <span className="bg-sky-600 text-white rounded-full px-1.5 py-0.5 text-xs mr-1 min-w-[18px] h-[18px] flex items-center justify-center">
                          {selectedOrders.length}
                        </span>
                      </Button>
                      
                      {/* Custom Excel Builder Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomExcelBuilder(true)}
                        className="platform-button bg-purple-50 hover:bg-purple-100 text-purple-700 dark:text-white dark:bg-purple-900 dark:hover:bg-purple-800 border-purple-300 dark:border-purple-600 flex items-center gap-1 h-7 px-2 text-xs"
                        data-testid="button-custom-excel-builder"
                      >
                        <i className="fas fa-cog text-xs"></i>
                        اكسل مخصص
                        <span className="bg-purple-600 text-white rounded-full px-1.5 py-0.5 text-xs mr-1 min-w-[18px] h-[18px] flex items-center justify-center">
                          {selectedOrders.length}
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetColumnOrder}
                        className="platform-button bg-blue-50 hover:bg-blue-100 text-blue-700 dark:text-white dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-300 dark:border-blue-600 flex items-center gap-1 h-7 px-2 text-xs"
                        title="إعادة ترتيب الأعمدة للوضع الافتراضي"
                        data-testid="button-reset-column-order"
                      >
                        <i className="fas fa-refresh text-xs"></i>
                        إعادة ترتيب الحقول
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date Statistics */}
            {(dateFrom || dateTo) && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
                  الفترة: {dateFrom ? `من ${new Date(dateFrom).toLocaleDateString('ar-EG')}` : 'من البداية'} 
                  {dateTo ? ` إلى ${new Date(dateTo).toLocaleDateString('ar-EG')}` : ' إلى اليوم'}
                </div>
                <div className="flex flex-wrap gap-4 justify-end">
                  <div className="bg-theme-primary-light dark:bg-gray-700 rounded-lg p-3 min-w-[120px] text-right theme-border">
                    <p className="text-xs text-theme-primary font-medium">عدد الطلبات</p>
                    <p className="text-lg font-bold text-theme-primary">{dateStats.totalOrders}</p>
                  </div>
                  <div className="bg-theme-primary-light dark:bg-gray-700 rounded-lg p-3 min-w-[140px] text-right theme-border">
                    <p className="text-xs text-theme-primary font-medium">إجمالي الإيرادات</p>
                    <p className="text-lg font-bold text-theme-primary">{formatCurrency(dateStats.totalRevenue)}</p>
                  </div>
                  <div className="bg-theme-primary-light dark:bg-gray-700 rounded-lg p-3 min-w-[140px] text-right theme-border">
                    <p className="text-xs text-theme-primary font-medium">متوسط قيمة الطلب</p>
                    <p className="text-lg font-bold text-theme-primary">{formatCurrency(dateStats.avgOrderValue)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Card className="border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <CardContent className="p-6">
                  <div className="text-center text-red-700 dark:text-red-300">
                    <h3 className="text-lg font-semibold mb-2">خطأ في تحميل الطلبات</h3>
                    <p className="text-sm mb-4">
                      {error.message.includes('401') 
                        ? 'يجب تسجيل الدخول أولاً' 
                        : 'حدث خطأ أثناء تحميل البيانات'
                      }
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/api/login'} 
                      variant="outline"
                      size="sm"
                    >
                      تسجيل الدخول
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Orders Table */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardContent className="p-0">
                {/* تنبيه التمرير للهاتف */}
                <div className="md:hidden bg-blue-50 border-b border-blue-200 p-2 text-center">
                  <p className="text-xs text-blue-600">
                    <i className="fas fa-arrows-alt-h mr-1"></i>
                    اسحب يميناً ويساراً لعرض كافة البيانات
                  </p>
                </div>
                {isLoading ? (
                  <div className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex justify-between items-center py-3 border-b">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center py-4 border-b">
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-28"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-28"></div>
                          <div className="h-3 bg-gray-200 rounded w-28"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : filteredOrders && filteredOrders.length > 0 ? (
                  <div className="overflow-x-auto overflow-y-hidden mobile-table-scroll" style={{ overscrollBehaviorX: 'contain' }}>
                    <table className="w-full" dir="rtl" style={{ direction: 'rtl', minWidth: '1400px' }}>
                      <thead className="border-b border-theme-primary">
                        <tr>
                          <th className="py-2 px-0 text-sm font-medium text-theme-primary" style={{ textAlign: 'center', direction: 'rtl', width: '14px', minWidth: '14px', maxWidth: '14px' }}></th>
                          <th className="py-2 px-2 text-sm font-medium text-theme-primary min-w-[50px]" style={{ textAlign: 'center', direction: 'rtl' }}>
                            <Checkbox 
                              checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </th>
                          {columnOrder.map((columnKey) => {
                            const column = columnsMap[columnKey];
                            if (!column) return null;
                            
                            return (
                              <th 
                                key={columnKey}
                                className={`py-2 px-1 text-sm font-medium text-theme-primary ${column.width} text-center ${
                                  draggedColumn === columnKey ? 'bg-blue-100' : ''
                                } ${!column.fixed ? 'cursor-move' : ''}`}
                                draggable={!column.fixed}
                                onDragStart={(e) => !column.fixed && handleDragStart(e, columnKey)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => !column.fixed && handleDrop(e, columnKey)}
                                title={!column.fixed ? 'اسحب لإعادة ترتيب العمود' : ''}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <i className={`${column.icon} text-xs text-theme-primary`}></i>
                                  <span>{column.label}</span>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-primary">
                        {filteredOrders.map((order: any) => (
                          <tr key={order.id} className={`hover:bg-theme-primary-light dark:hover:bg-gray-700 transition-colors duration-200 ${selectedOrders.includes(order.id) ? 'bg-theme-gradient/20 border-l-4 border-theme-primary' : ''}`}>
                            {/* الشريط الملون للحالة */}
                            <td className={`py-0 px-0 text-center status-column ${getStatusColor(order.status)}`} style={{ width: '14px', minWidth: '14px', maxWidth: '14px' }}>
                              <div className="flex items-center justify-center h-full py-1 px-0">
                                <span className="text-white text-[9px] font-medium transform -rotate-90 whitespace-nowrap">
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                            </td>
                            
                            {/* Checkbox */}
                            <td className="py-3 px-2 text-center">
                              <Checkbox 
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                              />
                            </td>

                            {/* الأعمدة الديناميكية */}
                            {columnOrder.map((columnKey) => {
                              const column = columnsMap[columnKey];
                              if (!column) return null;
                              
                              return (
                                <td key={columnKey} className={`py-2 px-1 text-center ${column.width}`}>
                                  {renderCellContent(order, columnKey)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* عرض معلومات العد */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border-t">
                      <div className="flex justify-between items-center text-sm text-gray-600" dir="rtl">
                        <div>
                          عرض {filteredOrders.length} من إجمالي {allFilteredOrders.length} طلب
                        </div>
                        {ordersPerPage !== "all" && allFilteredOrders.length > parseInt(ordersPerPage) && (
                          <div className="text-yellow-600">
                            <i className="fas fa-info-circle ml-1"></i>
                            يوجد {allFilteredOrders.length - filteredOrders.length} طلب إضافي
                          </div>
                        )}
                      </div>
                    </div>
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
        </div>
      </div>

      {/* View Order Modal */}
      <CompactOrderModal
        isOpen={showViewOrder}
        onClose={() => setShowViewOrder(false)}
        order={selectedOrderForView}
      />

      {/* Status Details Popup */}
      {showStatusPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {selectedStatus === 'all' ? 'جميع الطلبات' : 
                 selectedStatus === 'pending' ? 'طلبات في الانتظار' :
                 selectedStatus === 'confirmed' ? 'طلبات مؤكدة' :
                 selectedStatus === 'processing' ? 'طلبات قيد المعالجة' :
                 selectedStatus === 'shipped' ? 'طلبات مرسلة' :
                 selectedStatus === 'cancelled' ? 'طلبات ملغية' :
                 selectedStatus === 'no_answer' ? 'طلبات لا يرد' :
                 selectedStatus === 'postponed' ? 'طلبات مؤجلة' : 'تفاصيل الطلبات'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatusPopup(false)}
              >
                ✕
              </Button>
            </div>

            {(() => {
              const statusOrders = selectedStatus === 'all' 
                ? filteredOrders 
                : filteredOrders?.filter(order => order.status === selectedStatus) || [];

              if (statusOrders.length === 0) {
                return <div className="text-gray-500 text-center py-8">لا توجد طلبات</div>;
              }

              // تجميع الطلبات حسب المنتج والعرض
              const groupedOrders = statusOrders.reduce((groups: any, order: any) => {
                const key = `${order.productName || 'منتج غير محدد'}-${order.offer || 'عرض غير محدد'}`;
                if (!groups[key]) {
                  groups[key] = {
                    productName: order.productName || 'منتج غير محدد',
                    offer: order.offer || 'عرض غير محدد',
                    productId: order.productId,
                    orders: []
                  };
                }
                groups[key].orders.push(order);
                return groups;
              }, {});

              return (
                <div className="space-y-4">
                  {Object.values(groupedOrders).map((group: any, index: number) => {
                    const quantity = group.orders.length > 0 ? (group.orders[0].quantity || 1) : 1;
                    // البحث عن صورة المنتج من قائمة المنتجات
                    const product = Array.isArray(products) ? products.find((p: any) => p.id === group.productId) : null;
                    const productImages = product?.imageUrls ? convertToPublicUrls(product.imageUrls) : [];
                    const productImage = productImages[0] || null;
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-4 mb-3">
                          {/* صورة المنتج */}
                          <div className="flex-shrink-0">
                            {productImage ? (
                              <img 
                                src={productImage.startsWith('http') ? productImage : productImage}
                                alt={group.productName}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  console.log('Failed to load image:', productImage);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            
                            {/* صورة احتياطية في حالة فشل تحميل الصورة */}
                            <div className={`w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center ${productImage ? 'hidden' : ''}`}>
                              <i className="fas fa-box text-gray-400 text-xl"></i>
                            </div>
                          </div>
                          
                          {/* معلومات المنتج */}
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-gray-900">{group.productName}</h4>
                                <p className="text-sm text-gray-600">{group.offer}</p>
                              </div>
                              <div className="text-left">
                                <div className="text-lg font-bold text-green-600">{group.orders.length}</div>
                                <div className="text-xs text-gray-500">طلب</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {quantity === '1' ? 'قطعة واحدة' :
                               quantity === '2' ? 'قطعتان' :
                               quantity === '3' ? 'ثلاث قطع' :
                               `${quantity} قطع`}
                            </div>
                            <div className="text-xs text-gray-500">نوع العرض</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {parseInt(quantity) * group.orders.length}
                            </div>
                            <div className="text-xs text-gray-500">إجمالي القطع</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-gray-900">{statusOrders.length}</div>
                        <div className="text-xs text-gray-600">إجمالي الطلبات</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {statusOrders.reduce((sum, order) => {
                            return sum + (order.quantity || 1);
                          }, 0)}
                        </div>
                        <div className="text-xs text-gray-600">إجمالي القطع</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {Object.keys(groupedOrders).length}
                        </div>
                        <div className="text-xs text-gray-600">منتجات مختلفة</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* معاينة الطلب المودال */}
      <CompactOrderModal
        isOpen={showViewOrder}
        onClose={() => setShowViewOrder(false)}
        order={selectedOrderForView}
        onStatusChange={handleStatusChange}
        isMobile={isMobile}
      />

      {/* مودال طباعة الفواتير */}
      <OrderInvoicePrintModal
        orders={selectedOrdersForPrint}
        platformName={platformData?.name || sessionData?.platformName || platformSession?.platformName || 'منصة التجارة'}
        platformLogo={platformData?.logoUrl || sessionData?.logoUrl || platformSession?.logoUrl || null}
        platformId={platformId}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />

      {/* Custom Excel Builder Modal */}
      <CustomExcelBuilderModal
        isOpen={showCustomExcelBuilder}
        onClose={() => setShowCustomExcelBuilder(false)}
        platformId={platformId}
        selectedOrders={selectedOrders}
        orders={Array.isArray(orders) ? orders : []}
        onTemplateCreated={(template) => {
          setCustomExcelTemplate(template);
          localStorage.setItem(`customExcelTemplate_${platformId}`, JSON.stringify(template));
        }}
        existingTemplate={customExcelTemplate}
      />

      {/* إضافة طلب يدوي مودال */}
      <CreateOrderModal
        isOpen={showAddManualOrder}
        onClose={(open) => setShowAddManualOrder(open)}
        platformId={platformId || undefined}
      />
    </div>
  );
}