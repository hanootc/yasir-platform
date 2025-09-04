import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ClassicInvoice from './InvoiceTemplates/ClassicInvoice';
import ModernInvoice from './InvoiceTemplates/ModernInvoice';
import MinimalInvoice from './InvoiceTemplates/MinimalInvoice';

import { SimpleLargeInvoice } from './InvoiceTemplates/SimpleLarge';

interface InvoiceTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  platformName: string;
  platformLogo?: string;
  deliverySettings?: any;
  onTemplateSelect: (template: string) => void;
}

const templates = [
  {
    id: 'simple-large',
    name: 'البسيط الكبير',
    description: 'نموذج بسيط مع نصوص كبيرة وترتيب واضح',
    preview: '/template-previews/large.png'
  },
  {
    id: 'minimal',
    name: 'النموذج البسيط',
    description: 'النموذج البسيط الأصلي',
    preview: '/template-previews/minimal.png'
  }
];

export default function InvoiceTemplateSelector({
  isOpen,
  onClose,
  orders,
  platformName,
  platformLogo,
  deliverySettings,
  onTemplateSelect
}: InvoiceTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('simple-large');
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  const renderPreview = (templateId: string) => {
    const sampleOrder = orders[0] || {
      id: 'sample',
      orderNumber: '123',
      customerName: 'أحمد محمد',
      customerPhone: '07801234567',
      customerGovernorate: 'بغداد',
      customerAddress: 'الكرخ - حي المنصور',
      productName: 'منتج تجريبي',
      quantity: 2,
      totalAmount: 50000,
      selectedColorName: 'أحمر',
      selectedSizeName: 'كبير',
      notes: 'ملاحظات العميل...'
    };

    const props = {
      orders: [sampleOrder],
      platformName,
      platformLogo,
      deliverySettings
    };

    switch (templateId) {
      case 'simple-large':
        return <SimpleLargeInvoice {...props} />;
      case 'minimal':
        return <MinimalInvoice {...props} />;
      default:
        return <SimpleLargeInvoice {...props} />;
    }
  };

  const handleSelectTemplate = () => {
    onTemplateSelect(selectedTemplate);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-black border-theme-primary max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-theme-primary">
              اختر نموذج الفاتورة
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'theme-border bg-theme-primary-light'
                    : 'border-gray-600 hover:border-theme-primary bg-theme-primary-lighter'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold mb-2 text-theme-primary">{template.name}</h3>
                  <p className="text-sm text-gray-300 mb-4">{template.description}</p>
                  
                  <div className="bg-theme-primary-lighter rounded-lg p-4 mb-4 min-h-[200px] flex items-center justify-center border theme-border">
                    <div className="text-theme-primary text-sm">
                      معاينة {template.name}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(template.id);
                    }}
                    className="w-full mb-2 theme-border text-theme-primary hover:bg-theme-primary-light"
                  >
                    معاينة كاملة
                  </Button>
                  
                  <div className="flex items-center justify-center">
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate === template.id}
                      onChange={() => setSelectedTemplate(template.id)}
                      className="mr-2"
                    />
                    <span className="text-sm text-theme-primary">اختيار هذا النموذج</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-4 p-4 border-t theme-border">
            <Button onClick={onClose} variant="outline" className="theme-border text-theme-primary hover:bg-theme-primary-light">
              إلغاء
            </Button>
            <Button onClick={handleSelectTemplate} className="bg-theme-primary hover:bg-theme-primary-light text-white">
              استخدام النموذج المختار
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="bg-black border-theme-primary max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-theme-primary">
              معاينة {templates.find(t => t.id === previewTemplate)?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4 bg-white rounded-lg mx-4 max-h-[70vh] overflow-auto">
            <div className="w-full flex justify-center">
              <div style={{ width: 'fit-content' }}>
                {previewTemplate && renderPreview(previewTemplate)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 p-4 border-t theme-border">
            <Button 
              onClick={() => setPreviewTemplate(null)} 
              variant="outline"
              className="theme-border text-theme-primary hover:bg-theme-primary-light"
            >
              إغلاق المعاينة
            </Button>
            <Button 
              onClick={() => {
                setSelectedTemplate(previewTemplate!);
                setPreviewTemplate(null);
              }}
              className="bg-theme-primary hover:bg-theme-primary-light text-white"
            >
              اختيار هذا النموذج
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}