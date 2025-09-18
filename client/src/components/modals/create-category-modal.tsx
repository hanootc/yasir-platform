import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformId: string;
}

export default function CreateCategoryModal({ isOpen, onClose, platformId }: CreateCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest(`/api/platforms/${platformId}/categories`, {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: 'تم الإنشاء بنجاح',
        description: 'تم إنشاء التصنيف الجديد بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/categories`] });
      onClose();
      setFormData({ name: '', description: '', isActive: true });
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