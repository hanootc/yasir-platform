import React, { useState, useEffect } from 'react';
import { Order } from '@shared/schema';
import QRCode from 'qrcode';

interface SimpleLargeInvoiceProps {
  orders: Order[];
  platformLogo?: string;
  platformName: string;
  deliverySettings?: any;
  selectedDeliveryCompany?: any;
  paperSize?: string;
  orientation?: string;
  fontScale?: 'small' | 'normal' | 'large';
  printDate?: Date | null;
}

export function SimpleLargeInvoice({ 
  orders, 
  platformLogo, 
  platformName, 
  deliverySettings,
  selectedDeliveryCompany,
  paperSize = 'A5',
  orientation = 'portrait',
  fontScale = 'normal',
  printDate
}: SimpleLargeInvoiceProps) {
  const [qrCodes, setQrCodes] = useState<{[key: string]: string}>({});

  const formatDate = (date: string | Date) => {
    if (!date) return new Date().toLocaleDateString('ar');
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar');
  };

  const formatDateWithDay = (date: Date) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = days[date.getDay()];
    const dateString = formatDate(date);
    return `${dayName} ${dateString}`;
  };

  useEffect(() => {
    const generateQRCodes = async () => {
      const codes: {[key: string]: string} = {};
      
      for (const order of orders) {
        try {
          const qrData = order.orderNumber || order.id.slice(-6);
          
          const qrCodeUrl = await QRCode.toDataURL(qrData, {
            width: 120,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          codes[order.id] = qrCodeUrl;
        } catch (error) {
          console.error('Error generating QR code for order', order.id, error);
        }
      }
      
      setQrCodes(codes);
    };

    generateQRCodes();
  }, [orders]);

  const paperSizes = {
    A3: { 
      portrait: { 
        width: '297mm', height: '420mm', padding: '15mm', 
        fontSize: '16px', titleSize: '20px', logoSize: '90px', qrSize: '80px',
        fontSizeSmall: '12px', titleSizeSmall: '15px', logoSizeSmall: '70px', qrSizeSmall: '60px',
        fontSizeLarge: '20px', titleSizeLarge: '25px', logoSizeLarge: '110px', qrSizeLarge: '100px'
      },
      landscape: { 
        width: '420mm', height: '297mm', padding: '12mm', 
        fontSize: '14px', titleSize: '18px', logoSize: '80px', qrSize: '70px',
        fontSizeSmall: '10px', titleSizeSmall: '13px', logoSizeSmall: '60px', qrSizeSmall: '50px',
        fontSizeLarge: '18px', titleSizeLarge: '23px', logoSizeLarge: '100px', qrSizeLarge: '90px'
      }
    },
    A4: { 
      portrait: { 
        width: '210mm', height: '297mm', padding: '12mm', 
        fontSize: '14px', titleSize: '18px', logoSize: '80px', qrSize: '70px',
        fontSizeSmall: '10px', titleSizeSmall: '13px', logoSizeSmall: '60px', qrSizeSmall: '50px',
        fontSizeLarge: '18px', titleSizeLarge: '23px', logoSizeLarge: '100px', qrSizeLarge: '90px'
      },
      landscape: { 
        width: '297mm', height: '210mm', padding: '10mm', 
        fontSize: '12px', titleSize: '16px', logoSize: '70px', qrSize: '60px',
        fontSizeSmall: '8px', titleSizeSmall: '11px', logoSizeSmall: '50px', qrSizeSmall: '40px',
        fontSizeLarge: '16px', titleSizeLarge: '21px', logoSizeLarge: '90px', qrSizeLarge: '80px'
      }
    },
    A5: { 
      portrait: { 
        width: '148mm', height: '210mm', padding: '10mm', 
        fontSize: '12px', titleSize: '16px', logoSize: '70px', qrSize: '60px',
        fontSizeSmall: '8px', titleSizeSmall: '11px', logoSizeSmall: '50px', qrSizeSmall: '40px',
        fontSizeLarge: '16px', titleSizeLarge: '21px', logoSizeLarge: '90px', qrSizeLarge: '80px'
      },
      landscape: { 
        width: '210mm', height: '148mm', padding: '8mm', 
        fontSize: '11px', titleSize: '14px', logoSize: '60px', qrSize: '55px',
        fontSizeSmall: '7px', titleSizeSmall: '9px', logoSizeSmall: '40px', qrSizeSmall: '35px',
        fontSizeLarge: '15px', titleSizeLarge: '19px', logoSizeLarge: '80px', qrSizeLarge: '75px'
      }
    },
    A6: { 
      portrait: { 
        width: '105mm', height: '148mm', padding: '6mm', 
        fontSize: '10px', titleSize: '12px', logoSize: '50px', qrSize: '45px',
        fontSizeSmall: '6px', titleSizeSmall: '8px', logoSizeSmall: '35px', qrSizeSmall: '30px',
        fontSizeLarge: '14px', titleSizeLarge: '16px', logoSizeLarge: '65px', qrSizeLarge: '60px'
      },
      landscape: { 
        width: '148mm', height: '105mm', padding: '5mm', 
        fontSize: '9px', titleSize: '11px', logoSize: '45px', qrSize: '40px',
        fontSizeSmall: '5px', titleSizeSmall: '7px', logoSizeSmall: '30px', qrSizeSmall: '25px',
        fontSizeLarge: '13px', titleSizeLarge: '15px', logoSizeLarge: '60px', qrSizeLarge: '55px'
      }
    },
    Letter: { 
      portrait: { 
        width: '8.5in', height: '11in', padding: '0.6in', 
        fontSize: '14px', titleSize: '18px', logoSize: '80px', qrSize: '70px',
        fontSizeSmall: '10px', titleSizeSmall: '13px', logoSizeSmall: '60px', qrSizeSmall: '50px',
        fontSizeLarge: '18px', titleSizeLarge: '23px', logoSizeLarge: '100px', qrSizeLarge: '90px'
      },
      landscape: { 
        width: '11in', height: '8.5in', padding: '0.5in', 
        fontSize: '12px', titleSize: '16px', logoSize: '70px', qrSize: '60px',
        fontSizeSmall: '8px', titleSizeSmall: '11px', logoSizeSmall: '50px', qrSizeSmall: '40px',
        fontSizeLarge: '16px', titleSizeLarge: '21px', logoSizeLarge: '90px', qrSizeLarge: '80px'
      }
    },
    Sticker: { 
      portrait: { 
        width: '100mm', height: '70mm', padding: '3mm', 
        fontSize: '8px', titleSize: '10px', logoSize: '25px', qrSize: '20px',
        fontSizeSmall: '5px', titleSizeSmall: '6px', logoSizeSmall: '18px', qrSizeSmall: '15px',
        fontSizeLarge: '11px', titleSizeLarge: '14px', logoSizeLarge: '32px', qrSizeLarge: '27px'
      },
      landscape: { 
        width: '70mm', height: '100mm', padding: '3mm', 
        fontSize: '8px', titleSize: '10px', logoSize: '25px', qrSize: '20px',
        fontSizeSmall: '5px', titleSizeSmall: '6px', logoSizeSmall: '18px', qrSizeSmall: '15px',
        fontSizeLarge: '11px', titleSizeLarge: '14px', logoSizeLarge: '32px', qrSizeLarge: '27px'
      }
    },
    'Sticker-Large': { 
      portrait: { 
        width: '150mm', height: '100mm', padding: '4mm', 
        fontSize: '10px', titleSize: '12px', logoSize: '35px', qrSize: '30px',
        fontSizeSmall: '6px', titleSizeSmall: '8px', logoSizeSmall: '25px', qrSizeSmall: '20px',
        fontSizeLarge: '14px', titleSizeLarge: '16px', logoSizeLarge: '45px', qrSizeLarge: '40px'
      },
      landscape: { 
        width: '100mm', height: '150mm', padding: '4mm', 
        fontSize: '10px', titleSize: '12px', logoSize: '35px', qrSize: '30px',
        fontSizeSmall: '6px', titleSizeSmall: '8px', logoSizeSmall: '25px', qrSizeSmall: '20px',
        fontSizeLarge: '14px', titleSizeLarge: '16px', logoSizeLarge: '45px', qrSizeLarge: '40px'
      }
    },
    'Sticker-Small': { 
      portrait: { 
        width: '80mm', height: '50mm', padding: '2mm', 
        fontSize: '7px', titleSize: '8px', logoSize: '20px', qrSize: '15px',
        fontSizeSmall: '4px', titleSizeSmall: '5px', logoSizeSmall: '15px', qrSizeSmall: '10px',
        fontSizeLarge: '10px', titleSizeLarge: '11px', logoSizeLarge: '25px', qrSizeLarge: '20px'
      },
      landscape: { 
        width: '50mm', height: '80mm', padding: '2mm', 
        fontSize: '7px', titleSize: '8px', logoSize: '20px', qrSize: '15px',
        fontSizeSmall: '4px', titleSizeSmall: '5px', logoSizeSmall: '15px', qrSizeSmall: '10px',
        fontSizeLarge: '10px', titleSizeLarge: '11px', logoSizeLarge: '25px', qrSizeLarge: '20px'
      }
    },
    'Sticker-Square': { 
      portrait: { 
        width: '90mm', height: '90mm', padding: '3mm', 
        fontSize: '9px', titleSize: '11px', logoSize: '30px', qrSize: '25px',
        fontSizeSmall: '6px', titleSizeSmall: '7px', logoSizeSmall: '20px', qrSizeSmall: '15px',
        fontSizeLarge: '12px', titleSizeLarge: '15px', logoSizeLarge: '40px', qrSizeLarge: '35px'
      },
      landscape: { 
        width: '90mm', height: '90mm', padding: '3mm', 
        fontSize: '9px', titleSize: '11px', logoSize: '30px', qrSize: '25px',
        fontSizeSmall: '6px', titleSizeSmall: '7px', logoSizeSmall: '20px', qrSizeSmall: '15px',
        fontSizeLarge: '12px', titleSizeLarge: '15px', logoSizeLarge: '40px', qrSizeLarge: '35px'
      }
    }
  };

  const baseSizes = paperSizes[paperSize as keyof typeof paperSizes]?.[orientation as 'portrait' | 'landscape'] || paperSizes.A5.portrait;
  
  // Apply font scaling based on fontScale prop
  const currentSize = {
    ...baseSizes,
    fontSize: fontScale === 'small' ? baseSizes.fontSizeSmall : fontScale === 'large' ? baseSizes.fontSizeLarge : baseSizes.fontSize,
    titleSize: fontScale === 'small' ? baseSizes.titleSizeSmall : fontScale === 'large' ? baseSizes.titleSizeLarge : baseSizes.titleSize,
    logoSize: fontScale === 'small' ? baseSizes.logoSizeSmall : fontScale === 'large' ? baseSizes.logoSizeLarge : baseSizes.logoSize,
    qrSize: fontScale === 'small' ? baseSizes.qrSizeSmall : fontScale === 'large' ? baseSizes.qrSizeLarge : baseSizes.qrSize,
  };
  const currentDate = new Date();

  return (
    <div>
      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: 100% !important;
            }
            
            .invoice-page {
              width: 100% !important;
              height: 100vh !important;
              padding: ${currentSize.padding} !important;
              margin: 0 !important;
              page-break-after: always !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              position: relative !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            
            .invoice-page:last-child {
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
              padding: 0 !important;
            }
            
            img {
              max-width: 100% !important;
              height: auto !important;
              page-break-inside: avoid !important;
            }
            
            div, p, h1, h2, h3 {
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>
      
      <div style={{
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        color: '#000000',
        backgroundColor: 'white',
        fontSize: currentSize.fontSize
      }}>
        {orders.map((order, orderIndex) => (
          <div key={order.id} className="invoice-page" style={{ 
            width: currentSize.width,
            height: currentSize.height,
            padding: currentSize.padding,
            margin: '0',
            pageBreakAfter: orderIndex < orders.length - 1 ? 'always' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
          {/* Header Section */}
          <div>
            {/* الشعارات والباركود في بداية الفاتورة */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              {/* شعار شركة التوصيل - يمين */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: '1'
              }}>
                {selectedDeliveryCompany?.logo && (
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src={selectedDeliveryCompany.logo} 
                      alt="شعار شركة التوصيل"
                      style={{
                        width: `calc(${currentSize.logoSize} * 1.6)`,
                        height: `calc(${currentSize.logoSize} * 1.6)`,
                        objectFit: 'contain'
                      }}
                    />
                    <div style={{ 
                      fontSize: currentSize.fontSize, 
                      marginTop: '8px',
                      fontWeight: 'bold',
                      color: '#000000'
                    }}>
                      {selectedDeliveryCompany.name}
                    </div>
                  </div>
                )}
              </div>

              {/* الباركود ورقم الطلب - وسط */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: '1'
              }}>
                {qrCodes[order.id] && (
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src={qrCodes[order.id]} 
                      alt="QR Code للوصل"
                      style={{
                        width: `calc(${currentSize.qrSize} * 1.5)`,
                        height: `calc(${currentSize.qrSize} * 1.5)`,
                        border: '2px solid #000000'
                      }}
                    />
                    <div style={{ 
                      fontSize: `calc(${currentSize.fontSize} * 1.8)`, 
                      marginTop: '8px',
                      fontWeight: 'bold',
                      color: '#000000'
                    }}>
                      {order.orderNumber || order.id?.slice(-6)} #
                    </div>
                    <div style={{ 
                      fontSize: `calc(${currentSize.fontSize} * 0.8)`, 
                      marginTop: '4px',
                      color: '#666'
                    }}>
                      التاريخ: {formatDate(order.createdAt || currentDate)}
                    </div>
                  </div>
                )}
              </div>

              {/* شعار المنصة - يسار */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: '1'
              }}>
                {platformLogo && (
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src={platformLogo} 
                      alt="شعار المنصة"
                      style={{
                        width: `calc(${currentSize.logoSize} * 1.3)`,
                        height: `calc(${currentSize.logoSize} * 1.3)`,
                        objectFit: 'contain'
                      }}
                    />
                    <div style={{ 
                      fontSize: currentSize.fontSize, 
                      marginTop: '8px',
                      fontWeight: 'bold',
                      color: '#000000'
                    }}>
                      {platformName}
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* Customer and Platform Information */}
            <div style={{ 
              display: 'flex',
              gap: '10px',
              marginBottom: '15px'
            }}>
              {/* Customer Information - Right */}
              <div style={{ 
                flex: '1',
                backgroundColor: '#f8f8f8',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: currentSize.fontSize, 
                  fontWeight: 'bold',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '5px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '5px',
                  borderRadius: '3px',
                  textAlign: 'center'
                }}>
                  بيانات العميل
                </h3>
                <div style={{ fontSize: `calc(${currentSize.fontSize} * 1.0)`, lineHeight: '1.6' }}>
                  <div><strong>الاسم:</strong> {order.customerName}</div>
                  <div><strong>الهاتف:</strong> {order.customerPhone}</div>
                  <div><strong>العنوان:</strong> {order.customerAddress}</div>
                  {order.customerGovernorate && (
                    <div><strong>المحافظة:</strong> {order.customerGovernorate}</div>
                  )}
                </div>
              </div>

              {/* Platform Information - Left */}
              <div style={{ 
                flex: '1',
                backgroundColor: '#f0f8ff',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: currentSize.fontSize, 
                  fontWeight: 'bold',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '5px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '5px',
                  borderRadius: '3px',
                  textAlign: 'center'
                }}>
                  بيانات البيج
                </h3>
                <div style={{ fontSize: `calc(${currentSize.fontSize} * 1.0)`, lineHeight: '1.6' }}>
                  <div><strong>البيج:</strong> {platformName}</div>
                  {selectedDeliveryCompany?.reportsPhone && (
                    <div><strong>رقم البلاغات:</strong> {selectedDeliveryCompany.reportsPhone}</div>
                  )}
                  <div><strong>رقم الطلب:</strong> {order.orderNumber || order.id?.slice(-6)}</div>
                  <div><strong>التاريخ:</strong> {formatDateWithDay(new Date(order.createdAt || order.orderDate || new Date()))}</div>
                  {printDate && (
                    <div><strong>تاريخ الطباعة:</strong> {formatDateWithDay(printDate)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div style={{ 
              marginBottom: '15px',
              backgroundColor: '#f0f0f0',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: currentSize.fontSize, 
                fontWeight: 'bold',
                borderBottom: '1px solid #ccc',
                paddingBottom: '5px'
              }}>
                تفاصيل المنتج
              </h3>
              <div style={{ fontSize: `calc(${currentSize.fontSize} * 1.3)`, lineHeight: '1.6' }}>
                <div><strong>المنتج:</strong> {(order as any).productName || (order as any).product?.name}</div>
                <div><strong>الكمية:</strong> {(order as any).quantity || 1}</div>
                {(order as any).selectedColorName && (
                  <div><strong>اللون:</strong> {(order as any).selectedColorName}</div>
                )}
                {(order as any).selectedSizeName && (
                  <div><strong>الحجم:</strong> {(order as any).selectedSizeName}</div>
                )}
                {(order as any).selectedShapeName && (
                  <div><strong>الشكل:</strong> {(order as any).selectedShapeName}</div>
                )}
              </div>
            </div>

            {/* Total Amount */}
            <div style={{ 
              textAlign: 'center',
              backgroundColor: '#000000',
              color: 'white',
              padding: '6px',
              borderRadius: '5px',
              marginBottom: '10px'
            }}>
              <div style={{ 
                fontSize: `calc(${currentSize.fontSize} * 0.9)`, 
                fontWeight: 'bold',
                direction: 'ltr'
              }}>
                المبلغ الإجمالي: <span style={{ fontSize: `calc(${currentSize.fontSize} * 1.5)` }}>{((order as any).totalAmount || (order as any).total || (order as any).price || 0).toLocaleString('en-US')}</span> د.ع
              </div>
            </div>

            {/* Delivery Company Contact Info */}
            {selectedDeliveryCompany && (
              <div style={{ 
                marginBottom: '8px',
                backgroundColor: '#f0f8ff',
                padding: '6px',
                border: '1px solid #007bff',
                borderRadius: '5px',
                fontSize: `calc(${currentSize.fontSize} * 0.9)`
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div>
                    <strong>شركة التوصيل:</strong> {selectedDeliveryCompany.name}
                  </div>
                  {selectedDeliveryCompany.reportsPhone && (
                    <div>📋 بلاغات: {selectedDeliveryCompany.reportsPhone}</div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Section - Always visible */}
            <div style={{ 
              marginBottom: '10px',
              backgroundColor: '#f9f9f9',
              padding: '6px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              minHeight: '35px'
            }}>
              <h3 style={{ 
                margin: '0 0 4px 0', 
                fontSize: `calc(${currentSize.fontSize} * 1.1)`, 
                fontWeight: 'bold',
                borderBottom: '1px solid #ccc',
                paddingBottom: '3px'
              }}>
                ملاحظات
              </h3>
              <div style={{ 
                fontSize: `calc(${currentSize.fontSize} * 1.1)`, 
                lineHeight: '1.4',
                minHeight: '15px',
                color: ((order as any).notes && (order as any).notes.trim() !== '') ? '#000' : '#999',
                fontStyle: ((order as any).notes && (order as any).notes.trim() !== '') ? 'normal' : 'italic'
              }}>
                {((order as any).notes && (order as any).notes.trim() !== '') 
                  ? (order as any).notes 
                  : 'لا توجد ملاحظات'
                }
              </div>
            </div>

            {/* Page Number */}
            <div style={{ 
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: `calc(${currentSize.fontSize} * 0.9)`,
              color: '#333',
              fontWeight: 'bold',
              backgroundColor: 'white',
              padding: '2px 8px',
              borderRadius: '3px',
              border: '1px solid #ddd'
            }}>
              الصفحة {orderIndex + 1} من {orders.length}
            </div>

          </div>


          </div>
        ))}
      </div>
    </div>
  );
}