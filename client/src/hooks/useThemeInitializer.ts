import { useEffect } from 'react';

export const useThemeInitializer = () => {
  useEffect(() => {
    // تطبيق الثيم المحفوظ أو النظام الافتراضي
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const savedColorTheme = localStorage.getItem('colorTheme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // تطبيق نمط الظلام/النهار - الوضع الليلي افتراضي
      const shouldBeDark = savedTheme !== 'light'; // دائماً dark إلا إذا اختار المستخدم light صراحة
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        if (!savedTheme) {
          localStorage.setItem('theme', 'dark'); // حفظ الوضع الليلي كافتراضي
        }
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // تطبيق الثيم اللوني المحفوظ
      if (savedColorTheme) {
        applyColorTheme(savedColorTheme);
      }
    };

    const applyColorTheme = (themeId: string) => {
      const colorThemes: { [key: string]: any } = {
        'ocean-breeze': {
          '--primary': '168 91% 44%',
          '--primary-foreground': '0 0% 98%',
          '--secondary': '220 14% 96%',
          '--accent': '168 91% 96%',
          '--accent-foreground': '168 91% 10%',
          '--theme-gradient': 'linear-gradient(135deg, #667eea 0%, #06d6a0 100%)',
          '--theme-primary-rgb': '102, 126, 234',
          '--theme-secondary-rgb': '6, 214, 160',
          '--theme-primary-lighter': 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(6, 214, 160, 0.05) 100%)',
        },
        'ocean-blue': {
          '--primary': '185 100% 49%',
          '--primary-foreground': '0 0% 98%',
          '--secondary': '220 14% 96%',
          '--accent': '185 100% 96%',
          '--accent-foreground': '185 100% 10%',
          '--theme-gradient': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          '--theme-primary-rgb': '79, 172, 254',
          '--theme-secondary-rgb': '0, 242, 254',
          '--theme-primary-lighter': 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.05) 100%)',
        },
        'pink-coral': {
          '--primary': '340 100% 81%',
          '--primary-foreground': '0 0% 10%',
          '--secondary': '220 14% 96%',
          '--accent': '340 100% 96%',
          '--accent-foreground': '340 100% 10%',
          '--theme-gradient': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
          '--theme-primary-rgb': '255, 154, 158',
          '--theme-secondary-rgb': '254, 207, 239',
          '--theme-primary-lighter': 'linear-gradient(135deg, rgba(255, 154, 158, 0.1) 0%, rgba(254, 207, 239, 0.05) 100%)',
        },
        'sunset-orange': {
          '--primary': '25 100% 67%',
          '--primary-foreground': '0 0% 98%',
          '--secondary': '220 14% 96%',
          '--accent': '25 100% 96%',
          '--accent-foreground': '25 100% 10%',
          '--theme-gradient': 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
          '--theme-primary-rgb': '255, 126, 95',
          '--theme-secondary-rgb': '254, 180, 123',
          '--theme-primary-lighter': 'linear-gradient(135deg, rgba(255, 126, 95, 0.1) 0%, rgba(254, 180, 123, 0.05) 100%)',
        },
        'royal-purple': {
          '--primary': '263 70% 50%',
          '--primary-foreground': '0 0% 98%',
          '--secondary': '220 14% 96%',
          '--accent': '263 70% 96%',
          '--accent-foreground': '263 70% 10%',
          '--theme-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '--theme-primary-rgb': '102, 126, 234',
          '--theme-secondary-rgb': '118, 75, 162',
          '--theme-primary-lighter': 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
        },
        'emerald-mint': {
          '--primary': '151 100% 50%',
          '--primary-foreground': '0 0% 98%',
          '--secondary': '220 14% 96%',
          '--accent': '151 100% 96%',
          '--accent-foreground': '151 100% 10%',
          '--theme-gradient': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          '--theme-primary-rgb': '17, 153, 142',
          '--theme-secondary-rgb': '56, 239, 125',
          '--theme-primary-lighter': 'linear-gradient(135deg, rgba(17, 153, 142, 0.1) 0%, rgba(56, 239, 125, 0.05) 100%)',
        },
        'crimson-red': {
          '--primary': '0 100% 50%',
          '--primary-foreground': '0 0% 98%',
          '--secondary': '220 14% 96%',
          '--accent': '0 100% 96%',
          '--accent-foreground': '0 100% 10%',
          '--theme-gradient': 'linear-gradient(135deg, #dc143c 0%, #ff6b6b 100%)',
          '--theme-primary-rgb': '220, 20, 60',
          '--theme-secondary-rgb': '255, 107, 107',
          '--theme-primary-lighter': 'linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)',
        }
      };

      const theme = colorThemes[themeId];
      if (theme) {
        const root = document.documentElement;
        Object.entries(theme).forEach(([property, value]) => {
          root.style.setProperty(property, value as string);
        });
      }
    };

    // تطبيق الثيم فور التحميل
    initializeTheme();
  }, []);
};