import { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface MinimalInvoiceProps {
  orders: any[];
  platformName: string;
  platformLogo?: string;
  deliverySettings?: any;
  selectedDeliveryCompany?: any;
  pageNumber?: number;
  paperSize?: string;
  orientation?: string;
  fontScale?: 'small' | 'normal' | 'large';
  printDate?: Date | null;
}

const MinimalInvoice = forwardRef<HTMLDivElement, MinimalInvoiceProps>(
  ({ orders, platformName, platformLogo, deliverySettings, selectedDeliveryCompany, pageNumber = 1, paperSize = 'A4', orientation = 'portrait', fontScale = 'normal', printDate }, ref) => {
    const currentDate = new Date();
    const [qrCodes, setQrCodes] = useState<{[key: string]: string}>({});

    // Paper size configurations
    const paperSizes = {
      A3: { 
        portrait: { 
          width: '297mm', height: '420mm', padding: '15mm', 
          fontSize: '18px', titleSize: '24px', logoSize: '120px', qrSize: '100px',
          fontSizeSmall: '14px', titleSizeSmall: '18px', logoSizeSmall: '90px', qrSizeSmall: '75px',
          fontSizeLarge: '22px', titleSizeLarge: '30px', logoSizeLarge: '150px', qrSizeLarge: '125px'
        },
        landscape: { 
          width: '420mm', height: '297mm', padding: '12mm', 
          fontSize: '16px', titleSize: '22px', logoSize: '110px', qrSize: '90px',
          fontSizeSmall: '12px', titleSizeSmall: '16px', logoSizeSmall: '80px', qrSizeSmall: '65px',
          fontSizeLarge: '20px', titleSizeLarge: '28px', logoSizeLarge: '140px', qrSizeLarge: '115px'
        }
      },
      A4: { 
        portrait: { 
          width: '210mm', height: '297mm', padding: '12mm', 
          fontSize: '16px', titleSize: '22px', logoSize: '100px', qrSize: '80px',
          fontSizeSmall: '12px', titleSizeSmall: '16px', logoSizeSmall: '75px', qrSizeSmall: '60px',
          fontSizeLarge: '20px', titleSizeLarge: '28px', logoSizeLarge: '125px', qrSizeLarge: '100px'
        },
        landscape: { 
          width: '297mm', height: '210mm', padding: '10mm', 
          fontSize: '14px', titleSize: '20px', logoSize: '90px', qrSize: '70px',
          fontSizeSmall: '10px', titleSizeSmall: '14px', logoSizeSmall: '65px', qrSizeSmall: '50px',
          fontSizeLarge: '18px', titleSizeLarge: '26px', logoSizeLarge: '115px', qrSizeLarge: '90px'
        }
      },
      A5: { 
        portrait: { 
          width: '148mm', height: '210mm', padding: '10mm', 
          fontSize: '14px', titleSize: '18px', logoSize: '80px', qrSize: '70px',
          fontSizeSmall: '10px', titleSizeSmall: '12px', logoSizeSmall: '60px', qrSizeSmall: '50px',
          fontSizeLarge: '18px', titleSizeLarge: '24px', logoSizeLarge: '100px', qrSizeLarge: '90px'
        },
        landscape: { 
          width: '210mm', height: '148mm', padding: '8mm', 
          fontSize: '12px', titleSize: '16px', logoSize: '70px', qrSize: '60px',
          fontSizeSmall: '8px', titleSizeSmall: '10px', logoSizeSmall: '50px', qrSizeSmall: '40px',
          fontSizeLarge: '16px', titleSizeLarge: '22px', logoSizeLarge: '90px', qrSizeLarge: '80px'
        }
      },
      A6: { 
        portrait: { 
          width: '105mm', height: '148mm', padding: '6mm', 
          fontSize: '12px', titleSize: '14px', logoSize: '60px', qrSize: '50px',
          fontSizeSmall: '8px', titleSizeSmall: '10px', logoSizeSmall: '45px', qrSizeSmall: '35px',
          fontSizeLarge: '16px', titleSizeLarge: '18px', logoSizeLarge: '75px', qrSizeLarge: '65px'
        },
        landscape: { 
          width: '148mm', height: '105mm', padding: '5mm', 
          fontSize: '10px', titleSize: '12px', logoSize: '50px', qrSize: '45px',
          fontSizeSmall: '6px', titleSizeSmall: '8px', logoSizeSmall: '35px', qrSizeSmall: '30px',
          fontSizeLarge: '14px', titleSizeLarge: '16px', logoSizeLarge: '65px', qrSizeLarge: '60px'
        }
      },
      Letter: { 
        portrait: { 
          width: '8.5in', height: '11in', padding: '0.6in', 
          fontSize: '16px', titleSize: '22px', logoSize: '100px', qrSize: '80px',
          fontSizeSmall: '12px', titleSizeSmall: '16px', logoSizeSmall: '75px', qrSizeSmall: '60px',
          fontSizeLarge: '20px', titleSizeLarge: '28px', logoSizeLarge: '125px', qrSizeLarge: '100px'
        },
        landscape: { 
          width: '11in', height: '8.5in', padding: '0.5in', 
          fontSize: '14px', titleSize: '20px', logoSize: '90px', qrSize: '70px',
          fontSizeSmall: '10px', titleSizeSmall: '14px', logoSizeSmall: '65px', qrSizeSmall: '50px',
          fontSizeLarge: '18px', titleSizeLarge: '26px', logoSizeLarge: '115px', qrSizeLarge: '90px'
        }
      },
      Sticker: { 
        portrait: { 
          width: '100mm', height: '70mm', padding: '3mm', 
          fontSize: '10px', titleSize: '12px', logoSize: '35px', qrSize: '30px',
          fontSizeSmall: '7px', titleSizeSmall: '8px', logoSizeSmall: '25px', qrSizeSmall: '20px',
          fontSizeLarge: '13px', titleSizeLarge: '16px', logoSizeLarge: '45px', qrSizeLarge: '40px'
        },
        landscape: { 
          width: '70mm', height: '100mm', padding: '3mm', 
          fontSize: '10px', titleSize: '12px', logoSize: '35px', qrSize: '30px',
          fontSizeSmall: '7px', titleSizeSmall: '8px', logoSizeSmall: '25px', qrSizeSmall: '20px',
          fontSizeLarge: '13px', titleSizeLarge: '16px', logoSizeLarge: '45px', qrSizeLarge: '40px'
        }
      },
      'Sticker-Large': { 
        portrait: { 
          width: '150mm', height: '100mm', padding: '4mm', 
          fontSize: '12px', titleSize: '16px', logoSize: '45px', qrSize: '40px',
          fontSizeSmall: '8px', titleSizeSmall: '10px', logoSizeSmall: '30px', qrSizeSmall: '25px',
          fontSizeLarge: '16px', titleSizeLarge: '22px', logoSizeLarge: '60px', qrSizeLarge: '55px'
        },
        landscape: { 
          width: '100mm', height: '150mm', padding: '4mm', 
          fontSize: '12px', titleSize: '16px', logoSize: '45px', qrSize: '40px',
          fontSizeSmall: '8px', titleSizeSmall: '10px', logoSizeSmall: '30px', qrSizeSmall: '25px',
          fontSizeLarge: '16px', titleSizeLarge: '22px', logoSizeLarge: '60px', qrSizeLarge: '55px'
        }
      },
      'Sticker-Small': { 
        portrait: { 
          width: '80mm', height: '50mm', padding: '2mm', 
          fontSize: '9px', titleSize: '11px', logoSize: '25px', qrSize: '20px',
          fontSizeSmall: '6px', titleSizeSmall: '7px', logoSizeSmall: '18px', qrSizeSmall: '15px',
          fontSizeLarge: '12px', titleSizeLarge: '15px', logoSizeLarge: '32px', qrSizeLarge: '27px'
        },
        landscape: { 
          width: '50mm', height: '80mm', padding: '2mm', 
          fontSize: '9px', titleSize: '11px', logoSize: '25px', qrSize: '20px',
          fontSizeSmall: '6px', titleSizeSmall: '7px', logoSizeSmall: '18px', qrSizeSmall: '15px',
          fontSizeLarge: '12px', titleSizeLarge: '15px', logoSizeLarge: '32px', qrSizeLarge: '27px'
        }
      },
      'Sticker-Square': { 
        portrait: { 
          width: '90mm', height: '90mm', padding: '3mm', 
          fontSize: '11px', titleSize: '14px', logoSize: '35px', qrSize: '30px',
          fontSizeSmall: '8px', titleSizeSmall: '10px', logoSizeSmall: '25px', qrSizeSmall: '20px',
          fontSizeLarge: '14px', titleSizeLarge: '18px', logoSizeLarge: '45px', qrSizeLarge: '40px'
        },
        landscape: { 
          width: '90mm', height: '90mm', padding: '3mm', 
          fontSize: '11px', titleSize: '14px', logoSize: '35px', qrSize: '30px',
          fontSizeSmall: '8px', titleSizeSmall: '10px', logoSizeSmall: '25px', qrSizeSmall: '20px',
          fontSizeLarge: '14px', titleSizeLarge: '18px', logoSizeLarge: '45px', qrSizeLarge: '40px'
        }
      }
    };

    const baseSizes = paperSizes[paperSize as keyof typeof paperSizes]?.[orientation as keyof typeof paperSizes.A4] || paperSizes.A4.portrait;
    
    // Apply font scaling based on fontScale prop
    const currentSize = {
      ...baseSizes,
      fontSize: fontScale === 'small' ? baseSizes.fontSizeSmall : fontScale === 'large' ? baseSizes.fontSizeLarge : baseSizes.fontSize,
      titleSize: fontScale === 'small' ? baseSizes.titleSizeSmall : fontScale === 'large' ? baseSizes.titleSizeLarge : baseSizes.titleSize,
      logoSize: fontScale === 'small' ? baseSizes.logoSizeSmall : fontScale === 'large' ? baseSizes.logoSizeLarge : baseSizes.logoSize,
      qrSize: fontScale === 'small' ? baseSizes.qrSizeSmall : fontScale === 'large' ? baseSizes.qrSizeLarge : baseSizes.qrSize,
    };

    // Generate QR codes for invoice numbers
    useEffect(() => {
      const generateQRCodes = async () => {
        const codes: {[key: string]: string} = {};
        for (const order of orders) {
          const orderNumber = order.orderNumber || order.id.slice(-6);
          const qrData = orderNumber; // Only the order number
          try {
            codes[order.id] = await QRCode.toDataURL(qrData, {
              width: 120,
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
      return `${day}/${month}/${year}`;
    };

    const formatDateWithDay = (date: Date) => {
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const dayName = days[date.getDay()];
      const dateString = formatDate(date);
      return `${dayName} ${dateString}`;
    };

    return (
      <div ref={ref} style={{ 
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        width: currentSize.width,
        minHeight: currentSize.height,
        margin: '0 auto',
        backgroundColor: 'white',
        color: '#000000',
        fontSize: currentSize.fontSize,
        padding: currentSize.padding
      }}>
        <style>
          {`
            @media print {
              .invoice-page {
                page-break-after: auto !important;
              }
              
              @page {
                size: ${paperSize === 'A4' && orientation === 'landscape' ? 'A4 landscape' : 
                       paperSize === 'A4' && orientation === 'portrait' ? 'A4 portrait' :
                       paperSize === 'A5' && orientation === 'landscape' ? 'A5 landscape' :
                       paperSize === 'A5' && orientation === 'portrait' ? 'A5 portrait' :
                       paperSize === 'A3' && orientation === 'landscape' ? 'A3 landscape' :
                       paperSize === 'A3' && orientation === 'portrait' ? 'A3 portrait' :
                       paperSize === 'A6' && orientation === 'landscape' ? '148mm 105mm' :
                       paperSize === 'A6' && orientation === 'portrait' ? '105mm 148mm' :
                       paperSize === 'Sticker' && orientation === 'landscape' ? '70mm 100mm' :
                       paperSize === 'Sticker' && orientation === 'portrait' ? '100mm 70mm' :
                       paperSize === 'Sticker-Large' && orientation === 'landscape' ? '100mm 150mm' :
                       paperSize === 'Sticker-Large' && orientation === 'portrait' ? '150mm 100mm' :
                       paperSize === 'Sticker-Small' && orientation === 'landscape' ? '50mm 80mm' :
                       paperSize === 'Sticker-Small' && orientation === 'portrait' ? '80mm 50mm' :
                       paperSize === 'Sticker-Square' ? '90mm 90mm' :
                       paperSize === 'Letter' && orientation === 'landscape' ? 'letter landscape' :
                       'letter portrait'} !important;
                margin: 0 !important;
              }
            }
          `}
        </style>
        {orders.map((order, orderIndex) => (
          <div key={order.id} className="invoice-page" style={{ 
            marginBottom: orderIndex < orders.length - 1 ? '20mm' : '0',
            pageBreakAfter: orderIndex < orders.length - 1 ? 'always' : 'auto'
          }}>
            {/* Header with larger logos */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '25px',
              gap: '20px'
            }}>
              {/* Platform Logo (Right) */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: '1'
              }}>
                {platformLogo && (
                  <>
                    <img 
                      src={platformLogo} 
                      alt="شعار المنصة" 
                      style={{ 
                        width: `calc(${currentSize.logoSize} * 1.4)`, 
                        height: `calc(${currentSize.logoSize} * 1.4)`, 
                        objectFit: 'contain',
                        border: '3px solid #333',
                        borderRadius: '12px',
                        padding: '8px',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <div style={{
                      fontSize: `calc(${currentSize.fontSize} * 0.6)`,
                      marginTop: '4px',
                      fontWeight: 'bold',
                      color: '#666',
                      textAlign: 'center'
                    }}>
                      {platformName}
                    </div>
                  </>
                )}
              </div>

              {/* QR Code in center */}
              <div style={{ 
                flex: '1', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {qrCodes[order.id] && (
                  <img
                    src={qrCodes[order.id]}
                    alt={`باركود الطلب ${order.orderNumber || order.id.slice(-6)}`}
                    style={{ 
                      width: `calc(${currentSize.qrSize} * 1.5)`, 
                      height: `calc(${currentSize.qrSize} * 1.5)`,
                      border: '3px solid #333',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      padding: '4px'
                    }}
                  />
                )}
              </div>

              {/* Company Logo (Left) */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: '1'
              }}>
                {selectedDeliveryCompany?.logo && (
                  <>
                    <img 
                      src={selectedDeliveryCompany.logo} 
                      alt="شعار شركة التوصيل" 
                      style={{ 
                        width: `calc(${currentSize.logoSize} * 1.4)`, 
                        height: `calc(${currentSize.logoSize} * 1.4)`, 
                        objectFit: 'contain',
                        border: '3px solid #333',
                        borderRadius: '12px',
                        padding: '8px',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <div style={{
                      fontSize: `calc(${currentSize.fontSize} * 0.6)`,
                      marginTop: '4px',
                      fontWeight: 'bold',
                      color: '#666',
                      textAlign: 'center'
                    }}>
                      {selectedDeliveryCompany.name}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Invoice Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '15px',
              borderBottom: `3px solid #000`,
              paddingBottom: '12px'
            }}>
              <h1 style={{
                fontSize: `calc(${currentSize.titleSize} * 1.5)`,
                fontWeight: 'bold',
                margin: '0 0 8px 0'
              }}>
                فاتورة رقم: {order.orderNumber || order.id.slice(-6)} #
              </h1>
              
              <div style={{ fontSize: `calc(${currentSize.fontSize} * 1.1)`, color: '#333', fontWeight: 'bold' }}>
                التاريخ: {formatDate(currentDate)} | {selectedDeliveryCompany?.name || platformName}
              </div>
            </div>

            {/* Customer and Platform Information Tables */}
            <div style={{ 
              display: 'flex',
              gap: '15px',
              marginBottom: '15px'
            }}>
              {/* Customer Information Table - Right */}
              <div style={{ 
                flex: '1',
                border: '2px solid #333',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#ffffff'
              }}>
                <div style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '8px',
                  fontWeight: 'bold',
                  fontSize: `calc(${currentSize.fontSize} * 1.1)`,
                  textAlign: 'center'
                }}>
                  بيانات العميل
                </div>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: `calc(${currentSize.fontSize} * 1.0)`,
                  fontWeight: '500'
                }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd', 
                        fontWeight: 'bold',
                        width: '40%'
                      }}>العميل:</td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd'
                      }}>{order.customerName}</td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd', 
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa'
                      }}>الهاتف:</td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd'
                      }}>{order.customerPhone}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd', 
                        fontWeight: 'bold'
                      }}>المحافظة:</td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd'
                      }}>{order.customerGovernorate}</td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd', 
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa'
                      }}>العنوان:</td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd'
                      }}>{order.customerAddress}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Platform Information Table - Left */}
              <div style={{ 
                flex: '1',
                border: '2px solid #333',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#ffffff'
              }}>
                <div style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '8px',
                  fontWeight: 'bold',
                  fontSize: `calc(${currentSize.fontSize} * 1.1)`,
                  textAlign: 'center'
                }}>
                  بيانات البيج
                </div>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: `calc(${currentSize.fontSize} * 1.0)`,
                  fontWeight: '500'
                }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd', 
                        fontWeight: 'bold',
                        width: '40%'
                      }}>البيج:</td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd'
                      }}>{platformName}</td>
                    </tr>
                    {selectedDeliveryCompany?.reportsPhone && (
                      <tr>
                        <td style={{ 
                          padding: '6px 10px', 
                          border: '1px solid #ddd', 
                          fontWeight: 'bold',
                          backgroundColor: '#f8f9fa'
                        }}>رقم البلاغات:</td>
                        <td style={{ 
                          padding: '6px 10px', 
                          border: '1px solid #ddd'
                        }}>{selectedDeliveryCompany.reportsPhone}</td>
                      </tr>
                    )}
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd', 
                        fontWeight: 'bold'
                      }}>التاريخ:</td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd'
                      }}>{formatDateWithDay(new Date(order.createdAt || order.orderDate || currentDate))}</td>
                    </tr>
                    {printDate && (
                      <tr>
                        <td style={{ 
                          padding: '6px 10px', 
                          border: '1px solid #ddd', 
                          fontWeight: 'bold',
                          backgroundColor: '#f8f9fa'
                        }}>تاريخ الطباعة:</td>
                        <td style={{ 
                          padding: '6px 10px', 
                          border: '1px solid #ddd'
                        }}>{formatDateWithDay(printDate)}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd', 
                        fontWeight: 'bold',
                        backgroundColor: '#f8f9fa'
                      }}>رقم الطلب:</td>
                      <td style={{ 
                        padding: '6px 10px', 
                        border: '1px solid #ddd'
                      }}>{order.orderNumber || order.id.slice(-6)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Information */}
            <div style={{ 
              border: '3px solid #000', 
              padding: '12px', 
              marginBottom: '15px', 
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: `calc(${currentSize.fontSize} * 1.4)`, 
                fontWeight: 'bold', 
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                {order.productName}
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: `calc(${currentSize.fontSize} * 1.1)`
              }}>
                <div>
                  {(order.selectedColorName || order.selectedShapeName || order.selectedSizeName) && (
                    <div style={{ 
                      backgroundColor: '#e9ecef', 
                      padding: '6px 10px', 
                      borderRadius: '5px',
                      fontSize: `calc(${currentSize.fontSize} * 1.0)`,
                      fontWeight: 'bold'
                    }}>
                      {[order.selectedColorName, order.selectedShapeName, order.selectedSizeName]
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                  )}
                  {order.offer && (
                    <div style={{ 
                      marginTop: '5px', 
                      color: '#28a745', 
                      fontWeight: 'bold',
                      fontSize: `calc(${currentSize.fontSize} * 1.0)`
                    }}>
                      العرض: {order.offer}
                    </div>
                  )}
                </div>
                <div style={{ 
                  fontSize: `calc(${currentSize.fontSize} * 1.4)`, 
                  fontWeight: 'bold' 
                }}>
                  الكمية: {order.quantity || 1}
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            {selectedDeliveryCompany && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '10px',
                fontSize: `calc(${currentSize.fontSize} * 0.8)`,
                color: '#666',
                gap: '10px'
              }}>
                <div>🚚 التوصيل: {selectedDeliveryCompany.name}</div>
                {selectedDeliveryCompany.reportsPhone && (
                  <div>📋 بلاغات: {selectedDeliveryCompany.reportsPhone}</div>
                )}
              </div>
            )}

            {/* Total Amount */}
            <div style={{ 
              textAlign: 'center',
              backgroundColor: '#000000',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <div style={{ 
                fontSize: `calc(${currentSize.fontSize} * 1.2)`, 
                fontWeight: 'bold',
                direction: 'ltr'
              }}>
                المبلغ الإجمالي: <span style={{ fontSize: `calc(${currentSize.fontSize} * 1.8)` }}>{((order as any).totalAmount || (order as any).total || (order as any).price || 0).toLocaleString('en-US')}</span> د.ع
              </div>
            </div>

            {/* Notes Section - Always visible */}
            <div style={{ 
              marginBottom: '15px',
              backgroundColor: '#f9f9f9',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              minHeight: '50px'
            }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: `calc(${currentSize.fontSize} * 1.3)`, 
                fontWeight: 'bold',
                borderBottom: '2px solid #ccc',
                paddingBottom: '5px'
              }}>
                ملاحظات
              </h3>
              <div style={{ 
                fontSize: `calc(${currentSize.fontSize} * 1.2)`, 
                lineHeight: '1.5',
                minHeight: '20px',
                color: ((order as any).notes && (order as any).notes.trim() !== '') ? '#000' : '#999',
                fontStyle: ((order as any).notes && (order as any).notes.trim() !== '') ? 'normal' : 'italic',
                fontWeight: '500'
              }}>
                {((order as any).notes && (order as any).notes.trim() !== '') 
                  ? (order as any).notes 
                  : 'لا توجد ملاحظات'
                }
              </div>
            </div>

            {/* Page Number - Always visible */}
            <div style={{
              textAlign: 'center',
              fontSize: `calc(${currentSize.fontSize} * 0.9)`,
              color: '#333',
              marginTop: '15px',
              borderTop: '2px solid #000',
              paddingTop: '8px',
              fontWeight: 'bold'
            }}>
              {orders.length > 1 
                ? `صفحة ${orderIndex + 1} من ${orders.length}` 
                : `صفحة ${pageNumber || 1}`
              }
            </div>
          </div>
        ))}
      </div>
    );
  }
);

MinimalInvoice.displayName = 'MinimalInvoice';

export default MinimalInvoice;