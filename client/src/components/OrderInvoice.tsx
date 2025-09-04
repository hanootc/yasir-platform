import { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface OrderInvoiceProps {
  orders: any[];
  platformName: string;
  platformLogo?: string;
  deliverySettings?: any;
  pageNumber?: number;
}

const OrderInvoice = forwardRef<HTMLDivElement, OrderInvoiceProps>(
  ({ orders, platformName, platformLogo, deliverySettings, pageNumber = 1 }, ref) => {
    const currentDate = new Date();
    const [qrCodes, setQrCodes] = useState<{[key: string]: string}>({});
    
    // Debug logging
    console.log('🧾 OrderInvoice Props:', {
      ordersCount: orders.length,
      platformName,
      platformLogo: platformLogo ? 'provided' : 'missing',
      deliverySettings: deliverySettings ? 'provided' : 'missing',
      sampleOrder: orders[0] ? { 
        id: orders[0].id, 
        total: orders[0].total,
        price: orders[0].price,
        productName: orders[0].productName
      } : 'no orders'
    });
    
    // Additional debug for the first order
    if (orders[0]) {
      console.log('🧾 First Order Details:', orders[0]);
    }
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

    // Generate QR codes for invoice numbers
    useEffect(() => {
      const generateQRCodes = async () => {
        const codes: {[key: string]: string} = {};
        for (const order of orders) {
          const orderNumber = order.orderNumber || order.id.slice(-6);
          const qrData = `INVOICE-${orderNumber}-${platformName}`;
          try {
            codes[order.id] = await QRCode.toDataURL(qrData, {
              width: 60,
              margin: 1,
              color: {
                dark: '#1a365d',
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

    const generateWhatsAppQR = (phoneNumber: string, orderNumber: string, productName: string) => {
      // Remove leading zero and country code formatting
      const cleanPhone = phoneNumber.replace(/^0/, '964');
      const message = encodeURIComponent(`السلام عليكم عندك طلب (${productName}) رقم الوصل : (${orderNumber})`);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
      return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(whatsappUrl)}`;
    };

    if (!orders.length) return null;

    return (
      <div ref={ref} className="invoice-pages" dir="rtl">
        {orders.map((order, index) => (
          <div key={order.id} className="invoice-container" style={{
            width: '100%',
            maxWidth: '105mm',
            height: '148mm',
            margin: '0 auto',
            border: '3px solid #1a365d',
            borderRadius: '8px',
            padding: '12px',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: '500',
            lineHeight: '1.5',
            position: 'relative',
            pageBreakAfter: index < orders.length - 1 ? 'always' : 'auto',
            fontFamily: '"Tajawal", "Cairo", sans-serif',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}>
            
            {/* رأس الفاتورة الجديد */}
            <div style={{
              background: 'linear-gradient(135deg, #1a365d 0%, #2d5a87 100%)',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '12px',
              color: 'white',
              textAlign: 'center'
            }}>
              {/* معلومات شركة التوصيل */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                {/* شعار شركة التوصيل */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  padding: '3px',
                  width: '60px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {deliverySettings?.companyLogo || deliverySettings?.logoUrl ? (
                    <img 
                      src={deliverySettings.companyLogo || deliverySettings.logoUrl} 
                      alt="شعار شركة التوصيل"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        console.log('Delivery logo failed to load:', deliverySettings?.companyLogo || deliverySettings?.logoUrl);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#000000',
                    fontWeight: 'bold',
                    display: deliverySettings?.companyLogo ? 'none' : 'block'
                  }}>
                    التوصيل
                  </div>
                </div>

                {/* معلومات الفاتورة مع الباركود */}
                <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '4px',
                      color: '#000000'
                    }}>
                      وصل رقم {order.orderNumber || order.id.slice(-6)}#
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#000000',
                      opacity: '0.8'
                    }}>
                      {formatDate(currentDate)} - {getDayInArabic(currentDate)}
                    </div>
                  </div>
                  
                  {/* باركود رقم الفاتورة */}
                  {qrCodes[order.id] && (
                    <div style={{
                      backgroundColor: 'white',
                      padding: '4px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      <img 
                        src={qrCodes[order.id]} 
                        alt={`QR Code للوصل ${order.orderNumber || order.id.slice(-6)}`}
                        style={{
                          width: '50px',
                          height: '50px',
                          display: 'block'
                        }}
                      />
                      <div style={{
                        fontSize: '8px',
                        color: '#000000',
                        textAlign: 'center',
                        marginTop: '2px',
                        fontWeight: 'bold'
                      }}>
                        {order.orderNumber || order.id.slice(-6)}#
                      </div>
                    </div>
                  )}
                </div>

                {/* شعار المنصة */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  padding: '3px',
                  width: '60px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {platformLogo ? (
                    <img 
                      src={platformLogo} 
                      alt="شعار المنصة"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        console.log('Platform logo failed to load:', platformLogo);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div style={{ 
                    fontSize: '9px', 
                    color: '#000000',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    display: platformLogo ? 'none' : 'block'
                  }}>
                    {platformName.slice(0, 6)}
                  </div>
                </div>
              </div>

              {/* اسم الشركة ورقم البلاغات */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                borderTop: '1px solid rgba(255,255,255,0.3)',
                paddingTop: '6px'
              }}>
                <div style={{ fontWeight: 'bold', color: '#000000' }}>
                  {deliverySettings?.companyName || platformName}
                </div>
                
                {/* رقم البلاغات في الوسط */}
                {deliverySettings?.reportsPhone && (
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255,255,255,0.4)',
                    color: '#000000'
                  }}>
                    البلاغات: {deliverySettings.reportsPhone}
                  </div>
                )}

                {/* اسم المنصة أسفل الشعار */}
                <div style={{ 
                  fontSize: '10px', 
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {platformName}
                </div>
              </div>
            </div>

            {/* تفاصيل الطلب - تصميم محسّن */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '10px'
            }}>
              {/* تفاصيل العميل */}
              <div style={{
                flex: '1',
                backgroundColor: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }}>
                <div style={{
                  backgroundColor: '#1a365d',
                  color: 'white',
                  textAlign: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  معلومات العميل
                </div>
                
                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  <div style={{ 
                    marginBottom: '3px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <strong style={{ color: '#000000' }}>الاسم:</strong>
                    <span style={{ color: '#000000' }}>{order.customerName}</span>
                  </div>
                  <div style={{ 
                    marginBottom: '3px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <strong style={{ color: '#000000' }}>المحافظة:</strong>
                    <span style={{ color: '#000000' }}>{order.customerGovernorate || 'غير محدد'}</span>
                  </div>
                  <div style={{ 
                    marginBottom: '3px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <strong style={{ color: '#000000' }}>المنطقة:</strong>
                    <span style={{ fontSize: '10px', color: '#000000' }}>{order.customerAddress || 'غير محدد'}</span>
                  </div>
                  <div style={{ 
                    marginBottom: '3px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <strong style={{ color: '#000000' }}>الهاتف:</strong>
                    <span style={{ fontFamily: 'monospace', color: '#000000' }}>{order.customerPhone}</span>
                  </div>
                </div>

                {/* QR Code مصغر */}
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '6px',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '6px'
                }}>
                  <img 
                    src={generateWhatsAppQR(order.customerPhone, order.orderNumber || order.id, order.product.name)} 
                    alt="واتساب"
                    width="35"
                    height="35"
                    style={{ borderRadius: '4px' }}
                  />
                  <div style={{ 
                    fontSize: '8px',
                    color: '#000000',
                    fontWeight: 'bold',
                    marginTop: '2px'
                  }}>
                    واتساب مباشر
                  </div>
                </div>
              </div>


            </div>

            {/* تفاصيل المنتج والمبلغ */}
            <div style={{ marginBottom: '10px' }}>
              {/* معلومات المنتج */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '2px solid #1a365d',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                {/* عنوان المنتج */}
                <div style={{
                  backgroundColor: '#1a365d',
                  color: 'white',
                  padding: '6px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  تفاصيل المنتج
                </div>
                
                {/* محتوى المنتج */}
                <div style={{ padding: '8px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#1a365d',
                        marginBottom: '2px'
                      }}>
                        {order.product.name}
                      </div>
                      {(order.selectedColorName || order.selectedShapeName || order.selectedSizeName) && (
                        <div style={{
                          fontSize: '10px',
                          color: '#666',
                          backgroundColor: '#e2e8f0',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          display: 'inline-block'
                        }}>
                          {[order.selectedColorName, order.selectedShapeName, order.selectedSizeName]
                            .filter(Boolean)
                            .join(' • ')}
                        </div>
                      )}
                    </div>
                    
                    {/* الكمية */}
                    <div style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {order.quantity || 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* إجمالي المبلغ */}
              <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderRadius: '6px',
                padding: '8px',
                textAlign: 'center',
                color: 'white',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '11px',
                  opacity: '0.9',
                  marginBottom: '2px'
                }}>
                  المبلغ الإجمالي
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
                  {(() => {
                    const total = order.total || order.price || order.totalAmount || 0;
                    console.log('💰 Order amount calculation:', { 
                      total: order.total, 
                      price: order.price, 
                      totalAmount: order.totalAmount,
                      final: total 
                    });
                    return total && total !== '0' ? Number(total).toLocaleString('ar-IQ') : '0';
                  })()} دينار عراقي
                </div>
              </div>

              {/* منطقة الملاحظات */}
              {order.notes && (
                <div style={{
                  marginTop: '6px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  padding: '6px',
                  backgroundColor: '#fffbeb'
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#92400e',
                    fontWeight: 'bold',
                    marginBottom: '2px'
                  }}>
                    ملاحظات العميل:
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#451a03',
                    lineHeight: '1.3'
                  }}>
                    {order.notes}
                  </div>
                </div>
              )}
            </div>

            {/* ذيل الفاتورة */}
            <div style={{
              borderTop: '2px solid #1a365d',
              paddingTop: '6px',
              marginTop: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '9px',
                color: '#666'
              }}>
                {/* رقم الصفحة */}
                <div style={{
                  backgroundColor: '#1a365d',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {pageNumber + index}
                </div>

                {/* معلومات التواصل */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ marginBottom: '1px' }}>
                    شكراً لثقتكم بخدماتنا
                  </div>
                  {deliverySettings?.companyPhone && (
                    <div>
                      للاستفسار: {deliverySettings.companyPhone}
                    </div>
                  )}
                </div>

                {/* تاريخ مصغر */}
                <div style={{ fontSize: '8px', textAlign: 'left' }}>
                  <div>{formatDate(currentDate)}</div>
                  <div>{new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              counter-reset: page;
              background-color: #fff;
            }
            
            @page {
              size: A6 portrait;
              margin: 2mm;
            }
            
            .invoice-container {
              box-shadow: none !important;
              border: 2px solid #333 !important;
              width: 100% !important;
              height: 148mm !important;
              page-break-after: always;
            }
            
            .invoice-container:last-child {
              page-break-after: auto;
            }
          }
          
          @page {
            size: A6 portrait;
            margin: 2mm;
          }
        `}</style>
      </div>
    );
  }
);

OrderInvoice.displayName = 'OrderInvoice';

export default OrderInvoice;