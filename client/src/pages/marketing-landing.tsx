import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Smartphone, 
  Shield,
  Check,
  Play,
  Star,
  CreditCard,
  Truck,
  Headphones,
  Globe,
  TrendingUp,
  Package,
  Languages,
  Zap,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

export default function MarketingLanding() {
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [language, setLanguage] = useState("ar");

  // Detect user's country and set default language
  useEffect(() => {
    const detectLanguage = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const country = data.country_code;
        
        const arabicCountries = ['SA', 'AE', 'EG', 'JO', 'LB', 'SY', 'IQ', 'KW', 'QA', 'BH', 'OM', 'YE', 'PS', 'MA', 'TN', 'DZ', 'LY', 'SD', 'SO', 'DJ', 'KM', 'MR'];
        
        if (arabicCountries.includes(country)) {
          setLanguage("ar");
        } else {
          setLanguage("en");
        }
      } catch (error) {
        setLanguage("ar");
      }
    };

    detectLanguage();
  }, []);

  // Translations object
  const translations = {
    ar: {
      features: [
        {
          icon: <ShoppingCart className="h-8 w-8 marketing-icon-primary" />,
          title: "إدارة المنتجات",
          description: "إضافة وتنظيم المنتجات بسهولة مع إدارة الفئات والصور"
        },
        {
          icon: <Globe className="h-8 w-8 marketing-icon-primary" />,
          title: "صفحات الهبوط",
          description: "إنشاء صفحات هبوط احترافية بدون حاجة لخبرة تقنية"
        },
        {
          icon: <Smartphone className="h-8 w-8 marketing-icon-primary" />,
          title: "تكامل واتساب",
          description: "ربط مباشر مع واتساب لإدارة العملاء والطلبات"
        },
        {
          icon: <BarChart3 className="h-8 w-8 marketing-icon-primary" />,
          title: "ربط البكسل والإعلانات",
          description: "ربط بكسل Meta و TikTok مع تتبع متقدم للتحويلات"
        },
        {
          icon: <Users className="h-8 w-8 marketing-icon-primary" />,
          title: "إدارة الموظفين",
          description: "نظام شامل لإدارة فريق العمل والصلاحيات"
        },
        {
          icon: <CreditCard className="h-8 w-8 marketing-icon-primary" />,
          title: "نظام المحاسبة",
          description: "محاسبة متكاملة مع الرسوم البيانية والتقارير المالية"
        },
        {
          icon: <Package className="h-8 w-8 marketing-icon-primary" />,
          title: "إدارة المخزون",
          description: "تتبع المنتجات والكميات مع تنبيهات ذكية"
        },
        {
          icon: <Truck className="h-8 w-8 marketing-icon-primary" />,
          title: "شركات التوصيل",
          description: "ربط مع شركات الشحن وتتبع الطلبات تلقائياً"
        },
        {
          icon: <TrendingUp className="h-8 w-8 marketing-icon-primary" />,
          title: "تتبع التحويلات",
          description: "قياس أداء الإعلانات وتحسين معدل التحويل"
        },
        {
          icon: <Star className="h-8 w-8 marketing-icon-primary" />,
          title: "ثيمات متعددة",
          description: "8 ألوان متدرجة مع نظام ليلي/نهاري"
        }
      ],
      header: {
        login: "دخول",
        tryFree: "جرب مجاناً",
        brandName: "Sanadi Pro"
      },
      hero: {
        title: "منصة التجارة الإلكترونية الذكية",
        subtitle: "حل شامل لإدارة أعمالك التجارية بكفاءة عالية وسهولة تامة",
        description: "من إدارة المنتجات إلى التحليلات المتقدمة، كل ما تحتاجه لنجاح تجارتك الإلكترونية في مكان واحد",
        getStarted: "ابدأ الآن مجاناً",
        watchDemo: "شاهد العرض التوضيحي"
      },
      featuresSection: {
        title: "مميزات استثنائية لنجاح أعمالك",
        subtitle: "كل ما تحتاجه لإدارة تجارتك الإلكترونية بنجاح"
      },
      plans: {
        title: "خطط مرنة تناسب احتياجاتك",
        subtitle: "اختر الخطة المناسبة لحجم أعمالك"
      },
      testimonials: {
        title: "ماذا يقول عملاؤنا",
        subtitle: "آراء حقيقية من عملاء راضين عن خدماتنا"
      },
      cta: {
        title: "جاهز لبدء رحلتك؟",
        subtitle: "انضم إلى آلاف التجار الناجحين واكتشف الفرق",
        button: "ابدأ تجربتك المجانية"
      },
      footer: {
        description: "الحل الشامل لإدارة أعمالك التجارية بكفاءة عالية وسهولة تامة",
        secure: "آمن ومحمي",
        product: "المنتج",
        features: "المميزات",
        pricing: "الأسعار",
        support: "الدعم",
        help: "المساعدة",
        contact: "تواصل معنا",
        docs: "الوثائق",
        privacyPolicy: "سياسة الخصوصية",
        rights: "جميع الحقوق محفوظة"
      }
    },
    en: {
      features: [
        {
          icon: <ShoppingCart className="h-8 w-8 marketing-icon-primary" />,
          title: "Product Management",
          description: "Easily add and organize products with category and image management"
        },
        {
          icon: <Globe className="h-8 w-8 marketing-icon-primary" />,
          title: "Landing Pages",
          description: "Create professional landing pages without technical expertise"
        },
        {
          icon: <Smartphone className="h-8 w-8 marketing-icon-primary" />,
          title: "WhatsApp Integration",
          description: "Direct integration with WhatsApp for customer and order management"
        },
        {
          icon: <BarChart3 className="h-8 w-8 marketing-icon-primary" />,
          title: "Pixel & Ads Integration",
          description: "Connect Meta & TikTok pixels with advanced conversion tracking"
        },
        {
          icon: <Users className="h-8 w-8 marketing-icon-primary" />,
          title: "Staff Management",
          description: "Comprehensive system for managing team and permissions"
        },
        {
          icon: <CreditCard className="h-8 w-8 marketing-icon-primary" />,
          title: "Accounting System",
          description: "Integrated accounting with charts and financial reports"
        },
        {
          icon: <Package className="h-8 w-8 marketing-icon-primary" />,
          title: "Inventory Management",
          description: "Track products and quantities with smart alerts"
        },
        {
          icon: <Truck className="h-8 w-8 marketing-icon-primary" />,
          title: "Shipping Companies",
          description: "Integration with shipping companies and automatic order tracking"
        },
        {
          icon: <TrendingUp className="h-8 w-8 marketing-icon-primary" />,
          title: "Conversion Tracking",
          description: "Measure ad performance and optimize conversion rates"
        },
        {
          icon: <Star className="h-8 w-8 marketing-icon-primary" />,
          title: "Multiple Themes",
          description: "8 gradient colors with day/night system"
        }
      ],
      header: {
        login: "Login",
        tryFree: "Try Free",
        brandName: "Sanadi Pro"
      },
      hero: {
        title: "Smart E-commerce Platform",
        subtitle: "Complete solution for managing your business efficiently and easily",
        description: "From product management to advanced analytics, everything you need for your e-commerce success in one place",
        getStarted: "Get Started Free",
        watchDemo: "Watch Demo"
      },
      featuresSection: {
        title: "Exceptional Features for Business Success",
        subtitle: "Everything you need to successfully manage your e-commerce business"
      },
      plans: {
        title: "Flexible Plans That Fit Your Needs",
        subtitle: "Choose the right plan for your business size"
      },
      testimonials: {
        title: "What Our Customers Say",
        subtitle: "Real opinions from satisfied customers about our services"
      },
      cta: {
        title: "Ready to Start Your Journey?",
        subtitle: "Join thousands of successful merchants and discover the difference",
        button: "Start Your Free Trial"
      },
      footer: {
        description: "Complete solution for managing your business efficiently and easily",
        secure: "Secure & Protected",
        product: "Product",
        features: "Features",
        pricing: "Pricing",
        support: "Support",
        help: "Help",
        contact: "Contact Us",
        docs: "Documentation",
        privacyPolicy: "Privacy Policy",
        rights: "All rights reserved"
      }
    }
  };

  const t = translations[language as keyof typeof translations];
  const features = t.features;

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const plans = [
    {
      name: language === "ar" ? "البداية" : "Starter",
      price: language === "ar" ? "49,000" : "49,000",
      period: language === "ar" ? "دينار/شهر" : "IQD/month",
      description: language === "ar" ? "مثالي للمتاجر الصغيرة والمبتدئين" : "Perfect for small stores and beginners",
      features: language === "ar" ? [
        "25 منتج",
        "25 صفحة هبوط", 
        "1000 طلب شهرياً",
        "3 حساب موظف",
        "إدارة مخزن",
        "8 ثيمات ألوان + نظام ليلي/نهاري",
        "دعم واتساب أساسي",
        "تقارير أساسية"
      ] : [
        "25 products",
        "25 landing pages", 
        "1000 orders/month",
        "3 staff accounts",
        "Inventory management",
        "8 color themes + day/night mode",
        "Basic WhatsApp support",
        "Basic reports"
      ],
      popular: false,
      buttonText: language === "ar" ? "ابدأ الآن" : "Start Now"
    },
    {
      name: language === "ar" ? "المحترف" : "Professional",
      price: language === "ar" ? "69,000" : "69,000",
      period: language === "ar" ? "دينار/شهر" : "IQD/month",
      description: language === "ar" ? "الأنسب للمتاجر النشطة والمتوسطة" : "Best for active and medium stores",
      features: language === "ar" ? [
        "1000 منتج",
        "صفحات هبوط غير محدودة",
        "2000 طلب شهرياً", 
        "10 حساب موظف",
        "إدارة مخزن",
        "ربط شركات التوصيل",
        "ربط بكسل Meta و TikTok",
        "8 ثيمات ألوان + نظام ليلي/نهاري",
        "تكامل الإعلانات المتقدم",
        "نظام المحاسبة",
        "تصدير Excel مخصص"
      ] : [
        "1000 products",
        "Unlimited landing pages",
        "2000 orders/month", 
        "10 staff accounts",
        "Inventory management",
        "Shipping companies integration",
        "Meta & TikTok pixel integration",
        "8 color themes + day/night mode",
        "Advanced ads integration",
        "Accounting system",
        "Custom Excel export"
      ],
      popular: true,
      buttonText: language === "ar" ? "الباقة الأشهر" : "Most Popular"
    },
    {
      name: language === "ar" ? "المؤسسة" : "Enterprise",
      price: language === "ar" ? "99,000" : "99,000", 
      period: language === "ar" ? "دينار/شهر" : "IQD/month",
      description: language === "ar" ? "للشركات الكبيرة والمؤسسات" : "For large companies and enterprises",
      features: language === "ar" ? [
        "منتجات غير محدودة",
        "طلبات غير محدودة",
        "موظفين غير محدودين",
        "إدارة مخزن متقدمة",
        "ربط شركات توصيل متقدم",
        "ربط بكسل Meta و TikTok متقدم",
        "8 ثيمات ألوان + نظام ليلي/نهاري",
        "إدارة حملات إعلانية متكاملة",
        "API مخصص",
        "نسخ احتياطية يومية",
        "دعم فني مخصص"
      ] : [
        "Unlimited products",
        "Unlimited orders",
        "Unlimited staff",
        "Advanced inventory management",
        "Advanced shipping integration",
        "Advanced Meta & TikTok pixel",
        "8 color themes + day/night mode",
        "Integrated ad campaign management",
        "Custom API",
        "Daily backups",
        "Dedicated technical support"
      ],
      popular: false,
      buttonText: language === "ar" ? "للمؤسسات" : "For Enterprise"
    }
  ];

  const testimonials = [
    {
      name: language === "ar" ? "سارة أحمد" : "Sarah Ahmed",
      business: language === "ar" ? "متجر الأزياء العصرية" : "Modern Fashion Store",
      rating: 5,
      comment: language === "ar" ? "المنصة غيرت طريقة إدارة متجري بالكامل. وفرت علي ساعات من العمل اليومي." : "The platform completely changed how I manage my store. It saved me hours of daily work."
    },
    {
      name: language === "ar" ? "علي حسام" : "Ali Hussam", 
      business: language === "ar" ? "متجر الإلكترونيات" : "Electronics Store",
      rating: 5,
      comment: language === "ar" ? "التكامل مع واتساب والإعلانات ساعدني أضاعف مبيعاتي في شهرين." : "WhatsApp and ads integration helped me double my sales in two months."
    },
    {
      name: language === "ar" ? "نور الدين" : "Nour Al-Din",
      business: language === "ar" ? "متجر المواد الغذائية" : "Grocery Store", 
      rating: 5,
      comment: language === "ar" ? "نظام المحاسبة والتقارير دقيق جداً وسهل الاستخدام." : "The accounting and reporting system is very accurate and easy to use."
    }
  ];

  return (
    <div className={`min-h-screen marketing-gradient-hero ${language === "ar" ? "rtl" : "ltr"}`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="marketing-border-light border-b marketing-bg-dark/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/platform-registration">
                <Button className="marketing-btn-primary px-4 py-2 text-sm">
                  {t.header.tryFree}
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={toggleLanguage}
                className="px-4 py-2 text-sm flex items-center gap-1"
              >
                <Languages className="h-4 w-4" />
                {language === "ar" ? "English" : "العربية"}
              </Button>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <img 
                src="/sanadi-logo-01.png" 
                alt="Sanadi Pro" 
                className="w-16 h-16 md:w-20 md:h-20 object-contain"
              />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/platform-login">
                <Button variant="outline" className="px-4 py-2 text-sm flex items-center gap-1">{t.header.login}</Button>
              </Link>
              <a href="https://sanadi.pro/platform-registration" target="_blank" rel="noopener noreferrer">
                <Button className="marketing-btn-primary px-4 py-2 text-sm">
                  {language === "ar" ? "تسجيل حساب" : "Sign Up"}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-10 md:py-20 px-3 md:px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 md:mb-6 marketing-badge hover:opacity-90 text-xs md:text-sm">
            <Zap className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-white" />
            {language === "ar" ? "منصة شاملة لإدارة أعمالك" : "Complete platform for managing your business"}
          </Badge>
          <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 marketing-text-contrast-light leading-tight px-2">
            {language === "ar" ? (
              <>
                حوّل متجرك إلى<br />
                <span className="marketing-text-glow">إمبراطورية تجارية</span>
              </>
            ) : (
              <>
                Transform your store into<br />
                <span className="marketing-text-glow">Business Empire</span>
              </>
            )}
          </h1>
          <p className="text-sm md:text-xl marketing-text-light mb-6 md:mb-8 max-w-3xl mx-auto">
            {t.hero.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-8 md:mb-12 px-4">
            <Link href="/platform-registration">
              <Button size="lg" className="marketing-btn-primary px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg w-full sm:w-auto">
                {t.hero.getStarted}
                <ArrowRight className="mr-2 h-4 w-4 md:h-5 md:w-5 text-white" />
              </Button>
            </Link>
            <Button size="lg" className="marketing-btn-secondary px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg w-full sm:w-auto">
              {t.hero.watchDemo}
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-20 px-4">
            <div className="text-center marketing-card rounded-lg p-3 md:p-4">
              <h3 className="text-xl md:text-3xl font-bold marketing-accent mb-1">50+</h3>
              <p className="text-xs md:text-sm marketing-text-light">{language === "ar" ? "متجر نشط" : "Active Stores"}</p>
            </div>
            <div className="text-center marketing-card rounded-lg p-3 md:p-4">
              <h3 className="text-xl md:text-3xl font-bold marketing-accent mb-1">24/7</h3>
              <p className="text-xs md:text-sm marketing-text-light">{language === "ar" ? "دعم فني" : "Support"}</p>
            </div>
            <div className="text-center marketing-card rounded-lg p-3 md:p-4">
              <h3 className="text-xl md:text-3xl font-bold marketing-accent mb-1">99%</h3>
              <p className="text-xs md:text-sm marketing-text-light">{language === "ar" ? "نسبة الرضا" : "Satisfaction"}</p>
            </div>
            <div className="text-center marketing-card rounded-lg p-3 md:p-4">
              <h3 className="text-xl md:text-3xl font-bold marketing-accent mb-1">5x</h3>
              <p className="text-xs md:text-sm marketing-text-light">{language === "ar" ? "زيادة المبيعات" : "Sales Growth"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 md:py-20 px-3 md:px-4 marketing-bg-dark">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 marketing-text-contrast-light">
              {t.featuresSection.title}
            </h2>
            <p className="text-sm md:text-xl marketing-text-light max-w-2xl mx-auto">
              {t.featuresSection.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="marketing-card hover:marketing-card-hover transition-all duration-300 p-3 md:p-4 aspect-square flex flex-col justify-center items-center text-center">
                <CardContent className="p-0 flex flex-col items-center justify-center h-full space-y-2 md:space-y-3 text-center">
                  <div className="flex justify-center items-center mb-1 md:mb-2">{feature.icon}</div>
                  <CardTitle className="text-xs md:text-sm lg:text-base marketing-text-contrast-light leading-tight text-center">
                    {feature.title}
                  </CardTitle>
                  <p className="marketing-text-light text-xs md:text-sm leading-tight text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-10 md:py-20 px-3 md:px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 marketing-text-contrast-light">
              {t.plans.title}
            </h2>
            <p className="text-sm md:text-xl marketing-text-light max-w-2xl mx-auto">
              {t.plans.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`marketing-card hover:marketing-card-hover transition-all duration-300 relative ${
                  plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 marketing-badge text-xs">
                    {language === "ar" ? "الأشهر" : "Popular"}
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl md:text-2xl marketing-text-contrast-light mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-2">
                    <span className="text-2xl md:text-4xl font-bold marketing-accent">{plan.price}</span>
                    <span className="text-sm marketing-text-light"> {plan.period}</span>
                  </div>
                  <p className="text-xs md:text-sm marketing-text-light">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 md:space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <Check className="h-3 w-3 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs md:text-sm marketing-text-light">{feature}</span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Link href="/platform-registration">
                      <Button 
                        className={`w-full text-xs md:text-sm ${
                          plan.popular ? 'marketing-btn-primary' : 'marketing-btn-secondary'
                        }`}
                      >
                        {plan.buttonText}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-10 md:py-20 px-3 md:px-4 marketing-bg-dark">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 marketing-text-contrast-light">
              {t.testimonials.title}
            </h2>
            <p className="text-sm md:text-xl marketing-text-light max-w-2xl mx-auto">
              {t.testimonials.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="marketing-card hover:marketing-card-hover transition-all duration-300 p-4 md:p-6">
                <CardContent className="space-y-3 md:space-y-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="marketing-text-light text-sm md:text-base italic">
                    "{testimonial.comment}"
                  </p>
                  <div>
                    <h4 className="font-semibold marketing-text-contrast-light text-sm md:text-base">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs md:text-sm marketing-text-light">
                      {testimonial.business}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-20 px-3 md:px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 marketing-text-contrast-light">
            {t.cta.title}
          </h2>
          <p className="text-sm md:text-xl marketing-text-light mb-6 md:mb-8 max-w-2xl mx-auto">
            {t.cta.subtitle}
          </p>
          <Link href="/platform-registration">
            <Button size="lg" className="marketing-btn-primary px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg">
              {t.cta.button}
              <ArrowRight className="mr-2 h-4 w-4 md:h-5 md:w-5 text-white" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="marketing-bg-dark marketing-border-light border-t py-8 md:py-12 px-3 md:px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <img 
                  src="/sanadi-logo-01.png" 
                  alt="Sanadi Pro" 
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                />
                <h3 className="text-lg font-bold marketing-text-light">
                  {t.header.brandName}
                </h3>
              </div>
              <p className="marketing-text-light mb-3 md:mb-4 text-sm md:text-base max-w-md">
                {t.footer.description}
              </p>
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <Shield className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                <span className="marketing-text-light">{t.footer.secure}</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold marketing-text-light mb-2 md:mb-4 text-sm md:text-base">
                {t.footer.product}
              </h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <li><a href="#" className="marketing-text-light hover:marketing-accent transition-colors">{t.footer.features}</a></li>
                <li><a href="#" className="marketing-text-light hover:marketing-accent transition-colors">{t.footer.pricing}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold marketing-text-light mb-2 md:mb-4 text-sm md:text-base">
                {t.footer.support}
              </h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <li><a href="#" className="marketing-text-light hover:marketing-accent transition-colors">{t.footer.help}</a></li>
                <li><a href="#" className="marketing-text-light hover:marketing-accent transition-colors">{t.footer.contact}</a></li>
                <li><a href="#" className="marketing-text-light hover:marketing-accent transition-colors">{t.footer.docs}</a></li>
              </ul>
            </div>
          </div>
          <div className="marketing-border-light border-t pt-4 md:pt-8 text-center space-y-4">
            <div className="flex justify-center">
              <a 
                href="/privacy-policy"
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
              >
                <Shield className="h-4 w-4" />
                {t.footer.privacyPolicy}
              </a>
            </div>
            <p className="marketing-text-light text-xs md:text-sm">
              © 2024 Sanadi Pro. {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
