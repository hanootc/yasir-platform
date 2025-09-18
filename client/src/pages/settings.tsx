import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Shield, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";

const settingsFormSchema = z.object({
  tiktokAppId: z.string().optional(),
  tiktokAppSecret: z.string().optional(),
  metaAppId: z.string().optional(),
  metaAppSecret: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

export default function Settings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/system-settings'],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      tiktokAppId: "",
      tiktokAppSecret: "",
      metaAppId: "",
      metaAppSecret: "",
    },
  });

  // تحديث النموذج عند تحميل البيانات
  useEffect(() => {
    if (settings) {
      form.reset({
        tiktokAppId: (settings as any).tiktokAppId || "",
        tiktokAppSecret: (settings as any).tiktokAppSecret || "",
        metaAppId: (settings as any).metaAppId || "",
        metaAppSecret: (settings as any).metaAppSecret || "",
      });
    }
  }, [settings, form]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Settings save error:', response.status, errorText);
        throw new Error(`فشل في حفظ الإعدادات: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات النظام بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    saveSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-theme-primary-lighter">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-theme-primary-lighter">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="الإعدادات"
          subtitle="إعدادات النظام والتطبيقات"
          onCreateProduct={() => {}}
          onCreateLandingPage={() => {}}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* إعدادات منصات الإعلانات */}
            <Card className="theme-border bg-theme-primary-lighter">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-theme-primary">
                  <Shield className="h-5 w-5 text-theme-primary" />
                  إعدادات منصات الإعلانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* TikTok Settings */}
                    <div className="space-y-4 p-4 theme-border rounded-lg bg-theme-primary-light">
                      <h3 className="text-lg font-medium flex items-center gap-2 text-theme-primary">
                        <div className="w-6 h-6 bg-theme-gradient rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                        إعدادات TikTok
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tiktokAppId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>TikTok App ID</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="أدخل TikTok App ID" 
                                  {...field} 
                                  className="text-left theme-border"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="tiktokAppSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>TikTok App Secret</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password"
                                  placeholder="أدخل TikTok App Secret" 
                                  {...field}
                                  className="text-left theme-border"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Meta Settings */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">M</span>
                        </div>
                        إعدادات Meta (Facebook & Instagram)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="metaAppId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta App ID</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="أدخل Meta App ID" 
                                  {...field}
                                  className="text-left"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="metaAppSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meta App Secret</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password"
                                  placeholder="أدخل Meta App Secret" 
                                  {...field}
                                  className="text-left"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={saveSettingsMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saveSettingsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            حفظ الإعدادات
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}
