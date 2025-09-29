import { useEffect } from 'react';

/**
 * Hook بسيط لتعيين عنوان الصفحة
 * @param title عنوان الصفحة
 * @param addAppName هل تريد إضافة "- Sanadi Pro" (افتراضي: true)
 */
export function usePageTitle(title: string, addAppName: boolean = true) {
  useEffect(() => {
    if (addAppName) {
      document.title = `${title} - Sanadi Pro`;
    } else {
      document.title = title;
    }
  }, [title, addAppName]);
}

/**
 * Hook للصفحة الرئيسية (بدون إضافة اسم التطبيق)
 */
export function useHomePageTitle() {
  useEffect(() => {
    document.title = 'منصة التجارة الإلكترونية الذكية';
  }, []);
}

export default usePageTitle;
