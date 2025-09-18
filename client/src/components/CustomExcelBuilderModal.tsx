import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface CustomExcelBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformId: string | null;
  selectedOrders: string[];
  orders?: any[];
  onTemplateCreated: (template: ExcelTemplate) => void;
  existingTemplate?: ExcelTemplate | null;
}

interface ExcelColumn {
  key: string;
  label: string;
  enabled: boolean;
  width?: number;
  order: number;
}

interface ExcelTemplate {
  name: string;
  columns: ExcelColumn[];
  createdAt: string;
  updatedAt: string;
}

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

const getStatusLabel = (status: string) => statusLabels[status] || status;

// دالة لتنسيق الأسعار
const formatPrice = (amount: number, showZeros: boolean) => {
  if (showZeros) {
    // إظهار الأسعار كاملة مع الفواصل - أرقام إنجليزية
    return amount.toLocaleString('en-US');
  } else {
    // إزالة الأصفار من النهاية وإظهار الرقم مع الفواصل
    let formatted = amount.toLocaleString('en-US');
    // إزالة 000 من النهاية
    formatted = formatted.replace(/,?000$/, '');
    return formatted;
  }
};

const availableColumns = [
  { key: 'id', label: 'رقم الطلب', defaultWidth: 15 },
  { key: 'customerName', label: 'اسم العميل', defaultWidth: 20 },
  { key: 'customerPhone', label: 'رقم الهاتف', defaultWidth: 15 },
  { key: 'customerCity', label: 'المحافظة', defaultWidth: 15 },
  { key: 'customerAddress', label: 'العنوان', defaultWidth: 30 },
  { key: 'productName', label: 'اسم المنتج', defaultWidth: 25 },
  { key: 'quantity', label: 'الكمية', defaultWidth: 10 },
  { key: 'price', label: 'السعر', defaultWidth: 15 },
  { key: 'totalPrice', label: 'المجموع', defaultWidth: 15 },
  { key: 'offer', label: 'العرض', defaultWidth: 20 },
  { key: 'status', label: 'الحالة', defaultWidth: 15 },
  { key: 'createdAt', label: 'تاريخ الطلب', defaultWidth: 20 },
  { key: 'notes', label: 'ملاحظات', defaultWidth: 30 },
  { key: 'selectedColor', label: 'اللون المختار', defaultWidth: 15 },
  { key: 'selectedShape', label: 'الشكل المختار', defaultWidth: 15 },
  { key: 'selectedSize', label: 'الحجم المختار', defaultWidth: 15 },
];

export default function CustomExcelBuilderModal({
  isOpen,
  onClose,
  platformId,
  selectedOrders,
  orders,
  onTemplateCreated,
  existingTemplate
}: CustomExcelBuilderModalProps) {
  const { toast } = useToast();
  const [templateName, setTemplateName] = useState('');
  const [columns, setColumns] = useState<ExcelColumn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPricesWithZeros, setShowPricesWithZeros] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  // تهيئة الأعمدة عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      if (existingTemplate) {
        setTemplateName(existingTemplate.name);
        setColumns(existingTemplate.columns);
      } else {
        // إعداد افتراضي للأعمدة
        const defaultColumns = availableColumns.map((col, index) => ({
          key: col.key,
          label: col.label,
          enabled: ['customerName', 'customerPhone', 'customerCity', 'productName', 'quantity', 'price', 'totalPrice'].includes(col.key),
          width: col.defaultWidth,
          order: index
        }));
        setColumns(defaultColumns);
        setTemplateName('قالب Excel مخصص');
      }
    }
  }, [isOpen, existingTemplate]);

  const handleColumnToggle = (columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, enabled: !col.enabled } : col
    ));
  };

  const handleColumnWidthChange = (columnKey: string, width: number) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, width } : col
    ));
  };

  // فلترة الطلبات المحددة  
  const filteredOrders = selectedOrders.length > 0 
    ? orders?.filter(order => selectedOrders.includes(order.id)) || []
    : orders || [];

  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedItem(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetColumnKey) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    setColumns(prev => {
      const newColumns = [...prev];
      const draggedIndex = newColumns.findIndex(col => col.key === draggedItem);
      const targetIndex = newColumns.findIndex(col => col.key === targetColumnKey);
      
      // Remove dragged item and insert at target position
      const [draggedColumn] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, draggedColumn);
      
      // Update order numbers
      newColumns.forEach((col, idx) => {
        col.order = idx;
      });
      
      return newColumns;
    });
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const moveColumn = (columnKey: string, direction: 'up' | 'down') => {
    setColumns(prev => {
      const currentIndex = prev.findIndex(col => col.key === columnKey);
      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' && currentIndex === prev.length - 1)
      ) {
        return prev;
      }

      const newColumns = [...prev];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // تبديل العناصر
      [newColumns[currentIndex], newColumns[targetIndex]] = 
      [newColumns[targetIndex], newColumns[currentIndex]];
      
      // تحديث ترقيم الترتيب
      return newColumns.map((col, index) => ({ ...col, order: index }));
    });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للقالب",
        variant: "destructive",
      });
      return;
    }

    if (!columns.some(col => col.enabled)) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار عمود واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    const template: ExcelTemplate = {
      name: templateName,
      columns: columns,
      createdAt: existingTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onTemplateCreated(template);
    
    toast({
      title: "تم الحفظ",
      description: "تم حفظ قالب Excel المخصص بنجاح",
      variant: "default",
    });

    onClose();
  };

  const handleExportWithTemplate = async () => {
    if (!columns.some(col => col.enabled)) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار عمود واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (selectedOrders.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طلبات للتصدير",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const ordersToExport = orders?.filter(order => selectedOrders.includes(order.id)) || [];
      
      const enabledColumns = columns
        .filter(col => col.enabled)
        .sort((a, b) => a.order - b.order);

      const worksheetData = [
        // العناوين
        enabledColumns.map(col => col.label),
        // البيانات
        ...ordersToExport.map(order => 
          enabledColumns.map(col => {
            switch (col.key) {
              case 'id': return order.orderNumber || order.id?.slice(0, 8) || '';
              case 'customerName': return order.customerName || '';
              case 'customerPhone': return order.customerPhone || '';
              case 'customerCity': return order.customerGovernorate || order.customerCity || '';
              case 'customerAddress': return order.customerAddress || '';
              case 'productName': return order.productName || '';
              case 'quantity': return order.quantity || 1;
              case 'price': return formatPrice(order.totalAmount || 0, showPricesWithZeros);
              case 'totalPrice': return formatPrice(order.totalAmount || 0, showPricesWithZeros);
              case 'offer': return order.offer || '';
              case 'status': return getStatusLabel(order.status) || order.status || '';
              case 'createdAt': return order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US') : '';
              case 'notes': return order.notes || '';
              case 'selectedColor': return order.selectedColor?.name || '';
              case 'selectedShape': return order.selectedShape?.name || '';
              case 'selectedSize': return order.selectedSize?.name || '';
              default: return '';
            }
          })
        )
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // تعيين عرض الأعمدة
      const colWidths = enabledColumns.map(col => ({ wch: col.width || 15 }));
      ws['!cols'] = colWidths;

      // RTL direction
      ws['!dir'] = 'rtl';

      XLSX.utils.book_append_sheet(wb, ws, 'الطلبات المخصصة');
      XLSX.writeFile(wb, `طلبات_مخصصة_${new Date().toLocaleDateString('ar-IQ').replace(/\//g, '-')}.xlsx`);

      toast({
        title: "تم التصدير",
        description: `تم تصدير ${ordersToExport.length} طلب بقالب مخصص`,
        variant: "default",
      });

      // إغلاق المودال بعد التصدير الناجح
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = () => {
    if (platformId) {
      localStorage.removeItem(`customExcelTemplate_${platformId}`);
      onTemplateCreated(null as any);
      setTemplateName('قالب Excel مخصص');
      // إعادة تعيين الأعمدة للافتراضي
      const defaultColumns = availableColumns.map((col, index) => ({
        key: col.key,
        label: col.label,
        enabled: ['customerName', 'customerPhone', 'customerCity', 'productName', 'quantity', 'price', 'totalPrice'].includes(col.key),
        width: col.defaultWidth,
        order: index
      }));
      setColumns(defaultColumns);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف القالب المخصص",
        variant: "default",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-black">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-right text-white">
            بناء قالب Excel مخصص
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          {/* إعدادات القالب */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateName" className="text-sm font-medium text-white">
                اسم القالب
              </Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="أدخل اسم القالب"
                className="mt-1 bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-white">
                الأعمدة المتاحة ({columns.filter(col => col.enabled).length} مختار)
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setColumns(prev => prev.map(col => ({ ...col, enabled: true })))}
                  className="text-xs border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                >
                  اختيار الكل
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setColumns(prev => prev.map(col => ({ ...col, enabled: false })))}
                  className="text-xs border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                >
                  إلغاء الكل
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] border border-gray-600 rounded-lg p-3 bg-gray-900">
              <div className="space-y-3">
                {columns.map((column, index) => (
                  <div 
                    key={column.key} 
                    draggable={column.enabled}
                    onDragStart={(e) => handleDragStart(e, column.key)}
                    onDragOver={(e) => handleDragOver(e, column.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.key)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                      column.enabled 
                        ? 'bg-gray-800 border-gray-700 cursor-move hover:bg-gray-750' 
                        : 'bg-gray-900 border-gray-800'
                    } ${
                      draggedItem === column.key 
                        ? 'opacity-50 scale-95' 
                        : ''
                    } ${
                      dragOverItem === column.key && draggedItem !== column.key
                        ? 'border-blue-500 bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {column.enabled && (
                        <div className="text-gray-400 cursor-move">
                          <i className="fas fa-grip-vertical"></i>
                        </div>
                      )}
                      <Checkbox
                        checked={column.enabled}
                        onCheckedChange={(checked) => handleColumnToggle(column.key)}
                        className="border-gray-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{column.label}</span>
                        <span className="text-gray-400 text-sm">{column.key}</span>
                      </div>
                    </div>

                    {column.enabled && (
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-gray-300">العرض</Label>
                        <Input
                          type="number"
                          min="5"
                          max="50"
                          value={column.width}
                          onChange={(e) => handleColumnWidthChange(column.key, parseInt(e.target.value) || 15)}
                          className="w-16 h-8 text-xs bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* معاينة */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-white">
                معاينة القالب
              </Label>
              <Badge variant="secondary" className="bg-gray-700 text-white">
                {selectedOrders.length} طلب محدد
              </Badge>
            </div>

            {/* خيار عرض الأسعار */}
            <div className="flex items-center gap-3 p-3 border border-gray-600 rounded-lg bg-gray-800">
              <Checkbox
                checked={showPricesWithZeros}
                onCheckedChange={(checked) => setShowPricesWithZeros(!!checked)}
                className="border-gray-600"
              />
              <Label className="text-sm text-white cursor-pointer">
                عرض الأسعار مع الأصفار (مثال: 10,000 بدلاً من 10)
              </Label>
            </div>

            <ScrollArea className="h-[400px] border border-gray-600 rounded-lg bg-gray-900">
              <div className="p-3">
                {columns.filter(col => col.enabled).length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-gray-300 mb-2">
                      الأعمدة التي سيتم تصديرها (بالترتيب):
                    </div>
                    <div className="space-y-1">
                      {columns
                        .filter(col => col.enabled)
                        .sort((a, b) => a.order - b.order)
                        .map((column, index) => (
                          <div key={column.key} className="flex items-center justify-between p-2 bg-gray-800 rounded text-sm">
                            <div className="text-gray-400 text-xs">
                              عرض: {column.width}
                            </div>
                            <div className="text-white">
                              {index + 1}. {column.label}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                    
                    {/* معاينة البيانات الفعلية */}
                    {filteredOrders.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-bold text-gray-300 mb-2">
                          معاينة أول طلب:
                        </div>
                        <div className="space-y-1 text-xs">
                          {columns
                            .filter(col => col.enabled)
                            .sort((a, b) => a.order - b.order)
                            .map((column) => {
                              const order = filteredOrders[0];
                              let value = '';
                              switch (column.key) {
                                case 'id': value = order.orderNumber || order.id?.slice(0, 8) || ''; break;
                                case 'customerName': value = order.customerName || ''; break;
                                case 'customerPhone': value = order.customerPhone || ''; break;
                                case 'customerCity': value = order.customerGovernorate || order.customerCity || ''; break;
                                case 'customerAddress': value = order.customerAddress || ''; break;
                                case 'productName': value = order.productName || ''; break;
                                case 'quantity': value = (order.quantity || 1).toString(); break;
                                case 'price': value = formatPrice(order.totalAmount || 0, showPricesWithZeros); break;
                                case 'totalPrice': value = formatPrice(order.totalAmount || 0, showPricesWithZeros); break;
                                case 'offer': value = order.offer || ''; break;
                                case 'status': value = getStatusLabel(order.status) || order.status || ''; break;
                                case 'createdAt': value = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US') : ''; break;
                                case 'notes': value = order.notes || ''; break;
                                case 'selectedColor': value = order.selectedColor?.name || ''; break;
                                case 'selectedShape': value = order.selectedShape?.name || ''; break;
                                case 'selectedSize': value = order.selectedSize?.name || ''; break;
                                default: value = ''; break;
                              }
                              return (
                                <div key={column.key} className="flex items-center justify-between p-1 bg-gray-700 rounded">
                                  <span className="text-white">{value || ''}</span>
                                  <span className="text-gray-300">{column.label}:</span>
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    لم يتم اختيار أي أعمدة للتصدير
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-600">
          <div className="flex gap-2">
            <Button
              onClick={handleExportWithTemplate}
              disabled={isLoading || selectedOrders.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري التصدير...
                </div>
              ) : (
                <>
                  <i className="fas fa-download mr-2"></i>
                  تصدير الآن ({selectedOrders.length})
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSaveTemplate}
              variant="outline"
              className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
            >
              <i className="fas fa-save mr-2"></i>
              حفظ القالب
            </Button>
          </div>

          <div className="flex gap-2">
            {existingTemplate && (
              <Button
                onClick={handleDeleteTemplate}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <i className="fas fa-trash mr-2"></i>
                حذف القالب
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
            >
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}