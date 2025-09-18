import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { sortCategories } from "@/lib/categories";
import { IconSelector } from "./icon-selector";
import { Edit, Trash2, X } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
}

interface CategoriesManagerProps {
  platformId?: string;
}

export function CategoriesManager({ platformId }: CategoriesManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    isActive: true
  });

  const { toast } = useToast();

  const { data: categories, isLoading } = useQuery({
    queryKey: platformId ? [`/api/platforms/${platformId}/categories`] : ["/api/categories"],
    queryFn: async () => {
      if (!platformId) {
        return [];
      }
      const url = `/api/platforms/${platformId}/categories`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!platformId,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!platformId) {
        throw new Error("No platform selected");
      }
      // Use admin API endpoint for category creation
      return apiRequest(`/api/categories`, "POST", { ...data, platformId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/categories`] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", { platformId }] });
      toast({
        title: "تم إنشاء التصنيف",
        description: "تم إنشاء التصنيف بنجاح",
      });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      handleMutationError(error);
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!platformId) {
        throw new Error("No platform selected");
      }
      // Use admin API endpoint for category updates
      return apiRequest(`/api/categories/${id}`, "PUT", { ...data, platformId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/categories`] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", { platformId }] });
      toast({
        title: "تم تحديث التصنيف",
        description: "تم تحديث التصنيف بنجاح",
      });
      setShowEditDialog(false);
      setSelectedCategory(null);
      resetForm();
    },
    onError: (error) => {
      handleMutationError(error);
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!platformId) {
        throw new Error("No platform selected");
      }
      // Use admin API endpoint for category deletion
      return apiRequest(`/api/categories/${categoryId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/categories`] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", { platformId }] });
      toast({
        title: "تم حذف التصنيف",
        description: "تم حذف التصنيف بنجاح",
      });
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
    },
    onError: (error) => {
      handleMutationError(error);
    },
  });

  const handleMutationError = (error: any) => {
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
      description: "حدث خطأ أثناء العملية",
      variant: "destructive",
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      isActive: true
    });
  };

  const handleCreateCategory = () => {
    setShowCreateDialog(true);
    resetForm();
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      isActive: category.isActive
    });
    setShowEditDialog(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم التصنيف مطلوب",
        variant: "destructive",
      });
      return;
    }
    createCategoryMutation.mutate(formData);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !selectedCategory) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم التصنيف مطلوب",
        variant: "destructive",
      });
      return;
    }
    updateCategoryMutation.mutate({
      id: selectedCategory.id,
      data: formData
    });
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-40"></div>
                <div className="h-3 bg-gray-200 rounded w-64"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Category Button - Always at the top */}
      <div className="flex justify-start">
        <Button onClick={handleCreateCategory} className="bg-green-600 hover:bg-green-700">
          <i className="fas fa-plus ml-2"></i>
          إضافة تصنيف جديد
        </Button>
      </div>

      {/* Categories List */}
      {categories && Array.isArray(categories) && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortCategories(categories).map((category: Category) => (
            <div key={category.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow bg-white">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {category.icon && (() => {
                      const IconComponent = (LucideIcons as any)[category.icon.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join('')];
                      return IconComponent ? <IconComponent className="w-4 h-4 text-primary-600" /> : <LucideIcons.Tag className="w-4 h-4 text-primary-600" />;
                    })()}
                    <h4 className="font-medium text-gray-900 text-sm truncate">{category.name}</h4>
                    <Badge 
                      variant={category.isActive ? "default" : "secondary"}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {category.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                  {category.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(category.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditCategory(category)}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCategory(category)}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <i className="fas fa-tags text-4xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد تصنيفات</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة تصنيف لتنظيم منتجاتك</p>
        </div>
      )}

      {/* Create Category Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md bg-theme-gradient text-white" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right text-white font-bold">إضافة تصنيف جديد</DialogTitle>
            <DialogDescription className="text-right text-gray-100">
              أضف تصنيف جديد لتنظيم منتجاتك
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">اسم التصنيف *</label>
              <Input
                placeholder="مثال: إلكترونيات"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الوصف</label>
              <Textarea
                placeholder="وصف مختصر للتصنيف (اختياري)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الأيقونة</label>
              <div className="mt-1">
                <IconSelector 
                  value={formData.icon}
                  onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">تفعيل التصنيف</label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={createCategoryMutation.isPending}
                className="bg-white text-theme-primary hover:bg-gray-100 font-semibold"
              >
                {createCategoryMutation.isPending ? "جارٍ الحفظ..." : "حفظ التصنيف"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md bg-theme-gradient text-white" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right text-white font-bold">تعديل التصنيف</DialogTitle>
            <DialogDescription className="text-right text-gray-100">
              تعديل بيانات التصنيف "{selectedCategory?.name}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">اسم التصنيف *</label>
              <Input
                placeholder="مثال: إلكترونيات"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الوصف</label>
              <Textarea
                placeholder="وصف مختصر للتصنيف (اختياري)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">الأيقونة</label>
              <div className="mt-1">
                <IconSelector 
                  value={formData.icon}
                  onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">تفعيل التصنيف</label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={updateCategoryMutation.isPending}
                className="bg-white text-theme-primary hover:bg-gray-100 font-semibold"
              >
                {updateCategoryMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف التصنيف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف التصنيف "{categoryToDelete?.name}"؟
              <br />
              سيتم حذف التصنيف نهائياً ولا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}