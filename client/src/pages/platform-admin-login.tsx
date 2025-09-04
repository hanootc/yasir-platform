import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Lock, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  subdomain: z.string().min(3, "النطاق الفرعي مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function PlatformAdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      subdomain: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return await apiRequest('/api/platforms/login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
        userType: 'PLATFORM_OWNER',
        logoUrl: data.logoUrl || '/bastia-logo.png'
      }));
      
      // توجيه للوحة التحكم
      window.location.href = `/admin/${data.subdomain}`;
    },
    onError: (error: Error) => {
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
    <div className="min-h-screen bg-theme-primary-lighter flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl theme-border bg-theme-primary-lighter">
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
                          className="rounded-l-none placeholder:text-gray-400" 
                        />
                        <span className="bg-gray-100 dark:bg-gray-700 border border-l-0 rounded-l-md px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                          .platform.com
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
                        <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="أدخل كلمة المرور"
                          className="pr-10 pl-10 placeholder:text-gray-400"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
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
              <a href="/register-platform" className="text-theme-primary hover:opacity-80 font-medium">
                سجل منصة جديدة
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}