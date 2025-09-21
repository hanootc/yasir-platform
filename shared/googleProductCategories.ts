// قائمة شاملة من Google Product Categories مع الترجمة العربية
export interface GoogleProductCategory {
  id: string;
  arabicName: string;
  englishCategory: string;
  parentCategory?: string;
}

export const GOOGLE_PRODUCT_CATEGORIES: GoogleProductCategory[] = [
  // === فئات المنزل والحديقة ===
  {
    id: "home_garden",
    arabicName: "منزل وحديقة",
    englishCategory: "Home & Garden"
  },
  {
    id: "kitchen_appliances",
    arabicName: "أجهزة المطبخ",
    englishCategory: "Home & Garden > Kitchen & Dining > Kitchen Appliances",
    parentCategory: "home_garden"
  },
  {
    id: "kitchen_tools",
    arabicName: "أدوات المطبخ",
    englishCategory: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils",
    parentCategory: "home_garden"
  },
  {
    id: "blenders",
    arabicName: "خلاطات",
    englishCategory: "Home & Garden > Kitchen & Dining > Kitchen Appliances > Blenders",
    parentCategory: "kitchen_appliances"
  },
  {
    id: "cookware",
    arabicName: "أواني الطبخ",
    englishCategory: "Home & Garden > Kitchen & Dining > Cookware & Bakeware",
    parentCategory: "home_garden"
  },
  {
    id: "home_decor",
    arabicName: "ديكور منزلي",
    englishCategory: "Home & Garden > Decor",
    parentCategory: "home_garden"
  },
  {
    id: "furniture",
    arabicName: "أثاث",
    englishCategory: "Home & Garden > Decor > Furniture",
    parentCategory: "home_decor"
  },
  {
    id: "lighting",
    arabicName: "إضاءة",
    englishCategory: "Home & Garden > Lighting",
    parentCategory: "home_garden"
  },
  {
    id: "household_supplies",
    arabicName: "مستلزمات منزلية",
    englishCategory: "Home & Garden > Household Supplies",
    parentCategory: "home_garden"
  },
  {
    id: "cleaning_supplies",
    arabicName: "أدوات التنظيف",
    englishCategory: "Home & Garden > Household Supplies > Cleaning Supplies",
    parentCategory: "household_supplies"
  },
  {
    id: "linens_bedding",
    arabicName: "مفارش وأغطية",
    englishCategory: "Home & Garden > Linens & Bedding",
    parentCategory: "home_garden"
  },
  {
    id: "curtains",
    arabicName: "ستائر",
    englishCategory: "Home & Garden > Decor > Window Treatments",
    parentCategory: "home_decor"
  },
  {
    id: "gardening",
    arabicName: "أدوات الحديقة",
    englishCategory: "Home & Garden > Yard, Garden & Outdoor Living > Gardening",
    parentCategory: "home_garden"
  },
  {
    id: "plants",
    arabicName: "نباتات",
    englishCategory: "Home & Garden > Yard, Garden & Outdoor Living > Plants",
    parentCategory: "home_garden"
  },

  // === فئات الملابس والإكسسوارات ===
  {
    id: "apparel_accessories",
    arabicName: "ملابس وإكسسوارات",
    englishCategory: "Apparel & Accessories"
  },
  {
    id: "mens_clothing",
    arabicName: "ملابس رجالية",
    englishCategory: "Apparel & Accessories > Clothing > Men's Clothing",
    parentCategory: "apparel_accessories"
  },
  {
    id: "womens_clothing",
    arabicName: "ملابس نسائية",
    englishCategory: "Apparel & Accessories > Clothing > Women's Clothing",
    parentCategory: "apparel_accessories"
  },
  {
    id: "kids_clothing",
    arabicName: "ملابس أطفال",
    englishCategory: "Apparel & Accessories > Clothing > Baby & Toddler Clothing",
    parentCategory: "apparel_accessories"
  },
  {
    id: "shoes",
    arabicName: "أحذية",
    englishCategory: "Apparel & Accessories > Shoes",
    parentCategory: "apparel_accessories"
  },
  {
    id: "handbags",
    arabicName: "حقائب يد",
    englishCategory: "Apparel & Accessories > Handbags, Wallets & Cases",
    parentCategory: "apparel_accessories"
  },
  {
    id: "jewelry",
    arabicName: "مجوهرات",
    englishCategory: "Apparel & Accessories > Jewelry",
    parentCategory: "apparel_accessories"
  },
  {
    id: "watches",
    arabicName: "ساعات",
    englishCategory: "Apparel & Accessories > Jewelry > Watches",
    parentCategory: "jewelry"
  },
  {
    id: "sunglasses",
    arabicName: "نظارات شمسية",
    englishCategory: "Apparel & Accessories > Clothing Accessories > Sunglasses",
    parentCategory: "apparel_accessories"
  },

  // === فئات الإلكترونيات ===
  {
    id: "electronics",
    arabicName: "إلكترونيات",
    englishCategory: "Electronics"
  },
  {
    id: "mobile_phones",
    arabicName: "هواتف محمولة",
    englishCategory: "Electronics > Communications > Telephony > Mobile Phones",
    parentCategory: "electronics"
  },
  {
    id: "computers",
    arabicName: "حاسوب",
    englishCategory: "Electronics > Computers",
    parentCategory: "electronics"
  },
  {
    id: "laptops",
    arabicName: "لابتوب",
    englishCategory: "Electronics > Computers > Laptops",
    parentCategory: "computers"
  },
  {
    id: "tablets",
    arabicName: "أجهزة لوحية",
    englishCategory: "Electronics > Computers > Tablets",
    parentCategory: "computers"
  },
  {
    id: "televisions",
    arabicName: "تلفزيونات",
    englishCategory: "Electronics > Audio & Video > Televisions",
    parentCategory: "electronics"
  },
  {
    id: "headphones",
    arabicName: "سماعات",
    englishCategory: "Electronics > Audio & Video > Audio Components > Headphones",
    parentCategory: "electronics"
  },
  {
    id: "cameras",
    arabicName: "كاميرات",
    englishCategory: "Electronics > Cameras & Optics > Cameras",
    parentCategory: "electronics"
  },
  {
    id: "gaming_consoles",
    arabicName: "أجهزة ألعاب",
    englishCategory: "Electronics > Video Game Consoles",
    parentCategory: "electronics"
  },
  {
    id: "smart_home",
    arabicName: "منزل ذكي",
    englishCategory: "Electronics > Smart Home",
    parentCategory: "electronics"
  },

  // === فئات الصحة والجمال ===
  {
    id: "health_beauty",
    arabicName: "صحة وجمال",
    englishCategory: "Health & Beauty"
  },
  {
    id: "cosmetics",
    arabicName: "مستحضرات تجميل",
    englishCategory: "Health & Beauty > Personal Care > Cosmetics",
    parentCategory: "health_beauty"
  },
  {
    id: "fragrance",
    arabicName: "عطور",
    englishCategory: "Health & Beauty > Personal Care > Cosmetics > Fragrance",
    parentCategory: "cosmetics"
  },
  {
    id: "hair_care",
    arabicName: "العناية بالشعر",
    englishCategory: "Health & Beauty > Personal Care > Hair Care",
    parentCategory: "health_beauty"
  },
  {
    id: "skin_care",
    arabicName: "العناية بالبشرة",
    englishCategory: "Health & Beauty > Personal Care > Skin Care",
    parentCategory: "health_beauty"
  },
  {
    id: "bath_body",
    arabicName: "العناية بالجسم",
    englishCategory: "Health & Beauty > Personal Care > Bath & Body",
    parentCategory: "health_beauty"
  },
  {
    id: "vitamins_supplements",
    arabicName: "فيتامينات ومكملات",
    englishCategory: "Health & Beauty > Health Care > Vitamins & Supplements",
    parentCategory: "health_beauty"
  },
  {
    id: "medical_supplies",
    arabicName: "مستلزمات طبية",
    englishCategory: "Health & Beauty > Health Care > Medical Supplies",
    parentCategory: "health_beauty"
  },

  // === فئات الرياضة واللياقة ===
  {
    id: "sporting_goods",
    arabicName: "معدات رياضية",
    englishCategory: "Sporting Goods"
  },
  {
    id: "exercise_fitness",
    arabicName: "لياقة بدنية",
    englishCategory: "Sporting Goods > Exercise & Fitness",
    parentCategory: "sporting_goods"
  },
  {
    id: "outdoor_recreation",
    arabicName: "أنشطة خارجية",
    englishCategory: "Sporting Goods > Outdoor Recreation",
    parentCategory: "sporting_goods"
  },
  {
    id: "team_sports",
    arabicName: "رياضات جماعية",
    englishCategory: "Sporting Goods > Team Sports",
    parentCategory: "sporting_goods"
  },

  // === فئات الأطفال والرضع ===
  {
    id: "baby_toddler",
    arabicName: "أطفال ورضع",
    englishCategory: "Baby & Toddler"
  },
  {
    id: "baby_feeding",
    arabicName: "تغذية الأطفال",
    englishCategory: "Baby & Toddler > Baby & Toddler Feeding",
    parentCategory: "baby_toddler"
  },
  {
    id: "diapering",
    arabicName: "حفاضات ومستلزمات",
    englishCategory: "Baby & Toddler > Diapering",
    parentCategory: "baby_toddler"
  },
  {
    id: "baby_transport",
    arabicName: "عربات أطفال",
    englishCategory: "Baby & Toddler > Baby Transport",
    parentCategory: "baby_toddler"
  },
  {
    id: "toys_games",
    arabicName: "ألعاب",
    englishCategory: "Toys & Games"
  },
  {
    id: "educational_toys",
    arabicName: "ألعاب تعليمية",
    englishCategory: "Toys & Games > Educational Toys",
    parentCategory: "toys_games"
  },

  // === فئات الطعام والمشروبات ===
  {
    id: "food_beverages",
    arabicName: "طعام ومشروبات",
    englishCategory: "Food, Beverages & Tobacco"
  },
  {
    id: "food_items",
    arabicName: "مواد غذائية",
    englishCategory: "Food, Beverages & Tobacco > Food Items",
    parentCategory: "food_beverages"
  },
  {
    id: "beverages",
    arabicName: "مشروبات",
    englishCategory: "Food, Beverages & Tobacco > Beverages",
    parentCategory: "food_beverages"
  },
  {
    id: "snack_foods",
    arabicName: "وجبات خفيفة",
    englishCategory: "Food, Beverages & Tobacco > Food Items > Snack Foods",
    parentCategory: "food_items"
  },
  {
    id: "seasonings_spices",
    arabicName: "بهارات وتوابل",
    englishCategory: "Food, Beverages & Tobacco > Food Items > Seasonings & Spices",
    parentCategory: "food_items"
  },

  // === فئات السيارات والمركبات ===
  {
    id: "vehicles_parts",
    arabicName: "سيارات وقطع غيار",
    englishCategory: "Vehicles & Parts"
  },
  {
    id: "vehicle_parts",
    arabicName: "قطع غيار السيارات",
    englishCategory: "Vehicles & Parts > Vehicle Parts & Accessories",
    parentCategory: "vehicles_parts"
  },
  {
    id: "vehicle_tires",
    arabicName: "إطارات السيارات",
    englishCategory: "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Motor Vehicle Wheel Systems > Vehicle Tires",
    parentCategory: "vehicle_parts"
  },
  {
    id: "motor_oil",
    arabicName: "زيوت المحرك",
    englishCategory: "Vehicles & Parts > Vehicle Fluids & Chemicals > Motor Vehicle Fluids > Motor Oil",
    parentCategory: "vehicles_parts"
  },

  // === فئات الكتب والإعلام ===
  {
    id: "media",
    arabicName: "إعلام وكتب",
    englishCategory: "Media"
  },
  {
    id: "books",
    arabicName: "كتب",
    englishCategory: "Media > Books",
    parentCategory: "media"
  },
  {
    id: "office_supplies",
    arabicName: "مستلزمات مكتبية",
    englishCategory: "Office Supplies"
  },
  {
    id: "school_supplies",
    arabicName: "مستلزمات مدرسية",
    englishCategory: "Office Supplies > School & Office Supplies",
    parentCategory: "office_supplies"
  },

  // === فئات الفنون والترفيه ===
  {
    id: "arts_entertainment",
    arabicName: "فنون وترفيه",
    englishCategory: "Arts & Entertainment"
  },
  {
    id: "party_supplies",
    arabicName: "مستلزمات الحفلات",
    englishCategory: "Arts & Entertainment > Party & Celebration > Party Supplies",
    parentCategory: "arts_entertainment"
  },
  {
    id: "gift_giving",
    arabicName: "هدايا",
    englishCategory: "Arts & Entertainment > Party & Celebration > Gift Giving",
    parentCategory: "arts_entertainment"
  },
  {
    id: "musical_instruments",
    arabicName: "آلات موسيقية",
    englishCategory: "Arts & Entertainment > Musical Instruments",
    parentCategory: "arts_entertainment"
  },

  // === فئات الحيوانات الأليفة ===
  {
    id: "pet_supplies",
    arabicName: "مستلزمات الحيوانات الأليفة",
    englishCategory: "Animals & Pet Supplies"
  },
  {
    id: "pet_food",
    arabicName: "طعام الحيوانات",
    englishCategory: "Animals & Pet Supplies > Pet Supplies > Pet Food",
    parentCategory: "pet_supplies"
  },
  {
    id: "pet_toys",
    arabicName: "ألعاب الحيوانات",
    englishCategory: "Animals & Pet Supplies > Pet Supplies > Pet Toys",
    parentCategory: "pet_supplies"
  },

  // === فئات أخرى مهمة ===
  {
    id: "business_industrial",
    arabicName: "أعمال وصناعة",
    englishCategory: "Business & Industrial"
  },
  {
    id: "construction_tools",
    arabicName: "أدوات البناء",
    englishCategory: "Business & Industrial > Construction",
    parentCategory: "business_industrial"
  },
  {
    id: "religious_ceremonial",
    arabicName: "مستلزمات دينية",
    englishCategory: "Arts & Entertainment > Religious & Ceremonial"
  }
];

// دالة للبحث عن فئة بالـ ID
export function getGoogleCategoryById(id: string): GoogleProductCategory | undefined {
  return GOOGLE_PRODUCT_CATEGORIES.find(cat => cat.id === id);
}

// دالة للحصول على الفئات الرئيسية فقط
export function getMainCategories(): GoogleProductCategory[] {
  return GOOGLE_PRODUCT_CATEGORIES.filter(cat => !cat.parentCategory);
}

// دالة للحصول على الفئات الفرعية لفئة معينة
export function getSubCategories(parentId: string): GoogleProductCategory[] {
  return GOOGLE_PRODUCT_CATEGORIES.filter(cat => cat.parentCategory === parentId);
}

// دالة للبحث في الفئات بالنص العربي
export function searchCategoriesByArabicName(searchTerm: string): GoogleProductCategory[] {
  const term = searchTerm.toLowerCase();
  return GOOGLE_PRODUCT_CATEGORIES.filter(cat => 
    cat.arabicName.toLowerCase().includes(term)
  );
}

// دالة للحصول على جميع الفئات مرتبة أبجدياً
export function getAllCategoriesSorted(): GoogleProductCategory[] {
  return [...GOOGLE_PRODUCT_CATEGORIES].sort((a, b) => 
    a.arabicName.localeCompare(b.arabicName, 'ar')
  );
}
