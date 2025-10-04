import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store, Eye, EyeOff, Lock } from "lucide-react";

const loginSchema = z.object({
  subdomain: z.string().min(3, "النطاق الفرعي مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function PlatformAdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Don't check for existing session on login page - let user login fresh

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      subdomain: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch('/api/platforms/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.message || 'فشل في تسجيل الدخول');
        (error as any).status = errorData.status;
        (error as any).platformData = errorData.platformData;
        throw error;
      }
      
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك في لوحة إدارة ${data.platformName}`,
      });
      
      // حفظ معلومات الجلسة وتوجيه للوحة التحكم
      localStorage.setItem('platformSession', JSON.stringify({
        platformId: data.platformId,
        platformName: data.platformName,
        subdomain: data.subdomain,
        businessType: data.businessType,
        ownerName: data.ownerName,
        phoneNumber: data.phoneNumber,
        contactPhone: data.contactPhone,
        whatsappNumber: data.whatsappNumber,
        userType: 'PLATFORM_OWNER',
        logoUrl: data.logoUrl || '/bastia-logo.png'
      }));
      
      // توجيه للوحة التحكم - طباعة البيانات للتشخيص
      console.log('Login response data:', data);
      
      // توجيه للوحة إدارة المنصة
      setTimeout(() => {
        window.location.href = `/platform/${data.subdomain}/dashboard`;
      }, 1000);
    },
    onError: (error: any) => {
      // التحقق من حالة المنصة غير المفعلة
      if (error.status === "pending_verification") {
        // حفظ بيانات المنصة وتوجيه لصفحة انتظار التفعيل
        if (error.platformData) {
          localStorage.setItem('pendingPlatformData', JSON.stringify(error.platformData));
        }
        
        toast({
          title: "المنصة في انتظار التفعيل",
          description: "يرجى التواصل مع الدعم لتفعيل المنصة",
          variant: "destructive",
        });
        
        setTimeout(() => {
          window.location.href = '/platform-pending-activation';
        }, 2000);
        return;
      }
      
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "تحقق من النطاق الفرعي وكلمة المرور",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-primary-lighter to-theme-secondary-lighter flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl theme-border bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-theme-primary flex items-center justify-center gap-2">
            <Store className="w-6 h-6" />
            دخول المنصة
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            ادخل إلى لوحة إدارة منصتك التجارية
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* النطاق الفرعي */}
              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      النطاق الفرعي
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input 
                          placeholder="ahmed-shop" 
                          {...field} 
                          className="rounded-l-none placeholder:text-gray-400 bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                        />
                        <span className="bg-theme-primary-lighter dark:bg-gray-700 border border-l-0 rounded-l-md px-3 py-2 text-sm text-theme-primary dark:text-gray-300">
                          sanadi.pro/
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* كلمة المرور */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      كلمة المرور
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-300" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="أدخل كلمة المرور"
                          className="pr-10 pl-10 placeholder:text-gray-400 bg-transparent dark:bg-transparent border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-3 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* زر الدخول */}
              <Button 
                type="submit" 
                className="w-full h-12 text-lg bg-theme-gradient text-white font-medium hover:shadow-lg transition-all duration-300"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <>
                    <Store className="w-5 h-5 ml-2" />
                    دخول لوحة الإدارة
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* رابط التسجيل */}
          <div className="text-center mt-6 pt-6 border-t">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              ليس لديك منصة؟{' '}
              <a href="/register-platform" className="text-theme-primary hover:opacity-80 font-medium" aria-label="سجل منصة جديدة">
                سجل منصة جديدة
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}