import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getTemplateDisplayName } from "@/lib/landingPageTemplates";
import CreateLandingPageModal from "@/components/modals/create-landing-page-modal";
import EditLandingPageModal from "@/components/modals/edit-landing-page-modal";
import { PlatformSelector } from "@/components/PlatformSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LandingPages() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pageToEdit, setPageToEdit] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const { data: landingPages, isLoading } = useQuery({
    queryKey: selectedPlatform ? ["/api/landing-pages", { platformId: selectedPlatform }] : ["/api/landing-pages"],
    queryFn: async () => {
      const url = selectedPlatform 
        ? `/api/landing-pages?platformId=${selectedPlatform}`
        : '/api/landing-pages';
      
      console.log("🔍 Fetching landing pages from:", url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    }
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: platforms } = useQuery({
    queryKey: ["/api/platforms-list"]
  });

  const getPlatformName = (platformId: string | null) => {
    if (!platformId) return 'جميع المنصات';
    const platform = (platforms as any[])?.find(p => p.id === platformId);
    return platform?.platformName || platform?.subdomain || 'منصة غير محددة';
  };



  const { toast } = useToast();

  const deleteLandingPageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      return apiRequest(`/api/landing-pages/${pageId}`, { method: "DELETE" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/landing-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activities"] });
      
      toast({
        title: "تم حذف صفحة الهبوط",
        description: "تم حذف صفحة الهبوط بنجاح",
      });
      
      setShowDeleteDialog(false);
      setPageToDelete(null);
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
        description: "حدث خطأ أثناء حذف صفحة الهبوط",
        variant: "destructive",
      });
    },
  });

  const handleCreateLandingPage = () => {
    setShowCreateModal(true);
  };

  const handleEditLandingPage = (page: any) => {
    setPageToEdit(page);
    setShowEditModal(true);
  };

  const handleDeleteLandingPage = (page: any) => {
    setPageToDelete(page);
    setShowDeleteDialog(true);
  };

  const confirmDeleteLandingPage = () => {
    if (pageToDelete) {
      deleteLandingPageMutation.mutate(pageToDelete.id);
    }
  };

  const getProductName = (productId: string) => {
    const product = (products as any[])?.find((p: any) => p.id === productId);
    return product?.name || "غير محدد";
  }

  const getProductImage = (productId: string) => {
    const product = (products as any[])?.find((p: any) => p.id === productId);
    return product?.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : null;
  };

  // بناء رابط معاينة الصفحة
  const buildPreviewUrl = (page: any) => {
    return `/view-landing/${page.customUrl || page.id}`;
  };

  return (
    <div className="flex h-screen bg-theme-primary-lighter">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="صفحات الهبوط"
          subtitle="إنشاء وإدارة صفحات الهبوط للمنتجات"
          onCreateProduct={() => {}}
          onCreateLandingPage={handleCreateLandingPage}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <Button onClick={handleCreateLandingPage} className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300">
                <i className="fas fa-plus mr-2"></i>
                صفحة هبوط جديدة
              </Button>
              <div className="text-right">
                <div className="flex items-center gap-4 mb-2">
                  <PlatformSelector
                    value={selectedPlatform || undefined}
                    onValueChange={setSelectedPlatform}
                    placeholder="اختر منصة..."
                  />
                  <h2 className="text-2xl font-bold text-theme-primary">صفحات الهبوط</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {landingPages ? `${(landingPages as any[])?.length} صفحة` : "جارٍ التحميل..."}
                </p>
              </div>
            </div>
            

          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : landingPages && (landingPages as any[]).length > 0 ? (
            <div className="space-y-4">
              {(landingPages as any[]).map((page) => (
                <Card key={page.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getProductImage(page.productId) ? (
                          <img 
                            src={getProductImage(page.productId)} 
                            alt={getProductName(page.productId)}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <i className="fas fa-box text-xl text-gray-400"></i>
                        )}
                      </div>
                      
                      {/* Page Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{page.title}</h3>
                          <Badge variant={page.isActive ? "default" : "secondary"} className="text-xs">
                            {page.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">المنتج: {getProductName(page.productId)}</p>
                        {selectedPlatform === "all" && (
                          <p className="text-blue-600 text-sm mb-1">
                            <i className="fas fa-store text-xs ml-1"></i>
                            المنصة: {getPlatformName(page.platformId)}
                          </p>
                        )}
                        <p className="text-gray-500 text-sm mb-1">الرابط المخصص: /{page.customUrl || "غير محدد"}</p>
                        {page.template && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-palette text-xs text-gray-400"></i>
                            <span className="text-xs text-gray-500">
                              النموذج: {getTemplateDisplayName(page.template)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Stats */}
                      <div className="text-center min-w-[120px]">
                        <div className="text-2xl font-bold text-primary-600">{page.views || 0}</div>
                        <div className="text-sm text-gray-500">زيارة</div>
                      </div>
                      
                      <div className="text-center min-w-[120px]">
                        <div className="text-2xl font-bold text-purple-600">{page.conversions || 0}</div>
                        <div className="text-sm text-gray-500">تحويل</div>
                      </div>
                      
                      {/* Conversion Rate */}
                      <div className="text-center min-w-[120px]">
                        <div className="text-lg font-semibold text-gray-700">
                          {page.views > 0 ? ((page.conversions / page.views) * 100).toFixed(1) : "0"}%
                        </div>
                        <div className="text-sm text-gray-500">معدل التحويل</div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 min-w-[200px]">
                        <Button 
                          size="sm" 
                          className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300"
                          onClick={() => handleEditLandingPage(page)}
                        >
                          <i className="fas fa-edit ml-1"></i>
                          تعديل
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="theme-border hover:bg-theme-primary-light hover:text-theme-primary"
                          onClick={() => window.open(buildPreviewUrl(page), '_blank')}
                        >
                          <i className="fas fa-eye ml-1"></i>
                          عرض
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteLandingPage(page)}
                          disabled={deleteLandingPageMutation.isPending}
                        >
                          <i className="fas fa-trash ml-1"></i>
                          حذف
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-rocket text-2xl text-primary-600"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedPlatform === "all" 
                    ? "لا توجد صفحات هبوط" 
                    : `لا توجد صفحات هبوط في ${getPlatformName(selectedPlatform)}`
                  }
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedPlatform === "all"
                    ? "ابدأ بإنشاء صفحة هبوط لمنتجاتك باستخدام 10 نماذج مختلفة"
                    : `لا توجد صفحات هبوط في المنصة المختارة. اختر منصة أخرى أو قم بإنشاء صفحة هبوط جديدة.`
                  }
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 mb-8">
                  <div className="flex flex-col items-center p-3 bg-primary-50 rounded-lg">
                    <i className="fas fa-mobile-alt text-primary-600 text-lg mb-1"></i>
                    <span className="text-xs text-primary-700 text-center">عصري مبسط</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
                    <i className="fas fa-flag text-red-600 text-lg mb-1"></i>
                    <span className="text-xs text-red-700 text-center">البطل الجريء</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                    <i className="fas fa-cube text-purple-600 text-lg mb-1"></i>
                    <span className="text-xs text-purple-700 text-center">عرض المنتج</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                    <i className="fas fa-quote-right text-blue-600 text-lg mb-1"></i>
                    <span className="text-xs text-blue-700 text-center">الشهادات</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
                    <i className="fas fa-clock text-purple-600 text-lg mb-1"></i>
                    <span className="text-xs text-purple-700 text-center">العد التنازلي</span>
                  </div>
                </div>
                <Button onClick={handleCreateLandingPage} className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300">
                  <i className="fas fa-plus ml-2"></i>
                  إنشاء صفحة هبوط
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف صفحة الهبوط</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف صفحة الهبوط "{pageToDelete?.title}"؟
              <br />
              سيتم حذف جميع البيانات المرتبطة بهذه الصفحة نهائياً ولا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteLandingPage}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteLandingPageMutation.isPending}
            >
              {deleteLandingPageMutation.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateLandingPageModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      <EditLandingPageModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setPageToEdit(null);
        }}
        landingPage={pageToEdit}
      />
    </div>
  );
}
