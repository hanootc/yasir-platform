import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ImageUploadManager } from "@/components/ui/image-upload-manager";
import { FlexibleOffersManager } from "@/components/ui/flexible-offers-manager";
import type { PriceOffer } from "@shared/schema";


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wand2, CheckCircle, XCircle, X } from "lucide-react";

const createProductSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().optional(),
  price: z.string().min(1, "السعر مطلوب").refine((val) => {
    const cleanVal = val.replace(/,/g, '');
    const numVal = parseFloat(cleanVal);
    return !isNaN(numVal) && numVal > 0;
  }, "السعر يجب أن يكون رقم أكبر من صفر"),
  cost: z.string().optional().refine((val) => {
    if (!val) return true;
    const cleanVal = val.replace(/,/g, '');
    const numVal = parseFloat(cleanVal);
    return !isNaN(numVal) && numVal >= 0;
  }, "التكلفة يجب أن تكون رقم صالح"),
  stock: z.string().optional().refine((val) => {
    if (!val) return true;
    const cleanVal = val.replace(/,/g, '');
    const numVal = parseInt(cleanVal);
    return !isNaN(numVal) && numVal >= 0;
  }, "الكمية يجب أن تكون رقم صالح"),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformId?: string;
}

export default function CreateProductModal({ isOpen, onClose, platformId }: CreateProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [productImages, setProductImages] = useState<string[]>([]);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [priceOffers, setPriceOffers] = useState<PriceOffer[]>([]);

  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingAdditionalImages, setIsUploadingAdditionalImages] = useState(false);
  
  // AI Description Generation
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState<string>("");
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);

  const form = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      cost: "",
      stock: "",
      sku: "",
      categoryId: "",
    },
  });

  const { data: categories } = useQuery({
    queryKey: platformId ? [`/api/platforms/${platformId}/categories`] : ["/api/categories"],
    enabled: isOpen,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductForm) => {
      // التحقق من أن جميع الصور قد تم رفعها بنجاح
      // إذا كان المستخدم قد بدأ برفع الصور ولكن لم تكتمل، فعلينا منع الحفظ
      
      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price.replace(/,/g, '')),
        cost: data.cost ? parseFloat(data.cost.replace(/,/g, '')) : undefined,
        stock: data.stock ? parseInt(data.stock.replace(/,/g, '')) : undefined,

        sku: data.sku || undefined,
        categoryId: data.categoryId || undefined,
        imageUrls: productImages.length > 0 ? productImages : [],
        additionalImages: additionalImages.length > 0 ? additionalImages : [],
        priceOffers: priceOffers.length > 0 ? priceOffers : null,
      };

      const endpoint = platformId ? `/api/platforms/${platformId}/products` : "/api/products";
      return apiRequest(endpoint, "POST", productData);
    },
    onSuccess: (product) => {
      if (platformId) {
        // Force refetch products immediately
        queryClient.refetchQueries({ queryKey: [`/api/platforms/${platformId}/products`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/top-products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activities"] });
      }
      
      // Also invalidate any landing pages or product-related queries broadly
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key => 
            typeof key === 'string' && 
            (key.includes('landing') || key.includes('product') || key.includes('public'))
          );
        }
      });
      
      // Specifically invalidate public product endpoints
      queryClient.invalidateQueries({ queryKey: ['/api/public/products'] });
      
      toast({
        title: "تم إنشاء المنتج",
        description: `تم إنشاء المنتج بنجاح`,
      });
      
      onClose();
      form.reset();
      setProductImages([]);
      setAdditionalImages([]);
      setPriceOffers([]);
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
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء المنتج",
        variant: "destructive",
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

  // Handle product name changes
  const handleNameChange = (value: string) => {
    // Just update the field value
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
    const productName = form.getValues("name");
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
    form.setValue("description", generatedDescription);
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

  const onSubmit = (data: CreateProductForm) => {
    if (isUploadingImages) {
      toast({
        title: "انتظر قليلاً",
        description: "يتم رفع الصور الآن، الرجاء الانتظار حتى اكتمال الرفع",
        variant: "destructive",
      });
      return;
    }
    createProductMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900/95 backdrop-blur-sm border-theme-border">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-theme-border pb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-right pr-4">
            <DialogTitle className="text-xl font-semibold text-white">إنشاء منتج جديد</DialogTitle>
            <DialogDescription className="text-sm text-gray-300 mt-1">
              قم بإدخال بيانات المنتج الجديد وإعداد تفاصيل البيع
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">اسم المنتج *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="أدخل اسم المنتج" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e.target.value);
                        }}
                        className="border-theme-border focus:border-theme-accent bg-theme-primary-lighter text-theme-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">السعر (د.ع) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        className="price-input border-theme-border focus:border-theme-accent bg-theme-primary-lighter text-theme-primary"
                        placeholder="0" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          field.onChange(value);
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          if (value && !isNaN(Number(value))) {
                            const formatted = Math.round(Number(value)).toLocaleString('en-US');
                            field.onChange(formatted);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-white">وصف المنتج</FormLabel>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={generateDescriptionMutation.isPending || !form.getValues("name")}
                      className="flex items-center gap-2 bg-theme-gradient text-white hover:scale-[1.02] transform theme-shadow"
                    >
                      {generateDescriptionMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      <span>إنشاء بالذكاء الاصطناعي</span>
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea 
                      rows={4} 
                      placeholder="اكتب وصف تفصيلي للمنتج..." 
                      {...field} 
                      className="border-theme-border focus:border-theme-accent bg-theme-primary-lighter text-theme-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-white">صور المنتج</FormLabel>
              <div className="mt-2">
                <ImageUploadManager
                  initialImages={productImages}
                  onImagesChange={handleImagesChange}
                  onUploadStateChange={handleUploadStateChange}
                  maxImages={5}
                  productName="المنتج الجديد"
                />
              </div>
            </div>

            <div>
              <FormLabel className="text-white">صور إضافية (تظهر أسفل وصف المنتج)</FormLabel>
              <div className="mt-2">
                <ImageUploadManager
                  initialImages={additionalImages}
                  onImagesChange={handleAdditionalImagesChange}
                  onUploadStateChange={handleAdditionalUploadStateChange}
                  maxImages={10}
                  productName="المنتج الجديد - صور إضافية"
                />
              </div>
            </div>

            {/* إدارة العروض والكميات المرنة */}
            <div>
              <FormLabel className="text-white mb-3 block">العروض وأسعار الكميات</FormLabel>
              <FlexibleOffersManager 
                offers={priceOffers} 
                onChange={setPriceOffers}
                currency="د.ع"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">التصنيف</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-theme-border focus:border-theme-accent bg-theme-primary-lighter text-theme-primary">
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-theme-primary-lighter border-theme-border">
                        {(categories as any[])
                          ?.sort((a, b) => {
                            if (a.name === 'منزلية') return -1;
                            if (b.name === 'منزلية') return 1;
                            return a.name.localeCompare(b.name, 'ar');
                          })
                          .map((category: any) => (
                          <SelectItem key={category.id} value={category.id} className="text-theme-primary hover:bg-theme-accent">
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">التكلفة (د.ع)</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        className="price-input border-theme-border focus:border-theme-accent bg-theme-primary-lighter text-theme-primary"
                        placeholder="0" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          field.onChange(value);
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          if (value && !isNaN(Number(value))) {
                            const formatted = Math.round(Number(value)).toLocaleString('en-US');
                            field.onChange(formatted);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">الكمية المتوفرة</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        className="quantity-input border-theme-border focus:border-theme-accent bg-theme-primary-lighter text-theme-primary"
                        placeholder="0" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          field.onChange(value);
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          if (value && !isNaN(Number(value))) {
                            const formatted = Math.round(Number(value)).toLocaleString('en-US');
                            field.onChange(formatted);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>



            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">رمز المنتج (SKU)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="أدخل رمز المنتج" 
                      {...field} 
                      className="border-theme-border focus:border-theme-accent bg-theme-primary-lighter text-theme-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            <div className="flex items-center justify-between pt-6 border-t border-theme-border">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onClose()}
                className="border-theme-border hover:bg-theme-primary-lighter text-theme-secondary"
              >
                إلغاء
              </Button>
              <div className="flex space-x-3 space-x-reverse">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    // TODO: Save as draft functionality
                    toast({
                      title: "قريباً",
                      description: "ميزة حفظ المسودة قيد التطوير",
                    });
                  }}
                  className="border-theme-border hover:bg-theme-primary-lighter text-theme-secondary"
                >
                  حفظ كمسودة
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProductMutation.isPending || isUploadingImages || isUploadingAdditionalImages}
                  className="bg-theme-gradient text-white hover:scale-[1.02] transform theme-shadow"
                >
                  {(isUploadingImages || isUploadingAdditionalImages) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      يتم رفع الصور...
                    </>
                  ) : createProductMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جارٍ الإنشاء...
                    </>
                  ) : (
                    "إنشاء المنتج"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
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
