import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { landingPageTemplates, getTemplateById } from "@/lib/landingPageTemplates";
import { generateSlugFromArabic, isValidCustomUrl } from "@/lib/arabicToLatin";
import { TemplatePreviewModal } from "./template-preview-modal";
import { TemplatePreviewCard } from "../template-preview-card";

const createLandingPageSchema = z.object({
  title: z.string().min(1, "عنوان الصفحة مطلوب"),
  productId: z.string().min(1, "يجب اختيار منتج"),
  customUrl: z.string().optional().refine((val) => !val || isValidCustomUrl(val), {
    message: "الرابط المخصص يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطات فقط"
  }),
  template: z.string().min(1, "يجب اختيار نموذج"),
  content: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CreateLandingPageForm = z.infer<typeof createLandingPageSchema>;

interface CreateLandingPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateLandingPageModal({ open, onOpenChange }: CreateLandingPageModalProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern_minimal");
  const [previewTemplate, setPreviewTemplate] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<CreateLandingPageForm>({
    resolver: zodResolver(createLandingPageSchema),
    defaultValues: {
      title: "",
      productId: "",
      customUrl: "",
      template: "modern_minimal",
      content: "",
      isActive: true,
    },
  });

  // Get platform session from API
  const { data: platformSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/platform-session"],
    retry: false,
    enabled: open,
  });

  // Get employee session if available
  const { data: employeeSession } = useQuery({
    queryKey: ["/api/employee-session"],
    retry: false,
    enabled: open,
  });

  // Extract platform ID with proper typing - handle both platform and employee sessions
  const platformId = (employeeSession as any)?.success 
    ? (employeeSession as any).employee.platformId 
    : (platformSession as any)?.platformId;

  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: [`/api/platforms/${platformId}/products`],
    enabled: open && !!platformId,
  });

  // Debug logging
  console.log('Modal Debug:', {
    open,
    sessionLoading,
    platformSession,
    platformId,
    productsLoading,
    products,
    productsError
  });

  const createLandingPageMutation = useMutation({
    mutationFn: async (data: CreateLandingPageForm) => {
      console.log('🚀 Creating landing page with data:', data);
      console.log('🔗 API URL:', `/api/platforms/${platformId}/landing-pages`);
      
      try {
        const result = await apiRequest(`/api/platforms/${platformId}/landing-pages`, "POST", data);
        console.log('✅ Landing page created successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Error creating landing page:', error);
        console.error('❌ Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        throw error;
      }
    },
    onSuccess: (landingPage) => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/landing-pages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activities"] });
      
      toast({
        title: "تم إنشاء صفحة الهبوط",
        description: `تم إنشاء صفحة الهبوط بنجاح`,
      });
      
      onOpenChange(false);
      form.reset();
      setSelectedTemplate("modern_minimal");
    },
    onError: (error) => {
      console.error('❌ Mutation error handler:', error);
      
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
      
      // Show detailed error message
      const errorMessage = error.response?.data?.error || error.message || "حدث خطأ غير معروف";
      const errorDetails = error.response?.data?.details || "";
      
      toast({
        title: "خطأ في إنشاء صفحة الهبوط",
        description: `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateLandingPageForm) => {
    console.log('📝 Form submitted with data:', data);
    console.log('🎨 Selected template:', selectedTemplate);
    console.log('🆔 Platform ID:', platformId);
    
    const payload = {
      ...data,
      template: selectedTemplate,
      // Auto-generate customUrl if not provided
      customUrl: data.customUrl || generateSlugFromArabic(data.title),
    };
    
    console.log('🚀 Final payload for API:', payload);
    console.log('📡 About to call mutation...');
    
    createLandingPageMutation.mutate(payload);
  };

  // Auto-generate URL when title changes
  const handleTitleChange = (value: string) => {
    // Auto-generate customUrl only if it's empty
    if (!form.getValues("customUrl")) {
      const generatedUrl = generateSlugFromArabic(value);
      form.setValue("customUrl", generatedUrl);
    }
  };

  // Auto-generate URL and title when product changes
  const handleProductChange = (productId: string) => {
    form.setValue("productId", productId);
    
    // Find the selected product and use its name for title and URL generation
    const selectedProduct = (products as any[])?.find(p => p.id === productId);
    if (selectedProduct) {
      // Auto-fill title with product name
      if (!form.getValues("title")) {
        form.setValue("title", selectedProduct.name);
      }
      
      // Auto-generate URL if empty
      if (!form.getValues("customUrl")) {
        const generatedUrl = generateSlugFromArabic(selectedProduct.name);
        form.setValue("customUrl", generatedUrl);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modal-content-solid theme-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-theme-primary">إنشاء صفحة هبوط جديدة</DialogTitle>
          <DialogDescription className="text-right text-gray-600">
            قم بإنشاء صفحة هبوط جديدة لمنتجاتك لزيادة المبيعات
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log('❌ Form validation errors:', errors);
            console.log('📋 Current form values:', form.getValues());
          })} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* المنتج المرتبط - يمين في RTL */}
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المنتج المرتبط *</FormLabel>
                    <Select onValueChange={handleProductChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="theme-select-trigger">
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productsLoading ? (
                          <SelectItem value="loading" disabled>
                            جاري تحميل المنتجات...
                          </SelectItem>
                        ) : productsError ? (
                          <SelectItem value="error" disabled>
                            خطأ في تحميل المنتجات
                          </SelectItem>
                        ) : !products || (Array.isArray(products) && products.length === 0) ? (
                          <SelectItem value="no-products" disabled>
                            لا توجد منتجات متاحة
                          </SelectItem>
                        ) : (
                          (products as any[]).map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* عنوان صفحة الهبوط - يسار في RTL */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان صفحة الهبوط *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="أدخل عنوان جذاب لصفحة الهبوط" 
                        {...field}
                        className="theme-input"
                        onChange={(e) => {
                          field.onChange(e);
                          handleTitleChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <p className="text-xs text-theme-primary mt-1">
                        ✅ سيتم ملء العنوان تلقائياً عند اختيار المنتج
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الرابط المخصص</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 bg-theme-primary-light px-3 py-2 theme-border border-r-0 rounded-r-md">
                        /landing/
                      </span>
                      <Input 
                        className="rounded-r-none theme-input"
                        placeholder="url-slug" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <p className="text-sm text-gray-500">سيكون الرابط النهائي: /landing/{field.value || "url-slug"}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Selection */}
            <div className="space-y-4">
              <div>
                <FormLabel className="text-base font-semibold">اختيار نموذج التصميم *</FormLabel>
                <p className="text-sm text-gray-500 mt-1">اختر التصميم المناسب لصفحة الهبوط</p>
              </div>
              
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {landingPageTemplates.map((template) => (
                          <div key={template.id} className="space-y-3">
                            <TemplatePreviewCard
                              templateId={template.id}
                              name={template.name}
                              colorScheme={template.colorScheme}
                              onPreview={(templateId) => {
                                setPreviewTemplate(templateId);
                                setShowPreview(true);
                              }}
                            />
                            <Card
                              className={`cursor-pointer transition-all hover:theme-shadow theme-border ${
                                field.value === template.id
                                  ? 'ring-2 ring-primary bg-theme-primary-light'
                                  : 'hover:border-primary bg-theme-primary-lighter'
                              }`}
                              onClick={() => {
                                field.onChange(template.id);
                                setSelectedTemplate(template.id);
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-theme-gradient rounded flex items-center justify-center flex-shrink-0">
                                      <i className={`${template.preview} text-white text-xs`}></i>
                                    </div>
                                    <span className="font-medium text-sm text-theme-primary">{template.name}</span>
                                  </div>
                                  {field.value === template.id && (
                                    <i className="fas fa-check-circle text-primary"></i>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{template.description}</p>
                                <div className="flex gap-1 flex-wrap mt-2">
                                  {template.features.slice(0, 2).map((feature, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs bg-theme-primary-lighter text-theme-primary">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Template Features Preview */}
            {selectedTemplate && (
              <Card className="bg-theme-primary-light theme-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-theme-primary">مميزات النموذج: {getTemplateById(selectedTemplate)?.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {getTemplateById(selectedTemplate)?.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-theme-primary-lighter text-theme-primary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>محتوى إضافي (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={4} 
                      placeholder="أضف أي محتوى إضافي أو تخصيصات خاصة..." 
                      className="theme-textarea"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg theme-border bg-theme-primary-lighter p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-theme-primary">تفعيل الصفحة</FormLabel>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      هل تريد تفعيل الصفحة فور إنشائها؟
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

            <div className="flex justify-end gap-3 pt-4 border-t theme-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={createLandingPageMutation.isPending}
                className="theme-border hover:bg-theme-primary-light"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="bg-theme-gradient hover:scale-105 hover:theme-shadow text-white transition-all duration-200"
                disabled={createLandingPageMutation.isPending}
              >
                {createLandingPageMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin ml-2"></i>
                    جارٍ الإنشاء...
                  </>
                ) : (
                  <>
                    <i className="fas fa-rocket ml-2"></i>
                    إنشاء صفحة الهبوط
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      
      {/* Template Preview Modal */}
      <TemplatePreviewModal
        templateId={previewTemplate}
        open={showPreview}
        onOpenChange={setShowPreview}
      />
    </Dialog>
  );
}