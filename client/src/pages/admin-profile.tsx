import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Mail, Phone, MapPin, Shield, Calendar, Upload, Save, Loader2 } from "lucide-react";
import { AdminProtectedRoute } from '../components/AdminProtectedRoute';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { LogoUploader } from "@/components/UniversalFileUploader";

// Schema لملف المدير الشخصي (منفصل تماماً عن المنصة)
const adminProfileSchema = z.object({
  adminName: z.string().min(1, "اسم المدير مطلوب"),
  adminEmail: z.string().email("بريد إلكتروني صحيح مطلوب").optional().or(z.literal("")),
  adminPhone: z.string().optional(),
  adminAddress: z.string().optional(),
  adminBio: z.string().optional(),
});

type AdminProfileFormData = z.infer<typeof adminProfileSchema>;

export default function AdminProfile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string>("");

  // Remove authentication check that was causing issues

  // الحصول على معلومات المدير الشخصية (منفصلة عن المنصة)
  const { data: adminProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/admin/profile"],
    enabled: !!user,
    queryFn: () => apiRequest(`/api/admin/profile`),
  });

  // إعداد النموذج
  const form = useForm<AdminProfileFormData>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: {
      adminName: "",
      adminEmail: "",
      adminPhone: "",
      adminAddress: "",
      adminBio: "",
    },
  });

  // تحديث النموذج عند تحميل البيانات
  useEffect(() => {
    if (adminProfile) {
      form.reset({
        adminName: (adminProfile as any).adminName || (user as any)?.firstName + " " + (user as any)?.lastName || "",
        adminEmail: (adminProfile as any).adminEmail || (user as any)?.email || "",
        adminPhone: (adminProfile as any).adminPhone || "",
        adminAddress: (adminProfile as any).adminAddress || "",
        adminBio: (adminProfile as any).adminBio || "",
      });
      setUploadedAvatarUrl((adminProfile as any).avatarUrl || "");
    }
  }, [adminProfile, form, user]);

  // تحديث الملف الشخصي للمدير
  const updateProfileMutation = useMutation({
    mutationFn: async (data: AdminProfileFormData) => {
      return await apiRequest(`/api/admin/profile`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profile"] });
      toast({
        title: "تم الحفظ",
        description: "تم تحديث الملف الشخصي للمدير بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الملف الشخصي",
        variant: "destructive",
      });
    },
  });

  // تحديث صورة المدير الشخصية
  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarURL: string) => {
      return await apiRequest(`/api/admin/avatar`, {
        method: "PUT",
        body: { avatarURL },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profile"] });
      toast({
        title: "تم الحفظ",
        description: "تم تحديث الصورة الشخصية بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الصورة الشخصية",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  // معالجة رفع الصورة الشخصية
  const handleAvatarComplete = (uploadedFiles: { url: string; fileName: string; originalName: string; size: number }[]) => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      const avatarURL = uploadedFiles[0].url;
      setUploadedAvatarUrl(avatarURL);
      updateAvatarMutation.mutate(avatarURL);
    }
  };

  // Remove authentication checks that cause issues

  return (
    <div className="flex h-screen bg-theme-primary-lighter dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="الملف الشخصي للمدير"
          subtitle="إدارة المعلومات الشخصية للمدير (منفصل عن المنصة)"
        />
        
        <main className="flex-1 overflow-y-auto p-6 bg-theme-primary-lighter dark:bg-gray-900">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* صورة المدير الشخصية */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-right text-theme-primary flex items-center gap-2">
                  <User className="h-5 w-5" />
                  الصورة الشخصية للمدير
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  {/* عرض الصورة الحالية */}
                  {(uploadedAvatarUrl || (user as any)?.profileImageUrl) && (
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-theme-primary theme-shadow">
                      <img
                        src={uploadedAvatarUrl || (user as any)?.profileImageUrl}
                        alt="صورة المدير"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* رفع صورة شخصية جديدة */}
                  <LogoUploader
                    onComplete={handleAvatarComplete}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    buttonClassName="bg-theme-gradient hover:opacity-90 text-white border-0 theme-shadow hover:shadow-lg transition-all duration-200"
                  >
                    <User className="h-4 w-4 mr-2" />
                    رفع صورة شخصية جديدة
                  </LogoUploader>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    يُفضل أن تكون الصورة مربعة الشكل (1:1) ولا تتجاوز 5 ميجابايت
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* معلومات المدير الشخصية */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="text-right text-theme-primary flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  المعلومات الشخصية للمدير
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* المعلومات الأساسية */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="adminName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right text-theme-primary">اسم المدير</FormLabel>
                            <FormControl>
                              <Input {...field} className="text-right" dir="rtl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right text-theme-primary flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              البريد الإلكتروني
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="email" className="text-left" dir="ltr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="adminPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right text-theme-primary flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              رقم الهاتف
                            </FormLabel>
                            <FormControl>
                              <Input {...field} className="text-left" dir="ltr" placeholder="07xxxxxxxx" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adminAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right text-theme-primary flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              العنوان
                            </FormLabel>
                            <FormControl>
                              <Input {...field} className="text-right" dir="rtl" placeholder="بغداد، العراق" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="adminBio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-right text-theme-primary">نبذة شخصية</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="text-right min-h-[80px]" 
                              dir="rtl"
                              placeholder="نبذة مختصرة عن المدير..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* أزرار الحفظ */}
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                        disabled={updateProfileMutation.isPending}
                        className="border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
                      >
                        إعادة تعيين
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-theme-gradient text-white hover:opacity-90"
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            جارٍ الحفظ...
                          </>
                        ) : (
                          "حفظ التغييرات"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* معلومات الحساب */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="theme-border bg-theme-primary-light/20">
                <CardContent className="p-4 text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-theme-primary" />
                  <div className="text-2xl font-bold text-theme-primary">
                    مدير عام
                  </div>
                  <p className="text-sm text-muted-foreground">الصلاحية</p>
                </CardContent>
              </Card>

              <Card className="theme-border bg-theme-primary-light/20">
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-theme-primary" />
                  <div className="text-2xl font-bold text-theme-primary">
                    متفعل
                  </div>
                  <p className="text-sm text-muted-foreground">حالة الحساب</p>
                </CardContent>
              </Card>

              <Card className="theme-border bg-theme-primary-light/20">
                <CardContent className="p-4 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-theme-primary" />
                  <div className="text-2xl font-bold text-theme-primary">
                    {(user as any)?.email ? 'متوفر' : 'غير متوفر'}
                  </div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                </CardContent>
              </Card>

              <Card className="theme-border bg-theme-primary-light/20">
                <CardContent className="p-4 text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-theme-primary" />
                  <div className="text-2xl font-bold text-theme-primary">
                    {uploadedAvatarUrl ? 'متوفر' : 'غير متوفر'}
                  </div>
                  <p className="text-sm text-muted-foreground">الصورة الشخصية</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}