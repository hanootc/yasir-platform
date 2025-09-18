import React, { useState, useEffect } from 'react';
import { AdminProtectedRoute } from '../components/AdminProtectedRoute';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useAuth } from "@/hooks/useAuth";

// Custom hook for admin authentication
function useAdminAuth() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Simplified auth check - just check localStorage first
    const checkAdminAuth = () => {
      try {
        // Check localStorage for admin session first
        const adminSession = localStorage.getItem('sanadi-admin-session');
        if (adminSession) {
          try {
            const session = JSON.parse(adminSession);
            if (session.email === 'admin@sanadi.pro' && session.adminId) {
              setIsAdminAuthenticated(true);
              setIsCheckingAuth(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem('sanadi-admin-session');
          }
        }
        
        // If no localStorage session, assume not authenticated
        setIsAdminAuthenticated(false);
        setIsCheckingAuth(false);
      } catch (error) {
        console.log('Admin auth check failed:', error);
        setIsAdminAuthenticated(false);
        setIsCheckingAuth(false);
      }
    };

    // Run check immediately
    checkAdminAuth();
  }, []);

  const loginAdmin = (userData: any) => {
    setIsAdminAuthenticated(true);
    localStorage.setItem('adminSession', JSON.stringify(userData));
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('adminSession');
    window.location.href = '/system-admin-login';
  };

  return {
    isAdminAuthenticated,
    isCheckingAuth,
    loginAdmin,
    logoutAdmin
  };
}
import jsPDF from "jspdf";

interface Platform {
  id: string;
  platformName: string;
  ownerName: string;
  subdomain: string;
  subscriptionPlan: string;
  status: string;
  subscriptionEndDate: string;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
}

interface SubscriptionFeature {
  id: string;
  plan: string;
  featureName: string;
  featureKey: string;
  isEnabled: boolean;
  limitValue: number;
  description: string;
}

interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  platformName: string;
  ownerName: string;
  phoneNumber: string;
  subscriptionPlan: string;
  status: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  totalRevenue: number;
  createdAt: string;
  subdomain: string;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

interface Payment {
  id: string;
  platformId: string;
  platformName: string;
  ownerName: string;
  orderId: string;
  amount: number;
  subscriptionPlan: string;
  paymentStatus: string;
  transactionId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paidAt: string;
  createdAt: string;
  expiresAt: string;
}

interface SubscriptionStats {
  totalRevenue: number;
  totalPayments: number;
  monthlyRevenue: number;
  monthlyPayments: number;
  expiredSubscriptions: number;
  expiringSoon: number;
}

interface SystemSettings {
  defaultSubscriptionDays: number;
  trialPeriodDays: number;
  autoSuspendExpiredPlatforms: boolean;
  emailNotificationsEnabled: boolean;
  // ZainCash Payment Settings
  zaincashMerchantId: string;
  zaincashMerchantSecret: string;
  zaincashMsisdn: string;
}

function AdminDashboardContent() {
  const { toast } = useToast();
  const { isAdminAuthenticated, isCheckingAuth, logoutAdmin } = useAdminAuth();
  // Remove regular auth check that causes infinite loading
  // const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<SubscriptionFeature | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState(30);
  const [suspensionReason, setSuspensionReason] = useState("");
  
  // حالة إظهار/إخفاء سر التاجر
  const [showMerchantSecret, setShowMerchantSecret] = useState(false);
  const [isSecretAuthorized, setIsSecretAuthorized] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  
  // دالة التحقق من كلمة المرور
  const handlePasswordCheck = () => {
    if (passwordInput === "yaserxp1992") {
      setIsSecretAuthorized(true);
      setShowMerchantSecret(true);
      setShowPasswordModal(false);
      setPasswordInput("");
      toast({
        title: "تم التحقق بنجاح",
        description: "يمكنك الآن رؤية سر التاجر",
        variant: "default",
      });
    } else {
      toast({
        title: "كلمة المرور خاطئة",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };
  
  // دالة لإظهار/إخفاء سر التاجر
  const toggleSecretVisibility = () => {
    if (!isSecretAuthorized) {
      setShowPasswordModal(true);
    } else {
      setShowMerchantSecret(!showMerchantSecret);
    }
  };
  
  // دالة تنظيف النصوص للـ PDF (إزالة الأحرف العربية والخاصة)
  const cleanTextForPDF = (text: string): string => {
    if (!text) return '';
    // إزالة الأحرف العربية والخاصة والاحتفاظ بالإنجليزية والأرقام والرموز الأساسية
    return text.replace(/[^\x00-\x7F]/g, '').replace(/[^\w\s\-._@]/g, '');
  };

  // دالة تحميل فاتورة PDF
  const downloadInvoicePDF = (payment: Payment) => {
    // إنشاء PDF مباشرة باستخدام jsPDF
    const doc = new jsPDF();
    
    // إعداد الخط
    doc.setFont('helvetica', 'normal');
    
    // إضافة العنوان الرئيسي
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('SANDY PRO PLATFORM SUBSCRIPTION INVOICE', 105, 20, { align: 'center' });
    
    // خط فاصل
    doc.setLineWidth(1);
    doc.setDrawColor(79, 70, 229);
    doc.line(20, 25, 190, 25);
    
    let yPos = 40;
    
    // معلومات العميل والدفعة
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('CUSTOMER INFORMATION', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Order Number: ${cleanTextForPDF(payment.orderId)}`, 20, yPos);
    yPos += 6;
    doc.text(`Customer: ${cleanTextForPDF(payment.customerName)}`, 20, yPos);
    yPos += 6;
    doc.text(`Phone: ${cleanTextForPDF(payment.customerPhone)}`, 20, yPos);
    yPos += 6;
    
    if (payment.customerEmail) {
      doc.text(`Email: ${cleanTextForPDF(payment.customerEmail)}`, 20, yPos);
      yPos += 6;
    }
    
    doc.text(`Platform: ${cleanTextForPDF(payment.platformName)}`, 20, yPos);
    yPos += 6;
    doc.text(`Owner: ${cleanTextForPDF(payment.ownerName)}`, 20, yPos);
    yPos += 15;
    
    // تفاصيل الاشتراك
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('SUBSCRIPTION DETAILS', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    const planName = payment.subscriptionPlan === 'basic' ? 'Basic Plan' :
                     payment.subscriptionPlan === 'premium' ? 'Premium Plan' :
                     payment.subscriptionPlan === 'enterprise' ? 'Enterprise Plan' : 
                     payment.subscriptionPlan?.toUpperCase();
    
    doc.text(`Plan Type: ${planName}`, 20, yPos);
    yPos += 6;
    
    const statusText = payment.paymentStatus === 'success' ? 'PAID' :
                       payment.paymentStatus === 'pending' ? 'PENDING' :
                       payment.paymentStatus === 'failed' ? 'FAILED' :
                       payment.paymentStatus === 'cancelled' ? 'CANCELLED' :
                       payment.paymentStatus?.toUpperCase();
    
    // إضافة لون للحالة
    if (payment.paymentStatus === 'success') {
      doc.setTextColor(0, 150, 0);
    } else if (payment.paymentStatus === 'failed') {
      doc.setTextColor(200, 0, 0);
    } else {
      doc.setTextColor(200, 100, 0);
    }
    doc.text(`Payment Status: ${statusText}`, 20, yPos);
    doc.setTextColor(60, 60, 60); // العودة للون العادي
    yPos += 6;
    
    if (payment.transactionId) {
      doc.text(`Transaction ID: ${cleanTextForPDF(payment.transactionId)}`, 20, yPos);
      yPos += 6;
    }
    
    doc.text(`Payment Date: ${new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-US')}`, 20, yPos);
    yPos += 15;
    
    // طريقة الدفع - ZainCash مع شعار نصي
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text('PAYMENT METHOD', 20, yPos);
    yPos += 8;
    
    // رسم مربع للدفعة
    doc.setFillColor(79, 70, 229);
    doc.rect(20, yPos, 150, 20, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('ZainCash', 25, yPos + 8);
    doc.setFontSize(10);
    doc.text('Trusted Electronic Payment Service', 25, yPos + 15);
    
    yPos += 30;
    
    // المبلغ الإجمالي في مربع
    doc.setFillColor(0, 150, 0);
    doc.rect(20, yPos, 170, 25, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`TOTAL AMOUNT: ${payment.amount?.toLocaleString()} IQD`, 105, yPos + 15, { align: 'center' });
    
    // خط فاصل سفلي
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos + 10, 190, yPos + 10);
    
    // تذييل
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for using our services', 105, yPos + 20, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, yPos + 28, { align: 'center' });
    
    // حفظ الملف
    const fileName = `invoice-${payment.orderId}-${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  // دالة عرض الفاتورة في نافذة جديدة
  const showInvoicePreview = (payment: Payment) => {
    // إنشاء HTML للفاتورة
    const createInvoiceHTML = () => {
      const planName = payment.subscriptionPlan === 'basic' ? 'أساسي' :
                       payment.subscriptionPlan === 'premium' ? 'مميز' :
                       payment.subscriptionPlan === 'enterprise' ? 'متقدم' : 
                       payment.subscriptionPlan;
      
      const statusText = payment.paymentStatus === 'success' ? 'نجح' :
                         payment.paymentStatus === 'pending' ? 'معلق' :
                         payment.paymentStatus === 'failed' ? 'فشل' :
                         payment.paymentStatus === 'cancelled' ? 'ملغي' :
                         payment.paymentStatus;
      
      return `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
            body {
              font-family: 'Cairo', sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #333;
              line-height: 1.6;
            }
            .invoice {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 1px solid #ddd;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 30px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section h2 {
              color: #667eea;
              border-bottom: 2px solid #f0f0f0;
              padding-bottom: 10px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .info-label {
              font-weight: 600;
              color: #666;
            }
            .info-value {
              font-weight: 400;
              color: #333;
            }
            .total-section {
              background: #f8f9fa;
              border: 2px solid #28a745;
              border-radius: 10px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .total-amount {
              font-size: 24px;
              font-weight: 700;
              color: #28a745;
              margin: 10px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              background: #f8f9fa;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }
            .status-success {
              background: #d4edda;
              color: #155724;
              border: 1px solid #c3e6cb;
            }
            .status-pending {
              background: #fff3cd;
              color: #856404;
              border: 1px solid #ffeaa7;
            }
            .status-failed {
              background: #f8d7da;
              color: #721c24;
              border: 1px solid #f5c6cb;
            }
            .payment-method-section {
              margin: 20px 0;
            }
            .zaincash-logo {
              animation: pulse 2s ease-in-out infinite;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>فاتورة دفع اشتراك منصة سندي برو</h1>
              <p>رقم الفاتورة: ${payment.orderId}</p>
            </div>
            
            <div class="content">
              <div class="section">
                <h2>معلومات العميل</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">اسم العميل:</span>
                    <span class="info-value">${payment.customerName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">رقم الهاتف:</span>
                    <span class="info-value">${payment.customerPhone}</span>
                  </div>
                  ${payment.customerEmail ? `
                  <div class="info-item">
                    <span class="info-label">البريد الإلكتروني:</span>
                    <span class="info-value">${payment.customerEmail}</span>
                  </div>` : ''}
                </div>
              </div>
              
              <div class="section">
                <h2>معلومات المنصة</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">اسم المنصة:</span>
                    <span class="info-value">${payment.platformName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">مالك المنصة:</span>
                    <span class="info-value">${payment.ownerName}</span>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <h2>تفاصيل الاشتراك</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">خطة الاشتراك:</span>
                    <span class="info-value">${planName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">حالة الدفع:</span>
                    <span class="info-value">
                      <span class="status-badge status-${payment.paymentStatus === 'success' ? 'success' : payment.paymentStatus === 'pending' ? 'pending' : 'failed'}">
                        ${statusText}
                      </span>
                    </span>
                  </div>
                  ${payment.transactionId ? `
                  <div class="info-item">
                    <span class="info-label">معرف المعاملة:</span>
                    <span class="info-value">${payment.transactionId}</span>
                  </div>` : ''}
                  <div class="info-item">
                    <span class="info-label">تاريخ الدفع:</span>
                    <span class="info-value">${new Date(payment.paidAt || payment.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <h2>طريقة الدفع</h2>
                <div class="payment-method-section" style="text-align: center; padding: 20px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 10px; color: white;">
                  <div class="zaincash-logo" style="margin-bottom: 15px;">
                    <div style="display: inline-block; background: white; padding: 10px 20px; border-radius: 50px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                      <span style="color: #4f46e5; font-weight: 800; font-size: 20px; letter-spacing: -0.5px;">ZainCash</span>
                    </div>
                  </div>
                  <h3 style="margin: 10px 0; font-size: 18px; font-weight: 600;">تم الدفع عبر زين كاش</h3>
                  <p style="margin: 5px 0; opacity: 0.9;">خدمة الدفع الإلكتروني الموثوقة في العراق</p>
                  <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px;"><strong>آمنة • سريعة • موثوقة</strong></p>
                  </div>
                </div>
              </div>
              
              <div class="total-section">
                <h2>المبلغ الإجمالي</h2>
                <div class="total-amount">
                  ${payment.amount?.toLocaleString()} دينار عراقي
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>شكراً لكم لاستخدام خدماتنا</p>
              <p>تم إنشاء الفاتورة في: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</p>
            </div>
          </div>
        </body>
        </html>
      `;
    };
    
    // إنشاء نافذة جديدة للفاتورة
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(createInvoiceHTML());
      printWindow.document.close();
      
      // إضافة أزرار للتحكم
      printWindow.onload = () => {
        setTimeout(() => {
          // إضافة أزرار التحكم
          const controlsDiv = printWindow.document.createElement('div');
          controlsDiv.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; z-index: 1000; background: white; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <button onclick="downloadInvoice()" style="background: #007bff; color: white; border: none; padding: 8px 16px; margin: 0 5px; border-radius: 4px; cursor: pointer;">تحميل</button>
              <button onclick="window.print()" style="background: #28a745; color: white; border: none; padding: 8px 16px; margin: 0 5px; border-radius: 4px; cursor: pointer;">طباعة</button>
              <button onclick="window.close()" style="background: #dc3545; color: white; border: none; padding: 8px 16px; margin: 0 5px; border-radius: 4px; cursor: pointer;">إغلاق</button>
            </div>
            <script>
              window.orderId = '${payment.orderId}';
              function downloadInvoice() {
                // إخفاء أزرار التحكم
                const controlsDiv = document.querySelector('div[style*="position: fixed"]');
                if (controlsDiv) {
                  controlsDiv.style.display = 'none';
                }
                
                // إضافة styles للطباعة
                const printStyles = document.createElement('style');
                printStyles.innerHTML = \`
                  @media print {
                    body { margin: 0; }
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                  }
                \`;
                document.head.appendChild(printStyles);
                
                // فتح نافذة الطباعة التي ستسمح بحفظ كـ PDF
                setTimeout(() => {
                  window.print();
                  
                  // إزالة الـ styles وإعادة إظهار الأزرار بعد الطباعة
                  setTimeout(() => {
                    document.head.removeChild(printStyles);
                    if (controlsDiv) {
                      controlsDiv.style.display = 'block';
                    }
                  }, 1000);
                }, 100);
              }
            </script>
          `;
          printWindow.document.body.appendChild(controlsDiv);
        }, 500);
      };
    }
  };
  
  // بيانات فورم إضافة/تعديل الميزة
  const [featureForm, setFeatureForm] = useState({
    featureName: "",
    featureKey: "",
    plan: "basic",
    isEnabled: true,
    limitValue: -1,
    description: ""
  });

  // الإعدادات العامة للنظام
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    defaultSubscriptionDays: 365,
    trialPeriodDays: 7,
    autoSuspendExpiredPlatforms: false,
    emailNotificationsEnabled: false,
    // ZainCash default values - test values
    zaincashMerchantId: "5ffacf6612b5777c6d44266f",
    zaincashMerchantSecret: "$2y$10$hBbAZo2GfSSvyqAyV2j8Kup.LBbxpGIIlIAmCKxFo0OC1Zr3WeZF2",
    zaincashMsisdn: "964770000000"
  });

  // جلب إحصائيات النظام
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  // جلب المنصات
  const { data: platforms, isLoading: platformsLoading } = useQuery({
    queryKey: ["/api/admin/platforms"],
    retry: false,
  });

  // جلب المميزات
  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: ["/api/admin/features"],
    retry: false,
  });

  // جلب سجل الإجراءات
  const { data: adminActions, isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/admin/actions"],
    retry: false,
  });

  // جلب الاشتراكات
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ["/api/admin/subscriptions"],
    retry: false,
  });

  // جلب المدفوعات
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/admin/payments"],
    retry: false,
  });

  // جلب إحصائيات الاشتراكات
  const { data: subscriptionStats, isLoading: subscriptionStatsLoading } = useQuery({
    queryKey: ["/api/admin/subscription-stats"],
    retry: false,
  });

  // جلب الإعدادات العامة للنظام
  const { data: fetchedSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/system-settings"],
    retry: false,
  });

  // تحديث الإعدادات عند جلبها
  useEffect(() => {
    if (fetchedSettings) {
      setSystemSettings(prev => ({
        ...prev,
        ...fetchedSettings,
        // Ensure ZainCash fields have default values if not present
        zaincashMerchantId: (fetchedSettings as any)?.zaincashMerchantId || "5ffacf6612b5777c6d44266f",
        zaincashMerchantSecret: (fetchedSettings as any)?.zaincashMerchantSecret || "$2y$10$hBbAZo2GfSSvyqAyV2j8Kup.LBbxpGIIlIAmCKxFo0OC1Zr3WeZF2",
        zaincashMsisdn: (fetchedSettings as any)?.zaincashMsisdn || "964770000000"
      }));
    }
  }, [fetchedSettings]);

  // طلبات التحديث
  const extendSubscriptionMutation = useMutation({
    mutationFn: async ({ platformId, days, reason }: { platformId: string; days: number; reason: string }) => {
      return await apiRequest("/api/admin/extend-subscription", "POST", { platformId, days, reason });
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تمديد الاشتراك بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowExtendModal(false);
      setSelectedPlatform(null);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تمديد الاشتراك",
        variant: "destructive",
      });
    },
  });

  const suspendPlatformMutation = useMutation({
    mutationFn: async ({ platformId, reason }: { platformId: string; reason: string }) => {
      return await apiRequest("/api/admin/suspend-platform", "POST", { platformId, reason });
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إيقاف المنصة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowSuspendModal(false);
      setSelectedPlatform(null);
      setSuspensionReason("");
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إيقاف المنصة",
        variant: "destructive",
      });
    },
  });

  const activatePlatformMutation = useMutation({
    mutationFn: async ({ platformId, reason }: { platformId: string; reason: string }) => {
      return await apiRequest("/api/admin/activate-platform", "POST", { platformId, reason });
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تفعيل المنصة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تفعيل المنصة",
        variant: "destructive",
      });
    },
  });

  // إضافة ميزة جديدة
  const addFeatureMutation = useMutation({
    mutationFn: async (featureData: any) => {
      return await apiRequest("/api/admin/features", "POST", featureData);
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الميزة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
      setShowFeatureModal(false);
      resetFeatureForm();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الميزة",
        variant: "destructive",
      });
    },
  });

  // حفظ الإعدادات العامة
  const saveSystemSettingsMutation = useMutation({
    mutationFn: async (settings: SystemSettings) => {
      return await apiRequest("/api/admin/system-settings", "PUT", settings);
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم حفظ الإعدادات العامة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-settings"] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  // تحديث ميزة
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ featureId, featureData }: { featureId: string; featureData: any }) => {
      return await apiRequest(`/api/admin/features/${featureId}`, "PUT", featureData);
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الميزة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
      setShowFeatureModal(false);
      resetFeatureForm();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الميزة",
        variant: "destructive",
      });
    },
  });

  // حذف ميزة
  const deleteFeatureMutation = useMutation({
    mutationFn: async (featureId: string) => {
      return await apiRequest(`/api/admin/features/${featureId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم حذف الميزة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/features"] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الميزة",
        variant: "destructive",
      });
    },
  });

  // إعادة تعيين فورم الميزة
  const resetFeatureForm = () => {
    setFeatureForm({
      featureName: "",
      featureKey: "",
      plan: "basic",
      isEnabled: true,
      limitValue: -1,
      description: ""
    });
    setSelectedFeature(null);
  };

  // ملء فورم الميزة للتعديل
  const fillFeatureForm = (feature: SubscriptionFeature) => {
    setFeatureForm({
      featureName: feature.featureName,
      featureKey: feature.featureKey,
      plan: feature.plan,
      isEnabled: feature.isEnabled,
      limitValue: feature.limitValue,
      description: feature.description || ""
    });
    setSelectedFeature(feature);
    setShowFeatureModal(true);
  };

  // حفظ الميزة (إضافة أو تحديث)
  const handleSaveFeature = () => {
    if (selectedFeature) {
      updateFeatureMutation.mutate({
        featureId: selectedFeature.id,
        featureData: featureForm
      });
    } else {
      addFeatureMutation.mutate(featureForm);
    }
  };

  // دوال مساعدة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-red-500';
      case 'expired': return 'bg-red-600';
      case 'pending_verification': return 'bg-yellow-500';
      case 'pending_payment': return 'bg-orange-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'suspended': return 'معلق';
      case 'expired': return 'منتهي الصلاحية';
      case 'pending_verification': return 'في انتظار التحقق';
      case 'pending_payment': return 'في انتظار الدفع';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-500';
      case 'premium': return 'bg-blue-500';
      case 'basic': return 'bg-green-500';
      case 'free': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Remove the old authentication check that was redirecting to /api/login
  // Admin dashboard now uses its own authentication system

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من صلاحية الدخول...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <i className="fas fa-shield-alt text-4xl text-blue-600 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              صفحة الإدارة العامة
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              يجب تسجيل الدخول كمدير نظام للوصول إلى هذه الصفحة
            </p>
            <Button 
              onClick={() => window.location.href = '/system-admin-login'}
              className="w-full"
            >
              تسجيل دخول الإدارة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Remove the loading check that was causing infinite loading

  // Remove duplicate loading check and null return that causes black screen

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="لوحة التحكم الإدارية"
          subtitle="إدارة شاملة للمنصات والاشتراكات والصلاحيات"
        />
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* شريط التنقل السريع */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-theme-primary">لوحة إدارة النظام</h1>
            </div>

            {/* إحصائيات النظام */}
            {systemStats && Object.keys(systemStats).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i className="fas fa-building text-blue-600 dark:text-blue-300"></i>
                      </div>
                      <div className="mr-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المنصات</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{(systemStats as any)?.totalPlatforms || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                        <i className="fas fa-check-circle text-green-600 dark:text-green-300"></i>
                      </div>
                      <div className="mr-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المنصات النشطة</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{(systemStats as any)?.activePlatforms || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                        <i className="fas fa-clock text-yellow-600 dark:text-yellow-300"></i>
                      </div>
                      <div className="mr-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">اشتراكات منتهية الصلاحية</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{(systemStats as any)?.expiredSubscriptions || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                        <i className="fas fa-dollar-sign text-purple-600 dark:text-purple-300"></i>
                      </div>
                      <div className="mr-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الإيرادات</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{((systemStats as any)?.totalRevenue || 0).toLocaleString()} د.ع</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Tabs defaultValue="platforms" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="platforms">إدارة المنصات</TabsTrigger>
                <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
                <TabsTrigger value="payments">المدفوعات</TabsTrigger>
                <TabsTrigger value="features">مميزات الاشتراكات</TabsTrigger>
                <TabsTrigger value="actions">سجل الإجراءات</TabsTrigger>
                <TabsTrigger value="settings">الإعدادات العامة</TabsTrigger>
              </TabsList>

              {/* إدارة المنصات */}
              <TabsContent value="platforms" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>إدارة المنصات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {platformsLoading ? (
                      <div className="text-center py-8">
                        <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                        <p className="mt-2 text-gray-600">جاري تحميل المنصات...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right py-3 px-4">المنصة</th>
                              <th className="text-right py-3 px-4">المالك</th>
                              <th className="text-right py-3 px-4">الخطة</th>
                              <th className="text-right py-3 px-4">الحالة</th>
                              <th className="text-right py-3 px-4">انتهاء الاشتراك</th>
                              <th className="text-right py-3 px-4">الإحصائيات</th>
                              <th className="text-center py-3 px-4">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(platforms as Platform[])?.map((platform: Platform) => {
                              const daysLeft = getDaysUntilExpiry(platform.subscriptionEndDate);
                              const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
                              const isExpired = daysLeft <= 0;

                              return (
                                <tr key={platform.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">{platform.platformName}</p>
                                      <p className="text-sm text-gray-500">{platform.subdomain}.sanadi.pro</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">{platform.ownerName}</td>
                                  <td className="py-3 px-4">
                                    <Badge className={`text-white ${getPlanColor(platform.subscriptionPlan)}`}>
                                      {platform.subscriptionPlan === 'enterprise' ? 'المتطور' :
                                       platform.subscriptionPlan === 'premium' ? 'المحترف' :
                                       platform.subscriptionPlan === 'basic' ? 'البداية' : platform.subscriptionPlan}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge className={`text-white ${getStatusColor(platform.status)}`}>
                                      {getStatusText(platform.status)}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className={`text-sm ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'}`}>
                                        {formatDate(platform.subscriptionEndDate)}
                                      </p>
                                      <p className={`text-xs ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-yellow-500' : 'text-gray-500'}`}>
                                        {isExpired ? 'منتهي الصلاحية' : 
                                         isExpiringSoon ? `${daysLeft} أيام متبقية` : 
                                         `${daysLeft} يوم متبقي`}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="text-sm">
                                      <p>{platform.totalOrders} طلب</p>
                                      <p className="text-gray-500">{platform.totalRevenue?.toLocaleString()} د.ع</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex justify-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedPlatform(platform);
                                          setShowExtendModal(true);
                                        }}
                                      >
                                        <i className="fas fa-calendar-plus"></i>
                                      </Button>
                                      {platform.status === 'active' ? (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => {
                                            setSelectedPlatform(platform);
                                            setShowSuspendModal(true);
                                          }}
                                        >
                                          <i className="fas fa-pause"></i>
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => {
                                            activatePlatformMutation.mutate({
                                              platformId: platform.id,
                                              reason: 'تفعيل من لوحة الإدارة'
                                            });
                                          }}
                                          disabled={activatePlatformMutation.isPending}
                                        >
                                          <i className="fas fa-play"></i>
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            }) || []}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* إدارة الاشتراكات */}
              <TabsContent value="subscriptions" className="space-y-6">
                {/* إحصائيات الاشتراكات */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">إجمالي الإيرادات</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {(subscriptionStats as any)?.totalRevenue?.toLocaleString() || 0} د.ع
                          </p>
                        </div>
                        <i className="fas fa-money-bill-wave text-2xl text-yellow-500"></i>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">مدفوعات هذا الشهر</p>
                          <p className="text-2xl font-bold text-green-600">
                            {(subscriptionStats as any)?.monthlyPayments || 0}
                          </p>
                        </div>
                        <i className="fas fa-calendar-check text-2xl text-green-500"></i>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">اشتراكات منتهية</p>
                          <p className="text-2xl font-bold text-red-600">
                            {(subscriptionStats as any)?.expiredSubscriptions || 0}
                          </p>
                        </div>
                        <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>إدارة الاشتراكات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscriptionsLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right py-3 px-4">اسم المنصة</th>
                              <th className="text-right py-3 px-4">المالك</th>
                              <th className="text-right py-3 px-4">الخطة</th>
                              <th className="text-right py-3 px-4">الحالة</th>
                              <th className="text-right py-3 px-4">تاريخ الانتهاء</th>
                              <th className="text-right py-3 px-4">الأيام المتبقية</th>
                              <th className="text-right py-3 px-4">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(subscriptions as Subscription[])?.map((subscription: Subscription) => {
                              return (
                                <tr key={subscription.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="py-3 px-4">
                                    <div>
                                      <div className="font-medium">{subscription.platformName}</div>
                                      <div className="text-sm text-gray-500">{subscription.subdomain}</div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <div className="font-medium">{subscription.ownerName}</div>
                                      <div className="text-sm text-gray-500">{subscription.phoneNumber}</div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge variant={
                                      subscription.subscriptionPlan === 'enterprise' ? 'default' :
                                      subscription.subscriptionPlan === 'premium' ? 'secondary' : 'outline'
                                    }>
                                      {subscription.subscriptionPlan === 'basic' ? 'أساسي' :
                                       subscription.subscriptionPlan === 'premium' ? 'مميز' :
                                       subscription.subscriptionPlan === 'enterprise' ? 'متقدم' : 
                                       subscription.subscriptionPlan}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge variant={
                                      subscription.isExpired ? 'destructive' :
                                      subscription.isExpiringSoon ? 'secondary' : 'default'
                                    }>
                                      {subscription.isExpired ? 'منتهي' :
                                       subscription.isExpiringSoon ? 'ينتهي قريباً' : 'نشط'}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">
                                    {subscription.subscriptionEndDate ? 
                                      formatDate(subscription.subscriptionEndDate) : 'غير محدد'}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`font-medium ${
                                      subscription.daysRemaining < 0 ? 'text-red-600' :
                                      subscription.daysRemaining <= 7 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                      {subscription.daysRemaining < 0 ? 
                                        `${Math.abs(subscription.daysRemaining)} يوم متأخر` :
                                        `${subscription.daysRemaining} يوم`}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex justify-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedPlatform({
                                            id: subscription.id,
                                            platformName: subscription.platformName,
                                            ownerName: subscription.ownerName,
                                            subdomain: subscription.subdomain,
                                            subscriptionPlan: subscription.subscriptionPlan,
                                            status: subscription.status,
                                            subscriptionEndDate: subscription.subscriptionEndDate,
                                            totalOrders: 0,
                                            totalRevenue: subscription.totalRevenue,
                                            createdAt: subscription.createdAt
                                          });
                                          setShowExtendModal(true);
                                        }}
                                      >
                                        <i className="fas fa-calendar-plus ml-1"></i>
                                        تمديد
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }) || []}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* إدارة المدفوعات */}
              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>إدارة المدفوعات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paymentsLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right py-3 px-4">رقم الطلب</th>
                              <th className="text-right py-3 px-4">اسم المنصة</th>
                              <th className="text-right py-3 px-4">العميل</th>
                              <th className="text-right py-3 px-4">المبلغ</th>
                              <th className="text-right py-3 px-4">خطة الاشتراك</th>
                              <th className="text-right py-3 px-4">الحالة</th>
                              <th className="text-right py-3 px-4">تاريخ الدفع</th>
                              <th className="text-right py-3 px-4">معرف المعاملة</th>
                              <th className="text-right py-3 px-4">الفاتورة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(payments as Payment[])?.map((payment: Payment) => {
                              return (
                                <tr key={payment.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="py-3 px-4 font-mono text-sm">{payment.orderId}</td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <div className="font-medium">{payment.platformName || 'غير محدد'}</div>
                                      <div className="text-sm text-gray-500">{payment.ownerName || ''}</div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <div className="font-medium">{payment.customerName}</div>
                                      <div className="text-sm text-gray-500">{payment.customerPhone}</div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-bold text-green-600">
                                      {payment.amount?.toLocaleString()} د.ع
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge variant="outline">
                                      {payment.subscriptionPlan === 'basic' ? 'أساسي' :
                                       payment.subscriptionPlan === 'premium' ? 'مميز' :
                                       payment.subscriptionPlan === 'enterprise' ? 'متقدم' : 
                                       payment.subscriptionPlan}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge 
                                      variant="outline"
                                      className={
                                        payment.paymentStatus === 'success' 
                                          ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                                        payment.paymentStatus === 'pending' 
                                          ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' :
                                        payment.paymentStatus === 'failed' 
                                          ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 
                                          'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
                                      }
                                    >
                                      {payment.paymentStatus === 'success' ? 'نجح' :
                                       payment.paymentStatus === 'pending' ? 'معلق' :
                                       payment.paymentStatus === 'failed' ? 'فشل' :
                                       payment.paymentStatus === 'cancelled' ? 'ملغي' :
                                       payment.paymentStatus}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4">
                                    {payment.paidAt ? formatDate(payment.paidAt) : 
                                     formatDate(payment.createdAt)}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-sm">
                                      {payment.transactionId || 'غير متوفر'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => downloadInvoicePDF(payment)}
                                      className="h-8 px-3 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 dark:border-red-800"
                                      data-testid={`button-download-invoice-${payment.id}`}
                                    >
                                      <i className="fas fa-file-pdf ml-1"></i>
                                      PDF
                                    </Button>
                                  </td>
                                </tr>
                              );
                            }) || []}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* مميزات الاشتراكات */}
              <TabsContent value="features" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>إدارة مميزات الاشتراكات</CardTitle>
                      <Button 
                        onClick={() => {
                          resetFeatureForm();
                          setShowFeatureModal(true);
                        }}
                        disabled={addFeatureMutation.isPending}
                      >
                        <i className="fas fa-plus ml-2"></i>
                        إضافة ميزة جديدة
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(features as SubscriptionFeature[])?.map((feature: SubscriptionFeature) => (
                        <Card key={feature.id} className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-medium">{feature.featureName}</h3>
                              <p className="text-sm text-gray-500">{feature.featureKey}</p>
                            </div>
                            <Badge variant={feature.isEnabled ? "default" : "secondary"}>
                              {feature.isEnabled ? "مفعل" : "معطل"}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">الخطة:</span> {feature.plan}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">الحد الأقصى:</span> {feature.limitValue === -1 ? "لا محدود" : feature.limitValue}
                            </p>
                            {feature.description && (
                              <p className="text-sm text-gray-600">{feature.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fillFeatureForm(feature)}
                              disabled={updateFeatureMutation.isPending}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف الميزة "${feature.featureName}"؟`)) {
                                  deleteFeatureMutation.mutate(feature.id);
                                }
                              }}
                              disabled={deleteFeatureMutation.isPending}
                            >
                              {deleteFeatureMutation.isPending ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-trash"></i>
                              )}
                            </Button>
                          </div>
                        </Card>
                      )) || []}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* سجل الإجراءات */}
              <TabsContent value="actions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>سجل الإجراءات الإدارية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-right py-3 px-4">الإجراء</th>
                            <th className="text-right py-3 px-4">النوع</th>
                            <th className="text-right py-3 px-4">الهدف</th>
                            <th className="text-right py-3 px-4">السبب</th>
                            <th className="text-right py-3 px-4">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(adminActions as AdminAction[])?.map((action: AdminAction) => (
                            <tr key={action.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3 px-4">
                                <Badge variant="outline">
                                  {action.action === 'extend_subscription' ? 'تمديد اشتراك' :
                                   action.action === 'suspend_platform' ? 'إيقاف منصة' :
                                   action.action === 'activate_platform' ? 'تفعيل منصة' :
                                   action.action === 'update_feature' ? 'تحديث ميزة' :
                                   action.action}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">{action.targetType}</td>
                              <td className="py-3 px-4 font-mono text-sm">{action.targetId.substring(0, 8)}...</td>
                              <td className="py-3 px-4">{action.reason || '-'}</td>
                              <td className="py-3 px-4">{formatDate(action.createdAt)}</td>
                            </tr>
                          )) || []}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* الإعدادات العامة */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>الإعدادات العامة للنظام</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {settingsLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <Label htmlFor="default-subscription-days">مدة الاشتراك الافتراضية (بالأيام)</Label>
                          <Input
                            id="default-subscription-days"
                            type="number"
                            value={systemSettings.defaultSubscriptionDays}
                            onChange={(e) => setSystemSettings(prev => ({ 
                              ...prev, 
                              defaultSubscriptionDays: parseInt(e.target.value) || 365 
                            }))}
                            className="mt-1"
                            data-testid="input-default-subscription-days"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            المدة الافتراضية لاشتراك المنصات الجديدة
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="trial-period-days">مدة فترة التجربة (بالأيام)</Label>
                          <Input
                            id="trial-period-days"
                            type="number"
                            value={systemSettings.trialPeriodDays}
                            onChange={(e) => setSystemSettings(prev => ({ 
                              ...prev, 
                              trialPeriodDays: parseInt(e.target.value) || 7 
                            }))}
                            className="mt-1"
                            data-testid="input-trial-period-days"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            مدة فترة التجربة المجانية للمنصات الجديدة
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Switch 
                            id="auto-suspend"
                            checked={systemSettings.autoSuspendExpiredPlatforms}
                            onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                              ...prev, 
                              autoSuspendExpiredPlatforms: checked 
                            }))}
                            data-testid="switch-auto-suspend"
                          />
                          <div>
                            <Label htmlFor="auto-suspend">الإيقاف التلقائي للمنصات منتهية الصلاحية</Label>
                            <p className="text-sm text-gray-500">
                              إيقاف المنصات تلقائياً عند انتهاء فترة الاشتراك
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Switch 
                            id="email-notifications"
                            checked={systemSettings.emailNotificationsEnabled}
                            onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                              ...prev, 
                              emailNotificationsEnabled: checked 
                            }))}
                            data-testid="switch-email-notifications"
                          />
                          <div>
                            <Label htmlFor="email-notifications">إرسال إشعارات البريد الإلكتروني</Label>
                            <p className="text-sm text-gray-500">
                              إرسال تنبيهات البريد الإلكتروني للمنصات قبل انتهاء الاشتراك
                            </p>
                          </div>
                        </div>
                        
                        {/* إعدادات زين كاش */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">
                            إعدادات زين كاش للدفع
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                            هذه الإعدادات ستكون القيم الافتراضية لجميع المنصات في النظام
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="zaincash-merchant-id">معرف التاجر (Merchant ID)</Label>
                              <Input
                                id="zaincash-merchant-id"
                                value={systemSettings.zaincashMerchantId}
                                onChange={(e) => setSystemSettings(prev => ({ 
                                  ...prev, 
                                  zaincashMerchantId: e.target.value 
                                }))}
                                placeholder="مثال: 5ffacf6612b5777c6d44266f"
                                className="mt-1 text-left"
                                dir="ltr"
                                data-testid="input-zaincash-merchant-id"
                              />
                              <p className="text-sm text-gray-500 mt-1">
                                معرف التاجر الافتراضي من زين كاش
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="zaincash-merchant-secret">سر التاجر (Merchant Secret)</Label>
                              <div className="relative">
                                <Input
                                  id="zaincash-merchant-secret"
                                  type={showMerchantSecret ? "text" : "password"}
                                  value={systemSettings.zaincashMerchantSecret}
                                  onChange={(e) => setSystemSettings(prev => ({ 
                                    ...prev, 
                                    zaincashMerchantSecret: e.target.value 
                                  }))}
                                  placeholder="أدخل سر التاجر الافتراضي"
                                  className="mt-1 text-left pr-10"
                                  dir="ltr"
                                  data-testid="input-zaincash-merchant-secret"
                                />
                                <button
                                  type="button"
                                  onClick={toggleSecretVisibility}
                                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                  data-testid="button-toggle-secret-visibility"
                                >
                                  <i className={`fas ${showMerchantSecret ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                المفتاح السري الافتراضي لحساب زين كاش
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="zaincash-msisdn">رقم الهاتف (MSISDN)</Label>
                              <Input
                                id="zaincash-msisdn"
                                value={systemSettings.zaincashMsisdn}
                                onChange={(e) => setSystemSettings(prev => ({ 
                                  ...prev, 
                                  zaincashMsisdn: e.target.value 
                                }))}
                                placeholder="مثال: 964770000000"
                                className="mt-1 text-left"
                                dir="ltr"
                                data-testid="input-zaincash-msisdn"
                              />
                              <p className="text-sm text-gray-500 mt-1">
                                رقم الهاتف الافتراضي المرتبط بحساب زين كاش (بدون +)
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => saveSystemSettingsMutation.mutate(systemSettings)}
                          disabled={saveSystemSettingsMutation.isPending}
                          className="bg-theme-primary hover:bg-theme-primary-light text-white border-0 shadow-lg transition-all duration-300"
                          data-testid="button-save-settings"
                        >
                          {saveSystemSettingsMutation.isPending ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                              جارٍ الحفظ...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save ml-2"></i>
                              حفظ الإعدادات
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* مودال تمديد الاشتراك */}
            <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تمديد اشتراك المنصة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedPlatform && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-blue-800 dark:text-blue-200">
                        <strong>المنصة:</strong> {selectedPlatform.platformName}<br />
                        <strong>انتهاء الاشتراك الحالي:</strong> {formatDate(selectedPlatform.subscriptionEndDate)}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="extension-days">عدد الأيام للتمديد</Label>
                    <Input
                      id="extension-days"
                      type="number"
                      value={extensionDays}
                      onChange={(e) => setExtensionDays(Number(e.target.value))}
                      min={1}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="extension-reason">سبب التمديد</Label>
                    <Textarea
                      id="extension-reason"
                      placeholder="اختياري: سبب التمديد"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowExtendModal(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedPlatform) {
                          extendSubscriptionMutation.mutate({
                            platformId: selectedPlatform.id,
                            days: extensionDays,
                            reason: (document.getElementById('extension-reason') as HTMLTextAreaElement)?.value || ''
                          });
                        }
                      }}
                      disabled={extendSubscriptionMutation.isPending}
                    >
                      {extendSubscriptionMutation.isPending ? (
                        <i className="fas fa-spinner fa-spin ml-2"></i>
                      ) : (
                        <i className="fas fa-calendar-plus ml-2"></i>
                      )}
                      تمديد الاشتراك
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* مودال إيقاف المنصة */}
            <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إيقاف المنصة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedPlatform && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <p className="text-red-800 dark:text-red-200">
                        <strong>تحذير:</strong> سيتم إيقاف المنصة "{selectedPlatform.platformName}" ومنع الوصول إليها.
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="suspension-reason">سبب الإيقاف *</Label>
                    <Textarea
                      id="suspension-reason"
                      placeholder="يرجى تحديد سبب إيقاف المنصة"
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowSuspendModal(false)}>
                      إلغاء
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (selectedPlatform && suspensionReason.trim()) {
                          suspendPlatformMutation.mutate({
                            platformId: selectedPlatform.id,
                            reason: suspensionReason
                          });
                        }
                      }}
                      disabled={suspendPlatformMutation.isPending || !suspensionReason.trim()}
                    >
                      {suspendPlatformMutation.isPending ? (
                        <i className="fas fa-spinner fa-spin ml-2"></i>
                      ) : (
                        <i className="fas fa-pause ml-2"></i>
                      )}
                      إيقاف المنصة
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* مودال إدارة مميزات الاشتراكات */}
            <Dialog open={showFeatureModal} onOpenChange={(open) => {
              setShowFeatureModal(open);
              if (!open) {
                resetFeatureForm();
              }
            }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {selectedFeature ? 'تعديل ميزة الاشتراك' : 'إضافة ميزة جديدة'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="feature-name">اسم الميزة *</Label>
                    <Input
                      id="feature-name"
                      value={featureForm.featureName}
                      onChange={(e) => setFeatureForm(prev => ({ ...prev, featureName: e.target.value }))}
                      placeholder="مثال: رفع ملفات بحجم كبير"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="feature-key">مفتاح الميزة *</Label>
                    <Input
                      id="feature-key"
                      value={featureForm.featureKey}
                      onChange={(e) => setFeatureForm(prev => ({ ...prev, featureKey: e.target.value }))}
                      placeholder="مثال: large_file_upload"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="feature-plan">خطة الاشتراك *</Label>
                    <Select 
                      value={featureForm.plan} 
                      onValueChange={(value) => setFeatureForm(prev => ({ ...prev, plan: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر خطة الاشتراك" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">أساسي</SelectItem>
                        <SelectItem value="premium">مميز</SelectItem>
                        <SelectItem value="enterprise">متقدم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="feature-limit">الحد الأقصى</Label>
                    <Input
                      id="feature-limit"
                      type="number"
                      value={featureForm.limitValue}
                      onChange={(e) => setFeatureForm(prev => ({ ...prev, limitValue: Number(e.target.value) }))}
                      placeholder="-1 للا محدود"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">-1 = لا محدود، 0 = معطل، رقم موجب = الحد الأقصى</p>
                  </div>

                  <div>
                    <Label htmlFor="feature-description">الوصف</Label>
                    <Textarea
                      id="feature-description"
                      value={featureForm.description}
                      onChange={(e) => setFeatureForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="وصف مختصر عن الميزة"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="feature-enabled"
                      checked={featureForm.isEnabled}
                      onCheckedChange={(checked) => setFeatureForm(prev => ({ ...prev, isEnabled: checked }))}
                    />
                    <Label htmlFor="feature-enabled">الميزة مفعلة</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFeatureModal(false)}
                      disabled={addFeatureMutation.isPending || updateFeatureMutation.isPending}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleSaveFeature}
                      disabled={
                        addFeatureMutation.isPending || 
                        updateFeatureMutation.isPending ||
                        !featureForm.featureName.trim() ||
                        !featureForm.featureKey.trim()
                      }
                    >
                      {(addFeatureMutation.isPending || updateFeatureMutation.isPending) ? (
                        <i className="fas fa-spinner fa-spin ml-2"></i>
                      ) : selectedFeature ? (
                        <i className="fas fa-save ml-2"></i>
                      ) : (
                        <i className="fas fa-plus ml-2"></i>
                      )}
                      {selectedFeature ? 'حفظ التعديلات' : 'إضافة الميزة'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal لإدخال كلمة المرور */}
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
              <DialogContent className="sm:max-w-md bg-black">
                <DialogHeader>
                  <DialogTitle className="text-right">تأكيد الهوية</DialogTitle>
                  <DialogDescription className="text-right">
                    أدخل كلمة المرور لإظهار سر التاجر
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="master-password">كلمة المرور</Label>
                    <Input
                      id="master-password"
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="mt-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePasswordCheck();
                        }
                      }}
                      data-testid="input-master-password"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordInput("");
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handlePasswordCheck}
                      disabled={!passwordInput.trim()}
                      data-testid="button-confirm-password"
                    >
                      تأكيد
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardContent />
    </AdminProtectedRoute>
  );
}