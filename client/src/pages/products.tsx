import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateProductModal from "@/components/modals/create-product-modal";
import EditProductModal from "@/components/modals/edit-product-modal";
import { ProductImageSlider } from "@/components/ui/product-image-slider";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getTemplateDisplayName } from "@/lib/landingPageTemplates";
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


export default function Products() {
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);


  const { data: products, isLoading } = useQuery({
    queryKey: selectedPlatform ? ["/api/products", { platformId: selectedPlatform }] : ["/api/products"],
    queryFn: async () => {
      if (!selectedPlatform) {
        return [];
      }
      
      const url = `/api/products?platformId=${selectedPlatform}`;
      
      console.log("🔍 Fetching products from:", url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!selectedPlatform
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });



  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return products;
    
    if (selectedCategoryFilter === "all") {
      return products;
    }
    
    if (selectedCategoryFilter === "uncategorized") {
      return products.filter((product: any) => !product.categoryId);
    }
    
    return products.filter((product: any) => product.categoryId === selectedCategoryFilter);
  }, [products, selectedCategoryFilter]);

  const { toast } = useToast();

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!selectedPlatform) {
        throw new Error("No platform selected");
      }
      return apiRequest(`/api/platforms/${selectedPlatform}/products/${productId}`, "DELETE");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${selectedPlatform}/products`] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/top-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activities"] });
      
      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج بنجاح",
      });
      
      setShowDeleteDialog(false);
      setProductToDelete(null);
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
      
      // Check if it's a product with orders error
      if (error.message.includes("Cannot delete product with existing orders")) {
        try {
          const errorData = JSON.parse(error.message.split(': ')[1]);
          toast({
            title: "لا يمكن حذف المنتج",
            description: errorData.details || "هذا المنتج مرتبط بطلبات موجودة ولا يمكن حذفه",
            variant: "destructive",
          });
        } catch {
          toast({
            title: "لا يمكن حذف المنتج",
            description: "هذا المنتج مرتبط بطلبات موجودة ولا يمكن حذفه لحماية سجلات المبيعات",
            variant: "destructive",
          });
        }
        return;
      }
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المنتج",
        variant: "destructive",
      });
    },
  });

  const handleCreateProduct = () => {
    setShowCreateProduct(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowEditProduct(true);
  };

  const handleCloseEditProduct = () => {
    setShowEditProduct(false);
    setSelectedProduct(null);
  };

  const handleViewProduct = (product: any) => {
    // فتح نافذة جديدة لمعاينة المنتج أو إرسال المستخدم لصفحة المعاينة
    const viewUrl = `/product-preview/${product.id}`;
    window.open(viewUrl, '_blank');
  };



  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  // Get platform session from API  
  return (
    <div className="flex h-screen bg-theme-primary-lighter dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="إدارة المنتجات"
          subtitle="إدارة وتنظيم منتجات المتجر"
        />
        
        <main className="flex-1 overflow-y-auto p-6 bg-theme-primary-lighter dark:bg-gray-900">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <Button onClick={handleCreateProduct} className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300">
                <i className="fas fa-plus mr-2"></i>
                منتج جديد
              </Button>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-theme-primary">المنتجات</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {filteredProducts ? `${(filteredProducts as any[])?.length} منتج` : "جارٍ التحميل..."}
                </p>
              </div>
            </div>
            
            {/* Platform and Category Filters */}
            <div className="flex items-center justify-between mt-4 gap-4">
              <Badge variant="secondary" className="bg-theme-primary-light text-theme-primary">
                {filteredProducts ? filteredProducts.length : 0} منتج
              </Badge>
              
              <div className="flex items-center gap-6">
                {/* Platform Filter */}
                <div className="flex items-center gap-3">
                  <PlatformSelector
                    value={selectedPlatform || undefined}
                    onValueChange={setSelectedPlatform}
                    placeholder="اختر منصة..."
                  />
                  <label className="text-sm font-medium text-theme-primary whitespace-nowrap">
                    فلترة حسب المنصة:
                  </label>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-3">
                  <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                    <SelectTrigger className="w-[200px] theme-border">
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent className="bg-theme-primary-lighter theme-border">
                      <SelectItem value="all" className="hover:bg-theme-primary-light">جميع التصنيفات</SelectItem>
                      <SelectItem value="uncategorized" className="hover:bg-theme-primary-light">غير مصنف</SelectItem>
                      {categories && Array.isArray(categories) ? (categories as any[])
                        .sort((a, b) => {
                          if (a.name === 'منزلية') return -1;
                          if (b.name === 'منزلية') return 1;
                          return a.name.localeCompare(b.name, 'ar');
                        })
                        .map((category: any) => (
                        <SelectItem key={category.id} value={category.id} className="hover:bg-theme-primary-light">
                          {category.name}
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                  <label className="text-sm font-medium text-theme-primary whitespace-nowrap">
                    فلترة حسب التصنيف:
                  </label>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !selectedPlatform ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <i className="fas fa-box text-6xl mb-4"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">اختر منصة لعرض المنتجات</h3>
              <p className="text-gray-500">يرجى اختيار منصة من القائمة أعلاه لعرض وإدارة المنتجات</p>
            </div>
          ) : filteredProducts && Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
            <div className="space-y-3">
              {(filteredProducts as any[]).map((product: any) => (
                <div key={product.id} className="bg-theme-primary-lighter rounded-lg shadow-sm theme-border p-4 hover:theme-shadow transition-all duration-300">
                  <div className="flex items-center gap-4 w-full">
                    {/* Product Image - Small */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        <img 
                          src={product.imageUrls[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <i className="fas fa-image text-xl"></i>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info - Flexible */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-theme-primary truncate">{product.name}</h3>
                        <Badge variant={product.isActive ? "default" : "secondary"} className="text-xs">
                          {product.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      {product.description && (
                        <p className="text-theme-secondary text-sm truncate">{product.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {/* Category Display */}
                        {product.categoryId && categories && (
                          <>
                            <i className="fas fa-tag text-xs text-theme-accent"></i>
                            <span className="text-xs text-theme-secondary">
                              {(categories as any[])?.find((cat: any) => cat.id === product.categoryId)?.name || 'غير محدد'}
                            </span>
                          </>
                        )}
                        {/* Landing Template */}
                        {product.defaultLandingTemplate && (
                          <>
                            <i className="fas fa-rocket text-xs text-theme-accent ml-2"></i>
                            <span className="text-xs text-theme-secondary">
                              نموذج: {getTemplateDisplayName(product.defaultLandingTemplate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Price - Fixed width */}
                    <div className="text-left min-w-[140px]">
                      <div className="font-semibold text-theme-primary text-lg">
                        {formatCurrency(product.price)}
                      </div>
                      {product.stock !== null && (
                        <div className="text-sm text-theme-secondary">
                          المخزون: <span className={`font-medium ${
                            (product.stock || 0) > 10 ? 'text-green-600' : 
                            (product.stock || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {product.stock || 0}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions - Fixed width */}
                    <div className="flex gap-2 min-w-[200px]">
                      <Button 
                        size="sm" 
                        className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300"
                        onClick={() => handleEditProduct(product)}
                      >
                        <i className="fas fa-edit ml-1"></i>
                        تعديل
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-theme-border text-theme-primary hover:bg-theme-gradient hover:text-white hover:scale-[1.02] transform transition-all duration-300"
                        onClick={() => handleViewProduct(product)}
                      >
                        <i className="fas fa-eye ml-1"></i>
                        عرض
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteProduct(product)}
                        disabled={deleteProductMutation.isPending}
                      >
                        <i className="fas fa-trash ml-1"></i>
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-box text-2xl text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedCategoryFilter === "all" 
                    ? "لا توجد منتجات" 
                    : selectedCategoryFilter === "uncategorized" 
                      ? "لا توجد منتجات غير مصنفة"
                      : "لا توجد منتجات في هذا التصنيف"}
                </h3>
                {selectedCategoryFilter === "all" ? (
                  <>
                    <p className="text-gray-500 mb-6">ابدأ بإضافة منتجك الأول</p>
                    <Button onClick={handleCreateProduct} className="bg-primary-600 hover:bg-primary-700">
                      <i className="fas fa-plus ml-2"></i>
                      إضافة منتج
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-6">جرب تصنيف آخر أو اعرض جميع المنتجات</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedCategoryFilter("all")}
                    >
                      عرض جميع المنتجات
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </main>


      </div>

      <CreateProductModal 
        isOpen={showCreateProduct} 
        onClose={() => setShowCreateProduct(false)}
        platformId={selectedPlatform || undefined}
      />
      
      <EditProductModal
        isOpen={showEditProduct}
        onClose={handleCloseEditProduct}
        product={selectedProduct}
        platformId={selectedPlatform || ''}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent aria-describedby="delete-product-description">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المنتج</AlertDialogTitle>
            <AlertDialogDescription id="delete-product-description">
              هل أنت متأكد من حذف المنتج "{productToDelete?.name}"؟
              <br />
              سيتم حذف جميع البيانات والصور المرتبطة بهذا المنتج نهائياً ولا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
