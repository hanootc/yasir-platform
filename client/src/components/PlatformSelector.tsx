import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";

interface Platform {
  id: string;
  platformName: string;
  ownerName?: string;
  subdomain: string;
  businessType?: string;
  logoUrl?: string;
}

interface PlatformSelectorProps {
  value?: string;
  onValueChange: (platformId: string | null) => void;
  placeholder?: string;
}

export function PlatformSelector({ value, onValueChange, placeholder = "اختر منصة..." }: PlatformSelectorProps) {
  const { data: platforms = [], isLoading } = useQuery<Platform[]>({
    queryKey: ['/api/platforms-list'],
    enabled: true
  });

  // تحديد المنصة المختارة
  const selectedPlatform = platforms.find(p => p.id === value);

  const handleValueChange = (newValue: string) => {
    if (newValue === 'all') {
      onValueChange(null);
    } else {
      onValueChange(newValue);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md border animate-pulse">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <Select value={value || 'all'} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[280px] bg-white dark:bg-black/50 border-gray-200 dark:border-gray-700 hover:border-theme-primary dark:hover:border-theme-primary transition-colors">
        <SelectValue placeholder={placeholder}>
          {value && selectedPlatform ? (
            <div className="flex items-center gap-3">
              <Avatar className="w-6 h-6">
                <AvatarImage 
                  src={selectedPlatform.logoUrl?.startsWith('/objects/') 
                    ? selectedPlatform.logoUrl.replace('/objects/', '/public-objects/')
                    : selectedPlatform.logoUrl
                  }
                  alt={selectedPlatform.platformName}
                />
                <AvatarFallback className="bg-theme-primary text-white text-xs">
                  <Building2 className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div className="text-right flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-gray-900 dark:text-white">
                  {selectedPlatform.platformName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {selectedPlatform.ownerName || selectedPlatform.subdomain}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Building2 className="w-4 h-4" />
              <span>جميع المنصات</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-700 shadow-xl">
        <SelectItem 
          value="all" 
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-theme-primary focus:text-white data-[highlighted]:bg-theme-primary data-[highlighted]:text-white"
        >
          <div className="flex items-center gap-3 py-1">
            <div className="w-6 h-6 rounded-full bg-theme-primary flex items-center justify-center">
              <Building2 className="w-3 h-3 text-white" />
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">جميع المنصات</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                عرض بيانات كافة المشتركين
              </div>
            </div>
          </div>
        </SelectItem>

        {platforms.map((platform) => (
          <SelectItem 
            key={platform.id} 
            value={platform.id}
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-theme-primary focus:text-white data-[highlighted]:bg-theme-primary data-[highlighted]:text-white"
          >
            <div className="flex items-center gap-3 py-1">
              <Avatar className="w-6 h-6">
                <AvatarImage 
                  src={platform.logoUrl?.startsWith('/objects/') 
                    ? platform.logoUrl.replace('/objects/', '/public-objects/')
                    : platform.logoUrl
                  }
                  alt={platform.platformName}
                />
                <AvatarFallback className="bg-theme-primary text-white text-xs">
                  <Building2 className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div className="text-right flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {platform.platformName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {platform.ownerName || platform.subdomain}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}