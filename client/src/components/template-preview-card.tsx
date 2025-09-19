import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface TemplatePreviewCardProps {
  templateId: string;
  name: string;
  colorScheme: string;
  onPreview: (templateId: string) => void;
}

export function TemplatePreviewCard({ templateId, name, colorScheme, onPreview }: TemplatePreviewCardProps) {
  const getPreviewContent = (templateId: string) => {
    const baseClasses = "w-full h-40 rounded-lg overflow-hidden relative";
    
    switch (templateId) {
      case "modern_minimal":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-theme-50 to-theme-100`}>
            <div className="p-3 space-y-2">
              <div className="w-8 h-8 bg-theme-500 rounded-lg"></div>
              <div className="h-2 bg-theme-100 rounded w-3/4"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-theme-500 rounded"></div>
            </div>
          </div>
        );
        
      case "bold_hero":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-theme-500 to-theme-600`}>
            <div className="p-3 space-y-2 text-white">
              <div className="w-full h-16 bg-white/20 rounded-lg backdrop-blur"></div>
              <div className="h-2 bg-white/60 rounded w-2/3"></div>
              <div className="h-2 bg-white/40 rounded w-1/2"></div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-yellow-400 rounded"></div>
            </div>
          </div>
        );
        
      case "product_showcase":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-gray-50 to-white`}>
            <div className="p-3 space-y-2">
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
              </div>
              <div className="h-2 bg-gray-300 rounded w-full"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-theme-600 rounded"></div>
            </div>
          </div>
        );
        
      case "testimonial_focus":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-blue-50 to-yellow-50`}>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                <div className="h-2 bg-blue-300 rounded w-1/3"></div>
              </div>
              <div className="h-8 bg-blue-100 rounded-lg p-2">
                <div className="h-1 bg-blue-300 rounded w-full"></div>
                <div className="h-1 bg-theme-100 rounded w-2/3 mt-1"></div>
              </div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-theme-600 rounded"></div>
            </div>
          </div>
        );
        
      case "feature_highlight":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-green-50 to-white`}>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-green-200 rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                </div>
                <div className="h-8 bg-green-200 rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                </div>
              </div>
              <div className="h-2 bg-green-300 rounded w-full"></div>
              <div className="h-2 bg-green-300 rounded w-full"></div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-green-600 rounded"></div>
            </div>
          </div>
        );
        
      case "countdown_urgency":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-red-600 to-black`}>
            <div className="p-3 space-y-2 text-white">
              <div className="flex justify-center">
                <div className="w-16 h-8 bg-red-500 rounded-lg flex items-center justify-center text-xs font-bold">
                  ⏰
                </div>
              </div>
              <div className="h-2 bg-white/60 rounded w-2/3 mx-auto"></div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-red-500 rounded"></div>
            </div>
          </div>
        );
        
      case "video_intro":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-black to-blue-900`}>
            <div className="p-3 space-y-2 text-white">
              <div className="w-full h-16 bg-white/10 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                  ▶
                </div>
              </div>
              <div className="h-2 bg-white/40 rounded w-3/4"></div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-theme-500 rounded"></div>
            </div>
          </div>
        );
        
      case "comparison_table":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-blue-50 to-white`}>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="h-4 bg-theme-100 rounded"></div>
                <div className="h-4 bg-blue-300 rounded"></div>
                <div className="h-4 bg-blue-400 rounded"></div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-theme-600 rounded"></div>
            </div>
          </div>
        );
        
      case "benefits_grid":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-purple-50 to-white`}>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="h-6 bg-purple-200 rounded flex items-center justify-center">✓</div>
                <div className="h-6 bg-purple-200 rounded flex items-center justify-center">★</div>
                <div className="h-6 bg-purple-200 rounded flex items-center justify-center">💎</div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="h-6 bg-purple-200 rounded flex items-center justify-center">🚀</div>
                <div className="h-6 bg-purple-200 rounded flex items-center justify-center">⚡</div>
                <div className="h-6 bg-purple-200 rounded flex items-center justify-center">🎯</div>
              </div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-purple-600 rounded"></div>
            </div>
          </div>
        );
        
      case "story_driven":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-amber-50 to-orange-50`}>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-500 rounded-full text-white text-xs flex items-center justify-center">1</div>
                <div className="h-2 bg-amber-300 rounded flex-1"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center">2</div>
                <div className="h-2 bg-orange-300 rounded flex-1"></div>
              </div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-amber-600 rounded"></div>
            </div>
          </div>
        );
        
      case "colorful_vibrant":
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500`}>
            <div className="p-3 space-y-2 text-white">
              <div className="w-full h-12 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-lg opacity-80"></div>
              <div className="h-2 bg-white/60 rounded w-2/3"></div>
              <div className="h-2 bg-white/40 rounded w-1/2"></div>
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className={`${baseClasses} bg-gradient-to-br from-gray-200 to-gray-300`}>
            <div className="p-3 flex items-center justify-center h-full">
              <div className="text-gray-500 text-sm">معاينة التصميم</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="group relative">
      {getPreviewContent(templateId)}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-center justify-center">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPreview(templateId)}
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
        >
          <Eye className="h-4 w-4 ml-1" />
          معاينة {name}
        </Button>
      </div>
      <div className="mt-2 text-center">
        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{name}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{colorScheme}</p>
      </div>
    </div>
  );
}