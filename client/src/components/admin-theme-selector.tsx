import { useState } from "react";
import { Palette, Monitor, Sun, Moon, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminTheme } from "@/hooks/useAdminTheme";

const themeOptions = [
  { id: 'ocean-breeze', name: 'نسيم المحيط', colors: ['#667eea', '#06d6a0'] },
  { id: 'ocean-blue', name: 'الأزرق المحيطي', colors: ['#4facfe', '#00f2fe'] },
  { id: 'pink-coral', name: 'المرجاني الوردي', colors: ['#ff9a9e', '#fecfef'] },
  { id: 'sunset-orange', name: 'برتقالي الغروب', colors: ['#ff7e5f', '#feb47b'] },
  { id: 'royal-purple', name: 'البنفسجي الملكي', colors: ['#667eea', '#764ba2'] },
  { id: 'emerald-green', name: 'الزمردي الأخضر', colors: ['#11998e', '#38ef7d'] },
  { id: 'ruby-red', name: 'الياقوتي الأحمر', colors: ['#dc143c', '#ff6b6b'] },
  { id: 'golden-amber', name: 'الذهبي العنبري', colors: ['#f7971e', '#ffd200'] },
  { id: 'sapphire-blue', name: 'الياقوتي الأزرق', colors: ['#0f3460', '#4fc3f7'] },
  { id: 'forest-green', name: 'أخضر الغابة', colors: ['#134e5e', '#71b280'] },
];

export function AdminThemeSelector() {
  const { 
    adminTheme, 
    isLoading, 
    toggleDarkMode, 
    changeColorTheme 
  } = useAdminTheme();

  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />
        <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  const currentTheme = themeOptions.find(theme => theme.id === adminTheme?.themeId) || themeOptions[0];

  return (
    <div className="flex gap-2">
      {/* Theme Color Selector */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-md border border-border/50 hover:border-border"
          >
            <div className="flex w-full h-full rounded-sm overflow-hidden">
              <div 
                className="w-1/2" 
                style={{ backgroundColor: currentTheme.colors[0] }}
              />
              <div 
                className="w-1/2" 
                style={{ backgroundColor: currentTheme.colors[1] }}
              />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <div className="p-2">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4" />
              <span className="font-medium">اختيار لون الثيم (الإدارة)</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {themeOptions.map((theme) => (
                <DropdownMenuItem
                  key={theme.id}
                  className="flex items-center gap-3 p-3 cursor-pointer rounded-lg"
                  onSelect={() => {
                    changeColorTheme(theme.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex">
                    <div 
                      className="w-4 h-4 rounded-r-none rounded-l-full border-r border-white/20" 
                      style={{ backgroundColor: theme.colors[0] }}
                    />
                    <div 
                      className="w-4 h-4 rounded-l-none rounded-r-full" 
                      style={{ backgroundColor: theme.colors[1] }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{theme.name}</span>
                      {adminTheme?.themeId === theme.id && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            {adminTheme?.themeId && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      الحالي: {currentTheme.name}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dark/Light Mode Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDarkMode}
        className="h-8 w-8 p-0 rounded-md border border-border/50 hover:border-border"
      >
        {adminTheme?.darkMode ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
