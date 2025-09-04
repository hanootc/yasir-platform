import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Smartphone } from "lucide-react";
import { getTemplateById } from "@/lib/landingPageTemplates";
import { LandingPageTemplateRenderer } from "../landing-page-template-renderer";

interface TemplatePreviewModalProps {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreviewModal({ templateId, open, onOpenChange }: TemplatePreviewModalProps) {
  const template = getTemplateById(templateId);

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-hidden modal-content-solid theme-border p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-theme-gradient rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-theme-primary">
                  معاينة النموذج: {template.name}
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {template.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Template Features */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="text-xs bg-theme-primary-light text-theme-primary">
              {template.colorScheme}
            </Badge>
            {template.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        {/* Mobile Preview Container */}
        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="p-4">
            {/* Mobile Frame */}
            <div className="mx-auto w-full max-w-sm">
              <div className="bg-black rounded-3xl p-2 shadow-2xl">
                <div className="bg-white rounded-2xl overflow-hidden h-[700px] relative">
                  {/* Phone Status Bar */}
                  <div className="bg-black text-white text-xs py-1 px-4 flex justify-between items-center">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                      </div>
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>
                  
                  {/* Template Content */}
                  <div className="h-full overflow-y-auto scrollbar-hide">
                    <LandingPageTemplateRenderer 
                      templateId={templateId} 
                      isPreview={true} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <Smartphone className="inline w-4 h-4 ml-1" />
              معاينة بحجم الهاتف المحمول
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-theme-gradient hover:opacity-90 text-white"
            >
              إغلاق المعاينة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}