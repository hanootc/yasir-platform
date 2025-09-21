import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Search } from 'lucide-react';
import { GOOGLE_PRODUCT_CATEGORIES, getAllCategoriesSorted } from '@shared/googleProductCategories';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformId: string;
}

export default function CreateCategoryModal({ isOpen, onClose, platformId }: CreateCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    googleCategory: '',
    isActive: true
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // فلترة الفئات حسب البحث
  const filteredCategories = getAllCategoriesSorted().filter(cat => 
    searchTerm === '' || 
    cat.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.englishCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest(`/api/platforms/${platformId}/categories`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'تم الإنشاء بنجاح',
        description: 'تم إنشاء التصنيف الجديد بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/categories`] });
      onClose();
      setFormData({ name: '', description: '', googleCategory: '', isActive: true });
      setSearchTerm('');
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الإنشاء',
        description: error.message || 'حدث خطأ أثناء إنشاء التصنيف',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'اسم التصنيف مطلوب',
        variant: 'destructive',
      });
      return;
    }
    // Google Category اختياري مؤقتاً حتى يعمل النظام
    // if (!formData.googleCategory) {
    //   toast({
    //     title: 'خطأ في البيانات',
    //     description: 'يرجى اختيار Google Product Category',
    //     variant: 'destructive',
    //   });
    //   return;
    // }
    mutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white text-theme-primary" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-right text-theme-primary font-bold">إنشاء تصنيف جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-theme-primary font-semibold">اسم التصنيف*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="أدخل اسم التصنيف"
              required
              className="border-theme-border focus:border-theme-primary focus:ring-theme-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-theme-primary font-semibold">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="أدخل وصف التصنيف (اختياري)"
              rows={3}
              className="border-theme-border focus:border-theme-primary focus:ring-theme-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="googleCategory" className="text-theme-primary font-semibold">Google Product Category *</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث في الفئات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 border-theme-border focus:border-theme-primary focus:ring-theme-primary"
                />
              </div>
              <Select value={formData.googleCategory} onValueChange={(value) => handleInputChange('googleCategory', value)}>
                <SelectTrigger className="border-theme-border focus:border-theme-primary focus:ring-theme-primary">
                  <SelectValue placeholder="اختر Google Product Category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.englishCategory}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{category.arabicName}</span>
                        <span className="text-xs text-gray-500">{category.englishCategory}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {filteredCategories.length === 0 && (
                    <SelectItem value="" disabled>
                      لا توجد نتائج مطابقة
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formData.googleCategory && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>الفئة المختارة:</strong> {formData.googleCategory}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive" className="text-theme-primary font-semibold">تفعيل التصنيف</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-theme-gradient text-white hover:opacity-90 font-semibold"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              إنشاء التصنيف
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}