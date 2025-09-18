import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function PrintInvoiceModal({ isOpen, onClose, order }: PrintInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data: orderDetails } = useQuery({
    queryKey: ["/api/orders", order.id],
    enabled: !!order.id,
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printRef.current) {
      const printContent = printRef.current.innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>فاتورة طلب #${order.orderNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              direction: rtl;
              text-align: right;
            }
            body {
              font-family: 'Arial', sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #3b82f6;
            }
            .company-info h1 {
              color: #3b82f6;
              font-size: 24px;
              margin-bottom: 5px;
            }
            .company-info p {
              color: #666;
            }
            .invoice-title {
              text-align: left;
            }
            .invoice-title h2 {
              font-size: 28px;
              color: #333;
              margin-bottom: 5px;
            }
            .invoice-meta {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .meta-section h3 {
              color: #3b82f6;
              font-size: 16px;
              margin-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .meta-section p {
              margin-bottom: 5px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th,
            .items-table td {
              padding: 12px;
              text-align: right;
              border-bottom: 1px solid #e5e7eb;
            }
            .items-table th {
              background-color: #f8fafc;
              font-weight: bold;
              color: #374151;
              border-bottom: 2px solid #3b82f6;
            }
            .items-table tbody tr:hover {
              background-color: #f9fafb;
            }
            .total-section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 5px 0;
            }
            .total-row.final {
              font-size: 18px;
              font-weight: bold;
              color: #3b82f6;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
              margin-top: 15px;
            }
            .notes-section {
              margin-top: 30px;
              padding: 20px;
              background-color: #f8fafc;
              border-radius: 8px;
            }
            .notes-section h3 {
              color: #3b82f6;
              margin-bottom: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #666;
              font-size: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-confirmed { background-color: #dbeafe; color: #1e40af; }
            .status-processing { background-color: #e9d5ff; color: #7c2d12; }
            .status-shipped { background-color: #c7d2fe; color: #3730a3; }
            .status-delivered { background-color: #d1fae5; color: #065f46; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
            .status-refunded { background-color: #f3f4f6; color: #374151; }
            
            @media print {
              .invoice-container {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "في الانتظار",
      confirmed: "مؤكد",
      processing: "قيد المعالجة", 
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغي",
      refunded: "مسترد"
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle>معاينة الفاتورة</DialogTitle>
          <DialogDescription>
            معاينة وطباعة فاتورة الطلب #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="invoice-container">
          {/* Invoice Header */}
          <div className="invoice-header">
            <div className="company-info">
              <h1>منصة المنتجات</h1>
              <p>إدارة متكاملة للمنتجات والطلبات</p>
              <p>العراق - بغداد</p>
              <p>هاتف: +964 000 000 0000</p>
            </div>
            <div className="invoice-title">
              <h2>فاتورة</h2>
              <p>رقم الطلب: #{order.orderNumber}</p>
              <p>تاريخ الإصدار: {formatDate(new Date())}</p>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="invoice-meta">
            <div className="meta-section">
              <h3>معلومات العميل</h3>
              <p><strong>الاسم:</strong> {order.customerName}</p>
              {order.customerEmail && <p><strong>البريد الإلكتروني:</strong> {order.customerEmail}</p>}
              {order.customerPhone && <p><strong>الهاتف:</strong> {order.customerPhone}</p>}
              {order.customerAddress && <p><strong>العنوان:</strong> {order.customerAddress}</p>}
            </div>
            <div className="meta-section">
              <h3>معلومات الطلب</h3>
              <p><strong>تاريخ الطلب:</strong> {formatDate(order.createdAt)}</p>
              <p><strong>حالة الطلب:</strong> 
                <span className={`status-badge status-${order.status}`}>
                  {getStatusLabel(order.status)}
                </span>
              </p>
              {order.notes && <p><strong>ملاحظات:</strong> {order.notes}</p>}
            </div>
          </div>

          {/* Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>السعر الوحدة</th>
                <th>الكمية</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {orderDetails?.orderItems?.map((item: any, index: number) => (
                <tr key={index}>
                  <td>
                    <div>
                      <div className="font-medium">{item.product?.name || 'منتج غير معروف'}</div>
                      {item.offer && <div className="text-sm text-gray-600">العرض: {item.offer}</div>}
                      
                      {/* عرض الألوان المختارة */}
                      {item.selectedColorIds && item.selectedColorIds.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          الألوان: {item.selectedColorIds.map((colorId: string) => {
                            const color = item.colors?.find((c: any) => c.id === colorId);
                            return color?.colorName || colorId;
                          }).join(', ')}
                        </div>
                      )}
                      
                      {/* عرض الأشكال المختارة */}
                      {item.selectedShapeIds && item.selectedShapeIds.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          الأشكال: {item.selectedShapeIds.map((shapeId: string) => {
                            const shape = item.shapes?.find((s: any) => s.id === shapeId);
                            return shape?.shapeName || shapeId;
                          }).join(', ')}
                        </div>
                      )}
                      
                      {/* عرض الأحجام المختارة */}
                      {item.selectedSizeIds && item.selectedSizeIds.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          الأحجام: {item.selectedSizeIds.map((sizeId: string) => {
                            const size = item.sizes?.find((s: any) => s.id === sizeId);
                            return size?.sizeName || sizeId;
                          }).join(', ')}
                        </div>
                      )}
                      
                      {/* عرض الألوان الفردية (للتوافق مع النظام القديم) */}
                      {item.selectedColorId && !item.selectedColorIds?.length && (
                        <div className="text-sm text-gray-600 mt-1">
                          اللون: {item.colorName || item.selectedColorId}
                        </div>
                      )}
                      
                      {/* عرض الأشكال الفردية */}
                      {item.selectedShapeId && !item.selectedShapeIds?.length && (
                        <div className="text-sm text-gray-600 mt-1">
                          الشكل: {item.shapeName || item.selectedShapeId}
                        </div>
                      )}
                      
                      {/* عرض الأحجام الفردية */}
                      {item.selectedSizeId && !item.selectedSizeIds?.length && (
                        <div className="text-sm text-gray-600 mt-1">
                          الحجم: {item.sizeName || item.selectedSizeId}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>
                    جارٍ تحميل تفاصيل الطلب...
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Total Section */}
          <div className="total-section">
            <div className="total-row">
              <span>المجموع الفرعي:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {parseFloat(order.tax || '0') > 0 && (
              <div className="total-row">
                <span>الضريبة:</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            {parseFloat(order.shipping || '0') > 0 && (
              <div className="total-row">
                <span>الشحن:</span>
                <span>{formatCurrency(order.shipping)}</span>
              </div>
            )}
            <div className="total-row final">
              <span>الإجمالي النهائي:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="notes-section">
              <h3>ملاحظات إضافية</h3>
              <p>{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <p>شكراً لك على تعاملك معنا</p>
            <p>تم إنشاء هذه الفاتورة آلياً من منصة إدارة المنتجات</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 no-print">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <Button onClick={handlePrint} className="bg-primary-600 hover:bg-primary-700">
            <i className="fas fa-print mr-2"></i>
            طباعة الفاتورة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}