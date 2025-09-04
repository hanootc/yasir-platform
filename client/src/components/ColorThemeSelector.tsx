import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';

const colorThemes = [
  {
    id: 'ocean-breeze',
    name: 'نسيم المحيط',
    gradient: 'linear-gradient(135deg, #667eea 0%, #06d6a0 100%)',
    cssVars: {
      '--primary': '168 91% 44%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '220 14% 96%',
      '--accent': '168 91% 96%',
      '--accent-foreground': '168 91% 10%',
    }
  },
  {
    id: 'ocean-blue',
    name: 'الأزرق المحيطي',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    cssVars: {
      '--primary': '185 100% 49%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '220 14% 96%',
      '--accent': '185 100% 96%',
      '--accent-foreground': '185 100% 10%',
    }
  },
  {
    id: 'pink-coral',
    name: 'الوردي المرجاني',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    cssVars: {
      '--primary': '340 100% 81%',
      '--primary-foreground': '0 0% 10%',
      '--secondary': '220 14% 96%',
      '--accent': '340 100% 96%',
      '--accent-foreground': '340 100% 10%',
    }
  },
  {
    id: 'sunset-orange',
    name: 'البرتقالي الغروب',
    gradient: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
    cssVars: {
      '--primary': '25 100% 67%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '220 14% 96%',
      '--accent': '25 100% 96%',
      '--accent-foreground': '25 100% 10%',
    }
  },
  {
    id: 'royal-purple',
    name: 'البنفسجي الملكي',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cssVars: {
      '--primary': '263 70% 50%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '220 14% 96%',
      '--accent': '263 70% 96%',
      '--accent-foreground': '263 70% 10%',
    }
  },
  {
    id: 'emerald-mint',
    name: 'الزمردي النعناعي',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    cssVars: {
      '--primary': '151 100% 50%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '220 14% 96%',
      '--accent': '151 100% 96%',
      '--accent-foreground': '151 100% 10%',
    }
  },
  {
    id: 'crimson-red',
    name: 'الأحمر القرمزي',
    gradient: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
    cssVars: {
      '--primary': '7 100% 58%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '220 14% 96%',
      '--accent': '7 100% 96%',
      '--accent-foreground': '7 100% 10%',
    }
  },
  {
    id: 'golden-yellow',
    name: 'الذهبي المشمس',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    cssVars: {
      '--primary': '347 89% 65%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '220 14% 96%',
      '--accent': '347 89% 96%',
      '--accent-foreground': '347 89% 10%',
    }
  }
];

const ColorThemeSelector: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState('ocean-breeze');

  useEffect(() => {
    // تحميل المظهر المحفوظ من localStorage
    const savedTheme = localStorage.getItem('colorTheme') || 'ocean-breeze';
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = colorThemes.find(t => t.id === themeId);
    if (theme) {
      const root = document.documentElement;
      Object.entries(theme.cssVars).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
      
      // إضافة متغير خاص للتدرج
      root.style.setProperty('--theme-gradient', theme.gradient);
      
      // إضافة متغيرات لقيم RGB للاستخدام مع opacity
      const gradientColors = theme.gradient.match(/#[a-fA-F0-9]{6}/g);
      if (gradientColors && gradientColors.length >= 2) {
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const color1 = hexToRgb(gradientColors[0]);
        const color2 = hexToRgb(gradientColors[1]);
        
        if (color1) root.style.setProperty('--theme-primary-rgb', `${color1.r}, ${color1.g}, ${color1.b}`);
        if (color2) root.style.setProperty('--theme-secondary-rgb', `${color2.r}, ${color2.g}, ${color2.b}`);
      }
    }
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem('colorTheme', themeId);
    applyTheme(themeId);
  };

  const currentTheme = colorThemes.find(t => t.id === selectedTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative h-10 w-10 rounded-full border-2 theme-border hover:border-theme-primary transition-all duration-300"
          title="اختيار لون المظهر"
        >
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ background: currentTheme?.gradient }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
            الألوان المخصصة
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {colorThemes.map((theme) => (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`p-3 cursor-pointer rounded-lg border-2 transition-all ${
                  selectedTheme === theme.id 
                    ? 'theme-border bg-theme-primary-light' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-theme-primary'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    style={{ background: theme.gradient }}
                  />
                  <span className="text-xs text-center font-medium">
                    {theme.name}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ColorThemeSelector;