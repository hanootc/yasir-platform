import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSession } from "@/hooks/use-platform-session";
import PlatformSidebar from "@/components/PlatformSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import ColorThemeSelector from "@/components/ColorThemeSelector";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  platformId: string;
  isActive: boolean;
  createdAt: string;
}

export default function PlatformCategories() {
  const { session, isLoading: sessionLoading } = usePlatformSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
  });

  // Helper function to get the correct FontAwesome icon class
  const getIconClass = (icon: string) => {
    const iconMap: { [key: string]: string } = {
      'trees': 'tree',
      'heart-pulse': 'heartbeat',
      'sparkles': 'star',
      'wrench': 'tools',
      'shirt': 'tshirt',
      'baby': 'baby-carriage',
      'mobile': 'mobile-alt',
      'laptop': 'laptop',
      'car': 'car',
      'music': 'music',
      'gamepad': 'gamepad2',
    };
    
    return iconMap[icon] || icon;
  };

  // Fetch categories
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: [`/api/platforms/${session?.platformId}/categories`],
    enabled: !!session?.platformId,
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await fetch(`/api/platforms/${session?.platformId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) throw new Error("فشل في إنشاء التصنيف");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${session?.platformId}/categories`] });
      toast({ title: "تم إنشاء التصنيف بنجاح" });
      setShowCreateModal(false);
      setFormData({ name: "", description: "", icon: "" });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء التصنيف", variant: "destructive" });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/platforms/${session?.platformId}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("فشل في تحديث التصنيف");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${session?.platformId}/categories`] });
      toast({ title: "تم تحديث التصنيف بنجاح" });
      setEditingCategory(null);
      setFormData({ name: "", description: "", icon: "" });
    },
    onError: () => {
      toast({ title: "فشل في تحديث التصنيف", variant: "destructive" });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/platforms/${session?.platformId}/categories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("فشل في حذف التصنيف");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${session?.platformId}/categories`] });
      toast({ title: "تم حذف التصنيف بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في حذف التصنيف", variant: "destructive" });
    },
  });

  // Filter categories
  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
    });
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "", icon: "" });
  };

  // Icon options
  const iconOptions = [
    "tags",
    "box",
    "home",
    "utensils",
    "sparkles",
    "wrench",
    "shirt",
    "trees",
    "baby",
    "heart-pulse",
    "laptop",
    "mobile",
    "car",
    "book",
    "gamepad",
    "music",
  ];

  if (sessionLoading) {
    return <div className="p-8 text-center">جارٍ التحميل...</div>;
  }

  if (!session) {
    return <div className="p-8 text-center">خطأ في تحميل بيانات المنصة</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PlatformSidebar 
        session={session} 
        currentPath="/platform-categories" 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>
        {/* Page Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-4">
          <div className="text-right flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ColorThemeSelector />
              <ThemeToggle />
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="md:hidden bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <i className="fas fa-bars h-4 w-4"></i>
              </Button>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">إدارة التصنيفات</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {filteredCategories ? `${filteredCategories.length} تصنيف` : "جارٍ التحميل..."}
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          {/* Header and Actions */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
            <div className="flex-1 w-full lg:w-auto order-2 lg:order-1">
              <Input
                placeholder="البحث في التصنيفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md theme-border"
              />
            </div>
            
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300 order-1 lg:order-2"
                >
                  <i className="fas fa-plus mr-2"></i>
                  إضافة تصنيف جديد
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-right">
                    {editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">اسم التصنيف</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="أدخل اسم التصنيف"
                      required
                      className="theme-border"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">الوصف</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف التصنيف (اختياري)"
                      className="theme-border"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">الأيقونة</label>
                    <div className="grid grid-cols-6 gap-2 mb-2">
                      {iconOptions.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`p-2 rounded border transition-colors ${
                            formData.icon === icon
                              ? "bg-theme-gradient text-white border-theme-primary"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <i className={`fas fa-${getIconClass(icon)}`}></i>
                        </button>
                      ))}
                    </div>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="أو أدخل كلاس الأيقونة يدوياً"
                      className="theme-border"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300 flex-1"
                    >
                      {editingCategory ? "تحديث" : "إنشاء"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseModal}
                      className="theme-border flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="theme-border bg-theme-primary-lighter">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-8 w-8 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <Card key={category.id} className="theme-border bg-theme-primary-lighter hover:theme-shadow transition-all duration-300">
                  <CardContent className="p-6 text-right" dir="rtl">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-theme-gradient rounded-lg flex items-center justify-center">
                            <i className={`fas fa-${category.icon ? getIconClass(category.icon) : 'tags'} text-white`}></i>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {category.name}
                            </h3>
                            <Badge 
                              variant={category.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {category.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {category.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          تم الإنشاء: {new Date(category.createdAt).toLocaleDateString('ar')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="theme-border hover:bg-theme-primary-light hover:text-theme-primary flex-1"
                      >
                        <i className="fas fa-edit ml-1"></i>
                        تعديل
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="theme-border text-theme-primary hover:bg-theme-primary hover:text-white border-theme-primary transition-all duration-200 flex-1"
                          >
                            <i className="fas fa-trash ml-1"></i>
                            حذف
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف التصنيف "{category.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="theme-border bg-theme-primary-lighter">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-theme-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-tags text-2xl text-theme-primary"></i>
                </div>
                <h3 className="text-lg font-medium text-theme-primary mb-2">لا توجد تصنيفات</h3>
                <p className="text-gray-500 mb-4">لم يتم العثور على تصنيفات تتطابق مع البحث الحالي</p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-theme-gradient text-white hover:shadow-lg transition-all duration-300"
                >
                  إضافة أول تصنيف
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}