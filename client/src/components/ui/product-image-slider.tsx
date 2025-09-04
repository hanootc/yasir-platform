import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProductImageSliderProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ProductImageSlider({ images, productName, className = "" }: ProductImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // تحويل مسارات الصور للوصول العام
  const publicImages = images.map(url => 
    url.startsWith('/objects/') ? url.replace('/objects/', '/public-objects/') : url
  );

  if (!publicImages || publicImages.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <i className="fas fa-image text-4xl text-gray-400"></i>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % publicImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + publicImages.length) % publicImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Main Image */}
      <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
        <img 
          src={publicImages[currentIndex]} 
          alt={`${productName} - صورة ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation Arrows - Only show if more than 1 image */}
        {publicImages.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevImage}
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </>
        )}

        {/* Image Counter */}
        {publicImages.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {publicImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation - Only show if more than 1 image */}
      {publicImages.length > 1 && (
        <div className="flex justify-center mt-3 space-x-2 space-x-reverse">
          {publicImages.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToImage(index)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-primary-500 ring-2 ring-primary-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img 
                src={image} 
                alt={`${productName} - مصغر ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}