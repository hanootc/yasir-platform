import { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ModernInvoiceProps {
  orders: any[];
  platformName: string;
  platformLogo?: string;
  deliverySettings?: any;
  pageNumber?: number;
}

const ModernInvoice = forwardRef<HTMLDivElement, ModernInvoiceProps>(
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
              width: 100,
              margin: 1,
              color: {
                dark: '#000000',
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

    return (
      <div ref={ref} style={{ 
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        backgroundColor: 'white',
        color: '#000000',
        fontSize: '14px'
      }}>
        {orders.map((order, orderIndex) => (
          <div key={order.id} style={{ 
            marginBottom: orderIndex < orders.length - 1 ? '20mm' : '0',
            pageBreakAfter: orderIndex < orders.length - 1 ? 'always' : 'auto',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modern Header with Simple Black Design */}
            <div style={{
              backgroundColor: '#000000',
              color: 'white',
              padding: '30px 40px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Platform Info */}
                <div style={{ flex: 1 }}>
                  <h1 style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    margin: '0 0 10px 0'
                  }}>
                    {platformName}
                  </h1>
                  <div style={{
                    fontSize: '18px'
                  }}>
                    منصة التجارة الإلكترونية
                  </div>
                </div>

                {/* Invoice Number */}
                <div style={{
                  textAlign: 'center',
                  backgroundColor: 'white',
                  color: '#000000',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '2px solid white'
                }}>
                  <div style={{
                    fontSize: '14px',
                    marginBottom: '5px'
                  }}>
                    وصل رقم
                  </div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold'
                  }}>
                    {order.orderNumber || order.id.slice(-6)}#
                  </div>
                  <div style={{
                    fontSize: '12px',
                    marginTop: '10px'
                  }}>
                    {formatDate(currentDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ 
              padding: '40px',
              flex: 1,
              backgroundColor: 'white'
            }}>
              {/* Customer and QR Code Section */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '30px',
                marginBottom: '30px'
              }}>
                {/* Customer Information Card */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '25px',
                  borderRadius: '15px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    margin: '0 0 20px 0',
                    color: '#000000',
                    borderBottom: '3px solid #000000',
                    paddingBottom: '10px'
                  }}>
                    معلومات العميل
                  </h2>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    fontSize: '15px'
                  }}>
                    <div>
                      <strong style={{ color: '#000000' }}>الاسم:</strong>
                      <div style={{ marginTop: '5px', fontSize: '16px', color: '#000000' }}>{order.customerName}</div>
                    </div>
                    <div>
                      <strong style={{ color: '#000000' }}>الهاتف:</strong>
                      <div style={{ marginTop: '5px', fontSize: '16px', fontFamily: 'monospace', color: '#000000' }}>{order.customerPhone}</div>
                    </div>
                    <div>
                      <strong style={{ color: '#000000' }}>المحافظة:</strong>
                      <div style={{ marginTop: '5px', fontSize: '16px', color: '#000000' }}>{order.customerGovernorate}</div>
                    </div>
                    <div>
                      <strong style={{ color: '#000000' }}>العنوان:</strong>
                      <div style={{ marginTop: '5px', fontSize: '14px', color: '#000000' }}>{order.customerAddress}</div>
                    </div>
                  </div>
                </div>

                {/* QR Code and Logos */}
                <div style={{
                  backgroundColor: 'white',
                  padding: '25px',
                  borderRadius: '15px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Platform Logo */}
                  {platformLogo && (
                    <div style={{ marginBottom: '15px' }}>
                      <img 
                        src={platformLogo} 
                        alt="شعار المنصة"
                        style={{
                          maxWidth: '60px',
                          maxHeight: '60px',
                          objectFit: 'contain'
                        }}
                      />
                      <div style={{
                        fontSize: '10px',
                        color: '#000000',
                        marginTop: '5px'
                      }}>
                        {platformName}
                      </div>
                    </div>
                  )}
                  
                  {/* Delivery Company Logo */}
                  {deliverySettings?.companyLogo && (
                    <div style={{ marginBottom: '15px' }}>
                      <img 
                        src={deliverySettings.companyLogo} 
                        alt="شعار شركة التوصيل"
                        style={{
                          maxWidth: '50px',
                          maxHeight: '50px',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          console.log('Delivery logo failed to load:', deliverySettings.companyLogo);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div style={{
                        fontSize: '10px',
                        color: '#000000',
                        marginTop: '5px'
                      }}>
                        {deliverySettings?.companyName || 'شركة التوصيل'}
                      </div>
                    </div>
                  )}
                  
                  {/* QR Code */}
                  {qrCodes[order.id] && (
                    <div>
                      <img 
                        src={qrCodes[order.id]} 
                        alt={`QR Code للوصل ${order.orderNumber || order.id.slice(-6)}`}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '10px'
                        }}
                      />
                      <div style={{
                        fontSize: '12px',
                        color: '#000000',
                        marginTop: '10px'
                      }}>
                        امسح للتحقق
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '15px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                marginBottom: '30px'
              }}>
                <div style={{
                  backgroundColor: '#000000',
                  color: 'white',
                  padding: '20px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  تفاصيل الطلب
                </div>
                <div style={{ padding: '25px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#000000',
                        margin: '0 0 10px 0'
                      }}>
                        {order.productName}
                      </h3>
                      {(order.selectedColorName || order.selectedShapeName || order.selectedSizeName) && (
                        <div style={{
                          fontSize: '16px',
                          color: '#000000',
                          backgroundColor: '#f3f3f3',
                          border: '1px solid #000000',
                          padding: '8px 15px',
                          borderRadius: '20px',
                          display: 'inline-block',
                          marginBottom: '15px'
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
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      fontWeight: 'bold',
                      marginLeft: '20px'
                    }}>
                      {order.quantity || 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Amount - Modern Style */}
              <div style={{
                backgroundColor: '#000000',
                color: 'white',
                padding: '30px',
                borderRadius: '15px',
                textAlign: 'center',
                marginBottom: '30px'
              }}>
                <div style={{ 
                  fontSize: '18px', 
                  opacity: '0.9',
                  marginBottom: '10px'
                }}>
                  المبلغ الإجمالي
                </div>
                <div style={{
                  fontSize: '42px',
                  fontWeight: 'bold'
                }}>
                  {(order.totalAmount || order.total || order.price || 0).toLocaleString('ar-IQ')}
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  marginTop: '5px',
                  opacity: '0.9'
                }}>
                  دينار عراقي
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '15px',
                  border: '1px solid #000000',
                  borderLeft: '5px solid #000000',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#000000',
                    margin: '0 0 10px 0'
                  }}>
                    ملاحظات العميل:
                  </h4>
                  <div style={{ fontSize: '14px', color: '#000000', lineHeight: '1.6' }}>
                    {order.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              backgroundColor: '#000000',
              color: 'white',
              padding: '20px 40px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '5px' }}>
                شكراً لثقتكم بنا - {platformName}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: '0.7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                {deliverySettings?.companyName && (
                  <>
                    شركة التوصيل: 
                    {deliverySettings?.companyLogo && (
                      <img 
                        src={deliverySettings.companyLogo} 
                        alt="شعار شركة التوصيل"
                        style={{
                          width: '16px',
                          height: '16px',
                          objectFit: 'contain',
                          margin: '0 4px'
                        }}
                      />
                    )}
                    {deliverySettings.companyName} | 
                  </>
                )}
                البلاغات: {deliverySettings?.reportsPhone || '07XXXXXXXX'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

ModernInvoice.displayName = 'ModernInvoice';

export default ModernInvoice;