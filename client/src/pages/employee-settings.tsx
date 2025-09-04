import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useSessionInfo } from "@/hooks/useSessionInfo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User, Lock, Save, Eye, EyeOff, Menu, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import PlatformSidebar from "@/components/PlatformSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";
import { useLocation } from "wouter";

// Schema for personal information
const personalInfoSchema = z.object({
  fullName: z.string().min(2, "الاسم يجب أن يكون أكثر من حرفين"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(10, "رقم الهاتف يجب أن يكون أكثر من 10 أرقام"),
});

// Schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون أكثر من 6 أحرف"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
  path: ["confirmPassword"],
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

export default function EmployeeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isEmployee, employeeSession } = useSessionInfo();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");

  // Get platform session
  const { data: platformSession } = useQuery<PlatformSession>({
    queryKey: ["/api/platform-session"],
  });

  // Get current employee data
  const { data: employeeData, isLoading } = useQuery({
    queryKey: ["/api/employee/profile"],
    queryFn: async () => {
      const token = localStorage.getItem('employee_session_token');
      if (!token) throw new Error('No session token');
      
      const response = await fetch('/api/employee/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: isEmployee && !!employeeSession?.employee?.id,
  });

  // Personal info form
  const personalForm = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
    },
  });

  // Password form  
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update personal info when data loads
  React.useEffect(() => {
    if (employeeData?.employee) {
      const employee = employeeData.employee;
      personalForm.reset({
        fullName: employee.fullName || "",
        email: employee.email || "",
        phone: employee.phone || "",
      });
      setProfileImageUrl(employee.profileImageUrl || "");
    }
  }, [employeeData, personalForm]);

  // Update personal info mutation
  const updatePersonalInfoMutation = useMutation({
    mutationFn: async (data: PersonalInfoFormData) => {
      const token = localStorage.getItem('employee_session_token');
      const response = await fetch('/api/employee/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث المعلومات الشخصية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المعلومات الشخصية",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const token = localStorage.getItem('employee_session_token');
      const response = await fetch('/api/employee/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!response.ok) throw new Error('Failed to change password');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تغيير كلمة المرور",
        variant: "destructive",
      });
    },
  });

  // Upload profile image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('فشل في رفع الصورة');
      }

      const uploadResult = await uploadResponse.json();
      
      // Update employee profile with new image URL
      const token = localStorage.getItem('employee_session_token');
      const profileResponse = await fetch('/api/employee/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profileImageUrl: uploadResult.uploadURL
        }),
      });
      if (!profileResponse.ok) throw new Error('Failed to update profile image');
      return profileResponse.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث الصورة الشخصية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الصورة الشخصية",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
          variant: "destructive",
        });
        return;
      }
      uploadImageMutation.mutate(file);
    }
  };

  const onPersonalInfoSubmit = (data: PersonalInfoFormData) => {
    updatePersonalInfoMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (!isEmployee) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">غير مسموح لك بالوصول لهذه الصفحة</p>
      </div>
    );
  }

  if (isLoading || !platformSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-primary-lighter via-white to-theme-primary-lighter dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {platformSession && (
        <PlatformSidebar 
          session={platformSession} 
          currentPath={location}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
      
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'mr-16' : 'mr-64'
      } ${isMobile ? 'mr-0' : ''}`}>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <ColorThemeSelector />
                <ThemeToggle />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">إعدادات الموظف</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{platformSession.platformName}</p>
                </div>
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2"
                  >
                    {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Image Section */}
          <Card className="theme-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-theme-primary">
                <User className="w-5 h-5" />
                الصورة الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImageUrl} alt="الصورة الشخصية" />
                  <AvatarFallback className="bg-theme-primary/10 text-theme-primary text-lg">
                    {employeeData?.employee?.fullName?.charAt(0) || "م"}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  <label htmlFor="profile-image-upload">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="theme-border hover:bg-theme-primary/10"
                      disabled={uploadImageMutation.isPending}
                      asChild
                    >
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 ml-2" />
                        {uploadImageMutation.isPending ? "جاري الرفع..." : "تحديث الصورة"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Section */}
          <Card className="theme-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-theme-primary">
                <User className="w-5 h-5" />
                المعلومات الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...personalForm}>
                <form onSubmit={personalForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-4">
                  <FormField
                    control={personalForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                          <Input {...field} className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف</FormLabel>
                        <FormControl>
                          <Input {...field} className="theme-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-theme-gradient text-white hover:opacity-90"
                    disabled={updatePersonalInfoMutation.isPending}
                  >
                    <Save className="w-4 h-4 ml-2" />
                    {updatePersonalInfoMutation.isPending ? "جاري الحفظ..." : "حفظ المعلومات"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Password Change Section */}
          <Card className="theme-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-theme-primary">
                <Lock className="w-5 h-5" />
                تغيير كلمة المرور (اختياري)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الحالية</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type={showCurrentPassword ? "text" : "password"} 
                                className="theme-input pl-10" 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور الجديدة</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type={showNewPassword ? "text" : "password"} 
                                className="theme-input pl-10" 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تأكيد كلمة المرور</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type={showConfirmPassword ? "text" : "password"} 
                                className="theme-input pl-10" 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute left-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="bg-theme-gradient text-white hover:opacity-90"
                    disabled={changePasswordMutation.isPending}
                  >
                    <Lock className="w-4 h-4 ml-2" />
                    {changePasswordMutation.isPending ? "جاري التحديث..." : "تغيير كلمة المرور"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}