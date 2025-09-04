import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocalImageUploaderProps {
  onImageAdd: (imageUrl: string) => void;
  maxFiles?: number;
  currentImageCount: number;
  category?: string;
  children?: React.ReactNode;
}

export function LocalImageUploader({ 
  onImageAdd, 
  maxFiles = 5, 
  currentImageCount,
  category = 'products',
  children
}: LocalImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // التحقق من عدد الصور الجديدة
    const availableSlots = maxFiles - currentImageCount;
    const filesToProcess = Array.from(files).slice(0, availableSlots);
    
    if (files.length > availableSlots) {
      toast({
        title: "تحديد متقدم",
        description: `يمكن رفع ${availableSlots} صور إضافية فقط من أصل ${files.length} مُحددة`,
        variant: "default",
      });
    }

    if (filesToProcess.length === 0) {
      toast({
        title: "تم الوصول للحد الأقصى",
        description: `تم الوصول للحد الأقصى من الصور (${maxFiles})`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    // معالجة كل ملف
    for (const file of filesToProcess) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: `الملف "${file.name}" ليس صورة`,
          variant: "destructive",
        });
        errorCount++;
        continue;
      }

      // التحقق من حجم الملف (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير",
          description: `الملف "${file.name}" أكبر من 10 ميجابايت`,
          variant: "destructive",
        });
        errorCount++;
        continue;
      }

      try {
        console.log("📸 Preparing upload for file:", file.name, file.type, file.size);
        
        const formData = new FormData();
        formData.append('image', file, file.name);

        console.log("📤 Sending upload request...");
        
        const response = await fetch(`/api/upload/image?category=${category}`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('فشل في رفع الصورة');
        }

        const data = await response.json();
        
        // إضافة الصورة المرفوعة
        onImageAdd(data.url);
        successCount++;
        
        console.log(`✅ Successfully uploaded: ${file.name}`);

      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        errorCount++;
      }
    }

    setIsUploading(false);
    
    // عرض رسالة النتيجة النهائية
    if (successCount > 0 && errorCount === 0) {
      toast({
        title: "تم الرفع بنجاح",
        description: `تم رفع ${successCount} صورة بنجاح`,
      });
    } else if (successCount > 0 && errorCount > 0) {
      toast({
        title: "رفع جزئي",
        description: `تم رفع ${successCount} صورة من أصل ${successCount + errorCount}`,
        variant: "default",
      });
    } else if (errorCount > 0) {
      toast({
        title: "خطأ في الرفع",
        description: "فشل في رفع جميع الصور المحددة",
        variant: "destructive",
      });
    }

    // مسح input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const canUploadMore = currentImageCount < maxFiles;

  return (
    <div className="space-y-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={triggerFileSelect}
        disabled={isUploading || !canUploadMore}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-spin" />
            جاري الرفع...
          </>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            {children || (canUploadMore 
              ? `إضافة صورة (${currentImageCount}/${maxFiles})`
              : `تم الوصول للحد الأقصى (${maxFiles}/${maxFiles})`
            )}
          </>
        )}
      </Button>
      
      {!canUploadMore && (
        <p className="text-sm text-muted-foreground text-center">
          يمكن رفع {maxFiles} صور كحد أقصى
        </p>
      )}
    </div>
  );
}