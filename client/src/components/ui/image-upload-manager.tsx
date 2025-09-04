import { useState, useEffect } from "react";
import { LocalImageUploader } from "@/components/LocalImageUploader";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadManagerProps {
  initialImages?: string[];
  onImagesChange: (images: string[]) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  maxImages?: number;
  productName?: string;
}

export function ImageUploadManager({ 
  initialImages = [], 
  onImagesChange, 
  onUploadStateChange,
  maxImages = 5,
  productName = "المنتج"
}: ImageUploadManagerProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const { toast } = useToast();

  // Update local images when initialImages changes
  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const handleImageAdd = async (imageUrl: string) => {
    console.log("Adding image:", imageUrl);
    
    setImages(prevImages => {
      const newImages = [...prevImages, imageUrl];
      onImagesChange(newImages);
      return newImages;
    });
    
    // تحديث ACL للصورة المرفوعة  
    try {
      await fetch("/api/objects/set-acl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectPath: imageUrl,
          visibility: "public"
        }),
      });
    } catch (error) {
      console.error("Error setting ACL:", error);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Current Images Display */}
      {images.length > 0 && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative group image-grid-item rounded-xl overflow-hidden">
                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
                  <img 
                    src={url} 
                    alt={`صورة ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <button
                  type="button"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-md"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded-md text-xs font-medium">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload New Images */}
      <LocalImageUploader
        onImageAdd={handleImageAdd}
        maxFiles={maxImages}
        currentImageCount={images.length}
        category="products"
      />
      
      {images.length >= maxImages && (
        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">
            تم الوصول للحد الأقصى من الصور ({maxImages} صور)
          </p>
        </div>
      )}
    </div>
  );
}