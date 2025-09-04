import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, ZoomIn } from "lucide-react";

interface PlatformInstructionImageProps {
  imageSrc: string;
  altText: string;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

export default function PlatformInstructionImage({ 
  imageSrc, 
  altText, 
  title, 
  description, 
  size = "sm" 
}: PlatformInstructionImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`${sizeClasses[size]} p-1 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40`}
          title={`اضغط لرؤية ${title}`}
        >
          <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-4xl max-h-[80vh] overflow-auto bg-theme-primary-lighter theme-border" 
        dir="rtl"
        aria-describedby="instruction-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-theme-text">
            <ZoomIn className="h-5 w-5 text-theme-accent" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {description && (
            <p id="instruction-description" className="text-theme-text-secondary text-sm">{description}</p>
          )}
          <div className="border theme-border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
            <img
              src={imageSrc}
              alt={altText}
              className="w-full h-auto object-contain max-h-[60vh]"
              loading="lazy"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}