import { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, FileText, X, Eye, Settings } from "lucide-react";
import OrderInvoice from './OrderInvoice';
import ClassicInvoice from './InvoiceTemplates/ClassicInvoice';
import ModernInvoice from './InvoiceTemplates/ModernInvoice';
import MinimalInvoice from './InvoiceTemplates/MinimalInvoice';

import { SimpleLargeInvoice } from './InvoiceTemplates/SimpleLarge';
import InvoiceTemplateSelector from './InvoiceTemplateSelector';

interface OrderInvoicePrintModalProps {
  orders: any[];
  platformName: string;
  platformLogo?: string | null;
  platformId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderInvoicePrintModal({ 
  orders, 
  platformName, 
  platformLogo, 
  platformId: propPlatformId,
  isOpen, 
  onClose 
}: OrderInvoicePrintModalProps) {
  // Load saved print settings or use defaults
  const loadPrintSettings = () => {
    const saved = localStorage.getItem('printSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  };

  const savedSettings = loadPrintSettings();
  
  const [selectedTemplate, setSelectedTemplate] = useState(savedSettings.selectedTemplate || 'simple-large');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState(savedSettings.selectedPaperSize || 'A5');
  const [paperOrientation, setPaperOrientation] = useState(savedSettings.paperOrientation || 'portrait');
  const [fontScale, setFontScale] = useState<'small' | 'normal' | 'large'>(savedSettings.fontScale || 'normal');
  const [showCustomSizeInput, setShowCustomSizeInput] = useState(false);
  const [customSizeName, setCustomSizeName] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [customPaperSizes, setCustomPaperSizes] = useState<{[key: string]: any}>({});
  const [selectedDeliveryCompany, setSelectedDeliveryCompany] = useState<string>(savedSettings.selectedDeliveryCompany || 'none');
  
  // Load custom paper sizes from localStorage on component mount
  useEffect(() => {
    const savedCustomSizes = localStorage.getItem('customPaperSizes');
    if (savedCustomSizes) {
      setCustomPaperSizes(JSON.parse(savedCustomSizes));
    }
  }, []);

  // Get delivery settings for current platform
  const sessionData = JSON.parse(sessionStorage.getItem('platformSession') || '{}');
  const platformId = propPlatformId || sessionData.platformId;
  

  
  const { data: deliverySettings } = useQuery({
    queryKey: [`/api/platforms/${platformId}/delivery-settings`],
    enabled: !!platformId,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Get active delivery companies
  const { data: activeDeliveryCompanies = [], isLoading: isLoadingCompanies } = useQuery<any[]>({
    queryKey: [`/api/platforms/${platformId}/active-delivery-companies`],
    enabled: !!platformId,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Set default active delivery company when modal opens and companies are loaded
  // Only if no saved setting exists (first time user)
  useEffect(() => {
    if (isOpen && Array.isArray(activeDeliveryCompanies) && activeDeliveryCompanies.length > 0 && selectedDeliveryCompany === 'none' && !savedSettings.selectedDeliveryCompany) {
      // Find the active company (assuming there's only one active, or pick the first one)
      const activeCompany = activeDeliveryCompanies.find((company: any) => company.isActive) || activeDeliveryCompanies[0];
      if (activeCompany) {
        setSelectedDeliveryCompany(activeCompany.id);
      }
    }
  }, [isOpen, activeDeliveryCompanies, selectedDeliveryCompany, savedSettings.selectedDeliveryCompany]);

  // Reset selected orders when modal opens to select all orders by default
  useEffect(() => {
    if (isOpen) {
      setSelectedOrders(orders.map(o => o.id));
    }
  }, [isOpen, orders]);

  // Save print settings whenever they change
  useEffect(() => {
    const settings = {
      selectedTemplate,
      selectedPaperSize,
      paperOrientation,
      fontScale,
      selectedDeliveryCompany
    };
    localStorage.setItem('printSettings', JSON.stringify(settings));
  }, [selectedTemplate, selectedPaperSize, paperOrientation, fontScale, selectedDeliveryCompany]);





  const componentRef = useRef<HTMLDivElement>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>(orders.map(o => o.id));
  const [showPreview, setShowPreview] = useState(false);
  const [printDate, setPrintDate] = useState<Date | null>(null);

  const defaultPaperSizes = {
    A3: { 
      portrait: { size: 'A3 portrait', width: '297mm', height: '420mm' },
      landscape: { size: 'A3 landscape', width: '420mm', height: '297mm' }
    },
    A4: { 
      portrait: { size: 'A4 portrait', width: '210mm', height: '297mm' },
      landscape: { size: 'A4 landscape', width: '297mm', height: '210mm' }
    },
    A5: { 
      portrait: { size: 'A5 portrait', width: '148mm', height: '210mm' },
      landscape: { size: 'A5 landscape', width: '210mm', height: '148mm' }
    },
    A6: { 
      portrait: { size: 'A6 portrait', width: '105mm', height: '148mm' },
      landscape: { size: 'A6 landscape', width: '148mm', height: '105mm' }
    },
    Letter: { 
      portrait: { size: 'letter portrait', width: '8.5in', height: '11in' },
      landscape: { size: 'letter landscape', width: '11in', height: '8.5in' }
    }
  };

  // Combine default and custom paper sizes
  const paperSizes = { ...defaultPaperSizes, ...customPaperSizes };

  const currentPaperConfig = paperSizes[selectedPaperSize as keyof typeof paperSizes]?.[paperOrientation as 'portrait' | 'landscape'];

  // Function to save custom paper size
  const saveCustomPaperSize = () => {
    if (!customSizeName || !customWidth || !customHeight) {
      return;
    }

    const newCustomSize = {
      [customSizeName]: {
        portrait: { 
          size: `${customSizeName} portrait`, 
          width: customWidth, 
          height: customHeight 
        },
        landscape: { 
          size: `${customSizeName} landscape`, 
          width: customHeight, 
          height: customWidth 
        }
      }
    };

    const updatedCustomSizes = { ...customPaperSizes, ...newCustomSize };
    setCustomPaperSizes(updatedCustomSizes);
    localStorage.setItem('customPaperSizes', JSON.stringify(updatedCustomSizes));
    
    // Select the new custom size
    setSelectedPaperSize(customSizeName);
    
    // Reset form
    setCustomSizeName('');
    setCustomWidth('');
    setCustomHeight('');
    setShowCustomSizeInput(false);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `فواتير-${new Date().toLocaleDateString('ar')}`,
    onBeforePrint: async () => {
      // Set print date when user clicks print
      setPrintDate(new Date());
    },
    pageStyle: `
      @page {
        size: ${currentPaperConfig?.size || 'A5 portrait'};
        margin: 2mm;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0;
          padding: 0;
        }
      }
    `
  });

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500', 
      processing: 'bg-orange-500',
      shipped: 'bg-purple-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
      refunded: 'bg-gray-500',
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      pending: 'انتظار',
      confirmed: 'مؤكد', 
      processing: 'تجهيز',
      shipped: 'مشحون',
      delivered: 'مسلم',
      cancelled: 'ملغى',
      refunded: 'مسترد',
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));

  // Get selected delivery company data
  const selectedDeliveryCompanyData = Array.isArray(activeDeliveryCompanies) ? activeDeliveryCompanies.find(
    (company: any) => company.id === selectedDeliveryCompany
  ) : undefined;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black border-theme-primary max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="text-right pb-1.5">
            <DialogTitle className="text-theme-primary text-base font-bold flex items-center gap-1.5 justify-start">
              <FileText className="h-3.5 w-3.5" />
              طباعة فواتير الطلبات
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-right text-xs">
              اختر الطلبات للطباعة - {selectedPaperSize} {paperOrientation === 'portrait' ? 'طولي' : 'عرضي'} - {fontScale === 'small' ? 'صغير' : fontScale === 'large' ? 'كبير' : 'عادي'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* أزرار التحكم */}
            <div className="space-y-3 p-3 bg-theme-primary-lighter rounded">
              <div className="text-theme-primary font-medium text-center text-sm">
                تم اختيار {selectedOrders.length} من {orders.length} طلبات
              </div>
              
              {/* إعدادات الطباعة */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedPaperSize}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setShowCustomSizeInput(true);
                    } else {
                      setSelectedPaperSize(e.target.value);
                    }
                  }}
                  className="bg-black theme-border text-theme-primary px-2 py-1.5 rounded text-xs w-full"
                >
                  <option value="A3">A3</option>
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="A6">A6</option>
                  <option value="Letter">Letter</option>
                  <option value="Sticker">ستيكر عادي</option>
                  <option value="Sticker-Large">ستيكر كبير</option>
                  <option value="Sticker-Small">ستيكر صغير</option>
                  <option value="Sticker-Square">ستيكر مربع</option>
                  {/* Custom paper sizes */}
                  {Object.keys(customPaperSizes).map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                  <option value="custom">+ قياس مخصص</option>
                </select>
                <select
                  value={paperOrientation}
                  onChange={(e) => setPaperOrientation(e.target.value)}
                  className="bg-black theme-border text-theme-primary px-2 py-1.5 rounded text-xs w-full"
                >
                  <option value="portrait">طولي</option>
                  <option value="landscape">عرضي</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={fontScale}
                  onChange={(e) => setFontScale(e.target.value as 'small' | 'normal' | 'large')}
                  className="bg-black theme-border text-theme-primary px-2 py-1.5 rounded text-xs w-full"
                >
                  <option value="small">صغير</option>
                  <option value="normal">عادي</option>
                  <option value="large">كبير</option>
                </select>
                <select
                  value={selectedDeliveryCompany}
                  onChange={(e) => setSelectedDeliveryCompany(e.target.value)}
                  className="bg-black theme-border text-theme-primary px-2 py-1.5 rounded text-xs w-full"
                >
                  <option value="none">بدون شركة توصيل</option>
                  {activeDeliveryCompanies.map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Size Input */}
              {showCustomSizeInput && (
                <div className="space-y-2 p-3 bg-black border border-theme-primary rounded">
                  <div className="text-theme-primary font-medium text-sm text-center">إضافة قياس ورق مخصص</div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="اسم القياس"
                      value={customSizeName}
                      onChange={(e) => setCustomSizeName(e.target.value)}
                      className="bg-theme-primary-lighter border border-theme-primary text-theme-primary px-2 py-1.5 rounded text-xs w-full"
                    />
                    <input
                      type="text"
                      placeholder="العرض (مم)"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="bg-theme-primary-lighter border border-theme-primary text-theme-primary px-2 py-1.5 rounded text-xs w-full"
                    />
                    <input
                      type="text"
                      placeholder="الارتفاع (مم)"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="bg-theme-primary-lighter border border-theme-primary text-theme-primary px-2 py-1.5 rounded text-xs w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={saveCustomPaperSize}
                      size="sm"
                      className="bg-theme-gradient text-white text-xs py-1.5 h-auto w-full"
                      disabled={!customSizeName || !customWidth || !customHeight}
                    >
                      حفظ القياس
                    </Button>
                    <Button
                      onClick={() => setShowCustomSizeInput(false)}
                      variant="outline"
                      size="sm"
                      className="theme-border text-theme-primary hover:bg-theme-primary-light text-xs py-1.5 h-auto w-full"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}

              {/* الأزرار */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="theme-border text-theme-primary hover:bg-theme-primary-light text-xs py-1.5 h-auto w-full"
                >
                  {selectedOrders.length === orders.length ? 'إلغاء الكل' : 'تحديد الكل'}
                </Button>
                <Button
                  onClick={() => {
                    if (!showPreview) {
                      // Set print date when user clicks preview
                      setPrintDate(new Date());
                    }
                    setShowPreview(!showPreview);
                  }}
                  variant="outline"
                  size="sm"
                  className="theme-border text-theme-primary hover:bg-theme-primary-light text-xs py-1.5 h-auto w-full"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {showPreview ? 'إخفاء' : 'معاينة'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateSelector(true)}
                  className="theme-border text-theme-primary hover:bg-theme-primary-light text-xs py-1.5 h-auto w-full"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  النموذج
                </Button>
              </div>
            </div>

            {/* قائمة الطلبات */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {orders.map((order) => (
                <div 
                  key={order.id}
                  className={`flex items-center gap-2 p-1.5 rounded border transition-colors ${
                    selectedOrders.includes(order.id) 
                      ? 'bg-theme-primary-light border-theme-primary' 
                      : 'bg-theme-primary-lighter border-gray-600'
                  }`}
                >
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={() => toggleOrderSelection(order.id)}
                    className="theme-checkbox flex-shrink-0 scale-75"
                  />
                  
                  <div className="flex-1 min-w-0 text-right">
                    {/* السطر الأول: اسم العميل ورقم الطلب */}
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge className={`${getStatusColor(order.status)} text-white text-[10px] px-1.5 py-0 h-4`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        <span className="text-theme-primary font-medium text-xs">
                          #{order.orderNumber || order.id.slice(-6)}
                        </span>
                      </div>
                      <h4 className="text-theme-primary font-bold text-xs truncate">
                        {order.customerName}
                      </h4>
                    </div>
                    
                    {/* السطر الثاني: المنتج والمبلغ */}
                    <div className="flex items-center justify-between gap-1.5 text-[11px]">
                      <div className="text-theme-primary font-bold flex-shrink-0">
                        {order.total 
                          ? parseInt(order.total).toLocaleString() 
                          : order.totalAmount 
                          ? parseInt(order.totalAmount).toLocaleString()
                          : order.price
                          ? parseInt(order.price).toLocaleString()
                          : '0'
                        } د.ع
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="truncate text-gray-400">
                          {order.product?.name || order.productName}
                        </span>
                        {order.quantity > 1 && (
                          <span className="text-[10px] bg-theme-primary text-white px-1 py-0.5 rounded flex-shrink-0">
                            ×{order.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* السطر الثالث: المحافظة والعنوان */}
                    <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                      {order.customerGovernorate} - {order.customerAddress}
                    </div>
                  </div>
                </div>
              ))}
            </div>


          </div>

          <DialogFooter className="gap-2 border-t border-theme-primary pt-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="theme-border bg-theme-primary-lighter hover:bg-theme-primary-light px-4 text-sm h-8"
            >
              <X className="h-3 w-3 mr-1" />
              إلغاء
            </Button>
            <Button
              onClick={handlePrint}
              disabled={selectedOrders.length === 0}
              className="bg-theme-gradient text-white hover:opacity-90 px-4 text-sm h-8"
            >
              <Printer className="h-3 w-3 mr-1" />
              طباعة ({selectedOrders.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة معاينة الفواتير المنفصلة */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-white border-gray-300 max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="text-right pb-3 border-b border-gray-200">
            <DialogTitle className="text-gray-800 text-lg font-bold flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                معاينة الفواتير
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-right text-sm">
              معاينة الفواتير قبل الطباعة - {selectedPaperSize} {paperOrientation === 'portrait' ? 'طولي' : 'عرضي'} - حجم الخط {fontScale === 'small' ? 'صغير' : fontScale === 'large' ? 'كبير' : 'عادي'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedOrdersData.length > 0 && (
              <div className="overflow-auto bg-white w-full">
                <div className="w-full flex justify-center">
                  <div style={{ width: 'fit-content', transform: 'scale(0.9)', transformOrigin: 'center top' }}>
                    {selectedTemplate === 'simple-large' && (
                      <SimpleLargeInvoice
                        orders={selectedOrdersData}
                        platformName={platformName}
                        platformLogo={platformLogo || undefined}
                        deliverySettings={deliverySettings}
                        selectedDeliveryCompany={selectedDeliveryCompanyData}
                        paperSize={selectedPaperSize}
                        orientation={paperOrientation}
                        fontScale={fontScale}
                        printDate={printDate}
                      />
                    )}
                    {selectedTemplate === 'minimal' && (
                      <MinimalInvoice
                        orders={selectedOrdersData}
                        platformName={platformName}
                        platformLogo={platformLogo || undefined}
                        deliverySettings={deliverySettings}
                        selectedDeliveryCompany={selectedDeliveryCompanyData}
                        paperSize={selectedPaperSize}
                        orientation={paperOrientation}
                        fontScale={fontScale}
                        printDate={printDate}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 border-t border-gray-200 pt-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="border-gray-300 text-gray-600 hover:bg-gray-100 px-4 text-sm h-9"
            >
              <X className="h-4 w-4 mr-2" />
              إغلاق
            </Button>
            <Button
              onClick={handlePrint}
              disabled={selectedOrders.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 text-sm h-9"
            >
              <Printer className="h-4 w-4 mr-2" />
              طباعة ({selectedOrders.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مكون الطباعة المخفي */}
      <div style={{ display: 'none' }}>
        {selectedTemplate === 'simple-large' && (
          <div ref={componentRef}>
            <SimpleLargeInvoice
              orders={selectedOrdersData}
              platformName={platformName}
              platformLogo={platformLogo || undefined}
              deliverySettings={deliverySettings}
              selectedDeliveryCompany={selectedDeliveryCompanyData}
              paperSize={selectedPaperSize}
              orientation={paperOrientation}
              fontScale={fontScale}
              printDate={printDate}
            />
          </div>
        )}
        {selectedTemplate === 'simple-classic' && (
          <div ref={componentRef}>
            <ClassicInvoice
              orders={selectedOrdersData}
              platformName={platformName}
              platformLogo={platformLogo || undefined}
              deliverySettings={deliverySettings}
            />
          </div>
        )}
        {selectedTemplate === 'simple-modern' && (
          <div ref={componentRef}>
            <ModernInvoice
              orders={selectedOrdersData}
              platformName={platformName}
              platformLogo={platformLogo || undefined}
              deliverySettings={deliverySettings}
            />
          </div>
        )}
        {selectedTemplate === 'minimal' && (
          <MinimalInvoice
            ref={componentRef}
            orders={selectedOrdersData}
            platformName={platformName}
            platformLogo={platformLogo || undefined}
            deliverySettings={deliverySettings}
            selectedDeliveryCompany={selectedDeliveryCompanyData}
            paperSize={selectedPaperSize}
            orientation={paperOrientation}
            fontScale={fontScale}
            printDate={printDate}
          />
        )}
      </div>

      {/* مكون اختيار النموذج */}
      <InvoiceTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        orders={orders}
        platformName={platformName}
        platformLogo={platformLogo || undefined}
        deliverySettings={deliverySettings}
        onTemplateSelect={(template) => setSelectedTemplate(template)}
      />
    </>
  );
}