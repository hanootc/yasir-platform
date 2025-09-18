import { useState, useEffect } from 'react';

export interface AdminTheme {
  themeId: string;
  darkMode: boolean;
}

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
  'emerald-green': {
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
  'ruby-red': {
    '--primary': '0 100% 50%',
    '--primary-foreground': '0 0% 98%',
    '--secondary': '220 14% 96%',
    '--accent': '0 100% 96%',
    '--accent-foreground': '0 100% 10%',
    '--theme-gradient': 'linear-gradient(135deg, #dc143c 0%, #ff6b6b 100%)',
    '--theme-primary-rgb': '220, 20, 60',
    '--theme-secondary-rgb': '255, 107, 107',
    '--theme-primary-lighter': 'linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)',
  },
  'golden-amber': {
    '--primary': '45 100% 51%',
    '--primary-foreground': '0 0% 10%',
    '--secondary': '220 14% 96%',
    '--accent': '45 100% 96%',
    '--accent-foreground': '45 100% 10%',
    '--theme-gradient': 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    '--theme-primary-rgb': '247, 151, 30',
    '--theme-secondary-rgb': '255, 210, 0',
    '--theme-primary-lighter': 'linear-gradient(135deg, rgba(247, 151, 30, 0.1) 0%, rgba(255, 210, 0, 0.05) 100%)',
  },
  'sapphire-blue': {
    '--primary': '220 100% 50%',
    '--primary-foreground': '0 0% 98%',
    '--secondary': '220 14% 96%',
    '--accent': '220 100% 96%',
    '--accent-foreground': '220 100% 10%',
    '--theme-gradient': 'linear-gradient(135deg, #0f3460 0%, #4fc3f7 100%)',
    '--theme-primary-rgb': '15, 52, 96',
    '--theme-secondary-rgb': '79, 195, 247',
    '--theme-primary-lighter': 'linear-gradient(135deg, rgba(15, 52, 96, 0.1) 0%, rgba(79, 195, 247, 0.05) 100%)',
  },
  'forest-green': {
    '--primary': '140 100% 25%',
    '--primary-foreground': '0 0% 98%',
    '--secondary': '220 14% 96%',
    '--accent': '140 100% 96%',
    '--accent-foreground': '140 100% 10%',
    '--theme-gradient': 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    '--theme-primary-rgb': '19, 78, 94',
    '--theme-secondary-rgb': '113, 178, 128',
    '--theme-primary-lighter': 'linear-gradient(135deg, rgba(19, 78, 94, 0.1) 0%, rgba(113, 178, 128, 0.05) 100%)',
  }
};

const ADMIN_THEME_KEY = 'sanadi-admin-theme';

export const useAdminTheme = () => {
  const [adminTheme, setAdminTheme] = useState<AdminTheme>({
    themeId: 'ruby-red',
    darkMode: true
  });
  const [isLoading, setIsLoading] = useState(true);

  // تحميل الثيم من localStorage عند بدء التطبيق
  useEffect(() => {
    // دائماً استخدم الثيم الثابت (ruby-red + dark mode) حتى لو كان محفوظ في localStorage
    const fixedTheme = {
      themeId: 'ruby-red',
      darkMode: true
    };
    
    setAdminTheme(fixedTheme);
    applyTheme(fixedTheme);
    // حفظ الثيم الثابت في localStorage
    localStorage.setItem(ADMIN_THEME_KEY, JSON.stringify(fixedTheme));
    setIsLoading(false);
  }, []);

  // تطبيق الثيم على الصفحة
  const applyTheme = (theme: AdminTheme) => {
    const { themeId, darkMode } = theme;
    
    // تطبيق نمط الظلام/النهار
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // تطبيق الثيم اللوني
    const colorTheme = colorThemes[themeId];
    if (colorTheme) {
      const root = document.documentElement;
      Object.entries(colorTheme).forEach(([property, value]) => {
        root.style.setProperty(property, value as string);
      });
    }
    
    console.log('🎨 تم تطبيق ثيم الإدارة:', theme);
  };

  // حفظ الثيم في localStorage وتطبيقه - لكن دائماً استخدم الثيم الثابت
  const updateTheme = (newTheme: Partial<AdminTheme>) => {
    // تجاهل أي محاولة لتغيير الثيم - استخدم الثيم الثابت دائماً
    const fixedTheme = {
      themeId: 'ruby-red',
      darkMode: true
    };
    setAdminTheme(fixedTheme);
    localStorage.setItem(ADMIN_THEME_KEY, JSON.stringify(fixedTheme));
    applyTheme(fixedTheme);
  };

  const toggleDarkMode = () => {
    // تجاهل محاولة تغيير النمط - استخدم النمط الليلي دائماً
    const fixedTheme = {
      themeId: 'ruby-red',
      darkMode: true
    };
    setAdminTheme(fixedTheme);
    localStorage.setItem(ADMIN_THEME_KEY, JSON.stringify(fixedTheme));
    applyTheme(fixedTheme);
  };

  const changeColorTheme = (themeId: string) => {
    // تجاهل محاولة تغيير اللون - استخدم ruby-red دائماً
    const fixedTheme = {
      themeId: 'ruby-red',
      darkMode: true
    };
    setAdminTheme(fixedTheme);
    localStorage.setItem(ADMIN_THEME_KEY, JSON.stringify(fixedTheme));
    applyTheme(fixedTheme);
  };

  return {
    adminTheme,
    isLoading,
    updateTheme,
    toggleDarkMode,
    changeColorTheme,
    availableThemes: Object.keys(colorThemes),
  };
};
