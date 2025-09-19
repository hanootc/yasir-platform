import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight, User, Phone, MapPin, Home, MessageSquare, Package, Shield } from "lucide-react";
import { iraqGovernorates } from "@/lib/iraqGovernorates";

// Form schema for preview
const previewFormSchema = z.object({
  customerName: z.string().min(1, "الاسم مطلوب"),
  customerPhone: z.string().min(1, "رقم الهاتف مطلوب"),
  governorate: z.string().min(1, "المحافظة مطلوبة"),
  address: z.string().min(1, "العنوان مطلوب"),
  offer: z.string().min(1, "يرجى اختيار العرض"),
  notes: z.string().optional(),
});

// Mock data for preview
const mockProduct = {
  name: "منتج رائع ومميز",
  description: "وصف تفصيلي للمنتج يوضح جميع المميزات والفوائد التي يحصل عليها العميل عند شراء هذا المنتج المتميز",
  price: "25000",
  images: ["/placeholder-product.jpg"],
  priceOffers: [
    { label: "قطعة واحدة", price: "25000", quantity: 1, isDefault: true },
    { label: "قطعتان", price: "45000", quantity: 2, isDefault: false },
    { label: "ثلاث قطع", price: "65000", quantity: 3, isDefault: false }
  ]
};

const mockLandingPage = {
  title: "صفحة هبوط مميزة",
  customUrl: "sample-page"
};

interface LandingPageTemplateRendererProps {
  templateId: string;
  isPreview?: boolean;
}

export function LandingPageTemplateRenderer({ templateId, isPreview = true }: LandingPageTemplateRendererProps) {
  const product = mockProduct;
  const landingPage = mockLandingPage;
  
  // Form setup
  const form = useForm<z.infer<typeof previewFormSchema>>({
    resolver: zodResolver(previewFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      governorate: "",
      address: "",
      notes: "",
    },
  });

  // Mock submit handler
  const onSubmit = (data: z.infer<typeof previewFormSchema>) => {
    if (isPreview) return;
    console.log("Preview form data:", data);
  };
  
  // تحديد العرض المختار (الافتراضي)
  const defaultOffer = product.priceOffers.find(offer => offer.isDefault) || product.priceOffers[0];
  
  // دالة لعرض القوالب المختلفة حسب templateId
  const renderTemplate = () => {
    switch (templateId) {
      case "modern_minimal":
        return renderModernMinimal();
      case "bold_hero":
        return renderBoldHero();
      case "product_showcase":
        return renderProductShowcase();
      case "testimonial_focus":
        return renderTestimonialFocus();
      case "feature_highlight":
        return renderFeatureHighlight();
      case "countdown_urgency":
        return renderCountdownUrgency();
      case "colorful_vibrant":
        return renderColorfulGradient();
      case "tiktok_style":
        return renderModernMinimal();
      case "story_telling":
        return renderStoryTelling();
      case "colorful_gradient":
        return renderColorfulGradient();
      default:
        return renderModernMinimal();
    }
  };

  // البسيط - modern_minimal
  const renderModernMinimal = () => {

    return (
      <div className="bg-gray-50 min-h-screen" dir="rtl">
        {/* Product Images Section */}
        <div className="relative">
          <div className="aspect-video bg-gray-200 rounded-lg mx-4 mb-4 overflow-hidden">
            <img 
              src={product.images[0] || "/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Product Gallery Dots */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((dot, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white mx-4 rounded-lg shadow-sm border p-6 mb-4">
          <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          
          {/* Price */}
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-blue-600">
              {formatCurrency(parseFloat(defaultOffer.price))}
            </span>
            <span className="text-sm text-gray-500 block">دينار عراقي</span>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center p-2 bg-blue-50 rounded">
              <Shield className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs text-center">ضمان شامل</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-blue-50 rounded">
              <Package className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs text-center">توصيل سريع</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-blue-50 rounded">
              <MessageSquare className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs text-center">دعم فني</span>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="bg-white mx-4 rounded-lg shadow-sm border p-6 mb-4">
          <h3 className="text-xl font-bold mb-4">إرسال طلب</h3>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              {/* الاسم */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input 
                          placeholder="ادخل اسمك الكامل" 
                          className="pr-10 placeholder:text-gray-400"
                          disabled={isPreview}
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* رقم الهاتف */}
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input 
                          placeholder="07XX XXX XXXX" 
                          className="pr-10 placeholder:text-gray-400"
                          disabled={isPreview}
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* المحافظة */}
              <FormField
                control={form.control}
                name="governorate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المحافظة *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isPreview}>
                        <SelectTrigger>
                          <div className="flex items-center">
                            <MapPin className="ml-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="اختر المحافظة" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {iraqGovernorates.map((gov) => (
                            <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* العنوان */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Home className="absolute right-3 top-3 text-gray-400 h-4 w-4" />
                        <Textarea 
                          placeholder="ادخل عنوانك بالتفصيل"
                          className="pr-10 placeholder:text-gray-400 h-20 resize-none"
                          disabled={isPreview}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* العرض */}
              <FormField
                control={form.control}
                name="offer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع العرض *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isPreview}>
                        <SelectTrigger>
                          <div className="flex items-center">
                            <Package className="ml-2 h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="اختر نوع العرض" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="الأولى">الأولى</SelectItem>
                          <SelectItem value="المخفض">المخفض</SelectItem>
                          <SelectItem value="أكثر طلباً">أكثر طلباً</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ملاحظات */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات إضافية</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MessageSquare className="absolute right-3 top-3 text-gray-400 h-4 w-4" />
                        <Textarea 
                          placeholder="أي ملاحظات أو طلبات خاصة"
                          className="pr-10 placeholder:text-gray-400 h-16 resize-none"
                          disabled={isPreview}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* زر الإرسال */}
              <Button 
                type="submit"
                className={`w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 text-lg font-bold ${
                  isPreview ? 'cursor-not-allowed opacity-75' : ''
                }`}
                disabled={isPreview}
              >
                <Shield className="w-5 h-5 ml-2" />
                إرسال الطلب
              </Button>
            </form>
          </Form>
        </div>

        {/* Trust & Safety */}
        <div className="bg-white mx-4 rounded-lg shadow-sm border p-6 mb-20">
          <div className="text-center">
            <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-bold mb-2">طلبك آمن ومحمي</h3>
            <p className="text-sm text-gray-600">
              نحن نحمي معلوماتك الشخصية ونضمن وصول طلبك بأمان تام
            </p>
          </div>
        </div>
      </div>
    );
  };

  // التجاري - bold_hero
  const renderBoldHero = () => {
    return (
      <div className="bg-gradient-to-br from-theme-50 to-theme-100 min-h-screen text-gray-900" dir="rtl">
        {/* Hero */}
        <div className="p-6 text-center">
          <h1 className="text-3xl font-bold mb-2 text-theme-primary">{product.name}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>
          
          <div className="aspect-video bg-white/80 rounded-lg overflow-hidden mb-4 shadow-lg">
            <img 
              src={product.images[0] || "/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="bg-theme-gradient-strong text-white p-4 rounded-lg mb-6">
            <span className="text-2xl font-bold">
              {formatCurrency(parseFloat(defaultOffer.price))}
            </span>
            <span className="block text-sm">عرض محدود!</span>
          </div>
        </div>

        {/* Order Form */}
        <div className="bg-white/90 backdrop-blur-sm text-gray-900 m-4 rounded-lg p-4 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-theme-primary">احصل عليه الآن</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="الاسم" 
                        disabled={isPreview}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="الهاتف" 
                        disabled={isPreview}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="governorate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isPreview}>
                        <SelectTrigger>
                          <SelectValue placeholder="المحافظة" />
                        </SelectTrigger>
                        <SelectContent>
                          {iraqGovernorates.map((gov) => (
                            <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="العنوان" 
                        disabled={isPreview}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="offer"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isPreview}>
                        <SelectTrigger>
                          <SelectValue placeholder="نوع العرض" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="الأولى">الأولى</SelectItem>
                          <SelectItem value="المخفض">المخفض</SelectItem>
                          <SelectItem value="أكثر طلباً">أكثر طلباً</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3" disabled={isPreview}>
                اطلب الآن - عرض محدود
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  };

  // العارض - product_showcase
  const renderProductShowcase = () => {
    return (
      <div className="bg-gray-50 min-h-screen" dir="rtl">
        {/* Product Gallery */}
        <div className="bg-white p-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img 
              src={product.images[0] || "/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white mx-4 rounded-lg p-4 mb-4 shadow-sm">
          <h1 className="text-xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-purple-600">
              {formatCurrency(parseFloat(defaultOffer.price))}
            </span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((star) => (
                <div key={star} className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="bg-white mx-4 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-bold mb-3">اطلب منتجك</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="الاسم" 
                        disabled={isPreview}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="الهاتف" 
                        disabled={isPreview}
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="governorate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isPreview}>
                        <SelectTrigger>
                          <SelectValue placeholder="المحافظة" />
                        </SelectTrigger>
                        <SelectContent>
                          {iraqGovernorates.map((gov) => (
                            <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="العنوان" 
                        disabled={isPreview}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="offer"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isPreview}>
                        <SelectTrigger>
                          <SelectValue placeholder="نوع العرض" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="الأولى">الأولى</SelectItem>
                          <SelectItem value="المخفض">المخفض</SelectItem>
                          <SelectItem value="أكثر طلباً">أكثر طلباً</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white" disabled={isPreview}>
                أضف إلى السلة
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  };

  // باقي القوالب - نماذج متنوعة
  const renderTestimonialFocus = () => {
    return (
      <div className="bg-gray-50 min-h-screen" dir="rtl">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-amber-600 mb-4">{product.name}</h1>
          
          {/* Customer testimonial section */}
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <div className="text-yellow-500 text-2xl mb-2">★★★★★</div>
            <p className="text-gray-600 mb-2">"منتج ممتاز وجودة عالية"</p>
            <span className="text-sm text-gray-500">- عميل راضي</span>
          </div>
          
          <div className="aspect-square bg-white rounded-lg overflow-hidden mb-4">
            <img 
              src={product.images[0] || "/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-4 rounded-lg">
            <span className="text-2xl font-bold">
              {formatCurrency(parseFloat(defaultOffer.price))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderFeatureHighlight = () => {
    return (
      <div className="bg-gray-50 min-h-screen" dir="rtl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-green-600 mb-4 text-center">{product.name}</h1>
          
          <div className="aspect-video bg-white rounded-lg overflow-hidden mb-4">
            <img 
              src={product.images[0] || "/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Feature list */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="font-bold text-green-600 mb-3">المميزات الرئيسية:</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                <span className="text-sm">جودة عالية</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                <span className="text-sm">سعر مناسب</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(parseFloat(defaultOffer.price))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderCountdownUrgency = () => {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 min-h-screen text-gray-900" dir="rtl">
        <div className="p-6 text-center">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-2 rounded-lg mb-4">
            <span className="text-sm font-bold">عرض محدود - ينتهي قريباً!</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
          
          <div className="aspect-square bg-white/80 rounded-lg overflow-hidden mb-4 shadow-lg">
            <img 
              src={product.images[0] || "/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Countdown timer mockup */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 shadow-lg">
            <div className="text-red-600 text-sm mb-2">الوقت المتبقي:</div>
            <div className="text-2xl font-bold text-red-700">05:23:42</div>
          </div>
          
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-lg">
            <span className="text-xl font-bold">
              {formatCurrency(parseFloat(defaultOffer.price))}
            </span>
            <span className="block text-sm">بدلاً من سعر أعلى!</span>
          </div>
        </div>
      </div>
    );
  };

  const renderVideoIntro = () => renderModernMinimal();
  const renderComparisonTable = () => renderModernMinimal();
  const renderBenefitDriven = () => renderModernMinimal();
  const renderStoryTelling = () => renderModernMinimal();
  const renderColorfulGradient = () => renderModernMinimal();

  return renderTemplate();
}