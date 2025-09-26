import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages, ArrowLeft, ArrowRight, Trash2, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DataDeletion() {
  const [language, setLanguage] = useState("ar");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    reason: "",
    additionalInfo: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

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
      title: "طلب حذف البيانات الشخصية",
      subtitle: "نحترم حقك في الخصوصية وحذف بياناتك",
      description: "يمكنك طلب حذف جميع بياناتك الشخصية من منصتنا. سنقوم بمعالجة طلبك خلال 30 يوماً من تاريخ الاستلام.",
      form: {
        title: "نموذج طلب حذف البيانات",
        email: "البريد الإلكتروني",
        emailPlaceholder: "أدخل بريدك الإلكتروني",
        phone: "رقم الهاتف",
        phonePlaceholder: "أدخل رقم هاتفك",
        reason: "سبب الحذف",
        reasonPlaceholder: "اختياري - أخبرنا لماذا تريد حذف بياناتك",
        additionalInfo: "معلومات إضافية",
        additionalInfoPlaceholder: "أي معلومات إضافية تساعدنا في تحديد حسابك",
        submit: "إرسال طلب الحذف",
        submitting: "جاري الإرسال..."
      },
      whatWeDelete: {
        title: "ما الذي سيتم حذفه؟",
        items: [
          "جميع المعلومات الشخصية (الاسم، البريد الإلكتروني، الهاتف)",
          "عناوين الشحن والتوصيل",
          "تاريخ الطلبات والمشتريات",
          "تفضيلات الحساب والإعدادات",
          "أي بيانات أخرى مرتبطة بحسابك"
        ]
      },
      process: {
        title: "عملية الحذف",
        steps: [
          "استلام طلبك والتحقق من الهوية",
          "مراجعة البيانات المرتبطة بحسابك",
          "حذف جميع البيانات من أنظمتنا",
          "إرسال تأكيد إتمام عملية الحذف"
        ]
      },
      important: {
        title: "معلومات مهمة",
        items: [
          "عملية الحذف نهائية ولا يمكن التراجع عنها",
          "قد نحتفظ ببعض البيانات لأغراض قانونية أو محاسبية",
          "سيتم حذف حسابك نهائياً ولن تتمكن من الوصول إليه",
          "قد تستغرق العملية حتى 30 يوماً للإكمال"
        ]
      },
      alternatives: {
        title: "بدائل أخرى",
        description: "بدلاً من حذف حسابك بالكامل، يمكنك:",
        items: [
          "تعديل إعدادات الخصوصية",
          "إلغاء الاشتراك من الرسائل التسويقية",
          "تحديث معلوماتك الشخصية",
          "تعطيل الحساب مؤقتاً"
        ]
      },
      contact: {
        title: "تواصل معنا",
        description: "إذا كان لديك أسئلة حول عملية حذف البيانات:"
      },
      success: {
        title: "تم إرسال طلبك بنجاح!",
        description: "سنقوم بمراجعة طلبك ومعالجته خلال 30 يوماً. ستتلقى تأكيداً عبر البريد الإلكتروني عند إتمام العملية."
      },
      backToSite: "العودة إلى الموقع الرئيسي",
      rights: "جميع الحقوق محفوظة"
    },
    en: {
      title: "Personal Data Deletion Request",
      subtitle: "We respect your right to privacy and data deletion",
      description: "You can request the deletion of all your personal data from our platform. We will process your request within 30 days of receipt.",
      form: {
        title: "Data Deletion Request Form",
        email: "Email Address",
        emailPlaceholder: "Enter your email address",
        phone: "Phone Number",
        phonePlaceholder: "Enter your phone number",
        reason: "Reason for Deletion",
        reasonPlaceholder: "Optional - Tell us why you want to delete your data",
        additionalInfo: "Additional Information",
        additionalInfoPlaceholder: "Any additional information to help us identify your account",
        submit: "Submit Deletion Request",
        submitting: "Submitting..."
      },
      whatWeDelete: {
        title: "What will be deleted?",
        items: [
          "All personal information (name, email, phone)",
          "Shipping and delivery addresses",
          "Order and purchase history",
          "Account preferences and settings",
          "Any other data linked to your account"
        ]
      },
      process: {
        title: "Deletion Process",
        steps: [
          "Receive your request and verify identity",
          "Review data associated with your account",
          "Delete all data from our systems",
          "Send confirmation of deletion completion"
        ]
      },
      important: {
        title: "Important Information",
        items: [
          "The deletion process is permanent and cannot be undone",
          "We may retain some data for legal or accounting purposes",
          "Your account will be permanently deleted and inaccessible",
          "The process may take up to 30 days to complete"
        ]
      },
      alternatives: {
        title: "Other Alternatives",
        description: "Instead of deleting your account completely, you can:",
        items: [
          "Modify privacy settings",
          "Unsubscribe from marketing emails",
          "Update your personal information",
          "Temporarily disable your account"
        ]
      },
      contact: {
        title: "Contact Us",
        description: "If you have questions about the data deletion process:"
      },
      success: {
        title: "Your request has been submitted successfully!",
        description: "We will review and process your request within 30 days. You will receive email confirmation when the process is complete."
      },
      backToSite: "Back to Main Site",
      rights: "All rights reserved"
    }
  };

  const t = content[language as keyof typeof content];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email && !formData.phone) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يجب إدخال البريد الإلكتروني أو رقم الهاتف على الأقل" : "Please enter at least email or phone number",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/data-deletion-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: language === "ar" ? "تم الإرسال" : "Submitted",
          description: language === "ar" ? "تم إرسال طلبك بنجاح" : "Your request has been submitted successfully",
        });
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "حدث خطأ في إرسال الطلب" : "An error occurred while submitting the request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${language === "ar" ? "rtl" : "ltr"}`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={toggleLanguage}
              className="text-white border-white hover:bg-white hover:text-red-600 px-4 py-2 text-sm flex items-center gap-2"
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
                <p className="text-sm text-red-100">
                  {language === "ar" ? "منصة التجارة الإلكترونية الذكية" : "Smart E-commerce Platform"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trash2 className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          </div>
          <p className="text-lg text-gray-600 mb-2">{t.subtitle}</p>
          <p className="text-gray-700">{t.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            {!isSubmitted ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    {t.form.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.form.email}
                      </label>
                      <Input
                        type="email"
                        placeholder={t.form.emailPlaceholder}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.form.phone}
                      </label>
                      <Input
                        type="tel"
                        placeholder={t.form.phonePlaceholder}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.form.reason}
                      </label>
                      <Textarea
                        placeholder={t.form.reasonPlaceholder}
                        value={formData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.form.additionalInfo}
                      </label>
                      <Textarea
                        placeholder={t.form.additionalInfoPlaceholder}
                        value={formData.additionalInfo}
                        onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t.form.submitting : t.form.submit}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 mb-2">{t.success.title}</h3>
                    <p className="text-green-700">{t.success.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Information */}
          <div className="space-y-6">
            {/* What We Delete */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.whatWeDelete.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.whatWeDelete.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Trash2 className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Process */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.process.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {t.process.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Important Info */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  {t.important.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {t.important.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-yellow-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alternatives */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t.alternatives.title}</CardTitle>
            <CardDescription>{t.alternatives.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.alternatives.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-800">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t.contact.title}</CardTitle>
            <CardDescription>{t.contact.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{language === "ar" ? "البريد الإلكتروني" : "Email"}</p>
                <p className="text-red-600">{contactEmail}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{language === "ar" ? "الهاتف" : "Phone"}</p>
                <p className="text-red-600">{contactPhone}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{language === "ar" ? "اسم النشاط" : "Business"}</p>
                <p className="text-red-600">{businessName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <p className="text-sm">© 2025 {businessName}. {t.rights}</p>
          <a 
            href="https://sanadi.pro/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            {language === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {t.backToSite}
          </a>
        </div>
      </div>
    </div>
  );
}
