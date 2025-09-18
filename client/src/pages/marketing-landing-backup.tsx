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
        // Get user's country from IP
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const country = data.country_code;
        
        // Arabic countries
        const arabicCountries = ['SA', 'AE', 'EG', 'JO', 'LB', 'SY', 'IQ', 'KW', 'QA', 'BH', 'OM', 'YE', 'PS', 'MA', 'TN', 'DZ', 'LY', 'SD', 'SO', 'DJ', 'KM', 'MR'];
        
        if (arabicCountries.includes(country)) {
          setLanguage("ar");
        } else {
          setLanguage("en");
        }
      } catch (error) {
        // Default to Arabic if detection fails
        setLanguage("ar");
      }
    };

    detectLanguage();
  }, []);

  // صفحة Marketing تستخدم نظام الألوان الثابت المحدد في CSS

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
          title: "تطبيق موبايل",
          description: "تطبيق جوال متكامل لإدارة أعمالك من أي مكان"
        },
        {
          icon: <BarChart3 className="h-8 w-8 marketing-icon-primary" />,
          title: "تحليلات متقدمة",
          description: "تقارير مفصلة ورؤى ذكية لتحسين أداء أعمالك"
        },
        {
          icon: <Users className="h-8 w-8 marketing-icon-primary" />,
          title: "إدارة العملاء",
          description: "نظام CRM متكامل لإدارة العلاقات مع العملاء"
        },
        {
          icon: <Package className="h-8 w-8 marketing-icon-primary" />,
          title: "إدارة المخزون",
          description: "تتبع المخزون والمبيعات بدقة وكفاءة عالية"
        }
      ],
      header: {
        login: "دخول",
        tryFree: "جرب مجاناً",
        loginFull: "تسجيل الدخول",
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
        subtitle: "اختر الخطة المناسبة لحجم أعمالك",
        monthly: "شهرياً",
        yearly: "سنوياً",
        save20: "وفر 20%",
        basic: {
          name: "الأساسية",
          price: "99",
          description: "مثالية للشركات الناشئة",
          features: [
            "حتى 100 منتج",
            "صفحة هبوط واحدة",
            "تقارير أساسية",
            "دعم فني عبر الإيميل"
          ]
        },
        professional: {
          name: "الاحترافية",
          price: "199",
          description: "الأفضل للشركات المتنامية",
          features: [
            "منتجات غير محدودة",
            "5 صفحات هبوط",
            "تحليلات متقدمة",
            "دعم فني على مدار الساعة",
            "تكامل مع وسائل الدفع"
          ],
          popular: "الأكثر شعبية"
        },
        enterprise: {
          name: "المؤسسية",
          price: "399",
          description: "للشركات الكبيرة",
          features: [
            "كل مميزات الاحترافية",
            "صفحات هبوط غير محدودة",
            "API مخصص",
            "مدير حساب مخصص",
            "تدريب متخصص"
          ]
        },
        choosePlan: "اختر هذه الخطة"
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
        about: "حول",
        support: "الدعم",
        help: "المساعدة",
        contact: "تواصل معنا",
        docs: "الوثائق",
        legal: "قانوني",
        privacy: "سياسة الخصوصية",
        terms: "الشروط والأحكام",
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
          title: "Mobile App",
          description: "Complete mobile application to manage your business from anywhere"
        },
        {
          icon: <BarChart3 className="h-8 w-8 marketing-icon-primary" />,
          title: "Advanced Analytics",
          description: "Detailed reports and smart insights to improve your business performance"
        },
        {
          icon: <Users className="h-8 w-8 marketing-icon-primary" />,
          title: "Customer Management",
          description: "Integrated CRM system for managing customer relationships"
        },
        {
          icon: <Package className="h-8 w-8 marketing-icon-primary" />,
          title: "Inventory Management",
          description: "Track inventory and sales with precision and high efficiency"
        }
      ],
      header: {
        login: "Login",
        tryFree: "Try Free",
        loginFull: "Sign In",
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
        subtitle: "Choose the right plan for your business size",
        monthly: "Monthly",
        yearly: "Yearly",
        save20: "Save 20%",
        basic: {
          name: "Basic",
          price: "99",
          description: "Perfect for startups",
          features: [
            "Up to 100 products",
            "1 landing page",
            "Basic reports",
            "Email support"
          ]
        },
        professional: {
          name: "Professional",
          price: "199",
          description: "Best for growing businesses",
          features: [
            "Unlimited products",
            "5 landing pages",
            "Advanced analytics",
            "24/7 support",
            "Payment gateway integration"
          ],
          popular: "Most Popular"
        },
        enterprise: {
          name: "Enterprise",
          price: "399",
          description: "For large companies",
          features: [
            "All Professional features",
            "Unlimited landing pages",
            "Custom API",
            "Dedicated account manager",
            "Specialized training"
          ]
        },
        choosePlan: "Choose This Plan"
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
        about: "About",
        support: "Support",
        help: "Help",
        contact: "Contact Us",
        docs: "Documentation",
        legal: "Legal",
        privacy: "Privacy Policy",
        terms: "Terms & Conditions",
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
      ],
      popular: false,
      buttonText: "ابدأ الآن"
    },
    {
      name: "المحترف",
      price: "69,000",
      period: "دينار/شهر",
      description: "الأنسب للمتاجر النشطة والمتوسطة",
      features: [
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
      ],
      popular: true,
      buttonText: "الباقة الأشهر"
    },
    {
      name: "المؤسسة",
      price: "99,000", 
      period: "دينار/شهر",
      description: "للشركات الكبيرة والمؤسسات",
      features: [
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
      ],
      popular: false,
      buttonText: "للمؤسسات"
    }
  ];

  const testimonials = [
    {
      name: "سارة أحمد",
      business: "متجر الأزياء العصرية",
      rating: 5,
      comment: "المنصة غيرت طريقة إدارة متجري بالكامل. وفرت علي ساعات من العمل اليومي."
    },
    {
      name: "علي حسام", 
      business: "متجر الإلكترونيات",
      rating: 5,
      comment: "التكامل مع واتساب والإعلانات ساعدني أضاعف مبيعاتي في شهرين."
    },
    {
      name: "نور الدين",
      business: "متجر المواد الغذائية", 
      rating: 5,
      comment: "نظام المحاسبة والتقارير دقيق جداً وسهل الاستخدام."
    }
  ];

  return (
    <div className="min-h-screen marketing-gradient-hero rtl" dir="rtl">
      {/* Header */}
      <header className="marketing-border-light border-b marketing-bg-dark/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/platform-login">
                <Button size="sm" variant="outline" className="text-xs">{t.header.login}</Button>
              </Link>
              <Link href="/platform-registration">
                <Button size="sm" className="marketing-btn-primary text-xs">
                  {t.header.tryFree}
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={toggleLanguage}
                className="text-xs flex items-center gap-1"
              >
                <Languages className="h-3 w-3" />
                {language === "ar" ? "English" : "العربية"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <img 
                src="/sanadi-logo-01.png" 
                alt="Sanadi Pro" 
                className="w-12 h-12 object-contain"
              />
              <h1 className="text-lg font-bold marketing-text-light">
                {t.header.brandName}
              </h1>
            </div>
          </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <img 
                  src="/sanadi-logo-01.png" 
                  alt="Sanadi Pro" 
                  className="w-14 h-14 object-contain"
                />
                <h1 className="text-2xl font-bold marketing-text-light">
                  Sanadi Pro
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/platform-login">
                  <Button variant="outline">تسجيل الدخول</Button>
                </Link>
                <Link href="/platform-registration">
                  <Button className="marketing-btn-primary">
                    جرب مجاناً
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-10 md:py-20 px-3 md:px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 md:mb-6 marketing-badge hover:opacity-90 text-xs md:text-sm">
            <Zap className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-white" />
            منصة شاملة لإدارة أعمالك
          </Badge>
          <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 marketing-text-contrast-light leading-tight px-2">
            حوّل متجرك إلى<br />
            <span className="marketing-text-glow">إمبراطورية تجارية</span>
          </h1>
          <p className="text-sm md:text-xl marketing-text-light mb-6 md:mb-8 max-w-3xl mx-auto">
            منصة متكاملة تجمع إدارة المنتجات، المبيعات، المحاسبة، والإعلانات في مكان واحد. 
            ابدأ رحلتك نحو النجاح التجاري مع أقوى الأدوات العربية.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-8 md:mb-12 px-4">
            <Link href="/platform-registration">
              <Button size="lg" className="marketing-btn-primary px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg w-full sm:w-auto">
                ابدأ تجربتك المجانية
                <ArrowRight className="mr-2 h-4 w-4 md:h-5 md:w-5 text-white" />
              </Button>
            </Link>
            <Button size="lg" className="marketing-btn-secondary px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg w-full sm:w-auto">
              شاهد العرض التوضيحي
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-20 px-4">
            <div className="text-center marketing-card rounded-lg p-3 md:p-4">
              <h3 className="text-xl md:text-3xl font-bold marketing-accent mb-1">50+</h3>
              <p className="text-xs md:text-sm marketing-text-light">متجر نشط</p>
            </div>
            <div className="text-center marketing-card rounded-lg p-3 md:p-4">
              <h3 className="text-xl md:text-3xl font-bold marketing-accent mb-1">24/7</h3>
              <p className="text-xs md:text-sm marketing-text-light">دعم فني</p>
            </div>
            <div className="text-center marketing-card rounded-lg p-3 md:p-4">
              <h3 className="text-xl md:text-3xl font-bold marketing-accent mb-1">99%</h3>
              <p className="text-xs md:text-sm marketing-text-light">نسبة الرضا</p>
            </div>
            <div className="text-center marketing-card rounded-lg p-3 md:p-4">
              <h3 className="text-xl md:text-3xl font-bold marketing-accent mb-1">5x</h3>
              <p className="text-xs md:text-sm marketing-text-light">زيادة المبيعات</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 px-3 md:px-4 marketing-section-dark">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold marketing-text-contrast-light mb-3 md:mb-4">
              كل ما تحتاجه لإدارة متجرك
            </h2>
            <p className="text-sm md:text-lg marketing-text-light max-w-2xl mx-auto">
              مجموعة شاملة من الأدوات المتطورة لإدارة جميع جوانب عملك التجاري
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center marketing-card hover:shadow-lg transition-all duration-300 p-2 md:p-4">
                <CardHeader className="p-2 md:p-6">
                  <div className="flex justify-center mb-2 md:mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-sm md:text-lg mb-1 md:mb-2 marketing-text-light">{feature.title}</CardTitle>
                  <p className="text-xs md:text-sm marketing-text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-20 px-3 md:px-4 marketing-section-light">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 marketing-text-contrast-dark">
              اختر الباقة المناسبة لك
            </h2>
            <p className="text-sm md:text-lg marketing-text-dark">
              باقات مرنة تناسب جميع أحجام الأعمال
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative overflow-hidden marketing-card ${plan.popular ? 'marketing-glow ring-2 ring-blue-400 scale-105' : ''} hover:shadow-xl transition-all duration-300`}>
                {plan.popular && (
                  <Badge className="absolute top-4 right-4 marketing-badge text-xs">
                    الأشهر
                  </Badge>
                )}
                <CardHeader className="text-center p-4 md:p-6">
                  <CardTitle className="text-lg md:text-2xl font-bold marketing-text-light">{plan.name}</CardTitle>
                  <div className="mt-3 md:mt-4">
                    <span className="text-2xl md:text-4xl font-bold marketing-accent">{plan.price}</span>
                    <span className="text-sm md:text-base marketing-text-light mr-1">{plan.period}</span>
                  </div>
                  <p className="text-xs md:text-sm marketing-text-muted mt-1 md:mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center text-xs md:text-sm">
                        <Check className="h-3 w-3 md:h-4 md:w-4 marketing-icon-accent mr-2 md:mr-3 flex-shrink-0" />
                        <span className="marketing-text-light">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/platform-registration">
                    <Button 
                      className={`w-full text-xs md:text-sm ${plan.popular ? 'marketing-btn-primary' : 'marketing-btn-secondary'}`}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-20 px-3 md:px-4 marketing-section-dark">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 marketing-text-contrast-light">
              آراء عملائنا
            </h2>
            <p className="text-sm md:text-lg marketing-text-light">
              اكتشف كيف ساعدت منصتنا الآلاف في نمو أعمالهم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="marketing-card hover:shadow-lg transition-all duration-300 p-3 md:p-6">
                <CardContent className="text-center">
                  <div className="flex justify-center mb-2 md:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs md:text-sm marketing-text-light mb-3 md:mb-4 italic">
                    "{testimonial.comment}"
                  </p>
                  <div>
                    <h4 className="font-semibold text-sm md:text-base marketing-text-light">{testimonial.name}</h4>
                    <p className="text-xs md:text-sm marketing-text-muted">{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-3 md:px-4 marketing-gradient-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold marketing-text-contrast-light mb-3 md:mb-4">
            ابدأ رحلتك التجارية اليوم
          </h2>
          <p className="text-sm md:text-xl marketing-text-light/90 mb-6 md:mb-8 max-w-2xl mx-auto">
            انضم لآلاف التجار الذين حولوا أعمالهم باستخدام منصتنا المتطورة
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link href="/platform-registration">
              <Button size="lg" className="bg-white marketing-primary hover:bg-gray-100 px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg">
                ابدأ تجربة مجانية
                <ArrowRight className="mr-2 h-4 w-4 md:h-5 md:w-5 marketing-primary" />
              </Button>
            </Link>
            <Button size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 border-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg">
              تحدث مع مختص
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="marketing-bg-dark marketing-text-light py-8 md:py-12 px-3 md:px-4 marketing-border-light border-t">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <img 
                  src="/sanadi-logo-01.png" 
                  alt="Sanadi Pro" 
                  className="w-12 h-12 object-contain"
                />
                <h3 className="text-lg md:text-xl font-bold marketing-text-light">Sanadi Pro</h3>
              </div>
              <p className="text-xs md:text-sm marketing-text-muted mb-3 md:mb-4 max-w-md">
                الحل الشامل لإدارة أعمالك التجارية بكفاءة عالية وسهولة تامة
              </p>
              <div className="flex gap-4">
                <Shield className="h-4 w-4 md:h-5 md:w-5 marketing-icon-primary" />
                <span className="text-xs md:text-sm marketing-text-muted">آمن ومحمي</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm md:text-base mb-3 md:mb-4 marketing-text-light">الخدمات</h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm marketing-text-muted">
                <li>إدارة المنتجات</li>
                <li>صفحات الهبوط</li>
                <li>نظام المحاسبة</li>
                <li>التقارير والتحليلات</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm md:text-base mb-3 md:mb-4 marketing-text-light">الدعم</h4>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm marketing-text-muted">
                <li className="flex items-center gap-2">
                  <Headphones className="h-3 w-3 md:h-4 md:w-4 marketing-icon-primary" />
                  دعم فني 24/7
                </li>
                <li>الأسئلة الشائعة</li>
                <li>التوثيق</li>
                <li>تواصل معنا</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-6 md:mt-8 pt-4 md:pt-6 text-center">
            <p className="text-xs md:text-sm marketing-text-muted">
              2024 Sanadi Pro. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}