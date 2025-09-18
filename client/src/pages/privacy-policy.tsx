import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Languages, ArrowLeft, ArrowRight } from "lucide-react";

export default function PrivacyPolicy() {
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
      title: "سياسة الخصوصية",
      introduction: {
        title: "مقدمة",
        content: `نحن في ${businessName} نولي اهتماماً كبيراً بخصوصية عملائنا وحماية بياناتهم الشخصية. تهدف هذه السياسة إلى توضيح كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمونها لنا.`
      },
      dataCollection: {
        title: "المعلومات التي نجمعها",
        content: "نقوم بجمع المعلومات التالية عندما تتفاعل معنا:",
        items: [
          "المعلومات الشخصية: الاسم الكامل ورقم الهاتف",
          "معلومات الاتصال: عنوان الشحن والمحافظة", 
          "معلومات الطلب: تفاصيل المنتجات المطلوبة والعروض المختارة",
          "الملاحظات: أي طلبات أو تعليقات إضافية"
        ]
      },
      dataUsage: {
        title: "كيف نستخدم معلوماتك",
        content: "نستخدم المعلومات المجمعة للأغراض التالية:",
        items: [
          "معالجة وتنفيذ طلبياتك",
          "التواصل معك بخصوص طلبك عبر الواتساب أو الهاتف",
          "ترتيب عملية الشحن والتوصيل",
          "تحسين خدماتنا ومنتجاتنا",
          "إرسال تحديثات حول حالة الطلب"
        ]
      },
      cookies: {
        title: "ملفات تعريف الارتباط (الكوكيز)",
        content: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا وتذكر تفضيلاتك. يمكنك إيقاف هذه الملفات من إعدادات المتصفح إذا رغبت في ذلك."
      },
      contact: {
        title: "تواصل معنا",
        content: "إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية هذه، يرجى التواصل معنا:"
      },
      backToSite: "العودة إلى الموقع الرئيسي",
      rights: "جميع الحقوق محفوظة"
    },
    en: {
      title: "Privacy Policy",
      introduction: {
        title: "Introduction",
        content: `At ${businessName}, we take great care in protecting our customers' privacy and personal data. This policy aims to explain how we collect, use, and protect the personal information you provide to us.`
      },
      dataCollection: {
        title: "Information We Collect",
        content: "We collect the following information when you interact with us:",
        items: [
          "Personal Information: Full name and phone number",
          "Contact Information: Shipping address and governorate",
          "Order Information: Details of requested products and selected offers", 
          "Notes: Any additional requests or comments"
        ]
      },
      dataUsage: {
        title: "How We Use Your Information",
        content: "We use the collected information for the following purposes:",
        items: [
          "Processing and fulfilling your orders",
          "Communicating with you about your order via WhatsApp or phone",
          "Arranging shipping and delivery",
          "Improving our services and products",
          "Sending updates about order status"
        ]
      },
      cookies: {
        title: "Cookies",
        content: "We use cookies to improve your experience on our website and remember your preferences. You can disable these files from your browser settings if you wish."
      },
      contact: {
        title: "Contact Us",
        content: "If you have any questions or inquiries about this privacy policy, please contact us:"
      },
      backToSite: "Back to Main Site",
      rights: "All rights reserved"
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className={`min-h-screen bg-gray-50 ${language === "ar" ? "rtl" : "ltr"}`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={toggleLanguage}
              className="text-white border-white hover:bg-white hover:text-blue-600 px-4 py-2 text-sm flex items-center gap-2"
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
                <p className="text-sm text-blue-100">
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.dataCollection.title}</h2>
              <p>{t.dataCollection.content}</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                {t.dataCollection.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.dataUsage.title}</h2>
              <p>{t.dataUsage.content}</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                {t.dataUsage.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.cookies.title}</h2>
              <p>{t.cookies.content}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.contact.title}</h2>
              <p>{t.contact.content}</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p><strong className="text-blue-600">{language === "ar" ? "البريد الإلكتروني:" : "Email:"}</strong> <span className="text-blue-600">{contactEmail}</span></p>
                <p><strong className="text-blue-600">{language === "ar" ? "الهاتف:" : "Phone:"}</strong> <span className="text-blue-600">{contactPhone}</span></p>
                <p><strong className="text-blue-600">{language === "ar" ? "اسم النشاط:" : "Business Name:"}</strong> <span className="text-blue-600">{businessName}</span></p>
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
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            {language === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {t.backToSite}
          </a>
        </div>
      </div>
    </div>
  );
}