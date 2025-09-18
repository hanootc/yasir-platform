import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
import { ProductVariantsTab } from '@/components/product-variants/ProductVariantsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  // إعادة تعيين النموذج فقط عند الإغلاق (وليس عند الفتح)
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      stock: '',
      categoryId: '',
      isActive: true
    });
    setProductImages([]);
    setAdditionalImages([]);
    setPriceOffers([]);
    onClose();
  };

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
      console.log('Product data received in modal:', product);
      console.log('Available fields:', Object.keys(product));
      
      // Extract cost value from multiple possible field names
      const costValue = product.costPerItem || product.cost || product.cost_per_item || product.costperitem;
      const stockValue = product.quantity || product.stock;
      const categoryValue = product.categoryId || product.category_id;
      const activeValue = product.isActive ?? product.is_active;
      
      console.log('Extracted values:', {
        cost: costValue,
        stock: stockValue,
        category: categoryValue,
        active: activeValue
      });
      
      const formDataToSet = {
        name: product.name || '',
        description: product.description || '',
        price: product.price ? Math.round(parseFloat(product.price)).toLocaleString('en-US') : '',
        cost: costValue && costValue !== null ? Math.round(parseFloat(costValue)).toLocaleString('en-US') : '',
        stock: stockValue && stockValue !== null ? Math.round(parseFloat(stockValue)).toLocaleString('en-US') : '',
        categoryId: categoryValue || '',
        isActive: activeValue ?? true
      };
      
      console.log('Setting form data to:', formDataToSet);
      setFormData(formDataToSet);
      
      // تحديد الصور الحالية
      let currentImages = [];
      if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
        currentImages = product.imageUrls;
        console.log('Using imageUrls:', currentImages);
      } else if (product.images) {
        try {
          const parsedImages = JSON.parse(product.images);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            currentImages = parsedImages;
            console.log('Using parsed images:', currentImages);
          }
        } catch (e) {
          console.warn('Failed to parse product images:', e);
        }
      }
      setProductImages(currentImages);
      // تحديد الصور الإضافية
      let currentAdditionalImages = [];
      if (product.additionalImages) {
        if (Array.isArray(product.additionalImages)) {
          currentAdditionalImages = product.additionalImages;
        } else if (typeof product.additionalImages === 'string') {
          try {
            const parsedAdditionalImages = JSON.parse(product.additionalImages);
            if (Array.isArray(parsedAdditionalImages)) {
              currentAdditionalImages = parsedAdditionalImages;
            }
          } catch (e) {
            console.warn('Failed to parse additional images:', e);
          }
        }
      }
      setAdditionalImages(currentAdditionalImages);
      
      // تحديد العروض المرنة الحالية
      let currentPriceOffers = [];
      if (product.priceOffers) {
        if (Array.isArray(product.priceOffers)) {
          currentPriceOffers = product.priceOffers;
        } else if (typeof product.priceOffers === 'string') {
          try {
            const parsedOffers = JSON.parse(product.priceOffers);
            if (Array.isArray(parsedOffers)) {
              currentPriceOffers = parsedOffers;
            }
          } catch (e) {
            console.warn('Failed to parse price offers:', e);
          }
        }
      }
      setPriceOffers(currentPriceOffers);
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🔄 Starting product update...');
      console.log('Form data received:', data);
      console.log('Product ID:', product.id);
      console.log('Platform ID:', platformId);
      
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price.replace(/,/g, '')),
        cost: formData.cost ? parseFloat(formData.cost.replace(/,/g, '')) : null,
        stock: formData.stock ? parseFloat(formData.stock.replace(/,/g, '')) : null,
        categoryId: formData.categoryId || null,
        isActive: formData.isActive,
        imageUrls: productImages,
        additionalImages: additionalImages,
        priceOffers: priceOffers
      };
      
      console.log('📤 Sending update data:', updateData);
      
      const response = await apiRequest(`/api/platforms/${platformId}/products/${product.id}`, 'PATCH', updateData);
      
      console.log('✅ Update response:', response);
      return response;
    },
    onSuccess: (updatedProduct) => {
      console.log('✅ Product updated successfully, received:', updatedProduct);
      
      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم تحديث المنتج بنجاح',
      });
      
      // Invalidate and refetch all product-related queries immediately
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/product-names`] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/landing-pages`] });
      
      // Invalidate specific product queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key => 
            typeof key === 'string' && 
            (key.includes('public/products') || key.includes(`products/${product.id}`))
          );
        }
      });
      
      // Force immediate refetch to update UI
      queryClient.refetchQueries({ queryKey: [`/api/platforms/${platformId}/products`] });
      
      // Close modal immediately - data will update automatically
      handleClose();
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-0">
        <DialogHeader className="flex flex-row items-center justify-between border-0 pb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-theme-gradient hover:opacity-90 text-white flex items-center justify-center p-0 flex-shrink-0 transition-all duration-200 hover:shadow-md"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-right pr-4">
            <DialogTitle className="text-xl font-semibold text-theme-primary">تعديل المنتج</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              قم بتحديث معلومات المنتج وحفظ التغييرات
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
            <TabsTrigger value="variants">المتغيرات والأحجام</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
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
                {categories && Array.isArray(categories) ? categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {String(category.name || '')}
                  </SelectItem>
                )) : null}
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
                onClick={handleClose}
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
          </TabsContent>
          
          <TabsContent value="variants" className="space-y-4">
            <ProductVariantsTab productId={product?.id} platformId={platformId} />
          </TabsContent>
        </Tabs>
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