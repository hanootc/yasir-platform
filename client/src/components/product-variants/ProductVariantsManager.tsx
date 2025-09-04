import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Edit3, Package, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface ProductVariant {
  id: string;
  productId: string;
  platformId: string;
  colorId: string | null;
  shapeId: string | null;
  sizeId: string | null;
  variantName: string;
  sku: string | null;
  price: string;
  cost: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrls: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Related data from joins
  colorName?: string;
  colorCode?: string;
  colorImageUrl?: string;
  shapeName?: string;
  sizeName?: string;
  sizeValue?: string;
}

interface ProductColor {
  id: string;
  colorName: string;
  colorCode: string;
}

interface ProductShape {
  id: string;
  shapeName: string;
}

interface ProductSize {
  id: string;
  sizeName: string;
  sizeValue: string | null;
}

const variantSchema = z.object({
  colorId: z.string().default("none"),
  shapeId: z.string().default("none"),
  sizeId: z.string().default("none"),
  variantName: z.string().min(1, "اسم المتغير مطلوب"),
  sku: z.string().optional(),
  price: z.string().min(1, "السعر مطلوب"),
  cost: z.string().optional(),
  stockQuantity: z.number().min(0, "الكمية يجب أن تكون صفر أو أكثر").default(0),
  lowStockThreshold: z.number().min(0).default(5),
  imageUrls: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type VariantFormData = z.infer<typeof variantSchema>;

interface ProductVariantsManagerProps {
  productId: string;
  platformId: string;
}

export function ProductVariantsManager({ productId, platformId }: ProductVariantsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      colorId: "",
      shapeId: "",
      sizeId: "",
      variantName: "",
      sku: "",
      price: "",
      cost: "",
      stockQuantity: 0,
      lowStockThreshold: 5,
      imageUrls: [],
      isActive: true,
      isDefault: false,
    },
  });

  // Helper function for API requests with JSON response
  const fetchJson = async (url: string, options?: RequestInit) => {
    const response = await apiRequest(url, options?.method || "GET", options?.body ? JSON.parse(options.body as string) : undefined);
    return response.json();
  };

  // Fetch product variants
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["products", productId, "variants"],
    queryFn: () => fetchJson(`/api/products/${productId}/variants`),
  });

  // Fetch colors, shapes, and sizes for dropdowns
  const { data: colors = [] } = useQuery({
    queryKey: ["products", productId, "colors"],
    queryFn: () => fetchJson(`/api/products/${productId}/colors`),
  });

  const { data: shapes = [] } = useQuery({
    queryKey: ["products", productId, "shapes"],
    queryFn: () => fetchJson(`/api/products/${productId}/shapes`),
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["products", productId, "sizes"],
    queryFn: () => fetchJson(`/api/products/${productId}/sizes`),
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: (variantData: VariantFormData) =>
      fetchJson(`/api/products/${productId}/variants`, {
        method: "POST",
        body: JSON.stringify({
          ...variantData,
          platformId,
          colorId: variantData.colorId === "none" ? null : variantData.colorId,
          shapeId: variantData.shapeId === "none" ? null : variantData.shapeId,
          sizeId: variantData.sizeId === "none" ? null : variantData.sizeId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "variants"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المتغير بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المتغير",
        variant: "destructive",
      });
    },
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, variantData }: { variantId: string; variantData: Partial<VariantFormData> }) =>
      fetchJson(`/api/product-variants/${variantId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...variantData,
          colorId: variantData.colorId === "none" ? null : variantData.colorId,
          shapeId: variantData.shapeId === "none" ? null : variantData.shapeId,
          sizeId: variantData.sizeId === "none" ? null : variantData.sizeId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "variants"] });
      setEditingVariant(null);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث المتغير بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المتغير",
        variant: "destructive",
      });
    },
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) =>
      fetchJson(`/api/product-variants/${variantId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "variants"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المتغير بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المتغير",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VariantFormData) => {
    if (editingVariant) {
      updateVariantMutation.mutate({ variantId: editingVariant.id, variantData: data });
    } else {
      createVariantMutation.mutate(data);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    form.reset({
      colorId: variant.colorId || "none",
      shapeId: variant.shapeId || "none", 
      sizeId: variant.sizeId || "none",
      variantName: variant.variantName,
      sku: variant.sku || "",
      price: variant.price,
      cost: variant.cost || "",
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      imageUrls: variant.imageUrls || [],
      isActive: variant.isActive,
      isDefault: variant.isDefault,
    });
    setIsAddDialogOpen(true);
  };

  const generateVariantName = () => {
    const colorId = form.watch("colorId");
    const shapeId = form.watch("shapeId");
    const sizeId = form.watch("sizeId");

    const colorName = colors.find((c: ProductColor) => c.id === colorId)?.colorName || "";
    const shapeName = shapes.find((s: ProductShape) => s.id === shapeId)?.shapeName || "";
    const sizeName = sizes.find((s: ProductSize) => s.id === sizeId)?.sizeName || "";

    const parts = [colorName, shapeName, sizeName].filter(Boolean);
    if (parts.length > 0) {
      form.setValue("variantName", parts.join(" - "));
    }
  };

  const getStockStatus = (variant: ProductVariant) => {
    if (variant.stockQuantity === 0) {
      return { status: "نفدت الكمية", color: "text-red-500", icon: AlertCircle };
    } else if (variant.stockQuantity <= variant.lowStockThreshold) {
      return { status: "كمية قليلة", color: "text-yellow-500", icon: AlertCircle };
    } else {
      return { status: "متوفر", color: "text-green-500", icon: CheckCircle };
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">جاري التحميل...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          متغيرات المنتج
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingVariant(null);
                form.reset();
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة متغير
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVariant ? "تعديل المتغير" : "إضافة متغير جديد"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="colorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اللون</FormLabel>
                        <Select value={field.value} onValueChange={(value) => {
                          field.onChange(value);
                          generateVariantName();
                        }}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر اللون" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">بدون لون</SelectItem>
                            {colors.map((color: ProductColor) => (
                              <SelectItem key={color.id} value={color.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: color.colorCode }}
                                  />
                                  {color.colorName}
                                </div>
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
                    name="shapeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الشكل</FormLabel>
                        <Select value={field.value} onValueChange={(value) => {
                          field.onChange(value);
                          generateVariantName();
                        }}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الشكل" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">بدون شكل</SelectItem>
                            {shapes.map((shape: ProductShape) => (
                              <SelectItem key={shape.id} value={shape.id}>
                                {shape.shapeName}
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
                    name="sizeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحجم</FormLabel>
                        <Select value={field.value} onValueChange={(value) => {
                          field.onChange(value);
                          generateVariantName();
                        }}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الحجم" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">بدون حجم</SelectItem>
                            {sizes.map((size: ProductSize) => (
                              <SelectItem key={size.id} value={size.id}>
                                {size.sizeName} {size.sizeValue && `(${size.sizeValue})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="variantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المتغير</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} placeholder="اسم المتغير" />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateVariantName}
                          >
                            توليد
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كود المنتج (SKU)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="كود المنتج" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السعر (د.ع)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="السعر" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التكلفة (د.ع) - اختياري</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="التكلفة" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الكمية المتوفرة</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="الكمية"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حد الإنذار للكمية</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                            placeholder="حد الإنذار"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            متغير نشط
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            المتغير الافتراضي
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createVariantMutation.isPending || updateVariantMutation.isPending}
                    className="flex-1"
                  >
                    {editingVariant ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد متغيرات مضافة لهذا المنتج
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((variant: ProductVariant) => {
              const stockStatus = getStockStatus(variant);
              const StatusIcon = stockStatus.icon;

              return (
                <div
                  key={variant.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{variant.variantName}</span>
                          {variant.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              افتراضي
                            </span>
                          )}
                          {!variant.isActive && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              غير نشط
                            </span>
                          )}
                        </div>
                        {variant.sku && (
                          <div className="text-sm text-muted-foreground">
                            SKU: {variant.sku}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(variant)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteVariantMutation.mutate(variant.id)}
                        disabled={deleteVariantMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">السعر: </span>
                      <span className="font-medium">{formatCurrency(parseFloat(variant.price))}</span>
                    </div>
                    {variant.cost && (
                      <div>
                        <span className="text-muted-foreground">التكلفة: </span>
                        <span>{formatCurrency(parseFloat(variant.cost))}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <StatusIcon className={`w-4 h-4 ${stockStatus.color}`} />
                      <span className="text-muted-foreground">المخزون: </span>
                      <span className={stockStatus.color}>{variant.stockQuantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">حد الإنذار: </span>
                      <span>{variant.lowStockThreshold}</span>
                    </div>
                  </div>

                  {(variant.colorName || variant.shapeName || variant.sizeName) && (
                    <div className="flex gap-4 text-sm">
                      {variant.colorName && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: variant.colorCode }}
                          />
                          <span>{variant.colorName}</span>
                        </div>
                      )}
                      {variant.shapeName && (
                        <div>
                          <span className="text-muted-foreground">الشكل: </span>
                          {variant.shapeName}
                        </div>
                      )}
                      {variant.sizeName && (
                        <div>
                          <span className="text-muted-foreground">الحجم: </span>
                          {variant.sizeName} {variant.sizeValue && `(${variant.sizeValue})`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}