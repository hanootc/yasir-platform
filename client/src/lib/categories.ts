// Utility function لترتيب التصنيفات بحيث تظهر "منزلية" في المقدمة
export function sortCategories(categories: any[]) {
  if (!categories || !Array.isArray(categories)) {
    return [];
  }
  
  return categories.sort((a, b) => {
    // "منزلية" دائماً في المقدمة
    if (a.name === 'منزلية') return -1;
    if (b.name === 'منزلية') return 1;
    
    // ترتيب أبجدي بالعربية للباقي
    return a.name.localeCompare(b.name, 'ar');
  });
}