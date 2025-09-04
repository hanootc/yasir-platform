import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, ArrowRight, Calendar, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const SubscriptionRenewal = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [isProcessing, setIsProcessing] = useState(false);

  // خطط الاشتراك - مطابقة تماماً لصفحة التسجيل
  const plans = [
    {
      id: 'basic',
      name: 'البداية',
      price: '49,000',
      currency: 'IQD',
      duration: 'دينار/شهر',
      icon: Shield,
      color: 'bg-blue-500',
      description: 'مثالي للمتاجر الصغيرة والمبتدئين',
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
      id: 'premium',
      name: 'المحترف',
      price: '69,000',
      currency: 'IQD',
      duration: 'دينار/شهر',
      icon: Star,
      color: 'bg-purple-500',
      popular: true,
      description: 'الأفضل للأعمال النامية - الأشهر',
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
      id: 'enterprise',
      name: 'المتطور',
      price: '99,000',
      currency: 'IQD',
      duration: 'دينار/شهر',
      icon: Crown,
      color: 'bg-gold-500',
      description: 'للمؤسسات والمتاجر الكبيرة',
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

  const handleRenewal = async () => {
    setIsProcessing(true);
    
    try {
      // محاكاة عملية الدفع - سيتم استبدالها بـ API حقيقي
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // توجيه لصفحة الدفع أو معالجة التجديد
      window.location.href = `/payment?plan=${selectedPlan}&action=renewal`;
      
    } catch (error) {
      console.error('خطأ في عملية التجديد:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* الهيدر */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              تجديد الاشتراك
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              اختر الخطة المناسبة واستمر في تنمية أعمالك
            </p>
          </div>
        </div>
      </div>

      {/* معلومات الاشتراك الحالي */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <Calendar className="w-5 h-5" />
              حالة الاشتراك الحالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">الخطة الحالية</p>
                <p className="font-semibold text-gray-900 dark:text-white">المميزة</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الانتهاء</p>
                <p className="font-semibold text-red-600 dark:text-red-400">2025-09-02</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">الحالة</p>
                <Badge variant="destructive">ينتهي خلال 5 أيام</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* خطط الاشتراك */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-purple-500 dark:ring-purple-400 shadow-lg' 
                    : 'hover:ring-1 hover:ring-gray-300'
                } ${plan.popular ? 'lg:scale-105' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white px-3 py-1">
                      الأكثر شعبية
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {plan.description}
                  </p>
                  <CardDescription>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 mr-1">
                      {plan.duration}
                    </span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* أزرار العمل */}
        <div className="text-center space-y-4">
          <Button
            onClick={handleRenewal}
            disabled={isProcessing}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                جاري المعالجة...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                تجديد الاشتراك الآن
                <ArrowRight className="w-5 h-5 mr-2" />
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            سيتم تفعيل الاشتراك الجديد فور إتمام عملية الدفع
          </p>
          
          <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>✓ دفع آمن</span>
            <span>✓ إلغاء مجاني</span>
            <span>✓ دعم فني</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRenewal;