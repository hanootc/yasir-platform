import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, File as FileIcon, Image as ImageIcon, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface UniversalFileUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  category?: 'products' | 'profiles' | 'logos' | 'videos' | 'tiktok' | 'general';
  onComplete?: (files: { url: string; fileName: string; originalName: string; size: number }[]) => void;
  buttonClassName?: string;
  children: React.ReactNode;
  multiple?: boolean;
}

/**
 * مكوّن رفع ملفات شامل يحل محل ObjectUploader و LocalImageUploader
 * يدعم جميع أنواع الملفات ويحفظها محلياً في مجلدات منظمة
 */
export function UniversalFileUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  acceptedFileTypes = ['image/*'],
  category = 'general',
  onComplete,
  buttonClassName,
  children,
  multiple = false
}: UniversalFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    // التحقق من نوع الملف
    const isValidType = acceptedFileTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType + '/');
      }
      return file.type === type;
    });

    if (!isValidType) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: `الأنواع المدعومة: ${acceptedFileTypes.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    // التحقق من حجم الملف
    if (file.size > maxFileSize) {
      toast({
        title: "حجم الملف كبير",
        description: `يرجى رفع ملف أصغر من ${formatFileSize(maxFileSize)}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File): Promise<{ url: string; fileName: string; originalName: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file, file.name);

    // تحديد endpoint بناءً على نوع الملف
    let endpoint = '/api/upload/file';
    if (file.type.startsWith('image/')) {
      endpoint = '/api/upload/image';
    } else if (file.type.startsWith('video/')) {
      endpoint = '/api/upload/video';
    }

    const response = await fetch(`${endpoint}?category=${category}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `فشل في رفع الملف ${file.name}`);
    }

    const data = await response.json();
    return {
      url: data.url || data.uploadURL,
      fileName: data.fileName,
      originalName: data.originalName || file.name,
      size: data.size || file.size
    };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // التحقق من عدد الملفات
    if (files.length > maxNumberOfFiles) {
      toast({
        title: "عدد ملفات كثيرة",
        description: `يمكن رفع ${maxNumberOfFiles} ملف كحد أقصى`,
        variant: "destructive",
      });
      return;
    }

    // التحقق من صحة جميع الملفات
    const validFiles = files.filter(validateFile);
    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFiles = [];
      const totalFiles = validFiles.length;

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        console.log(`📤 رفع ملف ${i + 1}/${totalFiles}:`, file.name);
        
        const uploadedFile = await uploadFile(file);
        uploadedFiles.push(uploadedFile);
        
        // تحديث التقدم
        const progress = Math.round(((i + 1) / totalFiles) * 100);
        setUploadProgress(progress);
      }

      console.log('✅ تم رفع جميع الملفات بنجاح:', uploadedFiles);

      // استدعاء دالة الإكمال
      if (onComplete) {
        onComplete(uploadedFiles);
      }

      toast({
        title: "تم الرفع بنجاح",
        description: `تم رفع ${uploadedFiles.length} ملف بنجاح`,
      });

      // مسح input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ خطأ في رفع الملفات:', error);
      toast({
        title: "فشل في الرفع",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء رفع الملفات",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(',')}
        multiple={multiple && maxNumberOfFiles > 1}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={isUploading}
        className={buttonClassName}
      >
        {isUploading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{uploadProgress}%</span>
          </div>
        ) : (
          children
        )}
      </Button>
    </div>
  );
}

// مكوّن مخصص للصور
export function ImageUploader(props: Omit<UniversalFileUploaderProps, 'acceptedFileTypes'>) {
  return (
    <UniversalFileUploader
      {...props}
      acceptedFileTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
      category={props.category || 'products'}
    />
  );
}

// مكوّن مخصص للفيديوهات
export function VideoUploader(props: Omit<UniversalFileUploaderProps, 'acceptedFileTypes'>) {
  return (
    <UniversalFileUploader
      {...props}
      acceptedFileTypes={['video/mp4', 'video/avi', 'video/mov', 'video/wmv']}
      category={props.category || 'videos'}
      maxFileSize={props.maxFileSize || 100 * 1024 * 1024} // 100MB for videos
    />
  );
}

// مكوّن مخصص للشعارات
export function LogoUploader(props: Omit<UniversalFileUploaderProps, 'acceptedFileTypes' | 'category'>) {
  return (
    <UniversalFileUploader
      {...props}
      acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp']}
      category="logos"
      maxNumberOfFiles={1}
    />
  );
}