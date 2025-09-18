import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Edit3, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocalImageUploader } from "@/components/LocalImageUploader";

interface ProductShape {
  id: string;
  productId: string;
  shapeName: string;
  shapeDescription: string | null;
  shapeImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shapeSchema = z.object({
  shapeName: z.string().min(1, "اسم الشكل مطلوب"),
  shapeImageUrl: z.string().optional(),
  shapeDescription: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type ShapeFormData = z.infer<typeof shapeSchema>;

interface ProductShapesManagerProps {
  productId: string;
  platformId: string;
}

export function ProductShapesManager({ productId, platformId }: ProductShapesManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingShape, setEditingShape] = useState<ProductShape | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ShapeFormData>({
    resolver: zodResolver(shapeSchema),
    defaultValues: {
      shapeName: "",
      shapeImageUrl: "",
      shapeDescription: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  // Helper function for API requests with JSON response
  const fetchJson = async (url: string, method: string = "GET", body?: unknown) => {
    const response = await apiRequest(url, method, body);
    return response; // apiRequest already returns parsed JSON
  };

  // Fetch product shapes
  const { data: shapes = [], isLoading } = useQuery({
    queryKey: ["products", productId, "shapes"],
    queryFn: async () => {
      const result = await fetchJson(`/api/products/${productId}/shapes`, "GET");
      return Array.isArray(result) ? result : [];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Create shape mutation
  const createShapeMutation = useMutation({
    mutationFn: async (shapeData: ShapeFormData) => {
      console.log('🔶 Sending shape data:', shapeData);
      const result = await apiRequest(`/api/products/${productId}/shapes`, "POST", {
        shapeName: shapeData.shapeName,
        shapeImageUrl: shapeData.shapeImageUrl || null,
        shapeDescription: shapeData.shapeDescription || null,
        sortOrder: shapeData.sortOrder || 0
      });
      console.log('🔶 Shape creation result:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "shapes"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الشكل بنجاح",
      });
    },
    onError: (error: any) => {
      console.error("Shape creation error:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      toast({
        title: "خطأ",
        description: error?.message || "فشل في إضافة الشكل",
        variant: "destructive",
      });
    },
  });

  // Update shape mutation
  const updateShapeMutation = useMutation({
    mutationFn: ({ shapeId, shapeData }: { shapeId: string; shapeData: Partial<ShapeFormData> }) =>
      fetchJson(`/api/product-shapes/${shapeId}`, "PUT", shapeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "shapes"] });
      setEditingShape(null);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الشكل بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الشكل",
        variant: "destructive",
      });
    },
  });

  // Delete shape mutation
  const deleteShapeMutation = useMutation({
    mutationFn: (shapeId: string) =>
      fetchJson(`/api/product-shapes/${shapeId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "shapes"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الشكل بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الشكل",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShapeFormData) => {
    if (editingShape) {
      updateShapeMutation.mutate({ shapeId: editingShape.id, shapeData: data });
    } else {
      createShapeMutation.mutate(data);
    }
  };

  // معالج رفع الصورة
  const handleUploadComplete = (imageUrl: string) => {
    form.setValue("shapeImageUrl", imageUrl);
    toast({
      title: "تم بنجاح", 
      description: "تم رفع صورة الشكل بنجاح",
    });
  };

  const handleEdit = (shape: ProductShape) => {
    setEditingShape(shape);
    form.reset({
      shapeName: shape.shapeName,
      shapeImageUrl: shape.shapeImageUrl || "",
      shapeDescription: shape.shapeDescription || "",
      sortOrder: shape.sortOrder,
      isActive: shape.isActive,
    });
    setIsAddDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-4">جاري التحميل...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Square className="w-5 h-5" />
          أشكال المنتج
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingShape(null);
                form.reset();
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة شكل
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" aria-describedby="shape-dialog-description">
            <DialogHeader>
              <DialogTitle>
                {editingShape ? "تعديل الشكل" : "إضافة شكل جديد"}
              </DialogTitle>
              <div id="shape-dialog-description" className="sr-only">
                نافذة لإضافة أو تعديل شكل المنتج
              </div>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="shapeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الشكل</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: مربع، دائري، مستطيل" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shapeImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صورة الشكل</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <LocalImageUploader
                            onImageAdd={handleUploadComplete}
                            maxFiles={1}
                            currentImageCount={field.value ? 1 : 0}
                            category="shapes"
                          />
                          {field.value && (
                            <div className="relative inline-block">
                              <img 
                                src={field.value}
                                alt="معاينة الشكل" 
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
                  name="shapeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الشكل</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="وصف الشكل" />
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
                    disabled={createShapeMutation.isPending || updateShapeMutation.isPending}
                    className="flex-1"
                  >
                    {editingShape ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {shapes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد أشكال مضافة لهذا المنتج
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shapes.map((shape: ProductShape) => (
              <div
                key={shape.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{shape.shapeName}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(shape)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteShapeMutation.mutate(shape.id)}
                      disabled={deleteShapeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {shape.shapeImageUrl && (
                  <div className="relative">
                    <img
                      src={shape.shapeImageUrl}
                      alt={shape.shapeName}
                      className="w-full h-24 object-cover rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      onError={(e) => {
                        console.warn("فشل في تحميل صورة الشكل:", shape.shapeImageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log("تم تحميل صورة الشكل بنجاح:", shape.shapeImageUrl);
                      }}
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {shape.shapeName}
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  {shape.shapeDescription && <div>الوصف: {shape.shapeDescription}</div>}
                  <div>الترتيب: {shape.sortOrder}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}