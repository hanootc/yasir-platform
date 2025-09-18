import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoUploader } from '@/components/UniversalFileUploader';
import { insertPlatformSchema, type InsertPlatform } from '@shared/schema';
import { Upload, Store, Phone, MessageSquare, Lock, Eye, EyeOff, ShoppingBag, Check, CreditCard, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link, useLocation } from 'wouter';

export default function PlatformRegistration() {
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [paymentStep, setPaymentStep] = useState<'plan' | 'info' | 'payment' | 'complete'>('plan');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();

  // Check for payment callback from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderId = params.get('orderId');
    const plan = params.get('plan');
    const paymentSimulation = params.get('payment_simulation');
    const transactionId = params.get('transaction_id');

    if (payment === 'success' && orderId && plan) {
      setSelectedPlan(plan);
      setPaymentStep('complete');
      toast({
        title: "تم الدفع بنجاح!",
        description: "يمكنك الآن إكمال تسجيل منصتك",
        variant: "default",
      });
    } else if (paymentSimulation === 'true' && transactionId) {
      // Handle simulation mode for development
      // Extract plan from order_id if available
      const orderIdParam = params.get('order_id');
      if (orderIdParam) {
        // Extract plan from order_id format: platformName_planType_timestamp_random
        const parts = decodeURIComponent(orderIdParam).split('_');
        if (parts.length >= 2) {
          const planFromOrderId = parts[1]; // premium, basic, enterprise
          if (['basic', 'premium', 'enterprise'].includes(planFromOrderId)) {
            setSelectedPlan(planFromOrderId);
          }
        }
      }
      
      setPaymentStep('complete');
      toast({
        title: "تم الدفع بنجاح!",
        description: "تم تأكيد عملية الدفع بزين كاش - يمكنك إكمال التسجيل",
        variant: "default",
      });
      
      // Clear URL parameters to clean up the address bar
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else if (payment === 'failed') {
      const reason = params.get('reason');
      setPaymentStep('plan');
      toast({
        title: "فشل في الدفع",
        description: reason || "حدث خطأ أثناء عملية الدفع",
        variant: "destructive",
      });
    } else if (payment === 'cancelled') {
      setPaymentStep('plan');
      toast({
        title: "تم إلغاء الدفع",
        description: "يمكنك المحاولة مرة أخرى",
        variant: "default",
      });
    }
  }, [toast]);

  const plans = [
    {
      id: "basic",
      name: "البداية",
      price: "1,000",
      period: "دينار/شهر",
      description: "مثالي للمتاجر الصغيرة والمبتدئين",
      features: [
        "25 منتج",
        "25 صفحة هبوط", 
        "1000 طلب شهرياً",
        "3 حساب موظف",
        "إدارة مخزن",
        "8 ثيمات ألوان + نظام ليلي/نهاري",
        "دعم واتساب أساسي",
        "تقارير أساسية"
      ]
    },
    {
      id: "premium",
      name: "المحترف",
      price: "69,000",
      period: "دينار/شهر",
      description: "الأفضل للأعمال النامية - الأشهر",
      popular: true,
      features: [
        "100 منتج",
        "100 صفحة هبوط",
        "5000 طلب شهرياً",
        "10 حساب موظف",
        "إدارة مخزن متقدم",
        "8 ثيمات ألوان + نظام ليلي/نهاري",
        "واتساب أعمال + أتمتة",
        "تكامل TikTok للإعلانات",
        "تكامل Facebook Pixel",
        "تقارير تفصيلية + تحليلات",
        "دعم أولوية",
        "قوالب متقدمة"
      ]
    },
    {
      id: "enterprise",
      name: "المتطور",
      price: "99,000",
      period: "دينار/شهر", 
      description: "للمؤسسات والمتاجر الكبيرة",
      features: [
        "منتجات غير محدودة",
        "صفحات هبوط غير محدودة",
        "طلبات غير محدودة",
        "موظفين غير محدود",
        "إدارة مخزن احترافية",
        "8 ثيمات ألوان + نظام ليلي/نهاري",
        "واتساب أعمال + API متقدم",
        "تكامل شامل لجميع منصات الإعلان",
        "تحليلات متقدمة + AI",
        "API مخصص",
        "دعم 24/7",
        "تدريب شخصي",
        "نسخ احتياطي يومي"
      ]
    }
  ];

  const selectedPlanData = plans.find(p => p.id === selectedPlan) || plans[1];

  const form = useForm<InsertPlatform>({
    resolver: zodResolver(insertPlatformSchema),
    mode: 'onChange',
    defaultValues: {
      platformName: '',
      ownerName: '',
      businessType: '',
      phoneNumber: '',
      whatsappNumber: '',
      password: '',
      logoUrl: '',
      subdomain: '',
      subscriptionPlan: selectedPlan as any
    }
  });

  // Update subscription plan in form when selectedPlan changes
  useEffect(() => {
    form.setValue('subscriptionPlan', selectedPlan as any);
  }, [selectedPlan, form]);

  // Check URL for payment simulation completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_simulation') === 'true') {
      const transactionId = urlParams.get('transaction_id');
      const orderId = urlParams.get('order_id');
      
      if (transactionId && orderId) {
        console.log('Payment simulation completed successfully', { transactionId, orderId });
        setPaymentStep('complete');
        
        // Clean URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        toast({
          title: "تم الدفع بنجاح!",
          description: "تم تأكيد عملية الدفع بزين كاش. يمكنك الآن إكمال إنشاء منصتك",
          variant: "default",
        });
      }
    }
  }, []);

  const handleLogoUploadComplete = (files: any[]) => {
    if (files.length > 0) {
      const uploadedFile = files[0];
      setLogoUrl(uploadedFile.url);
      form.setValue('logoUrl', uploadedFile.url);
      console.log('Logo uploaded:', uploadedFile);
    }
  };

  const createPayment = useMutation({
    mutationFn: async (platformData: any) => {
      console.log('🔄 Creating payment for:', platformData);
      setPaymentLoading(true);
      
      const response = await apiRequest('/api/payments/zaincash/create', {
        method: 'POST',
        body: platformData
      });
      const data = await response.json();
      
      console.log('✅ Payment API response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Payment success:', data);
      setPaymentData(data);
      setPaymentLoading(false);
      
      if (data.success && data.paymentUrl) {
        console.log('🔄 Storing form data and redirecting to:', data.paymentUrl);
        
        // Store form data temporarily
        const formData = form.getValues();
        localStorage.setItem('platformRegistrationData', JSON.stringify({
          ...formData,
          selectedPlan,
          logoUrl,
          paymentData: data // Store payment data for reference
        }));
        
        // Check if this is a simulation or real payment
        const isSimulation = data.paymentUrl.includes('payment_simulation=true');
        
        console.log('🔒 Redirecting to ZainCash payment gateway');
        toast({
          title: "توجيه للدفع",
          description: "سيتم توجيهك إلى زين كاش لإتمام الدفع الآمن",
          variant: "default",
        });
        
        // Add small delay for UI feedback then redirect
        setTimeout(() => {
          try {
            console.log('🚀 Attempting redirect to:', data.paymentUrl);
            
            // Try direct redirect first
            window.location.href = data.paymentUrl;
            
            // Fallback after 2 seconds if redirect doesn't work
            setTimeout(() => {
              console.log('⚠️ Direct redirect may have failed, trying window.open');
              const popup = window.open(data.paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
              if (!popup) {
                console.log('❌ Popup blocked, showing manual link');
                toast({
                  title: "يرجى فتح رابط الدفع يدوياً", 
                  description: `انقر هنا: ${data.paymentUrl}`,
                  variant: "default"
                });
              } else {
                console.log('✅ Popup opened successfully');
              }
            }, 2000);
            
          } catch (error) {
            console.error('❌ Redirect failed:', error);
            // Immediate fallback: try popup
            const popup = window.open(data.paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            if (!popup) {
              toast({
                title: "يرجى فتح رابط الدفع يدوياً", 
                description: `الرابط: ${data.paymentUrl}`,
                variant: "default"
              });
            }
          }
        }, 500);
      } else {
        console.log('❌ Payment response missing success or paymentUrl:', data);
        toast({
          title: "خطأ في الدفع",
          description: data.error || "لم يتم الحصول على رابط الدفع",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('❌ Payment error:', error);
      setPaymentLoading(false);
      toast({
        title: "خطأ في الدفع",
        description: error.message || "حدث خطأ أثناء إنشاء رابط الدفع",
        variant: "destructive",
      });
    }
  });

  const registerPlatform = useMutation({
    mutationFn: async (data: InsertPlatform) => {
      const response = await apiRequest('/api/platforms', {
        method: 'POST',
        body: data
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إنشاء المنصة');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء المنصة بنجاح!",
        description: "مرحباً بك في منصة إدارة الأعمال",
        variant: "default",
      });
      
      // Clear stored data
      localStorage.removeItem('platformRegistrationData');
      
      // Redirect to success page
      setTimeout(() => {
        window.location.href = `/platform-success?subdomain=${data.subdomain}&platform=${encodeURIComponent(data.platformName)}`;
      }, 2000);
    },
    onError: (error: Error) => {
      console.error('❌ Platform registration failed:', error);
      
      // رسائل خطأ محددة للحقول المكررة
      if (error.message.includes('النطاق الفرعي مستخدم')) {
        form.setError('subdomain', { 
          type: 'manual', 
          message: 'هذا النطاق الفرعي مستخدم بالفعل. اختر نطاقاً آخر.' 
        });
        toast({
          title: "نطاق فرعي مكرر",
          description: "هذا النطاق الفرعي مستخدم بالفعل. اختر نطاقاً آخر.",
          variant: "destructive",
        });
      } else if (error.message.includes('رقم الهاتف مستخدم')) {
        form.setError('phoneNumber', { 
          type: 'manual', 
          message: 'رقم الهاتف مستخدم بالفعل. استخدم رقماً آخر.' 
        });
        toast({
          title: "رقم هاتف مكرر",
          description: "رقم الهاتف مستخدم بالفعل. استخدم رقماً آخر.",
          variant: "destructive",
        });
      } else if (error.message.includes('رقم الواتساب مستخدم')) {
        form.setError('whatsappNumber', { 
          type: 'manual', 
          message: 'رقم الواتساب مستخدم بالفعل. استخدم رقماً آخر.' 
        });
        toast({
          title: "رقم واتساب مكرر",
          description: "رقم الواتساب مستخدم بالفعل. استخدم رقماً آخر.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ في إنشاء المنصة",
          description: error.message || "يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
      }
    }
  });

  // Load saved data if available - enhanced version
  useEffect(() => {
    if (paymentStep === 'complete') {
      const savedData = localStorage.getItem('platformRegistrationData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          console.log('📥 Loading saved platform data:', parsedData);
          
          // Restore all form fields
          Object.keys(parsedData).forEach(key => {
            if (key === 'logoUrl') {
              setLogoUrl(parsedData[key]);
              form.setValue('logoUrl', parsedData[key]);
            } else if (key === 'selectedPlan') {
              setSelectedPlan(parsedData[key]);
              form.setValue('subscriptionPlan', parsedData[key]);
            } else if (key !== 'paymentData' && key in form.getValues()) {
              form.setValue(key as keyof InsertPlatform, parsedData[key]);
            }
          });
          
          // Force form validation
          form.trigger();
          
          console.log('✅ Form data restored successfully');
          toast({
            title: "تم استرداد البيانات",
            description: "تم تحميل بياناتك المحفوظة بنجاح",
            variant: "default",
          });
        } catch (error) {
          console.error('Error loading saved data:', error);
          toast({
            title: "خطأ في تحميل البيانات",
            description: "يرجى إعادة إدخال البيانات",
            variant: "destructive",
          });
        }
      }
    }
  }, [paymentStep, form, toast]);

  const onSubmit = async (data: InsertPlatform) => {
    console.log('🚀 Form onSubmit triggered!', { paymentStep, data });
    console.log('🔍 Form validation:', {
      isValid: form.formState.isValid,
      errors: form.formState.errors
    });
    
    if (paymentStep === 'complete') {
      // Register platform - validate all required fields
      const finalData = {
        subdomain: data.subdomain,
        platformName: data.platformName,
        businessType: data.businessType || 'retail',
        ownerName: data.ownerName,
        phoneNumber: data.phoneNumber,
        whatsappNumber: data.whatsappNumber || data.phoneNumber,
        password: data.password,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        description: data.description || 'منصة تجارية جديدة',
        logoUrl: logoUrl || null,
        subscriptionPlan: selectedPlan as any
      };
      
      console.log('🚀 Registering platform with data:', finalData);
      console.log('📋 Form state:', {
        isValid: form.formState.isValid,
        errors: form.formState.errors,
        values: form.getValues()
      });
      
      // Check if all required fields are present
      const requiredFields = ['subdomain', 'platformName', 'ownerName', 'phoneNumber', 'password'];
      const missingFields = requiredFields.filter(field => !finalData[field as keyof typeof finalData]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        toast({
          title: "بيانات مفقودة",
          description: `يرجى إدخال: ${missingFields.map(field => {
            const fieldNames: { [key: string]: string } = {
              subdomain: 'النطاق الفرعي',
              platformName: 'اسم المنصة',
              ownerName: 'اسم المالك',
              phoneNumber: 'رقم الهاتف',
              password: 'كلمة المرور'
            };
            return fieldNames[field] || field;
          }).join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      registerPlatform.mutate(finalData);
    } else if (paymentStep === 'payment') {
      // Create payment - validate required fields first
      const customerName = data.ownerName || form.getValues('ownerName');
      const customerPhone = data.phoneNumber || form.getValues('phoneNumber');
      const platformName = data.platformName || form.getValues('platformName') || 'منصة جديدة';
      
      console.log('Payment data:', { customerName, customerPhone, platformName, selectedPlan });
      
      if (!customerName || !customerPhone) {
        console.log('Missing required fields:', { customerName, customerPhone });
        toast({
          title: "يرجى إدخال البيانات المطلوبة",
          description: "اسم المالك ورقم الهاتف مطلوبان للدفع",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Creating payment request...');
      createPayment.mutate({
        platformName: platformName,
        subscriptionPlan: selectedPlan,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: data.contactEmail || '' // Optional
      });
    }
  };

  return (
    <div className="min-h-screen bg-theme-primary-lighter py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl theme-border bg-theme-primary-lighter backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-between items-center mb-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  ← العودة للرئيسية
                </Button>
              </Link>
              
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-theme-primary mb-2">
                  تسجيل منصة جديدة
                </CardTitle>
                <CardDescription className="text-gray-600">
                  أنشئ منصتك التجارية واستمتع بإدارة شاملة لأعمالك
                </CardDescription>
              </div>
              
              <div></div>
            </div>
            
            <div className="bg-theme-primary-light theme-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-theme-gradient rounded-full"></div>
                  <p className="text-sm text-theme-primary font-bold">
                    الدفع الآمن بزين كاش
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1 h-auto"
                  onClick={() => {
                    // Test ZainCash payment flow directly
                    const testData = {
                      platformName: "test-platform",
                      subscriptionPlan: "premium",
                      customerName: "أحمد محمد",
                      customerPhone: "9647801234567",
                      customerEmail: "test@example.com"
                    };
                    
                    console.log('🧪 Testing ZainCash payment flow...');
                    createPayment.mutate(testData);
                  }}
                >
                  اختبار سريع
                </Button>
              </div>
              <p className="text-xs text-theme-primary">
                نظام دفع حقيقي متصل بزين كاش - بيانات اختبار: 9647802999569 (PIN: 1234, OTP: 1111)
              </p>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className={`flex items-center gap-2 ${
                paymentStep === 'plan' ? 'text-theme-primary' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                  paymentStep === 'plan' ? 'border-theme-primary bg-theme-primary-light' : 'border-gray-300'
                }`}>
                  1
                </div>
                <span className="text-sm">اختيار الباقة</span>
              </div>
              
              <div className="w-8 h-px bg-gray-300"></div>
              
              <div className={`flex items-center gap-2 ${
                paymentStep === 'payment' ? 'text-theme-primary' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                  paymentStep === 'payment' ? 'border-theme-primary bg-theme-primary-light' : 'border-gray-300'
                }`}>
                  2
                </div>
                <span className="text-sm">الدفع</span>
              </div>
              
              <div className="w-8 h-px bg-gray-300"></div>
              
              <div className={`flex items-center gap-2 ${
                paymentStep === 'complete' ? 'text-theme-primary' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                  paymentStep === 'complete' ? 'border-theme-primary bg-theme-primary-light' : 'border-gray-300'
                }`}>
                  {paymentStep === 'complete' ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <span className="text-sm">إنشاء المنصة</span>
              </div>
            </div>
          </CardHeader>
        
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* مرحلة اختيار الباقة */}
                {paymentStep === 'plan' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      اختر باقتك
                    </h3>
                    <div className="space-y-3">
                      {plans.map((plan) => (
                        <Card 
                          key={plan.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedPlan === plan.id ? 'ring-2 ring-theme-primary bg-theme-primary-light' : ''
                          } ${plan.popular ? 'theme-border border-theme-primary' : ''}`}
                          onClick={() => setSelectedPlan(plan.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-base font-bold text-theme-primary">{plan.name}</h4>
                                  {plan.popular && (
                                    <Badge className="bg-theme-gradient text-white text-xs">الأشهر</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-theme-primary">{plan.price}</span>
                                  <span className="text-sm text-gray-600">{plan.period}</span>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedPlan === plan.id 
                                  ? 'bg-theme-gradient border-theme-primary' 
                                  : 'border-gray-300'
                              }`}>
                                {selectedPlan === plan.id && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* ملخص الباقة المختارة */}
                    <Card className="bg-theme-primary-light theme-border">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-theme-primary mb-3">ميزات باقة {selectedPlanData.name}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedPlanData.features.slice(0, 6).map((feature, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <Check className="h-3 w-3 text-theme-primary mr-2 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                        {selectedPlanData.features.length > 6 && (
                          <div className="text-sm text-theme-primary mt-2">
                            + {selectedPlanData.features.length - 6} ميزات إضافية
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <div className="flex justify-end pt-6">
                      <Button
                        type="button"
                        onClick={() => setPaymentStep('payment')}
                        className="bg-theme-gradient hover:opacity-90 text-white px-8"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          <span>التالي - الدفع بزين كاش</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}

                {/* مرحلة الدفع */}
                {paymentStep === 'payment' && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-lg font-semibold text-gray-900">معلومات الدفع</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="platformName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Store className="w-4 h-4" />
                              اسم المنصة
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="متجر أحمد للملابس" {...field} className="placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Store className="w-4 h-4" />
                              اسم المالك
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="أحمد محمد" {...field} className="placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              رقم الهاتف
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="07XXXXXXXXX" {...field} className="placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPaymentStep('plan')}
                      >
                        السابق
                      </Button>
                      <Button
                        type="button"
                        disabled={createPayment.isPending}
                        className="bg-theme-gradient hover:opacity-90 text-white px-8 py-3 text-lg font-semibold theme-shadow"
                        onClick={(e) => {
                          console.log('🔴 Payment button clicked!', e);
                          e.preventDefault();
                          
                          // Handle payment directly without form validation
                          const formValues = form.getValues();
                          const customerName = formValues.ownerName;
                          const customerPhone = formValues.phoneNumber;
                          const platformName = formValues.platformName || 'منصة جديدة';
                          
                          console.log('🔍 Payment data:', { customerName, customerPhone, platformName, selectedPlan });
                          
                          if (!customerName || !customerPhone) {
                            toast({
                              title: "يرجى إدخال البيانات المطلوبة",
                              description: "اسم المالك ورقم الهاتف مطلوبان للدفع",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          console.log('🔄 Creating payment request...');
                          createPayment.mutate({
                            platformName: platformName,
                            subscriptionPlan: selectedPlan,
                            customerName: customerName,
                            customerPhone: customerPhone,
                            customerEmail: formValues.contactEmail || ''
                          });
                        }}
                      >
                        {createPayment.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            جاري التوجيه للدفع...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {/* ZainCash Logo */}
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg text-theme-primary text-sm font-bold shadow-sm">
                              <div className="w-3 h-3 bg-theme-gradient rounded-full"></div>
                              ZainCash
                            </div>
                            <span>ادفع {selectedPlanData.price} دينار</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* مرحلة إكمال التسجيل */}
                {paymentStep === 'complete' && (
                  <div className="space-y-4">
                    <div className="bg-theme-primary-light theme-border rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-theme-primary" />
                        <span className="text-theme-primary font-medium">تم الدفع بنجاح! أكمل معلومات منصتك</span>
                      </div>
                    </div>

                    <Separator />
                    
                    <h3 className="text-lg font-semibold text-theme-primary">معلومات المنصة</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="platformName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Store className="w-4 h-4" />
                              اسم المنصة
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="متجر أحمد للملابس" {...field} className="placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4" />
                              ماذا يبيع التاجر؟
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="ملابس، إلكترونيات، طعام..." {...field} className="placeholder:text-gray-400" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            اسم مالك المنصة
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="أحمد محمد علي" {...field} className="placeholder:text-gray-400" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            رقم الهاتف
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="07XXXXXXXXX" 
                              {...field} 
                              className="placeholder:text-gray-400"
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, ''); // إزالة أي شيء غير رقمي
                                
                                // إضافة 964 تلقائياً إذا لم يكن موجوداً
                                if (value.length > 0 && !value.startsWith('964')) {
                                  if (value.startsWith('0')) {
                                    value = '964' + value.substring(1);
                                  } else if (value.startsWith('7')) {
                                    value = '964' + value;
                                  } else {
                                    value = '964' + value;
                                  }
                                }
                                
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-500 mt-1">
                            سيتم إضافة رمز الدولة 964 تلقائياً
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            رقم الواتساب
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="07XXXXXXXXX" 
                              {...field} 
                              className="placeholder:text-gray-400"
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, ''); // إزالة أي شيء غير رقمي
                                
                                // إضافة 964 تلقائياً إذا لم يكن موجوداً
                                if (value.length > 0 && !value.startsWith('964')) {
                                  if (value.startsWith('0')) {
                                    value = '964' + value.substring(1);
                                  } else if (value.startsWith('7')) {
                                    value = '964' + value;
                                  } else {
                                    value = '964' + value;
                                  }
                                }
                                
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-500 mt-1">
                            رقم واتساب منفصل للمنصة (سيتم إضافة 964 تلقائياً)
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            النطاق الفرعي للمنصة
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="sanadi"
                                {...field} 
                                className="placeholder:text-gray-400 pr-3 pl-28"
                                onChange={(e) => {
                                  // تحويل إلى أحرف صغيرة وإزالة المسافات والرموز غير المسموحة
                                  let value = e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, '')
                                    .replace(/^-+|-+$/g, ''); // إزالة الشرطات من البداية والنهاية
                                  
                                  field.onChange(value);
                                }}
                              />
                              <span className="absolute left-2 top-3 text-sm text-gray-500">
                                sanadi.pro/
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* شرح توضيحي للنطاق الفرعي */}
                    <div className="bg-theme-primary-light theme-border rounded-lg p-4 mt-2">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-theme-primary-lighter rounded-full flex items-center justify-center mt-0.5">
                          <ShoppingBag className="w-3 h-3 text-theme-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-theme-primary mb-1">النطاق الفرعي لمنصتك</h4>
                          <p className="text-sm text-theme-primary leading-relaxed">
                            النطاق الفرعي هو العنوان الذي سيصل إليه عملاؤك لزيارة منصتك. 
                            رابط منصتك سيكون: <span className="font-medium">sanadi.pro/{form.watch('subdomain') || 'sanadi'}</span>
                          </p>
                          <div className="mt-2 text-xs text-theme-primary">
                            <strong>مثال:</strong> إذا اخترت "sanadi" فسيكون رابط منصتك: <span className="font-mono bg-theme-primary-light px-1 rounded">sanadi.pro/sanadi</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            كلمة المرور للمنصة
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="أدخل كلمة مرور قوية للمنصة"
                                className="pr-10 pl-10 placeholder:text-gray-400"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-500 mt-1">
                            ستحتاج هذه الكلمة للدخول إلى لوحة إدارة المنصة لاحقاً
                          </p>
                        </FormItem>
                      )}
                    />

                    {/* شعار المنصة */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-theme-primary">شعار المنصة</h3>
                      
                      <div className="border-2 border-dashed theme-border rounded-lg p-6 text-center">
                        {logoUrl ? (
                          <div className="space-y-4">
                            <img 
                              src={logoUrl}
                              alt="شعار المنصة" 
                              className="w-20 h-20 object-contain mx-auto rounded-lg border"
                            />
                            <p className="text-sm text-theme-primary">تم رفع الشعار بنجاح</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                            <p className="text-gray-500">ارفع شعار منصتك (اختياري)</p>
                          </div>
                        )}
                        
                        <LogoUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onComplete={handleLogoUploadComplete}
                          buttonClassName="mt-4"
                        >
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            <span>{logoUrl ? 'تغيير الشعار' : 'رفع الشعار'}</span>
                          </div>
                        </LogoUploader>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={registerPlatform.isPending}
                        className="bg-theme-gradient text-white px-8"
                        onClick={() => {
                          console.log('🔥 Create Platform Button Clicked!');
                          console.log('📋 Current paymentStep:', paymentStep);
                          console.log('📋 Form isValid:', form.formState.isValid);
                          console.log('📋 Form values:', form.getValues());
                          console.log('📋 Form errors:', form.formState.errors);
                        }}
                      >
                        {registerPlatform.isPending ? 'جاري إنشاء المنصة...' : 'إنشاء المنصة'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}