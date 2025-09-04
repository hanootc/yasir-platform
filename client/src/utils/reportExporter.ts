import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// دالة لتحويل النصوص العربية إلى تمثيل يمكن عرضه في PDF
const processArabicText = (text: string): string => {
  // للنصوص العربية، سنعكس النص لتحسين العرض في PDF
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(text)) {
    // تحويل النص العربي لعرض أفضل في PDF
    return text.split(' ').reverse().join(' ');
  }
  return text;
};

// دالة لتنسيق الأرقام
const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('en-US');
};

// دالة لتنسيق العملة
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' د.ع';
};

// دالة لتنسيق التاريخ
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('ar-IQ');
};

export interface ReportsData {
  overview: {
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    orders: number;
    revenue: number;
    imageUrl?: string;
  }>;
  orderAnalytics: {
    statusBreakdown: Array<{ status: string; count: number; percentage: number; }>;
    governorateBreakdown: Array<{ governorate: string; count: number; revenue: number; }>;
  };
  tiktokAnalytics: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalImpressions: number;
    totalClicks: number;
    totalSpend: number;
    leads: number;
    ctr: number;
    cpc: number;
  };
}

// تصدير تقرير PDF
export const exportReportToPDF = (data: ReportsData, dateRange: string, reportType: string = 'comprehensive') => {
  const doc = new jsPDF();
  
  // إعداد الخط
  doc.setFont('helvetica');
  doc.setFontSize(16);
  
  // العنوان باللغة العربية مع معالجة النص
  const reportTitle = reportType === 'sales' ? processArabicText('تقرير المبيعات') :
                     reportType === 'products' ? processArabicText('تقرير المنتجات') :
                     reportType === 'customers' ? processArabicText('تقرير العملاء') :
                     reportType === 'tiktok' ? processArabicText('تقرير إعلانات TikTok') :
                     processArabicText('تقرير تحليلات المنصة');
  
  doc.text(reportTitle, 105, 20, { align: 'center' });
  doc.text(processArabicText(`فترة التقرير: ${dateRange}`), 105, 30, { align: 'center' });
  
  let yPos = 50;
  
  // إضافة أقسام مختلفة حسب نوع التقرير
  if (reportType === 'comprehensive' || reportType === 'sales') {
    // نظرة عامة
    doc.setFontSize(14);
    doc.text(processArabicText('نظرة عامة'), 20, yPos);
    yPos += 10;
  
  const overviewData = [
    [processArabicText('إجمالي المبيعات'), formatCurrency(data.overview.totalSales)],
    [processArabicText('إجمالي الطلبات'), formatNumber(data.overview.totalOrders)],
    [processArabicText('إجمالي المنتجات'), formatNumber(data.overview.totalProducts)],
    [processArabicText('إجمالي العملاء'), formatNumber(data.overview.totalCustomers)],
    [processArabicText('معدل التحويل'), `${data.overview.conversionRate}%`],
    [processArabicText('متوسط قيمة الطلب'), formatCurrency(data.overview.averageOrderValue)]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [[processArabicText('المقياس'), processArabicText('القيمة')]],
    body: overviewData,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [91, 33, 182] },
  });
  
    yPos = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // أفضل المنتجات
  if ((reportType === 'comprehensive' || reportType === 'products') && data.topProducts && data.topProducts.length > 0) {
    doc.text(processArabicText('أفضل المنتجات'), 20, yPos);
    yPos += 10;
    
    const productsData = data.topProducts.slice(0, 10).map(product => [
      processArabicText(product.name),
      formatNumber(product.orders),
      formatNumber(product.sales),
      formatCurrency(product.revenue)
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [[processArabicText('اسم المنتج'), processArabicText('الطلبات'), processArabicText('الكمية'), processArabicText('الإيرادات')]],
      body: productsData,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [91, 33, 182] },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // إضافة صفحة جديدة إذا لزم الأمر
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  // إحصائيات TikTok
  if (reportType === 'comprehensive' || reportType === 'tiktok') {
    doc.text(processArabicText('إحصائيات إعلانات TikTok'), 20, yPos);
    yPos += 10;
  
  const tiktokData = [
    [processArabicText('إجمالي الحملات'), formatNumber(data.tiktokAnalytics.totalCampaigns)],
    [processArabicText('الحملات النشطة'), formatNumber(data.tiktokAnalytics.activeCampaigns)],
    [processArabicText('إجمالي الانطباعات'), formatNumber(data.tiktokAnalytics.totalImpressions)],
    [processArabicText('إجمالي النقرات'), formatNumber(data.tiktokAnalytics.totalClicks)],
    [processArabicText('إجمالي الإنفاق'), `$${data.tiktokAnalytics.totalSpend.toFixed(2)}`],
    [processArabicText('العملاء المحتملون'), formatNumber(data.tiktokAnalytics.leads)],
    [processArabicText('معدل النقر'), `${data.tiktokAnalytics.ctr.toFixed(2)}%`],
    [processArabicText('تكلفة النقرة'), `$${data.tiktokAnalytics.cpc.toFixed(2)}`]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [[processArabicText('المقياس'), processArabicText('القيمة')]],
    body: tiktokData,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [91, 33, 182] },
  });
  }
  
  // إضافة معلومات إضافية في النهاية
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.text(processArabicText(`تم الإنشاء في: ${new Date().toLocaleDateString('ar-IQ')}`), 20, yPos);
  doc.text(processArabicText('المنصة: نظام إدارة إعلانات TikTok'), 20, yPos + 8);
  
  // حفظ الملف
  const fileName = `platform-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// تصدير تقرير Excel
export const exportReportToExcel = (data: ReportsData, dateRange: string, reportType: string = 'comprehensive') => {
  const workbook = XLSX.utils.book_new();
  
  // ورقة النظرة العامة (للتقرير الشامل أو تقرير المبيعات)
  if (reportType === 'comprehensive' || reportType === 'sales') {
    const overviewData = [
      ['المقياس', 'القيمة'],
      ['إجمالي المبيعات', formatCurrency(data.overview.totalSales)],
      ['إجمالي الطلبات', data.overview.totalOrders],
      ['إجمالي المنتجات', data.overview.totalProducts],
      ['إجمالي العملاء', data.overview.totalCustomers],
      ['معدل التحويل', `${data.overview.conversionRate}%`],
      ['متوسط قيمة الطلب', formatCurrency(data.overview.averageOrderValue)]
    ];
    
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'نظرة عامة');
  }
  
  // ورقة أفضل المنتجات
  if ((reportType === 'comprehensive' || reportType === 'products') && data.topProducts && data.topProducts.length > 0) {
    const productsData = [
      ['اسم المنتج', 'عدد الطلبات', 'الكمية المبيعة', 'الإيرادات']
    ];
    
    data.topProducts.forEach(product => {
      productsData.push([
        product.name,
        product.orders,
        product.sales,
        product.revenue
      ]);
    });
    
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'أفضل المنتجات');
  }
  
  // ورقة إحصائيات الطلبات
  if (data.orderAnalytics.statusBreakdown.length > 0) {
    const statusData = [
      ['حالة الطلب', 'العدد', 'النسبة المئوية']
    ];
    
    data.orderAnalytics.statusBreakdown.forEach(status => {
      const statusName = status.status === 'completed' ? 'مكتملة' :
                        status.status === 'pending' ? 'في الانتظار' :
                        status.status === 'cancelled' ? 'ملغية' : status.status;
      statusData.push([statusName, status.count, `${status.percentage}%`]);
    });
    
    const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'حالة الطلبات');
  }
  
  // ورقة إحصائيات المحافظات
  if (data.orderAnalytics.governorateBreakdown.length > 0) {
    const governorateData = [
      ['المحافظة', 'عدد الطلبات', 'الإيرادات']
    ];
    
    data.orderAnalytics.governorateBreakdown.forEach(gov => {
      governorateData.push([gov.governorate, gov.count, gov.revenue]);
    });
    
    const governorateSheet = XLSX.utils.aoa_to_sheet(governorateData);
    XLSX.utils.book_append_sheet(workbook, governorateSheet, 'إحصائيات المحافظات');
  }
  
  // ورقة إحصائيات TikTok
  if (reportType === 'comprehensive' || reportType === 'tiktok') {
    const tiktokData = [
      ['المقياس', 'القيمة'],
      ['إجمالي الحملات', data.tiktokAnalytics.totalCampaigns],
      ['الحملات النشطة', data.tiktokAnalytics.activeCampaigns],
      ['إجمالي مرات الظهور', data.tiktokAnalytics.totalImpressions],
      ['إجمالي النقرات', data.tiktokAnalytics.totalClicks],
      ['إجمالي الإنفاق', `$${data.tiktokAnalytics.totalSpend.toFixed(2)}`],
      ['العملاء المحتملين', data.tiktokAnalytics.leads],
      ['معدل النقر', `${data.tiktokAnalytics.ctr.toFixed(2)}%`],
      ['تكلفة النقرة', `$${data.tiktokAnalytics.cpc.toFixed(2)}`]
    ];
    
    const tiktokSheet = XLSX.utils.aoa_to_sheet(tiktokData);
    XLSX.utils.book_append_sheet(workbook, tiktokSheet, 'TikTok Ads');
  }
  
  // حفظ الملف مع اسم يعكس نوع التقرير
  const reportName = reportType === 'sales' ? 'sales-report' :
                    reportType === 'products' ? 'products-report' :
                    reportType === 'customers' ? 'customers-report' :
                    reportType === 'tiktok' ? 'tiktok-report' :
                    'platform-report';
  
  const fileName = `${reportName}-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// تصدير تقرير CSV
export const exportReportToCSV = (data: ReportsData, dateRange: string, reportType: string = 'comprehensive') => {
  const csvData = [
    ['نوع البيانات', 'المقياس', 'القيمة'],
    ['نظرة عامة', 'إجمالي المبيعات', formatCurrency(data.overview.totalSales)],
    ['نظرة عامة', 'إجمالي الطلبات', data.overview.totalOrders.toString()],
    ['نظرة عامة', 'إجمالي المنتجات', data.overview.totalProducts.toString()],
    ['نظرة عامة', 'إجمالي العملاء', data.overview.totalCustomers.toString()],
    ['نظرة عامة', 'معدل التحويل', `${data.overview.conversionRate}%`],
    ['نظرة عامة', 'متوسط قيمة الطلب', formatCurrency(data.overview.averageOrderValue)]
  ];
  
  // إضافة بيانات أفضل المنتجات
  if (data.topProducts && data.topProducts.length > 0) {
    data.topProducts.forEach(product => {
      csvData.push([
        'أفضل المنتجات',
        product.name,
        `الطلبات: ${product.orders} | الكمية: ${product.sales} | الإيرادات: ${formatCurrency(product.revenue)}`
      ]);
    });
  }
  
  // تحويل إلى CSV
  const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  // تحميل الملف
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `platform-report-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};