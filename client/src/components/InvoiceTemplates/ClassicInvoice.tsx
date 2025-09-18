import { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ClassicInvoiceProps {
  orders: any[];
  platformName: string;
  platformLogo?: string;
  deliverySettings?: any;
  pageNumber?: number;
}

const ClassicInvoice = forwardRef<HTMLDivElement, ClassicInvoiceProps>(
  ({ orders, platformName, platformLogo, deliverySettings, pageNumber = 1 }, ref) => {
    const currentDate = new Date();
    const [qrCodes, setQrCodes] = useState<{[key: string]: string}>({});

    // Generate QR codes for invoice numbers
    useEffect(() => {
      const generateQRCodes = async () => {
        const codes: {[key: string]: string} = {};
        for (const order of orders) {
          const orderNumber = order.orderNumber || order.id.slice(-6);
          const qrData = `INVOICE-${orderNumber}-${platformName}`;
          try {
            codes[order.id] = await QRCode.toDataURL(qrData, {
              width: 80,
              margin: 1,
              color: {
                dark: '#2563eb',
                light: '#ffffff'
              }
            });
          } catch (error) {
            console.error('Error generating QR code:', error);
          }
        }
        setQrCodes(codes);
      };
      
      if (orders.length > 0) {
        generateQRCodes();
      }
    }, [orders, platformName]);

    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const getDayInArabic = (date: Date) => {
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return days[date.getDay()];
    };

    return (
      <div ref={ref} style={{ 
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        backgroundColor: 'white',
        color: '#000000',
        fontSize: '14px',
        padding: '15mm'
      }}>
        {orders.map((order, orderIndex) => (
          <div key={order.id} style={{ 
            marginBottom: orderIndex < orders.length - 1 ? '20mm' : '0',
            pageBreakAfter: orderIndex < orders.length - 1 ? 'always' : 'auto'
          }}>
            {/* Header - Simple Style */}
            <div style={{
              border: '2px solid #000000',
              padding: '10px',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              <h1 style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#000000',
                margin: '0 0 5px 0'
              }}>
                وصل استلام #{order.orderNumber || order.id.slice(-6)}
              </h1>
              <div style={{
                fontSize: '12px',
                color: '#000000'
              }}>
                {formatDate(currentDate)}
              </div>
            </div>

            {/* Customer Information */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Customer Details */}
              <div style={{
                border: '2px solid #000000',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f8f8f8'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#000000',
                  margin: '0 0 15px 0',
                  borderBottom: '2px solid #000000',
                  paddingBottom: '8px'
                }}>
                  بيانات العميل
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <div><strong>الاسم:</strong> {order.customerName}</div>
                  <div><strong>المحافظة:</strong> {order.customerGovernorate}</div>
                  <div><strong>العنوان:</strong> {order.customerAddress}</div>
                  <div><strong>الهاتف:</strong> {order.customerPhone}</div>
                </div>
              </div>

              {/* Company Info */}
              <div style={{
                border: '2px solid #000000',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f8f8f8'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#000000',
                  margin: '0 0 15px 0',
                  borderBottom: '2px solid #000000',
                  paddingBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  {deliverySettings?.companyLogo && (
                    <img 
                      src={deliverySettings.companyLogo} 
                      alt="شعار شركة التوصيل"
                      style={{
                        width: '30px',
                        height: '30px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        console.log('Delivery logo failed to load:', deliverySettings.companyLogo);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  شركة التوصيل
                </h3>
                <div style={{ lineHeight: '1.8' }}>
                  <div><strong>الشركة:</strong> {deliverySettings?.companyName || 'شركة التوصيل'}</div>
                  <div><strong>الهاتف:</strong> {deliverySettings?.companyPhone || '07XXXXXXXX'}</div>
                  <div><strong>البلاغات:</strong> {deliverySettings?.reportsPhone || '07XXXXXXXX'}</div>
                  <div><strong>المنصة:</strong> {platformName}</div>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div style={{
              border: '2px solid #000000',
              borderRadius: '8px',
              marginBottom: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#000000',
                color: 'white',
                padding: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                تفاصيل المنتج
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f8f8'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <div>
                    <h4 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#000000',
                      margin: '0 0 10px 0'
                    }}>
                      {order.productName}
                    </h4>
                    {(order.selectedColorName || order.selectedShapeName || order.selectedSizeName) && (
                      <div style={{
                        fontSize: '14px',
                        color: '#000000',
                        backgroundColor: '#e5e5e5',
                        padding: '5px 10px',
                        borderRadius: '15px',
                        display: 'inline-block',
                        border: '1px solid #000000'
                      }}>
                        {[order.selectedColorName, order.selectedShapeName, order.selectedSizeName]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    )}
                  </div>
                  <div style={{
                    backgroundColor: '#000000',
                    color: 'white',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>
                    {order.quantity || 1}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div style={{
              backgroundColor: '#000000',
              color: 'white',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                المبلغ الإجمالي
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold'
              }}>
                {(order.totalAmount || order.total || order.price || 0).toLocaleString('ar-IQ')} د.ع
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div style={{
                border: '1px solid #000000',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f8f8f8',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#000000',
                  margin: '0 0 10px 0'
                }}>
                  ملاحظات العميل:
                </h4>
                <div style={{ fontSize: '13px', color: '#000000' }}>
                  {order.notes}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{
              borderTop: '3px solid #000000',
              paddingTop: '15px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#000000'
            }}>
              <div>شكراً لثقتكم بنا - {platformName}</div>
              <div style={{ marginTop: '5px' }}>
                تم إنشاء هذا الوصل بتاريخ {formatDate(currentDate)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

ClassicInvoice.displayName = 'ClassicInvoice';

export default ClassicInvoice;