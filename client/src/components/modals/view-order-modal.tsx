import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ViewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

function extractPriceFromOffer(offer: string): number {
  // البحث عن الأرقام متبوعة بـ "د.ع"
  const priceMatch = offer.match(/(\d{1,3}(?:,\d{3})*)\s*د\.ع/);
  if (priceMatch) {
    return parseInt(priceMatch[1].replace(/,/g, ''));
  }
  
  // البحث عن أي رقم في النص
  const numberMatch = offer.match(/(\d{1,3}(?:,\d{3})*)/);
  if (numberMatch) {
    const number = parseInt(numberMatch[1].replace(/,/g, ''));
    // إذا كان الرقم كبير (أكثر من 1000) فهو على الأغلب سعر
    if (number > 1000) {
      return number;
    }
  }
  
  return 0;
}

function extractQuantityFromOffer(offer: string): number {
  const arabicToNumber = {
    "واحدة": 1,
    "واحد": 1,
    "قطعة واحدة": 1,
    "قطعتان": 2,
    "اثنتان": 2,
    "اثنين": 2,
    "ثلاث": 3,
    "ثلاثة": 3,
    "أربع": 4,
    "أربعة": 4,
    "خمس": 5,
    "خمسة": 5,
    "ست": 6,
    "ستة": 6,
    "سبع": 7,
    "سبعة": 7,
    "ثمان": 8,
    "ثمانية": 8,
    "تسع": 9,
    "تسعة": 9,
    "عشر": 10,
    "عشرة": 10,
  };

  const numberMatch = offer.match(/\d+/);
  if (numberMatch) {
    return parseInt(numberMatch[0]);
  }

  for (const [word, num] of Object.entries(arabicToNumber)) {
    if (offer.includes(word)) {
      return num;
    }
  }

  return 1;
}

export default function ViewOrderModal({ isOpen, onClose, order }: ViewOrderModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Debug log
  console.log("ViewOrderModal rendered with isEditing:", isEditing);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerGovernorate: "",
    status: "",
    notes: "",
    quantity: 1,
    discountAmount: 0,
    customPrice: 0,
  });
  // إعادة ملء البيانات عند فتح المودال أو تغيير الطلب
  useEffect(() => {
    if (order && isOpen) {
      console.log("Order data in ViewOrderModal:", order);
      const currentQuantity = extractQuantityFromOffer(order.offer || "");
      const currentPrice = extractPriceFromOffer(order.offer || "") || Number(order.totalAmount || order.productPrice || 0);
      
      const newFormData = {
        customerName: order.customerName || "",
        customerPhone: order.customerPhone || "",
        customerAddress: order.customerAddress || "",
        customerGovernorate: order.customerGovernorate || "",
        status: order.status || "",
        notes: order.notes || "",
        quantity: currentQuantity,
        discountAmount: Number(order.discountAmount || 0),
        customPrice: currentPrice,
      };
      
      console.log("Setting form data:", newFormData);
      console.log("Extracted quantity:", currentQuantity);
      console.log("Extracted price:", currentPrice);
      
      setFormData(newFormData);
    }
  }, [order, isOpen]);

  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/orders/${order.id}`, 'PATCH', data);
    },
    onSuccess: (updatedOrder) => {
      console.log("Update response:", updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/platforms/${order.platform_id}/orders`] });
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث الطلب بنجاح",
      });
      setIsEditing(false);
      
      // إعادة ملء البيانات من القيم المحفوظة في النموذج
      setTimeout(() => {
        if (order) {
          const currentQuantity = extractQuantityFromOffer(order.offer || "");
          const currentPrice = extractPriceFromOffer(order.offer || "") || Number(order.totalAmount || 0);
          
          setFormData(prevData => ({
            ...prevData,
            quantity: currentQuantity,
            customPrice: currentPrice,
          }));
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error("Update order error:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الطلب",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrderMutation.mutate({
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      customerGovernorate: formData.customerGovernorate,
      status: formData.status,
      notes: formData.notes,
      discountAmount: formData.discountAmount,
    });
  };

  const calculateTotal = () => {
    const subtotal = formData.customPrice * formData.quantity;
    return Math.max(0, subtotal - formData.discountAmount);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} د.ع`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusLabels = {
    pending: "في الانتظار",
    confirmed: "مؤكد",
    processing: "قيد المعالجة",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
    refunded: "مسترد",
    no_answer: "لا يرد",
    postponed: "مؤجل",
    returned: "مرتجع",
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
    no_answer: "bg-pink-100 text-pink-800",
    postponed: "bg-indigo-100 text-indigo-800",
    returned: "bg-amber-100 text-amber-800",
  };

  const iraqiGovernorates = [
    "بغداد", "البصرة", "نينوى", "أربيل", "النجف", "كربلاء", "السليمانية", 
    "الأنبار", "ديالى", "المثنى", "القادسية", "بابل", "كركوك", "واسط", 
    "صلاح الدين", "ذي قار", "ميسان", "دهوك", "حلبجة"
  ];

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="space-y-6">
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-right text-xl font-bold text-gray-900">
              تفاصيل الطلب #{order.orderNumber}
            </DialogTitle>
          </DialogHeader>

          {/* Order Summary - Right to Left Layout */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">إجمالي المبلغ</Label>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      {isEditing ? formatCurrency(calculateTotal()) : (
                        order.total ? formatCurrency(order.total) : (
                          order.productPrice ? formatCurrency(Number(order.productPrice) * extractQuantityFromOffer(order.offer || "")) : "غير محدد"
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">التاريخ</Label>
                    <div className="text-gray-800 mt-1">{formatDate(order.createdAt)}</div>
                  </div>
                </div>
                
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">الحالة</Label>
                    <div className="mt-1">
                      <Badge className={`${statusColors[order.status as keyof typeof statusColors]}`}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">رقم الطلب</Label>
                    <div className="font-mono text-blue-600 font-medium mt-1">#{order.orderNumber}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details - Right to Left Layout */}
          {order.productName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right">تفاصيل المنتج</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {/* Product Image - First on the right side */}
                  <div className="flex-shrink-0">
                    {order.productImage && order.productImage[0] && (
                      <img 
                        src={order.productImage[0]} 
                        alt={order.productName}
                        className="w-20 h-20 object-cover rounded-lg border shadow-sm"
                        onError={(e) => {
                          console.log("Image failed to load:", order.productImage[0]);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Product Info - Takes remaining space */}
                  <div className="flex-1 text-right space-y-3">
                    <h3 className="text-lg font-semibold">{order.productName}</h3>
                    <div className="space-y-2">
                      {/* حقل السعر */}
                      <div className="flex items-center gap-2">
                        <Label className="text-gray-600">السعر للقطعة:</Label>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={formData.customPrice}
                              onChange={(e) => setFormData({ ...formData, customPrice: parseFloat(e.target.value) || 0 })}
                              className="w-24 h-8 text-center"
                            />
                            <span className="text-sm text-gray-600">د.ع</span>
                          </div>
                        ) : (
                          <span className="text-gray-800">
                            {formatCurrency(Number(order.productPrice || 0))}
                          </span>
                        )}
                      </div>
                      
                      {/* حقل الكمية */}
                      <div className="flex items-center gap-2">
                        <Label className="text-blue-600 font-medium">الكمية:</Label>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={formData.quantity}
                              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                              className="w-20 h-8 text-center"
                            />
                            <span className="text-sm text-gray-600">قطعة</span>
                          </div>
                        ) : (
                          <span className="text-blue-600 font-medium">
                            {extractQuantityFromOffer(order.offer || "")} قطعة
                          </span>
                        )}
                      </div>

                      {/* حقل الخصم */}
                      {isEditing && (
                        <div className="flex items-center gap-2">
                          <Label className="text-red-600 font-medium">الخصم:</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={formData.discountAmount}
                              onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                              className="w-24 h-8 text-center"
                            />
                            <span className="text-sm text-gray-600">د.ع</span>
                          </div>
                        </div>
                      )}

                      {/* عرض المجموع في وضع التحرير */}
                      {isEditing && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-green-700 font-medium">المجموع النهائي:</Label>
                            <span className="text-green-800 font-bold text-lg">
                              {formatCurrency(Math.max(0, (formData.customPrice * formData.quantity) - formData.discountAmount))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {order.offer && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <Label className="text-sm text-purple-700 font-medium">العرض المختار:</Label>
                        <p className="text-purple-800 mt-1 text-right leading-relaxed">
                          {order.offer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Customer Details - Right to Left Layout */}
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <Button
                variant={isEditing ? "outline" : "default"}
                size="sm"
                onClick={() => {
                  console.log("Edit button clicked, current isEditing:", isEditing);
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? "إلغاء" : "تعديل"}
              </Button>
              <CardTitle className="text-right">معلومات العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Customer Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">اسم العميل</Label>
                    <Input
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1 text-right"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">رقم الهاتف</Label>
                    <Input
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      disabled={!isEditing}
                      className="mt-1 text-left font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">المحافظة</Label>
                    <Select
                      value={formData.customerGovernorate}
                      onValueChange={(value) => setFormData({ ...formData, customerGovernorate: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1 text-right">
                        <SelectValue placeholder="اختر المحافظة" />
                      </SelectTrigger>
                      <SelectContent>
                        {iraqiGovernorates.map((governorate) => (
                          <SelectItem key={governorate} value={governorate}>
                            {governorate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">حالة الطلب</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-1 text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">في الانتظار</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="processing">قيد المعالجة</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                        <SelectItem value="refunded">مسترد</SelectItem>
                        <SelectItem value="no_answer">لا يرد</SelectItem>
                        <SelectItem value="postponed">مؤجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">العنوان</Label>
                  <Textarea
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1 text-right resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-600">ملاحظات</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={!isEditing}
                    className="mt-1 text-right resize-none"
                    rows={3}
                    placeholder="أضف ملاحظات حول الطلب..."
                  />
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateOrderMutation.isPending}
                    >
                      {updateOrderMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}