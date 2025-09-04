import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Edit3, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocalImageUploader } from "@/components/LocalImageUploader";

interface ProductColor {
  id: string;
  productId: string;
  colorName: string;
  colorCode: string;
  colorImageUrl: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const colorSchema = z.object({
  colorName: z.string().min(1, "اسم اللون مطلوب"),
  colorCode: z.string().min(1, "كود اللون مطلوب"),
  colorImageUrl: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type ColorFormData = z.infer<typeof colorSchema>;

interface ProductColorsManagerProps {
  productId: string;
  platformId: string;
}

export function ProductColorsManager({ productId, platformId }: ProductColorsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<ProductColor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ColorFormData>({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      colorName: "",
      colorCode: "#000000",
      colorImageUrl: "",
      description: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  // Helper function for API requests with JSON response
  const fetchJson = async (url: string, options?: RequestInit) => {
    const response = await apiRequest(url, {
      method: options?.method || "GET",
      body: options?.body ? JSON.parse(options.body as string) : undefined
    });
    return response.json();
  };

  // Fetch product colors
  const { data: colors = [], isLoading } = useQuery({
    queryKey: ["products", productId, "colors"],
    queryFn: () => fetchJson(`/api/products/${productId}/colors`),
  });

  // Create color mutation
  const createColorMutation = useMutation({
    mutationFn: (colorData: ColorFormData) =>
      fetchJson(`/api/products/${productId}/colors`, {
        method: "POST",
        body: JSON.stringify({ ...colorData, platformId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "colors"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة اللون بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة اللون",
        variant: "destructive",
      });
    },
  });

  // Update color mutation
  const updateColorMutation = useMutation({
    mutationFn: ({ colorId, colorData }: { colorId: string; colorData: Partial<ColorFormData> }) =>
      fetchJson(`/api/product-colors/${colorId}`, {
        method: "PUT",
        body: JSON.stringify(colorData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "colors"] });
      setEditingColor(null);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث اللون بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث اللون",
        variant: "destructive",
      });
    },
  });

  // Delete color mutation
  const deleteColorMutation = useMutation({
    mutationFn: (colorId: string) =>
      fetchJson(`/api/product-colors/${colorId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "colors"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف اللون بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف اللون",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ColorFormData) => {
    if (editingColor) {
      updateColorMutation.mutate({ colorId: editingColor.id, colorData: data });
    } else {
      createColorMutation.mutate(data);
    }
  };

  const handleEdit = (color: ProductColor) => {
    setEditingColor(color);
    form.reset({
      colorName: color.colorName,
      colorCode: color.colorCode,
      colorImageUrl: color.colorImageUrl || "",
      description: color.description || "",
      sortOrder: color.sortOrder,
      isActive: color.isActive,
    });
    setIsAddDialogOpen(true);
  };

  const handleUploadComplete = (imageUrl: string) => {
    form.setValue("colorImageUrl", imageUrl);
  };

  if (isLoading) {
    return <div className="text-center py-4">جاري التحميل...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          ألوان المنتج
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingColor(null);
                form.reset();
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة لون
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingColor ? "تعديل اللون" : "إضافة لون جديد"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="colorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم اللون</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: أحمر، أزرق" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colorCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود اللون</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="color" 
                            {...field} 
                            className="w-20 h-10 p-1"
                          />
                          <Input 
                            {...field} 
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colorImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صورة اللون</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <LocalImageUploader
                            onImageAdd={handleUploadComplete}
                            maxFiles={1}
                            currentImageCount={field.value ? 1 : 0}
                            category="colors"
                          >
                            رفع صورة
                          </LocalImageUploader>
                          {field.value && (
                            <div className="relative inline-block">
                              <img 
                                src={field.value}
                                alt="معاينة اللون" 
                                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                onError={(e) => {
                                  console.warn("فشل في تحميل الصورة:", field.value);
                                  e.currentTarget.style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log("تم تحميل معاينة الصورة بنجاح:", field.value);
                                }}
                              />
                              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                ✓
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف اللون</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="وصف اللون" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ترتيب العرض</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    disabled={createColorMutation.isPending || updateColorMutation.isPending}
                    className="flex-1"
                  >
                    {editingColor ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {colors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد ألوان مضافة لهذا المنتج
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colors.map((color: ProductColor) => (
              <div
                key={color.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: color.colorCode }}
                    />
                    <span className="font-medium">{color.colorName}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(color)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteColorMutation.mutate(color.id)}
                      disabled={deleteColorMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {color.colorImageUrl && (
                  <div className="relative">
                    <img
                      src={color.colorImageUrl}
                      alt={color.colorName}
                      className="w-full h-24 object-cover rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      onError={(e) => {
                        console.warn("فشل في تحميل صورة اللون:", color.colorImageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log("تم تحميل صورة اللون بنجاح:", color.colorImageUrl);
                      }}
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {color.colorName}
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  <div>الكود: {color.colorCode}</div>
                  {color.description && <div>الوصف: {color.description}</div>}
                  <div>الترتيب: {color.sortOrder}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}