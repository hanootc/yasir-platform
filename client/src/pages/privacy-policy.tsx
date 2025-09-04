import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function PrivacyPolicy() {
  const { slug } = useParams<{ slug: string }>();

  // جلب بيانات صفحة الهبوط لضمان التصميم المتناسق
  const { data: landingPage } = useQuery({
    queryKey: ['/api/landing', slug],
    queryFn: async () => {
      if (!slug) return null;
      const response = await fetch(`/api/landing/${slug}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!slug,
  });

  const businessName = landingPage?.business_name || "متجرنا";
  const contactEmail = landingPage?.contact_email || "info@example.com";
  const contactPhone = landingPage?.contact_phone || "07XX-XXX-XXXX";

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-300">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-xs">⭐</span>
                ))}
              </div>
              <span className="text-xs text-yellow-100 mr-1">4.9</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white">🏪</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">{businessName}</h1>
                <p className="text-xs text-blue-100">جودة مضمونة وخدمة ممتازة</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">سياسة الخصوصية</h1>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">مقدمة</h2>
              <p>
                نحن في {businessName} نولي اهتماماً كبيراً بخصوصية عملائنا وحماية بياناتهم الشخصية. 
                تهدف هذه السياسة إلى توضيح كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمونها لنا.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">المعلومات التي نجمعها</h2>
              <p>نقوم بجمع المعلومات التالية عندما تتفاعل معنا:</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                <li><strong>المعلومات الشخصية:</strong> الاسم الكامل ورقم الهاتف</li>
                <li><strong>معلومات الاتصال:</strong> عنوان الشحن والمحافظة</li>
                <li><strong>معلومات الطلب:</strong> تفاصيل المنتجات المطلوبة والعروض المختارة</li>
                <li><strong>الملاحظات:</strong> أي طلبات أو تعليقات إضافية</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">كيف نستخدم معلوماتك</h2>
              <p>نستخدم المعلومات المجمعة للأغراض التالية:</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                <li>معالجة وتنفيذ طلبياتك</li>
                <li>التواصل معك بخصوص طلبك عبر الواتساب أو الهاتف</li>
                <li>ترتيب عملية الشحن والتوصيل</li>
                <li>تحسين خدماتنا ومنتجاتنا</li>
                <li>إرسال تحديثات حول حالة الطلب</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">حماية معلوماتك</h2>
              <p>
                نلتزم بحماية معلوماتك الشخصية من خلال:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                <li>استخدام تقنيات التشفير المتقدمة</li>
                <li>تقييد الوصول للمعلومات على الموظفين المخولين فقط</li>
                <li>عدم مشاركة معلوماتك مع أطراف ثالثة دون موافقتك</li>
                <li>تحديث أنظمة الأمان بانتظام</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">مشاركة المعلومات</h2>
              <p>
                نحن لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة، باستثناء:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                <li>شركات الشحن لتوصيل طلبياتك</li>
                <li>مقدمي الخدمات التقنية لمعالجة الطلبات</li>
                <li>الجهات الحكومية عند الطلب القانوني</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">حقوقك</h2>
              <p>يحق لك:</p>
              <ul className="list-disc list-inside mt-2 space-y-2">
                <li>طلب الاطلاع على معلوماتك الشخصية</li>
                <li>تصحيح أي معلومات غير دقيقة</li>
                <li>طلب حذف معلوماتك (في حدود القانون)</li>
                <li>الاعتراض على استخدام معلوماتك لأغراض التسويق</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">ملفات تعريف الارتباط (الكوكيز)</h2>
              <p>
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا وتذكر تفضيلاتك. 
                يمكنك إيقاف هذه الملفات من إعدادات المتصفح إذا رغبت في ذلك.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">التحديثات على السياسة</h2>
              <p>
                قد نقوم بتحديث هذه السياسة من وقت لآخر. سنقوم بإشعارك بأي تغييرات مهمة 
                عبر الموقع الإلكتروني أو وسائل الاتصال المتاحة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">تواصل معنا</h2>
              <p>
                إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية هذه، يرجى التواصل معنا:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p><strong>البريد الإلكتروني:</strong> {contactEmail}</p>
                <p><strong>الهاتف:</strong> {contactPhone}</p>
                <p><strong>اسم النشاط:</strong> {businessName}</p>
              </div>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600 text-center">
                تاريخ آخر تحديث: {new Date().toLocaleDateString('ar-SA', {
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
      <div className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm">© 2025 {businessName}. جميع الحقوق محفوظة.</p>
          {landingPage && (
            <a 
              href={`/landing/${landingPage.slug}`}
              className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
            >
              العودة إلى الصفحة الرئيسية
            </a>
          )}
        </div>
      </div>
    </div>
  );
}