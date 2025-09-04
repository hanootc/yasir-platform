// Landing page template definitions with Arabic names and previews

export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // Image or icon name
  features: string[];
  colorScheme: string;
  layout: string;
}

export const landingPageTemplates: LandingPageTemplate[] = [
  {
    id: "modern_minimal",
    name: "البسيط",
    description: "تصميم نظيف ومرتب مثالي للجوال مع فورم مدمج",
    preview: "fas fa-mobile-alt",
    features: ["تصميم مضغوط", "متوافق مع الجوال", "فورم مبسط", "تركيز على المحتوى"],
    colorScheme: "أبيض وأزرق",
    layout: "عمود واحد"
  },
  {
    id: "bold_hero",
    name: "التجاري",
    description: "تصميم تجاري شامل مع عرض احترافي ونموذج مدمج",
    preview: "fas fa-crown",
    features: ["عرض شامل", "نموذج مدمج", "شهادات العملاء", "أقسام متنوعة"],
    colorScheme: "تدرجات احترافية",
    layout: "متعدد الأقسام"
  },
  {
    id: "product_showcase",
    name: "العارض",
    description: "تصميم مخصص لعرض المنتجات بتفاصيل شاملة ونموذج مرتب",
    preview: "fas fa-cube",
    features: ["معرض صور", "تفاصيل مفصلة", "نموذج مدمج", "عرض منظم"],
    colorScheme: "أبيض ورمادي",
    layout: "شبكة منتجات"
  },
  {
    id: "testimonial_focus",
    name: "الشهادات",
    description: "يبرز آراء العملاء مع نموذج طلب مرتب ومضغوط",
    preview: "fas fa-quote-right",
    features: ["شهادات قوية", "تقييمات بارزة", "نموذج سريع", "تصميم مقنع"],
    colorScheme: "أزرق وذهبي",
    layout: "بطاقات شهادات"
  },
  {
    id: "feature_highlight",
    name: "المميزات",
    description: "يركز على فوائد المنتج مع نموذج طلب ذكي ومرتب",
    preview: "fas fa-star",
    features: ["مميزات واضحة", "فوائد بارزة", "نموذج ذكي", "تصميم فعال"],
    colorScheme: "أخضر وأبيض",
    layout: "أعمدة متعددة"
  },
  {
    id: "countdown_urgency",
    name: "الاستعجال",
    description: "يخلق شعور بالاستعجال مع نموذج سريع للطلب الفوري",
    preview: "fas fa-clock",
    features: ["عد تنازلي", "عروض محدودة", "نموذج سريع", "طلب فوري"],
    colorScheme: "أحمر وأسود",
    layout: "مركزي مع مؤقت"
  },
  {
    id: "video_intro",
    name: "التفاعلي",
    description: "يستخدم الفيديو لجذب الانتباه مع نموذج طلب تفاعلي",
    preview: "fas fa-play-circle",
    features: ["فيديو جذاب", "عرض تفاعلي", "نموذج مرن", "تصميم بصري"],
    colorScheme: "أسود وأزرق",
    layout: "فيديو كامل العرض"
  },
  {
    id: "comparison_table",
    name: "المقارن",
    description: "يقارن بين خيارات مختلفة للمنتج أو الباقات",
    preview: "fas fa-table",
    features: ["جدول مقارنة", "خطط متعددة", "أسعار متدرجة", "اختيار الباقة"],
    colorScheme: "أزرق وأبيض",
    layout: "جدول تفاعلي"
  },
  {
    id: "benefits_grid",
    name: "الفوائد",
    description: "يعرض الفوائد في تخطيط شبكي منظم",
    preview: "fas fa-th",
    features: ["فوائد متعددة", "رموز واضحة", "تخطيط منظم", "سهولة المسح"],
    colorScheme: "بنفسجي وأبيض",
    layout: "شبكة ٣×٣"
  },
  {
    id: "story_driven",
    name: "القصة",
    description: "يحكي قصة المنتج أو المؤسس لخلق اتصال عاطفي",
    preview: "fas fa-book-open",
    features: ["سرد القصة", "رحلة العميل", "اتصال عاطفي", "خلفية المؤسس"],
    colorScheme: "بني وكريمي",
    layout: "تدرج زمني"
  },
  {
    id: "colorful_vibrant",
    name: "الملوّن",
    description: "تصميم مفعم بالألوان والحيوية لجذب الانتباه",
    preview: "fas fa-rainbow",
    features: ["ألوان زاهية", "تدرجات جذابة", "تأثيرات بصرية", "طاقة عالية"],
    colorScheme: "متعدد الألوان",
    layout: "ديناميكي متدرج"
  }
];

export const getTemplateById = (id: string): LandingPageTemplate | undefined => {
  return landingPageTemplates.find(template => template.id === id);
};

export const getTemplateDisplayName = (id: string): string => {
  const template = getTemplateById(id);
  return template?.name || id;
};