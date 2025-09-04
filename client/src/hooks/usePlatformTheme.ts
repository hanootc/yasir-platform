import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { usePlatformSession } from './use-platform-session';

export interface PlatformTheme {
  id?: string;
  platformId: string;
  themeId: string;
  darkMode: boolean;
  customPrimary?: string;
  customSecondary?: string;
  customAccent?: string;
  customGradient?: string;
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

export const usePlatformTheme = () => {
  const { session, isLoading: sessionLoading } = usePlatformSession();
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const queryClient = useQueryClient();

  // جلب ثيم المنصة من قاعدة البيانات
  const { data: platformTheme, isLoading: themeLoading } = useQuery<PlatformTheme>({
    queryKey: [`/api/platforms/${session?.platformId}/theme`],
    enabled: !!session?.platformId,
    refetchOnWindowFocus: false,
  });

  // حفظ/تحديث ثيم المنصة
  const updateThemeMutation = useMutation({
    mutationFn: async (themeData: Partial<PlatformTheme>) => {
      if (!session?.platformId) throw new Error('Platform ID not found');
      
      return apiRequest(`/api/platforms/${session.platformId}/theme`, {
        method: 'POST',
        body: JSON.stringify(themeData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/platforms/${session?.platformId}/theme`] 
      });
    },
  });

  // تطبيق الثيم على الصفحة
  const applyTheme = (theme: PlatformTheme) => {
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
  };

  // تطبيق الثيم عند تحميل البيانات
  useEffect(() => {
    if (!sessionLoading && !themeLoading && platformTheme && !isThemeLoaded) {
      applyTheme(platformTheme);
      setIsThemeLoaded(true);
      console.log('🎨 تم تطبيق ثيم المنصة:', platformTheme);
    }
  }, [platformTheme, sessionLoading, themeLoading, isThemeLoaded]);

  // تطبيق الثيم الافتراضي عند عدم وجود ثيم محفوظ
  useEffect(() => {
    if (!sessionLoading && !themeLoading && !platformTheme && session?.platformId && !isThemeLoaded) {
      const defaultTheme: PlatformTheme = {
        platformId: session.platformId,
        themeId: 'ocean-breeze',
        darkMode: false
      };
      applyTheme(defaultTheme);
      setIsThemeLoaded(true);
      console.log('🎨 تم تطبيق الثيم الافتراضي للمنصة');
    }
  }, [session, sessionLoading, themeLoading, platformTheme, isThemeLoaded]);

  const updateTheme = (themeData: Partial<PlatformTheme>) => {
    updateThemeMutation.mutate(themeData);
    
    // تطبيق الثيم فوراً بدون انتظار الحفظ
    if (platformTheme) {
      const newTheme = { ...platformTheme, ...themeData };
      applyTheme(newTheme);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !platformTheme?.darkMode;
    updateTheme({ darkMode: newDarkMode });
  };

  const changeColorTheme = (themeId: string) => {
    updateTheme({ themeId });
  };

  return {
    platformTheme,
    isLoading: sessionLoading || themeLoading,
    isThemeLoaded,
    updateTheme,
    toggleDarkMode,
    changeColorTheme,
    availableThemes: Object.keys(colorThemes),
    isUpdating: updateThemeMutation.isPending,
  };
};