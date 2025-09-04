import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // تحميل المظهر المحفوظ من localStorage
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemDark);
    setIsDark(shouldBeDark);
    
    // تطبيق المظهر على العنصر الجذر
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // حفظ المظهر في localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // تطبيق المظهر على العنصر الجذر
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full border-2 border-purple-200 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-400 transition-all duration-300"
      title={isDark ? 'تبديل إلى المظهر النهاري' : 'تبديل إلى المظهر الليلي'}
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        {isDark ? (
          <i className="fas fa-sun text-yellow-500 text-lg transition-all duration-300"></i>
        ) : (
          <i className="fas fa-moon text-purple-600 text-lg transition-all duration-300"></i>
        )}
      </div>
    </Button>
  );
};

export default ThemeToggle;