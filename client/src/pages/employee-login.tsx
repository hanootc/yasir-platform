import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Login form schema
const loginSchema = z.object({
  usernameOrPhone: z.string().min(1, "اسم المستخدم أو رقم الموبايل مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  platformId: z.string().min(1, "معرف المنصة مطلوب")
});

type LoginForm = z.infer<typeof loginSchema>;

export default function EmployeeLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Clear any existing employee session data on component mount
  useEffect(() => {
    localStorage.removeItem("employee_session_token");
    localStorage.removeItem("employeeData");
    
    // Clear React Query cache to ensure fresh data
    queryClient.clear();
  }, []);

  // Get platform session data
  const { data: platformSession } = useQuery({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrPhone: "",
      password: "",
      platformId: platformSession?.platformId || "67ce2605-a0de-4262-bc05-be6131d96c26"
    }
  });

  // Update platformId when session data loads
  useEffect(() => {
    if (platformSession?.platformId) {
      form.setValue("platformId", platformSession.platformId);
    }
  }, [platformSession, form]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError("");

    try {
      // Clear any existing employee session data
      localStorage.removeItem("employee_session_token");
      localStorage.removeItem("employeeData");

      const response = await fetch("/api/employee/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "حدث خطأ في تسجيل الدخول");
        return;
      }

      // Store new session token and employee data
      localStorage.setItem("employee_session_token", result.sessionToken);
      localStorage.setItem("employeeData", JSON.stringify(result.employee));

      // Invalidate all employee session related queries to force refresh
      await queryClient.invalidateQueries({ queryKey: ["/api/employee/session"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/platform-session"] });
      
      // Clear all cache to ensure fresh data
      queryClient.clear();

      // Redirect to employee dashboard
      setLocation("/employee/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      setError("حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-primary-lighter via-white to-theme-primary-light dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md theme-border bg-white dark:bg-gray-800 shadow-2xl">
        <CardHeader className="text-center pb-4">
          {platformSession?.logoUrl ? (
            <div className="mx-auto w-20 h-20 mb-4 relative overflow-hidden rounded-full border-2 border-theme-primary shadow-lg">
              <img 
                src={platformSession.logoUrl} 
                alt={`شعار ${platformSession.platformName}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-theme-gradient rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          )}
          <CardTitle className="text-2xl font-bold text-theme-primary mb-2">
            دخول الموظفين
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            قم بتسجيل الدخول للوصول إلى لوحة تحكم الموظفين
          </p>
          {platformSession && (
            <div className="mt-4 p-3 bg-theme-primary-lighter rounded-lg border theme-border">
              <p className="text-sm font-medium text-theme-primary mb-1">
                منصة: {platformSession.platformName}
              </p>
              {platformSession.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {platformSession.description}
                </p>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Platform ID - Hidden */}
            <input type="hidden" {...form.register("platformId")} />

            {/* Username or Phone */}
            <div className="space-y-2">
              <Label htmlFor="usernameOrPhone" className="text-right block text-sm font-medium">
                اسم المستخدم أو رقم الموبايل
              </Label>
              <Input
                id="usernameOrPhone"
                {...form.register("usernameOrPhone")}
                placeholder="أدخل اسم المستخدم أو رقم الموبايل"
                className="text-right theme-border"
                dir="ltr"
              />
              {form.formState.errors.usernameOrPhone && (
                <p className="text-red-500 text-sm text-right">
                  {form.formState.errors.usernameOrPhone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-right block text-sm font-medium">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  placeholder="أدخل كلمة المرور"
                  className="text-right theme-border pr-10"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-500 text-sm text-right">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-right">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-theme-gradient text-white hover:opacity-90 font-medium py-3"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  جاري تسجيل الدخول...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="absolute bottom-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>هل تحتاج مساعدة؟ تواصل مع الإدارة</p>
      </div>
    </div>
  );
}