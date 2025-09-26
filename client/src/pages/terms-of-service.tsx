import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Languages, ArrowLeft, ArrowRight } from "lucide-react";

export default function TermsOfService() {
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

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const businessName = "Sanadi Pro";
  const contactEmail = "info@sanadi.pro";
  const contactPhone = "+9647814411303";

  const content = {
    ar: {
      title: "شروط الخدمة",
      introduction: {
        title: "مقدمة",
        content: `مرحباً بك في ${businessName}. باستخدامك لخدماتنا، فإنك توافق على الالتزام بشروط الخدمة هذه. يرجى قراءة هذه الشروط بعناية قبل استخدام منصتنا.`
      },
      acceptance: {
        title: "قبول الشروط",
        content: "باستخدام موقعنا الإلكتروني أو خدماتنا، فإنك تؤكد أنك:",
        items: [
          "تبلغ من العمر 18 عاماً أو أكثر أو تحت إشراف ولي أمر",
          "تملك الأهلية القانونية لإبرام العقود",
          "توافق على الالتزام بجميع الشروط والأحكام المذكورة هنا",
          "تقدم معلومات صحيحة ودقيقة عند التسجيل أو الطلب"
        ]
      },
      services: {
        title: "وصف الخدمات",
        content: "نحن نقدم منصة تجارة إلكترونية تشمل:",
        items: [
          "بيع المنتجات والسلع المختلفة",
          "خدمات التسويق الرقمي وإدارة الإعلانات",
          "إنشاء صفحات الهبوط والمتاجر الإلكترونية",
          "خدمات الشحن والتوصيل",
          "دعم العملاء والمساعدة الفنية"
        ]
      },
      orders: {
        title: "الطلبات والدفع",
        content: "عند تقديم طلب عبر منصتنا:",
        items: [
          "جميع الطلبات تخضع للتأكيد والموافقة من قبلنا",
          "الأسعار المعروضة تشمل جميع الرسوم والضرائب المطبقة",
          "يتم الدفع عند الاستلام أو حسب طريقة الدفع المتفق عليها",
          "نحتفظ بالحق في إلغاء أي طلب لأسباب تقنية أو قانونية",
          "مدة التسليم تتراوح بين 1-7 أيام عمل حسب المنطقة"
        ]
      },
      userResponsibilities: {
        title: "مسؤوليات المستخدم",
        content: "يتعهد المستخدم بـ:",
        items: [
          "استخدام الخدمة لأغراض قانونية فقط",
          "عدم انتهاك حقوق الملكية الفكرية",
          "عدم نشر محتوى مسيء أو غير قانوني",
          "الحفاظ على سرية بيانات الحساب",
          "إبلاغنا فوراً عن أي استخدام غير مصرح به للحساب"
        ]
      },
      limitations: {
        title: "حدود المسؤولية",
        content: "نحن غير مسؤولين عن:",
        items: [
          "أي أضرار غير مباشرة أو عرضية",
          "فقدان البيانات أو الأرباح",
          "انقطاع الخدمة لأسباب تقنية خارجة عن سيطرتنا",
          "أخطاء في المحتوى المقدم من طرف ثالث",
          "التأخير في التسليم بسبب ظروف قاهرة"
        ]
      },
      termination: {
        title: "إنهاء الخدمة",
        content: "يحق لنا إنهاء أو تعليق حسابك في الحالات التالية:",
        items: [
          "انتهاك أي من شروط الخدمة هذه",
          "استخدام الخدمة لأغراض غير قانونية",
          "تقديم معلومات كاذبة أو مضللة",
          "عدم الدفع أو التأخر في السداد",
          "أي سلوك يضر بسمعة الشركة أو المستخدمين الآخرين"
        ]
      },
      changes: {
        title: "تعديل الشروط",
        content: "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع."
      },
      contact: {
        title: "تواصل معنا",
        content: "لأي استفسارات حول شروط الخدمة، يرجى التواصل معنا:"
      },
      backToSite: "العودة إلى الموقع الرئيسي",
      rights: "جميع الحقوق محفوظة"
    },
    en: {
      title: "Terms of Service",
      introduction: {
        title: "Introduction",
        content: `Welcome to ${businessName}. By using our services, you agree to comply with these terms of service. Please read these terms carefully before using our platform.`
      },
      acceptance: {
        title: "Acceptance of Terms",
        content: "By using our website or services, you confirm that you:",
        items: [
          "Are 18 years of age or older, or under parental supervision",
          "Have the legal capacity to enter into contracts",
          "Agree to comply with all terms and conditions mentioned herein",
          "Provide accurate and truthful information when registering or ordering"
        ]
      },
      services: {
        title: "Description of Services",
        content: "We provide an e-commerce platform that includes:",
        items: [
          "Sale of various products and goods",
          "Digital marketing services and ad management",
          "Creation of landing pages and online stores",
          "Shipping and delivery services",
          "Customer support and technical assistance"
        ]
      },
      orders: {
        title: "Orders and Payment",
        content: "When placing an order through our platform:",
        items: [
          "All orders are subject to confirmation and approval by us",
          "Displayed prices include all applicable fees and taxes",
          "Payment is made upon delivery or according to the agreed payment method",
          "We reserve the right to cancel any order for technical or legal reasons",
          "Delivery time ranges from 1-7 business days depending on the region"
        ]
      },
      userResponsibilities: {
        title: "User Responsibilities",
        content: "The user undertakes to:",
        items: [
          "Use the service for legal purposes only",
          "Not violate intellectual property rights",
          "Not post offensive or illegal content",
          "Maintain the confidentiality of account data",
          "Immediately notify us of any unauthorized use of the account"
        ]
      },
      limitations: {
        title: "Limitation of Liability",
        content: "We are not responsible for:",
        items: [
          "Any indirect or incidental damages",
          "Loss of data or profits",
          "Service interruption due to technical reasons beyond our control",
          "Errors in content provided by third parties",
          "Delivery delays due to force majeure circumstances"
        ]
      },
      termination: {
        title: "Service Termination",
        content: "We have the right to terminate or suspend your account in the following cases:",
        items: [
          "Violation of any of these terms of service",
          "Using the service for illegal purposes",
          "Providing false or misleading information",
          "Non-payment or delay in payment",
          "Any behavior that harms the company's reputation or other users"
        ]
      },
      changes: {
        title: "Modification of Terms",
        content: "We reserve the right to modify these terms at any time. You will be notified of any material changes via email or notice on the website."
      },
      contact: {
        title: "Contact Us",
        content: "For any inquiries about the terms of service, please contact us:"
      },
      backToSite: "Back to Main Site",
      rights: "All rights reserved"
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className={`min-h-screen bg-gray-50 ${language === "ar" ? "rtl" : "ltr"}`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={toggleLanguage}
              className="text-white border-white hover:bg-white hover:text-green-600 px-4 py-2 text-sm flex items-center gap-2"
            >
              <Languages className="h-4 w-4" />
              {language === "ar" ? "English" : "العربية"}
            </Button>
            <div className="flex items-center gap-3">
              <img 
                src="/sanadi-logo-01.png" 
                alt="Sanadi Pro" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold">{businessName}</h1>
                <p className="text-sm text-green-100">
                  {language === "ar" ? "منصة التجارة الإلكترونية الذكية" : "Smart E-commerce Platform"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t.title}</h1>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.introduction.title}</h2>
              <p>{t.introduction.content}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.acceptance.title}</h2>
              <p>{t.acceptance.content}</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                {t.acceptance.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.services.title}</h2>
              <p>{t.services.content}</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                {t.services.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.orders.title}</h2>
              <p>{t.orders.content}</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                {t.orders.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.userResponsibilities.title}</h2>
              <p>{t.userResponsibilities.content}</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                {t.userResponsibilities.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.limitations.title}</h2>
              <p>{t.limitations.content}</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                {t.limitations.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.termination.title}</h2>
              <p>{t.termination.content}</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                {t.termination.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.changes.title}</h2>
              <p>{t.changes.content}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.contact.title}</h2>
              <p>{t.contact.content}</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p><strong className="text-green-600">{language === "ar" ? "البريد الإلكتروني:" : "Email:"}</strong> <span className="text-green-600">{contactEmail}</span></p>
                <p><strong className="text-green-600">{language === "ar" ? "الهاتف:" : "Phone:"}</strong> <span className="text-green-600">{contactPhone}</span></p>
                <p><strong className="text-green-600">{language === "ar" ? "اسم النشاط:" : "Business Name:"}</strong> <span className="text-green-600">{businessName}</span></p>
              </div>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600 text-center">
                {language === "ar" ? "تاريخ آخر تحديث:" : "Last Updated:"} {new Date().toLocaleDateString(language === "ar" ? 'ar-SA' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <p className="text-sm">© 2025 {businessName}. {t.rights}</p>
          <a 
            href="https://sanadi.pro/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            {language === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {t.backToSite}
          </a>
        </div>
      </div>
    </div>
  );
}
