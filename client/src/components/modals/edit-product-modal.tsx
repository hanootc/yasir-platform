import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, X, Unlock, Lock, Wand2, CheckCircle, XCircle } from 'lucide-react';
import { isUnauthorizedError } from '@/lib/authUtils';
import { ImageUploadManager } from '@/components/ui/image-upload-manager';
import { FlexibleOffersManager } from '@/components/ui/flexible-offers-manager';
import { PriceOffer } from '@shared/schema';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  platformId: string;
}

export default function EditProductModal({ isOpen, onClose, product, platformId }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    categoryId: '',
    isActive: true
  });

  const [productImages, setProductImages] = useState<string[]>([]);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [priceOffers, setPriceOffers] = useState<PriceOffer[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingAdditionalImages, setIsUploadingAdditionalImages] = useState(false);
  
  // AI Description Generation states
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: [`/api/platforms/${platformId}/categories`],
    enabled: !!platformId,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price ? Math.round(product.price).toLocaleString('en-US') : '',
        cost: product.cost ? Math.round(product.cost).toLocaleString('en-US') : '',
        stock: product.stock ? Math.round(product.stock).toLocaleString('en-US') : '',
        categoryId: product.categoryId || '',
        isActive: product.isActive ?? true
      });
      
      // تحديد الصور الحالية
      setProductImages(product.imageUrls || []);
      setAdditionalImages(product.additionalImages || []);
      
      // تحديد العروض المرنة الحالية
      setPriceOffers(product.priceOffers || []);
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const updateData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price.replace(/,/g, '')) || 0,
        cost: data.cost ? parseFloat(data.cost.replace(/,/g, '')) : undefined,
        stock: data.stock ? parseInt(data.stock.replace(/,/g, '')) : undefined,
        categoryId: data.categoryId && data.categoryId !== 'none' ? data.categoryId : undefined,
        isActive: data.isActive,
        imageUrls: productImages,
        additionalImages: additionalImages,
        priceOffers: priceOffers.length > 0 ? priceOffers : null
      };
      return apiRequest(`/api/platforms/${platformId}/products/${product.id}`, 'PATCH', updateData);
    },
    onSuccess: () => {
      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم تحديث المنتج بنجاح',
      });
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/landing-pages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/product-names`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}`] });
      
      // Also invalidate any landing pages associated with this product
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key => 
            typeof key === 'string' && 
            (key.includes('landing') || key.includes('product') || key.includes('public'))
          );
        }
      });
      
      // Specifically invalidate public product endpoints that landing pages use
      queryClient.invalidateQueries({ queryKey: ['/api/public/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/products', product.id] });
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في التحديث',
        description: error.message || 'حدث خطأ أثناء تحديث المنتج',
        variant: 'destructive',
      });
    },
  });

  const handleImagesChange = (images: string[]) => {
    setProductImages(images);
  };

  const handleUploadStateChange = (isUploading: boolean) => {
    setIsUploadingImages(isUploading);
  };

  const handleAdditionalImagesChange = (images: string[]) => {
    setAdditionalImages(images);
  };

  const handleAdditionalUploadStateChange = (isUploading: boolean) => {
    setIsUploadingAdditionalImages(isUploading);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'اسم المنتج مطلوب',
        variant: 'destructive',
      });
      return;
    }
    mutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // AI Description Generation
  const generateDescriptionMutation = useMutation({
    mutationFn: async (productName: string) => {
      return apiRequest("/api/products/generate-description", "POST", { productName });
    },
    onSuccess: (data: any) => {
      setGeneratedDescription(data.description);
      setShowDescriptionPreview(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مصرح",
          description: "تم تسجيل خروجك. يتم إعادة تسجيل الدخول...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Show detailed error message from server
      const errorMessage = error.message || "فشل في إنشاء وصف المنتج";
      toast({
        title: "فشل في إنشاء الوصف",
        description: errorMessage,
        variant: "destructive",
        duration: 7000, // Show longer for detailed messages
      });
    },
  });

  const handleGenerateDescription = () => {
    const productName = formData.name;
    if (!productName.trim()) {
      toast({
        title: "مطلوب",
        description: "يرجى إدخال اسم المنتج أولاً",
        variant: "destructive",
      });
      return;
    }
    generateDescriptionMutation.mutate(productName);
  };

  const handleAcceptDescription = () => {
    setFormData(prev => ({ ...prev, description: generatedDescription }));
    setShowDescriptionPreview(false);
    setGeneratedDescription("");
    toast({
      title: "تم قبول الوصف",
      description: "تم إضافة الوصف المُنشأ بالذكاء الاصطناعي",
    });
  };

  const handleRejectDescription = () => {
    setShowDescriptionPreview(false);
    setGeneratedDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-0">
        <DialogHeader className="flex flex-row items-center justify-between border-0 pb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-theme-gradient hover:opacity-90 text-white flex items-center justify-center p-0 flex-shrink-0 transition-all duration-200 hover:shadow-md"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-right pr-4">
            <DialogTitle className="text-xl font-semibold text-theme-primary">تعديل المنتج</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المنتج*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="أدخل اسم المنتج"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={generateDescriptionMutation.isPending || !formData.name.trim()}
                className="flex items-center gap-2 bg-theme-gradient text-white hover:scale-[1.02] transform theme-shadow"
              >
                {generateDescriptionMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                <span>إنشاء بالذكاء الاصطناعي</span>
              </Button>
              <Label htmlFor="description">وصف المنتج</Label>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="أدخل وصف المنتج"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">السعر (د.ع)*</Label>
              <Input
                id="price"
                type="text"
                value={formData.price}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value === '' || /^\d+$/.test(value)) {
                    handleInputChange('price', value);
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value && !isNaN(Number(value))) {
                    const formatted = Math.round(Number(value)).toLocaleString('en-US');
                    setFormData(prev => ({ ...prev, price: formatted }));
                  }
                }}
                placeholder="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost">تكلفة المنتج (د.ع)</Label>
              <Input
                id="cost"
                type="text"
                value={formData.cost}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value === '' || /^\d+$/.test(value)) {
                    handleInputChange('cost', value);
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (value && !isNaN(Number(value))) {
                    const formatted = Math.round(Number(value)).toLocaleString('en-US');
                    setFormData(prev => ({ ...prev, cost: formatted }));
                  }
                }}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">الكمية المتوفرة</Label>
            <Input
              id="stock"
              type="text"
              value={formData.stock}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                if (value === '' || /^\d+$/.test(value)) {
                  handleInputChange('stock', value);
                }
              }}
              onBlur={(e) => {
                const value = e.target.value.replace(/,/g, '');
                if (value && !isNaN(Number(value))) {
                  const formatted = Math.round(Number(value)).toLocaleString('en-US');
                  setFormData(prev => ({ ...prev, stock: formatted }));
                }
              }}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">التصنيف</Label>
            <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون تصنيف</SelectItem>
                {categories && Array.isArray(categories) && categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* العروض المرنة */}
          <div className="space-y-4">
            <FlexibleOffersManager
              offers={priceOffers}
              onChange={setPriceOffers}
            />
          </div>

          {/* صور المنتج الرئيسية */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold text-theme-primary">صور المنتج الرئيسية</Label>
            <ImageUploadManager
              initialImages={productImages}
              onImagesChange={handleImagesChange}
              onUploadStateChange={handleUploadStateChange}
              maxImages={5}
              productName="صور المنتج"
            />
          </div>

          {/* الصور الإضافية */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold text-theme-primary">الصور الإضافية</Label>
            <p className="text-sm text-gray-600">يمكن إضافة المزيد من الصور لعرض تفاصيل إضافية للمنتج</p>
            <ImageUploadManager
              initialImages={additionalImages}
              onImagesChange={handleAdditionalImagesChange}
              onUploadStateChange={handleAdditionalUploadStateChange}
              maxImages={10}
              productName="الصور الإضافية"
            />
          </div>

          <div className="flex items-center justify-between p-6 bg-theme-primary-lighter rounded-lg border-0 hover:bg-theme-primary-light transition-colors">
            <div 
              className="cursor-pointer"
              onClick={() => handleInputChange('isActive', !formData.isActive)}
            >
              {formData.isActive ? (
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 cursor-pointer hover:from-green-200 hover:to-emerald-200 transition-all duration-200">
                  <Unlock className="ml-1 h-3 w-3" />
                  مفتوح
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 cursor-pointer hover:bg-red-200 transition-all duration-200">
                  <Lock className="ml-1 h-3 w-3" />
                  مغلق
                </Badge>
              )}
            </div>
            <Label htmlFor="isActive" className="text-lg font-semibold text-theme-primary cursor-pointer">
              حالة المنتج
            </Label>
          </div>

          <DialogFooter className="gap-3 pt-6 border-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-6 py-3 text-base theme-border hover:bg-theme-primary-light hover:text-theme-primary"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || isUploadingImages || isUploadingAdditionalImages}
              className="bg-theme-gradient hover:opacity-90 px-6 py-3 text-base font-semibold text-white transition-all duration-200 hover:shadow-lg"
            >
              {(isUploadingImages || isUploadingAdditionalImages) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  يتم رفع الصور...
                </>
              ) : mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : (
                "حفظ التعديلات"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* AI Generated Description Preview */}
      <Dialog open={showDescriptionPreview} onOpenChange={setShowDescriptionPreview}>
        <DialogContent className="max-w-2xl bg-gray-900/95 backdrop-blur-sm border-theme-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Wand2 className="h-5 w-5 text-theme-accent" />
              وصف المنتج المُنشأ بالذكاء الاصطناعي
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-theme-accent/10 border border-theme-border rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">الوصف المُنشأ:</h4>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {generatedDescription}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">
                هل تريد استخدام هذا الوصف؟ يمكنك تعديله لاحقاً.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRejectDescription}
                  className="flex items-center gap-2 border-theme-border hover:bg-theme-primary-lighter text-theme-secondary"
                >
                  <XCircle className="h-4 w-4" />
                  رفض
                </Button>
                <Button
                  onClick={handleAcceptDescription}
                  className="flex items-center gap-2 bg-theme-gradient text-white hover:scale-[1.02] transform theme-shadow"
                >
                  <CheckCircle className="h-4 w-4" />
                  قبول واستخدام
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}