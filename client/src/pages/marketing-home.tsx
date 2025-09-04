import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, 
  Smartphone, 
  BarChart3, 
  Users, 
  MessageCircle, 
  CreditCard,
  ArrowLeft,
  Star,
  Check,
  Globe,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Rocket
} from "lucide-react";
import { Link } from "wouter";

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">س</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              سنادي
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/platform-registration">
              <Button variant="outline" className="hidden md:flex">
                إنشاء متجر
              </Button>
            </Link>
            <Link href="/system-admin-login">
              <Button variant="ghost" className="text-sm">
                تسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300">
            <Star className="w-4 h-4 ml-1" />
            المنصة الأولى في العراق للتجارة الإلكترونية
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              أطلق متجرك الإلكتروني
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              في دقائق معدودة
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            منصة سنادي توفر لك كل ما تحتاجه لبناء وإدارة متجرك الإلكتروني بنجاح. 
            من إنشاء صفحات الهبوط إلى إدارة الطلبات وربط الإعلانات - كل شيء في مكان واحد.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/platform-registration">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 rounded-xl">
                <Rocket className="w-5 h-5 ml-2" />
                ابدأ مجاناً الآن
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-xl border-2">
              <Globe className="w-5 h-5 ml-2" />
              شاهد العرض التوضيحي
            </Button>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">+1000</div>
              <div className="text-gray-600 dark:text-gray-400">متجر نشط</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">+50K</div>
              <div className="text-gray-600 dark:text-gray-400">طلب شهرياً</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600 mb-2">99.9%</div>
              <div className="text-gray-600 dark:text-gray-400">وقت التشغيل</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400">دعم فني</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              مميزات تجعل متجرك يتفوق على المنافسين
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              أدوات احترافية مصممة خصيصاً لنجاح تجارتك الإلكترونية في السوق العراقي
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ShoppingBag className="w-8 h-8" />,
                title: "متاجر احترافية",
                description: "قوالب جاهزة وقابلة للتخصيص بالكامل مع دعم اللغة العربية والتوجه من اليمين لليسار",
                color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: "صفحات هبوط متجاوبة",
                description: "11 قالب مختلف مُحسن للجوال مع معدلات تحويل عالية ومصمم للسوق العراقي",
                color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
              },
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: "ربط WhatsApp التلقائي",
                description: "إدارة شاملة لطلبات WhatsApp مع الرد التلقائي وتأكيد الطلبات بذكاء اصطناعي",
                color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "ربط الإعلانات",
                description: "ربط مباشر مع TikTok Ads و Meta Ads مع تتبع شامل للتحويلات والنتائج",
                color: "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "تقارير وإحصائيات",
                description: "لوحة تحكم شاملة مع تقارير مفصلة وتحليلات عميقة لأداء متجرك",
                color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "مدفوعات زين كاش",
                description: "ربط مباشر مع زين كاش للمدفوعات الآمنة والسريعة مع إدارة المعاملات المالية",
                color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
                <CardContent className="p-0">
                  <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              خطط تناسب كل الأعمال
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              ابدأ مجاناً ثم اختر الخطة المناسبة لحجم عملك
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "المجاني",
                price: "0",
                period: "مدى الحياة",
                description: "مثالي للبدء وتجربة المنصة",
                features: [
                  "متجر واحد",
                  "5 منتجات",
                  "صفحة هبوط واحدة",
                  "WhatsApp أساسي",
                  "تقارير أساسية"
                ],
                highlighted: false,
                cta: "ابدأ مجاناً"
              },
              {
                name: "احترافي",
                price: "50",
                period: "شهرياً",
                description: "الأفضل للشركات الناشئة",
                features: [
                  "متاجر غير محدودة",
                  "منتجات غير محدودة",
                  "جميع قوالب الهبوط",
                  "WhatsApp متقدم",
                  "ربط الإعلانات",
                  "تقارير مفصلة",
                  "دعم أولوية"
                ],
                highlighted: true,
                cta: "ابدأ التجربة المجانية"
              },
              {
                name: "المؤسسات",
                price: "مخصص",
                period: "حسب الاحتياج",
                description: "حلول مخصصة للشركات الكبيرة",
                features: [
                  "كل مميزات الاحترافي",
                  "API مخصص",
                  "تصميم مخصص",
                  "تدريب شخصي",
                  "مدير حساب مخصص",
                  "دعم 24/7"
                ],
                highlighted: false,
                cta: "تواصل معنا"
              }
            ].map((plan, index) => (
              <Card key={index} className={`p-6 relative ${plan.highlighted ? 'ring-2 ring-blue-500 scale-105' : ''} bg-white dark:bg-gray-800`}>
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                    الأكثر شعبية
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-blue-600">
                        {plan.price === "مخصص" ? plan.price : `$${plan.price}`}
                      </span>
                      {plan.price !== "مخصص" && (
                        <span className="text-gray-600 dark:text-gray-400">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {plan.description}
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.highlighted ? 'bg-blue-600 hover:bg-blue-700' : 'variant-outline'}`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              جاهز لبدء رحلتك في التجارة الإلكترونية؟
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              انضم إلى آلاف التجار الذين يثقون بمنصة سنادي لنمو أعمالهم
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/platform-registration">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  <Zap className="w-5 h-5 ml-2" />
                  ابدأ متجرك مجاناً
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600">
                <MessageCircle className="w-5 h-5 ml-2" />
                تحدث مع فريق المبيعات
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">س</span>
                </div>
                <span className="text-xl font-bold">سنادي</span>
              </div>
              <p className="text-gray-400 mb-4">
                المنصة الرائدة للتجارة الإلكترونية في العراق
              </p>
              <div className="flex gap-4">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">آمن ومُعتمد</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">المنتج</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/platform-registration" className="hover:text-white">إنشاء متجر</Link></li>
                <li><a href="#" className="hover:text-white">القوالب</a></li>
                <li><a href="#" className="hover:text-white">المميزات</a></li>
                <li><a href="#" className="hover:text-white">الأسعار</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">الشركة</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">من نحن</a></li>
                <li><a href="#" className="hover:text-white">الوظائف</a></li>
                <li><a href="#" className="hover:text-white">الأخبار</a></li>
                <li><a href="#" className="hover:text-white">تواصل معنا</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">الدعم</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">مركز المساعدة</a></li>
                <li><a href="#" className="hover:text-white">الدليل</a></li>
                <li><a href="#" className="hover:text-white">المجتمع</a></li>
                <li><Link href="/system-admin-login" className="hover:text-white">تسجيل الدخول</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 سنادي. جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">سياسة الخصوصية</a>
              <a href="#" className="hover:text-white">شروط الاستخدام</a>
              <a href="#" className="hover:text-white">ملفات تعريف الارتباط</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}