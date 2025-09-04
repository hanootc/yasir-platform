import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState } from "react";

interface ImageModalProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

export function ImageModal({ src, alt, children }: ImageModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 border-0 bg-transparent shadow-none">
        <div className="relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute -top-12 right-0 z-50 p-2 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="bg-black bg-opacity-90 p-4 rounded-lg">
            <img
              src={src}
              alt={alt}
              className="w-full h-auto max-h-[70vh] object-contain rounded"
            />
            <p className="text-white text-center mt-2 text-sm">{alt}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}