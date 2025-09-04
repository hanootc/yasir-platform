import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as LucideIcons from "lucide-react";

interface IconSelectorProps {
  value?: string;
  onChange: (iconName: string) => void;
}

const commonIcons = [
  { name: 'home', label: 'منزل' },
  { name: 'smartphone', label: 'هاتف' },
  { name: 'shirt', label: 'ملابس' },
  { name: 'book-open', label: 'كتب' },
  { name: 'dumbbell', label: 'رياضة' },
  { name: 'sparkles', label: 'جمال' },
  { name: 'baby', label: 'أطفال' },
  { name: 'utensils', label: 'طعام' },
  { name: 'gem', label: 'مجوهرات' },
  { name: 'wrench', label: 'أدوات' },
  { name: 'music', label: 'موسيقى' },
  { name: 'shopping-bag', label: 'حقائب' },
  { name: 'car', label: 'سيارات' },
  { name: 'heart-pulse', label: 'صحة' },
  { name: 'gamepad-2', label: 'ألعاب' },
  { name: 'trees', label: 'حديقة' },
  { name: 'coffee', label: 'مشروبات' },
  { name: 'graduation-cap', label: 'تعليم' },
  { name: 'palette', label: 'فنون' },
  { name: 'tag', label: 'عام' },
];

export function IconSelector({ value, onChange }: IconSelectorProps) {
  const [customIcon, setCustomIcon] = useState(value || '');

  const handleIconSelect = (iconName: string) => {
    setCustomIcon(iconName);
    onChange(iconName);
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join('')];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <LucideIcons.Tag className="w-5 h-5" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="اكتب اسم الأيقونة أو اختر من القائمة"
          value={customIcon}
          onChange={(e) => {
            setCustomIcon(e.target.value);
            onChange(e.target.value);
          }}
          className="flex-1"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              اختر أيقونة
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="grid grid-cols-4 gap-2 p-2">
              {commonIcons.map((icon) => (
                <Button
                  key={icon.name}
                  variant={customIcon === icon.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleIconSelect(icon.name)}
                  className="h-12 flex flex-col items-center gap-1 p-1"
                >
                  {renderIcon(icon.name)}
                  <span className="text-xs">{icon.label}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {customIcon && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>معاينة:</span>
          {renderIcon(customIcon)}
          <span>{customIcon}</span>
        </div>
      )}
    </div>
  );
}