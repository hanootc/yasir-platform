// Arabic to Latin transliteration mapping
const arabicToLatinMap: Record<string, string> = {
  'ا': 'a',
  'أ': 'a',
  'إ': 'i',
  'آ': 'aa',
  'ب': 'b',
  'ت': 't',
  'ث': 'th',
  'ج': 'j',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'dh',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'd',
  'ط': 't',
  'ظ': 'z',
  'ع': 'a',
  'غ': 'gh',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'و': 'w',
  'ي': 'y',
  'ى': 'a',
  'ء': 'a',
  'ة': 'h',
  'ئ': 'y',
  'ؤ': 'w',
  // Diacritics (usually ignored in URLs)
  'َ': '',
  'ُ': '',
  'ِ': '',
  'ّ': '',
  'ً': '',
  'ٌ': '',
  'ٍ': '',
  'ْ': '',
  // Numbers
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/**
 * Convert Arabic text to Latin characters for URL-friendly slugs
 */
export function arabicToLatin(arabicText: string): string {
  if (!arabicText) return '';
  
  let result = '';
  
  for (const char of arabicText) {
    if (arabicToLatinMap[char]) {
      result += arabicToLatinMap[char];
    } else if (/[a-zA-Z0-9]/.test(char)) {
      // Keep existing Latin characters and numbers
      result += char.toLowerCase();
    } else if (char === ' ') {
      result += '-';
    }
    // Skip other characters (punctuation, etc.)
  }
  
  // Clean up the result
  result = result
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .toLowerCase();
    
  return result;
}

/**
 * Generate a URL-friendly slug from Arabic title
 */
export function generateSlugFromArabic(title: string): string {
  const transliterated = arabicToLatin(title);
  
  // Add timestamp suffix to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  
  return transliterated ? `${transliterated}-${timestamp}` : `page-${timestamp}`;
}

/**
 * Validate if a custom URL is valid
 */
export function isValidCustomUrl(url: string): boolean {
  if (!url) return true; // Empty is allowed
  
  // Only allow letters, numbers, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9-_]+$/;
  
  return validPattern.test(url) && url.length >= 3 && url.length <= 100;
}