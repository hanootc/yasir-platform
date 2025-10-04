import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OfferType {
  id: string;
  label: string;
  quantity: number;
  price: number;
  savings: number;
}

interface CompactOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  isMobile?: boolean;
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
    // البحث عن العرض المطابق للكمية في العروض الحقيقية
    const matchingOffer = availableOffers.find((offer: OfferType) => offer.quantity === quantity);
    if (matchingOffer) {
      return matchingOffer.price;
    }
    
    // إذا لم نجد عرض مطابق، نحسب السعر بناءً على أقرب عرض
    const sortedOffers = [...availableOffers].sort((a, b) => a.quantity - b.quantity);
    
    // إذا كانت الكمية أقل من أصغر عرض
    if (quantity < sortedOffers[0]?.quantity) {
      return sortedOffers[0]?.price || 15000;
    }
    
    // إذا كانت الكمية أكبر من أكبر عرض، نحسب السعر تناسبياً
    const largestOffer = sortedOffers[sortedOffers.length - 1];
    if (quantity > largestOffer?.quantity) {
      const pricePerUnit = largestOffer.price / largestOffer.quantity;
      return Math.round(quantity * pricePerUnit);
    }
    
    // إذا كانت الكمية بين عرضين، نأخذ العرض الأقرب
    for (let i = 0; i < sortedOffers.length - 1; i++) {
      if (quantity >= sortedOffers[i].quantity && quantity <= sortedOffers[i + 1].quantity) {
        const diff1 = quantity - sortedOffers[i].quantity;
        const diff2 = sortedOffers[i + 1].quantity - quantity;
        return diff1 <= diff2 ? sortedOffers[i].price : sortedOffers[i + 1].price;
      }
    }
    
    // إذا لم نجد شيء، نعود للسعر الافتراضي
    return 15000;
  };

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerGovernorate: "",
    status: "",
    notes: "",
    selectedOffer: "",
    customPrice: 0,
    discountAmount: 0,
    quantity: 1,
    selectedColor: "",
    selectedShape: "",
    selectedSize: "",
  });

  // جلب بيانات المنتج (الألوان، الأشكال، الأحجام)
  const productId = order?.productId || order?.product_id;
  
  const { data: productColors } = useQuery({
    queryKey: [`/api/products/${productId}/colors`],
    queryFn: () => apiRequest(`/api/products/${productId}/colors`),
    enabled: !!productId && isOpen,
  });
  
  const { data: productShapes } = useQuery({
    queryKey: [`/api/products/${productId}/shapes`],
    queryFn: () => apiRequest(`/api/products/${productId}/shapes`),
    enabled: !!productId && isOpen,
  });
  
  const { data: productSizes } = useQuery({
    queryKey: [`/api/products/${productId}/sizes`],
    queryFn: () => apiRequest(`/api/products/${productId}/sizes`),
    enabled: !!productId && isOpen,
  });

  // جلب العروض الحقيقية للمنتج
  const { data: productOffers } = useQuery({
    queryKey: [`/api/products/${productId}/offers`],
    queryFn: () => apiRequest(`/api/products/${productId}/offers`),
    enabled: !!productId && isOpen,
  });

  // العروض المتاحة - استخدام العروض الحقيقية أو العروض الافتراضية
  const availableOffers: OfferType[] = productOffers && productOffers.length > 0 
    ? (() => {
        console.log('🔍 Product Offers from API:', productOffers);
        return productOffers.map((offer: any) => {
          console.log('🔍 Processing offer:', offer);
          return {
            id: offer.id,
            label: offer.name || offer.label || offer.title || `${offer.quantity} قطع`,
            quantity: offer.quantity,
            price: offer.price,
            savings: offer.savings || 0
          };
        });
      })()
    : [
        { id: "1", label: "قطعة واحدة", quantity: 1, price: 15000, savings: 0 },
        { id: "2", label: "قطعتين", quantity: 2, price: 25000, savings: 5000 },
        { id: "3", label: "3 قطع", quantity: 3, price: 30000, savings: 15000 },
      ];

  useEffect(() => {
    if (order && isOpen) {
      console.log('Order data in modal:', order);
      console.log('🔍 Available offers:', availableOffers);
      const currentQuantity = extractQuantity(order.offer || "");
      const totalOfferPrice = extractPrice(order.offer || "") || Number(order.totalAmount || order.total_amount || 0);
      
      // تحديد العرض المحدد بناءً على الكمية
      const currentOffer = availableOffers.find((offer: OfferType) => offer.quantity === currentQuantity);
      
      setFormData({
        customerName: order.customerName || order.customer_name || order.name || "",
        customerPhone: order.customerPhone || order.customer_phone || order.phone || "",
        customerAddress: order.customerAddress || order.customer_address || order.address || "",
        customerGovernorate: order.customerGovernorate || order.customer_governorate || order.governorate || "",
        status: order.status || "",
        notes: order.notes || order.note || "",
        selectedOffer: currentOffer?.id || "",
        customPrice: totalOfferPrice,
        discountAmount: Number(order.discountAmount || order.discount_amount || 0),
        quantity: currentQuantity,
        selectedColor: order.selectedColor || order.color || "",
        selectedShape: order.selectedShape || order.shape || "",
        selectedSize: order.selectedSize || order.size || "",
      });
    }
  }, [order, isOpen]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🔄 Updating order with data:', data);
      console.log('🔄 Order quantity in data:', data.quantity);
      const orderId = order.id || order._id;
      const platformId = order.platformId || order.platform_id;
      
      if (platformId) {
        // إذا كان الطلب من منصة، استخدم endpoint المنصة
        return apiRequest(`/api/platforms/${platformId}/orders/${orderId}`, 'PATCH', data);
      } else {
        // إذا كان طلب عادي
        return apiRequest(`/api/orders/${orderId}`, 'PATCH', data);
      }
    },
    onSuccess: (updatedOrder) => {
      console.log('✅ Order updated successfully:', updatedOrder);
      console.log('✅ Updated order quantity:', updatedOrder?.quantity);
      
      // تحديث جميع queries المتعلقة بالطلبات
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing-page-orders"] });
      
      const platformId = order.platformId || order.platform_id;
      if (platformId) {
        queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/orders`] });
      }
      
      // إجبار تحديث فوري للبيانات
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/orders"] });
        queryClient.refetchQueries({ queryKey: ["/api/landing-page-orders"] });
        if (platformId) {
          queryClient.refetchQueries({ queryKey: [`/api/platforms/${platformId}/orders`] });
        }
      }, 100);
      toast({ title: "تم التحديث", description: "تم حفظ التغييرات بنجاح" });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating order:', error);
      toast({ 
        title: "خطأ في التحديث", 
        description: error.message || "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive"
      });
    },
  });

  const handleSave = () => {
    const selectedOfferData = availableOffers.find((offer: OfferType) => offer.id === formData.selectedOffer);
    const quantity = formData.quantity || 1; // استخدام الكمية من formData
    const offerLabel = selectedOfferData?.label || `${quantity} قطعة`;
    
    // إنشاء نص العرض الجديد
    const newOffer = `${offerLabel} - ${formData.customPrice.toLocaleString()} د.ع`;
    const finalTotal = formData.customPrice - formData.discountAmount; // بدون ضرب في الكمية
    
    // العثور على IDs المتغيرات المحددة
    const selectedColorId = productColors?.find((c: any) => (c.colorName || c.name) === formData.selectedColor)?.id;
    const selectedShapeId = productShapes?.find((s: any) => (s.shapeName || s.name) === formData.selectedShape)?.id;
    const selectedSizeId = productSizes?.find((s: any) => (s.sizeName || s.name) === formData.selectedSize)?.id;
    
    const updateData = {
      ...formData,
      offer: newOffer,
      quantity: quantity,
      totalAmount: finalTotal,
      // حفظ IDs المتغيرات للعرض الصحيح في الجدول
      selectedColorId: selectedColorId,
      selectedShapeId: selectedShapeId,
      selectedSizeId: selectedSizeId,
      // إضافة خصائص المنتج بأسماء مختلفة للتوافق
      color: formData.selectedColor,
      shape: formData.selectedShape,
      size: formData.selectedSize,
      selectedColor: formData.selectedColor,
      selectedShape: formData.selectedShape,
      selectedSize: formData.selectedSize,
    };
    
    console.log('🔄 Saving order with data:', updateData);
    console.log('🔄 Quantity being saved:', quantity);
    console.log('🔄 New offer text:', newOffer);
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
            {offer && (
              <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-2 mt-2">
                <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">العرض المختار:</div>
                <div className="text-purple-800 dark:text-purple-200 text-sm leading-relaxed text-right">
                  {offer}
                </div>
              </div>
            )}
            
            {/* خصائص المنتج (اللون، الشكل، الحجم) */}
            {(productColors?.length > 0 || productShapes?.length > 0 || productSizes?.length > 0) && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {productColors?.length > 0 && (
                  <div className="text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 block mb-1">اللون</div>
                    <Select value={formData.selectedColor} onValueChange={(value) => setFormData(prev => ({ ...prev, selectedColor: value }))}>
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500">
                        <SelectValue placeholder="اختر اللون" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        {productColors.map((color: any) => (
                          <SelectItem key={color.id} value={color.colorName || color.name}>
                            {color.colorName || color.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {productShapes?.length > 0 && (
                  <div className="text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 block mb-1">الشكل</div>
                    <Select value={formData.selectedShape} onValueChange={(value) => setFormData(prev => ({ ...prev, selectedShape: value }))}>
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500">
                        <SelectValue placeholder="اختر الشكل" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        {productShapes.map((shape: any) => (
                          <SelectItem key={shape.id} value={shape.shapeName || shape.name}>
                            {shape.shapeName || shape.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {productSizes?.length > 0 && (
                  <div className="text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 block mb-1">الحجم</div>
                    <Select value={formData.selectedSize} onValueChange={(value) => setFormData(prev => ({ ...prev, selectedSize: value }))}>
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500">
                        <SelectValue placeholder="اختر الحجم" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        {productSizes.map((size: any) => (
                          <SelectItem key={size.id} value={size.sizeName || size.name}>
                            {size.sizeName || size.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            
            {/* العروض المتاحة */}
            <div className="mt-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 block mb-2">العرض المحدد:</div>
              <Select 
                value={formData.selectedOffer} 
                onValueChange={(value) => {
                  const selectedOffer = availableOffers.find((offer: OfferType) => offer.id === value);
                  if (selectedOffer) {
                    console.log('🔄 Selected offer:', selectedOffer);
                    setFormData(prev => ({ 
                      ...prev, 
                      selectedOffer: value,
                      quantity: selectedOffer.quantity,
                      customPrice: selectedOffer.price
                    }));
                  }
                }}
              >
                <SelectTrigger className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500">
                  <SelectValue placeholder="اختر العرض" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                  {availableOffers.map((offer: OfferType) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{offer.label}</span>
                        <div className="text-left">
                          <span className="font-bold">{offer.price.toLocaleString()} د.ع</span>
                          {offer.savings > 0 && (
                            <div className="text-xs text-green-600">وفر {offer.savings.toLocaleString()} د.ع</div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* تعديل السعر والكمية والخصم */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <label htmlFor="custom-price-input" className="text-xs text-gray-600 dark:text-gray-400">السعر الإجمالي</label>
                <Input
                  id="custom-price-input"
                  type="number"
                  value={formData.customPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPrice: parseInt(e.target.value) || 0 }))}
                  className="text-center h-7 text-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                />
              </div>
              <div className="text-center">
                <label htmlFor="quantity-input" className="text-xs text-gray-600 dark:text-gray-400">الكمية</label>
                <Input
                  id="quantity-input"
                  type="number"
                  min="1"
                  value={formData.quantity || extractQuantity(offer)}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="text-center h-7 text-xs bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
                />
              </div>
              <div className="text-center">
                <label htmlFor="discount-amount-input" className="text-xs text-gray-600 dark:text-gray-400">الخصم</label>
                <Input
                  id="discount-amount-input"
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