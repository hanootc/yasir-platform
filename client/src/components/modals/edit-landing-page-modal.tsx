import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getTemplateDisplayName } from "@/lib/landingPageTemplates";
import { usePlatformSession } from "@/hooks/use-platform-session";

const editLandingPageSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  content: z.string().optional(),
  customUrl: z.string().min(1, "الرابط المخصص مطلوب"),
  template: z.string().min(1, "النموذج مطلوب"),
  isActive: z.boolean(),
  productId: z.string().min(1, "المنتج مطلوب"),
});

type EditLandingPageFormData = z.infer<typeof editLandingPageSchema>;

interface EditLandingPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  landingPage: any;
}

const templates = [
  { value: "modern_minimal", label: "البسيط" },
  { value: "bold_hero", label: "التجاري" },
  { value: "product_showcase", label: "العارض" },
  { value: "testimonial_focus", label: "الشهادات" },
  { value: "feature_highlight", label: "المميزات" },
  { value: "countdown_urgency", label: "الاستعجال" },
  { value: "colorful_vibrant", label: "الملوّن" },
  { value: "tiktok_style", label: "تيك توك" },
];

export default function EditLandingPageModal({
  isOpen,
  onClose,
  landingPage,
}: EditLandingPageModalProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();

  // Get platform session
  const { session: platformSession } = usePlatformSession();

  // Get employee session if available
  const { data: employeeSession } = useQuery({
    queryKey: ["/api/employee-session"],
    retry: false,
  });

  // Extract platform ID - handle both platform and employee sessions
  const platformId = (employeeSession as any)?.success 
    ? (employeeSession as any).employee.platformId 
    : platformSession?.platformId;

  const { data: products } = useQuery({
    queryKey: [`/api/platforms/${platformId}/products`],
    enabled: !!platformId,
  });

  const form = useForm<EditLandingPageFormData>({
    resolver: zodResolver(editLandingPageSchema),
    defaultValues: {
      title: "",
      content: "",
      customUrl: "",
      template: "modern_minimal",
      isActive: true,
      productId: "",
    },
  });

  // Update form when landing page data changes
  useEffect(() => {
    if (landingPage) {
      form.reset({
        title: landingPage.title || "",
        content: landingPage.content || "",
        customUrl: landingPage.customUrl || "",
        template: landingPage.template || "modern_minimal",
        isActive: landingPage.isActive !== false,
        productId: landingPage.productId || "",
      });
    }
  }, [landingPage, form]);

  const updateLandingPageMutation = useMutation({
    mutationFn: async (data: EditLandingPageFormData) => {
      if (!platformId) {
        throw new Error('معرف المنصة غير متوفر');
      }
      return apiRequest(`/api/platforms/${platformId}/landing-pages/${landingPage.id}`, "PATCH", data);
    },
    onSuccess: () => {
      if (platformId) {
        queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/landing-pages`] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activities"] });
      
      toast({
        title: "تم تحديث صفحة الهبوط",
        description: "تم تحديث صفحة الهبوط بنجاح",
      });
      
      onClose();
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
        description: "حدث خطأ أثناء تحديث صفحة الهبوط",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditLandingPageFormData) => {
    updateLandingPageMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const getProductName = (productId: string) => {
    const product = (products as any[])?.find((p: any) => p.id === productId);
    return product?.name || "غير محدد";
  };

  const getSelectedProduct = () => {
    const productId = form.watch("productId");
    return (products as any[])?.find((p: any) => p.id === productId);
  };

  const selectedProduct = getSelectedProduct();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modal-content-solid theme-border">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold text-theme-primary">
            تحرير صفحة الهبوط: {landingPage?.title}
          </DialogTitle>
          <DialogDescription className="text-right text-gray-600">
            قم بتحرير إعدادات وتصميم صفحة الهبوط الخاصة بك
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="basic" className="text-right">الأساسيات</TabsTrigger>
            <TabsTrigger value="design" className="text-right">التصميم</TabsTrigger>
            <TabsTrigger value="content" className="text-right">المحتوى</TabsTrigger>
            <TabsTrigger value="analytics" className="text-right">الإحصائيات</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-right">المعلومات الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">عنوان الصفحة</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="أدخل عنوان صفحة الهبوط"
                              className="text-right theme-input"
                              dir="rtl"
                            />
                          </FormControl>
                          <FormMessage className="text-right" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">الرابط المخصص</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2" dir="ltr">
                              <span className="text-gray-500 text-sm">/</span>
                              <Input
                                {...field}
                                placeholder="custom-url"
                                className="text-left theme-input"
                                dir="ltr"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-right" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">المنتج المرتبط</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-right theme-select-trigger">
                                <SelectValue placeholder="اختر المنتج" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(products as any[])?.map((product: any) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex items-center gap-2 text-right">
                                    <span>{product.name}</span>
                                    <Badge variant="outline">{product.price} د.ع</Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-right" />
                        </FormItem>
                      )}
                    />

                    {selectedProduct && (
                      <Card className="p-4 bg-gray-50">
                        <div className="flex items-center gap-4">
                          {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0 && (
                            <img
                              src={selectedProduct.imageUrls[0].startsWith('/objects/') ? 
                                selectedProduct.imageUrls[0].replace('/objects/', '/public-objects/') : 
                                selectedProduct.imageUrls[0]
                              }
                              alt={selectedProduct.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1 text-right">
                            <h4 className="font-semibold">{selectedProduct.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{selectedProduct.description}</p>
                            <div className="flex gap-2 justify-end">
                              <Badge>{selectedProduct.price} د.ع</Badge>
                              {selectedProduct.stock !== undefined && (
                                <Badge variant="outline">
                                  {selectedProduct.stock} في المخزون
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="text-right">
                            <FormLabel className="text-base font-medium">حالة الصفحة</FormLabel>
                            <p className="text-sm text-gray-600">
                              {field.value ? "الصفحة نشطة ومتاحة للزوار" : "الصفحة غير نشطة"}
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-right">تصميم الصفحة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">قالب التصميم</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-right">
                                <SelectValue placeholder="اختر القالب" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {templates.map((template) => (
                                <SelectItem key={template.value} value={template.value}>
                                  {template.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-right" />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2 text-right">
                        معاينة القالب: {getTemplateDisplayName(form.watch("template"))}
                      </h4>
                      <p className="text-sm text-blue-700 text-right">
                        القالب المحدد سيحدد شكل وتخطيط صفحة الهبوط الخاصة بك
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-right">محتوى الصفحة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right block">المحتوى التفصيلي</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="أدخل محتوى صفحة الهبوط (اختياري)"
                              className="text-right min-h-[200px]"
                              dir="rtl"
                            />
                          </FormControl>
                          <FormMessage className="text-right" />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2 text-right">نصائح لكتابة المحتوى:</h4>
                      <ul className="text-sm text-gray-600 space-y-1 text-right">
                        <li>• استخدم عناوين جذابة ووضحة</li>
                        <li>• اذكر فوائد المنتج وليس فقط مواصفاته</li>
                        <li>• أضف دعوة واضحة للعمل</li>
                        <li>• استخدم لغة بسيطة ومفهومة</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-right">إحصائيات الأداء</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {landingPage?.views || 0}
                        </div>
                        <div className="text-sm text-gray-600">إجمالي الزيارات</div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {landingPage?.conversions || 0}
                        </div>
                        <div className="text-sm text-gray-600">التحويلات</div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {landingPage?.views > 0 
                            ? ((landingPage.conversions / landingPage.views) * 100).toFixed(1) 
                            : "0"}%
                        </div>
                        <div className="text-sm text-gray-600">معدل التحويل</div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h4 className="font-semibold text-right">معلومات الصفحة</h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded-lg text-right">
                          <span className="text-gray-600">تاريخ الإنشاء:</span>
                          <div className="font-medium">
                            {landingPage?.createdAt 
                              ? new Date(landingPage.createdAt).toLocaleDateString('ar-EG')
                              : "غير متاح"}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg text-right">
                          <span className="text-gray-600">آخر تحديث:</span>
                          <div className="font-medium">
                            {landingPage?.updatedAt 
                              ? new Date(landingPage.updatedAt).toLocaleDateString('ar-EG')
                              : "غير متاح"}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg text-right">
                        <span className="text-gray-600">رابط الصفحة:</span>
                        <div className="font-medium text-blue-600" dir="ltr">
                          /{landingPage?.customUrl}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={updateLandingPageMutation.isPending}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={updateLandingPageMutation.isPending}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  {updateLandingPageMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      جارٍ الحفظ...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}