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
import { Trash2, Plus, Edit3, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductSize {
  id: string;
  productId: string;
  sizeName: string;
  sizeValue: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sizeSchema = z.object({
  sizeName: z.string().min(1, "اسم الحجم مطلوب"),
  sizeValue: z.string().min(1, "قيمة الحجم مطلوبة"),
  sizeDescription: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type SizeFormData = z.infer<typeof sizeSchema>;

interface ProductSizesManagerProps {
  productId: string;
  platformId: string;
}

export function ProductSizesManager({ productId, platformId }: ProductSizesManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<ProductSize | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SizeFormData>({
    resolver: zodResolver(sizeSchema),
    defaultValues: {
      sizeName: "",
      sizeValue: "",
      sizeDescription: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  // Helper function for API requests with JSON response
  const fetchJson = async (url: string, method: string = "GET", body?: unknown) => {
    const response = await apiRequest(url, method, body);
    return response; // apiRequest already returns parsed JSON
  };

  // Fetch product sizes
  const { data: sizes = [], isLoading } = useQuery({
    queryKey: ["products", productId, "sizes"],
    queryFn: async () => {
      const result = await fetchJson(`/api/products/${productId}/sizes`, "GET");
      return Array.isArray(result) ? result : [];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Create size mutation
  const createSizeMutation = useMutation({
    mutationFn: async (sizeData: SizeFormData) => {
      const result = await apiRequest(`/api/products/${productId}/sizes`, "POST", {
        sizeName: sizeData.sizeName,
        sizeValue: sizeData.sizeValue,
        sizeDescription: sizeData.sizeDescription || null,
        sortOrder: sizeData.sortOrder || 0
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "sizes"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الحجم بنجاح",
      });
    },
    onError: (error: any) => {
      console.error("Size creation error:", error);
      toast({
        title: "خطأ",
        description: error?.message || "فشل في إضافة الحجم",
        variant: "destructive",
      });
    },
  });

  // Update size mutation
  const updateSizeMutation = useMutation({
    mutationFn: ({ sizeId, sizeData }: { sizeId: string; sizeData: Partial<SizeFormData> }) =>
      fetchJson(`/api/product-sizes/${sizeId}`, "PUT", sizeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "sizes"] });
      setEditingSize(null);
      form.reset();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الحجم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحجم",
        variant: "destructive",
      });
    },
  });

  // Delete size mutation
  const deleteSizeMutation = useMutation({
    mutationFn: (sizeId: string) =>
      fetchJson(`/api/product-sizes/${sizeId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", productId, "sizes"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الحجم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الحجم",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SizeFormData) => {
    if (editingSize) {
      updateSizeMutation.mutate({ sizeId: editingSize.id, sizeData: data });
    } else {
      createSizeMutation.mutate(data);
    }
  };

  const handleEdit = (size: ProductSize) => {
    setEditingSize(size);
    form.reset({
      sizeName: size.sizeName,
      sizeValue: size.sizeValue || "",
      sizeDescription: size.description || "",
      sortOrder: size.sortOrder,
      isActive: size.isActive,
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
          <Maximize2 className="w-5 h-5" />
          أحجام المنتج
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingSize(null);
                form.reset({
                  sizeName: "",
                  sizeValue: "",
                  sizeDescription: "",
                  sortOrder: 0,
                  isActive: true,
                });
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة حجم
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" aria-describedby="size-dialog-description">
            <DialogHeader>
              <DialogTitle>
                {editingSize ? "تعديل الحجم" : "إضافة حجم جديد"}
              </DialogTitle>
              <div id="size-dialog-description" className="sr-only">
                نافذة لإضافة أو تعديل حجم المنتج
              </div>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="sizeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الحجم</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: صغير، متوسط، كبير" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sizeValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>قيمة الحجم *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: XL، 42، 28cm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sizeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الحجم</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="وصف الحجم" />
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
                    disabled={createSizeMutation.isPending || updateSizeMutation.isPending}
                    className="flex-1"
                  >
                    {editingSize ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sizes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد أحجام مضافة لهذا المنتج
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sizes.map((size: ProductSize) => (
              <div
                key={size.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{size.sizeName}</span>
                    {size.sizeValue && (
                      <span className="text-sm text-muted-foreground">
                        ({size.sizeValue})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(size)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSizeMutation.mutate(size.id)}
                      disabled={deleteSizeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {size.description && <div>الوصف: {size.description}</div>}
                  <div>الترتيب: {size.sortOrder}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}