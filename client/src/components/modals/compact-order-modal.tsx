import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CompactOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function CompactOrderModal({ isOpen, onClose, order }: CompactOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const extractPrice = (offer: string): number => {
    const match = offer.match(/(\d{1,3}(?:,\d{3})*)\s*د\.ع/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  };

  const extractQuantity = (offer: string): number => {
    // التعامل مع الكلمات المكتوبة
    if (offer.includes('واحدة') || offer.includes('واحد') || offer.includes('قطعة واحدة')) return 1;
    if (offer.includes('اثنتان') || offer.includes('اثنين') || offer.includes('قطعتين') || offer.includes('قطعتان')) return 2;
    if (offer.includes('ثلاث') || offer.includes('ثلاثة قطع')) return 3;
    if (offer.includes('أربع') || offer.includes('أربعة قطع')) return 4;
    if (offer.includes('خمس') || offer.includes('خمسة قطع')) return 5;
    
    // التعامل مع الأرقام المكتوبة كأرقام
    const numMatch = offer.match(/(\d+)\s*قط/); // مثل "5 قطع" أو "10 قطعة"
    if (numMatch) return parseInt(numMatch[1]);
    
    // البحث عن أي رقم في النص كبديل أخير
    const anyNumMatch = offer.match(/\d+/);
    return anyNumMatch ? parseInt(anyNumMatch[0]) : 1;
  };

  // دالة لحساب السعر بناءً على الكمية مع العروض
  const calculatePriceForQuantity = (quantity: number): number => {
    // أسعار العروض الثابتة
    if (quantity === 1) return 15000; // سعر القطعة الواحدة
    if (quantity === 2) return 25000; // عرض قطعتين
    if (quantity === 3) return 30000; // عرض 3 قطع
    
    // للكميات الأكبر من 3، نضيف سعر القطع الإضافية على عرض الـ3 قطع
    if (quantity > 3) {
      const basePrice = 30000; // سعر أول 3 قطع
      const additionalPieces = quantity - 3;
      const additionalPrice = additionalPieces * 15000; // سعر القطع الإضافية
      return basePrice + additionalPrice;
    }
    
    // إذا كانت الكمية أقل من 1، عودة للسعر الأساسي
    return 15000;
  };

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerGovernorate: "",
    status: "",
    notes: "",
    quantity: 1,
    customPrice: 0,
    discountAmount: 0,
  });

  useEffect(() => {
    if (order && isOpen) {
      const currentQuantity = extractQuantity(order.offer || "");
      const totalOfferPrice = extractPrice(order.offer || "");
      
      // السعر يكون هو سعر العرض الكامل، وليس سعر القطعة الواحدة
      // مثلاً: قطعتين - 25,000 د.ع = السعر 25,000 (وليس 12,500)
      
      setFormData({
        customerName: order.customerName || order.customer_name || "",
        customerPhone: order.customerPhone || order.customer_phone || "",
        customerAddress: order.customerAddress || order.customer_address || "",
        customerGovernorate: order.customerGovernorate || order.customer_governorate || "",
        status: order.status || "",
        notes: order.notes || "",
        quantity: currentQuantity,
        customPrice: totalOfferPrice,
        discountAmount: Number(order.discountAmount || order.discount_amount || 0),
      });
    }
  }, [order, isOpen]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/orders/${order.id}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      const platformId = order.platformId || order.platform_id;
      if (platformId) {
        queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/orders`] });
      }
      toast({ title: "تم التحديث", description: "تم حفظ التغييرات بنجاح" });
      onClose();
    },
  });

  const handleSave = () => {
    // إنشاء نص العرض الجديد
    const newOffer = `${formData.quantity === 1 ? 'قطعة واحدة' : `${formData.quantity} قطع`} - ${formData.customPrice.toLocaleString()} د.ع`;
    // السعر هو بالفعل المجموع الكامل للعرض، لا نحتاج لضرب في الكمية
    const finalTotal = formData.customPrice - formData.discountAmount;
    
    const updateData = {
      ...formData,
      offer: newOffer,
      totalAmount: finalTotal,
    };
    
    updateMutation.mutate(updateData);
  };

  if (!order) return null;

  const orderNumber = order.orderNumber || order.order_number || order.id?.slice(-4) || "غير محدد";
  const productName = order.productName || order.product_name || "منتج غير محدد";
  const offer = order.offer || "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center justify-between">
            <span>تفاصيل الطلب</span>
            <span className="bg-theme-primary-light px-3 py-1 rounded-lg text-theme-primary font-bold">
              #{orderNumber}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* بيانات المنتج */}
          <div className="bg-theme-primary-lighter dark:bg-gray-700 p-3 rounded text-sm border border-theme-primary dark:border-gray-600">
            <div className="font-medium text-theme-primary dark:text-white">{productName}</div>
            <div className="text-theme-primary dark:text-gray-300 mt-1">{offer}</div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center">
                <label className="text-xs text-gray-600 dark:text-gray-400">الكمية</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    const newPrice = calculatePriceForQuantity(newQuantity);
                    setFormData(prev => ({ 
                      ...prev, 
                      quantity: newQuantity,
                      customPrice: newPrice
                    }));
                  }}
                  className="text-center h-7 text-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                  min="1"
                />
              </div>
              <div className="text-center">
                <label className="text-xs text-gray-600 dark:text-gray-400">سعر العرض</label>
                <Input
                  type="number"
                  value={formData.customPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPrice: parseInt(e.target.value) || 0 }))}
                  className="text-center h-7 text-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                />
              </div>
              <div className="text-center">
                <label className="text-xs text-gray-600 dark:text-gray-400">الخصم</label>
                <Input
                  type="number"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseInt(e.target.value) || 0 }))}
                  className="text-center h-7 text-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                />
              </div>
            </div>
            <div className="text-center mt-2 text-sm font-medium text-theme-primary dark:text-white bg-theme-primary-light dark:bg-gray-600 py-2 rounded">
              المجموع النهائي: {(formData.customPrice - formData.discountAmount).toLocaleString()} د.ع
            </div>
          </div>

          {/* بيانات العميل */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="الاسم"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <Input
              placeholder="الهاتف"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select value={formData.customerGovernorate} onValueChange={(value) => setFormData(prev => ({ ...prev, customerGovernorate: value }))}>
              <SelectTrigger className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500">
                <SelectValue placeholder="المحافظة" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <SelectItem value="بغداد">بغداد</SelectItem>
                <SelectItem value="البصرة">البصرة</SelectItem>
                <SelectItem value="نينوى">نينوى</SelectItem>
                <SelectItem value="الأنبار">الأنبار</SelectItem>
                <SelectItem value="أربيل">أربيل</SelectItem>
                <SelectItem value="كركوك">كركوك</SelectItem>
                <SelectItem value="النجف">النجف</SelectItem>
                <SelectItem value="كربلاء">كربلاء</SelectItem>
                <SelectItem value="واسط">واسط</SelectItem>
                <SelectItem value="صلاح الدين">صلاح الدين</SelectItem>
                <SelectItem value="القادسية">القادسية</SelectItem>
                <SelectItem value="ذي قار">ذي قار</SelectItem>
                <SelectItem value="المثنى">المثنى</SelectItem>
                <SelectItem value="بابل">بابل</SelectItem>
                <SelectItem value="ديالى">ديالى</SelectItem>
                <SelectItem value="ميسان">ميسان</SelectItem>
                <SelectItem value="السليمانية">السليمانية</SelectItem>
                <SelectItem value="دهوك">دهوك</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="processing">قيد المعالجة</SelectItem>
                <SelectItem value="shipped">تم الشحن</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
                <SelectItem value="no_answer">لا يرد</SelectItem>
                <SelectItem value="postponed">مؤجل</SelectItem>
                <SelectItem value="returned">مرتجع</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="العنوان"
            value={formData.customerAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
            className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />

          <Textarea
            placeholder="ملاحظات"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />

          {/* أزرار العمليات */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {updateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
            
            <Button
              onClick={() => {
                const phone = formData.customerPhone || order.customerPhone || order.customer_phone;
                if (phone) {
                  const customerName = formData.customerName || order.customerName || order.customer_name || 'العميل';
                  const message = `مرحبا ${customerName}، بخصوص طلبكم رقم ${orderNumber}`;
                  const url = `https://wa.me/+964${phone.replace(/^0+/, '')}?text=${encodeURIComponent(message)}`;
                  window.open(url, '_blank');
                }
              }}
              className="bg-green-500 hover:bg-green-600 px-3"
            >
              <i className="fab fa-whatsapp"></i>
            </Button>

            <Button onClick={onClose} variant="outline" className="px-3">
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}