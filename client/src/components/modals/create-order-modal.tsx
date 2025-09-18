import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

const createOrderSchema = z.object({
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  customerPhone: z.string().min(1, "رقم الهاتف مطلوب"),
  customerAddress: z.string().min(1, "العنوان مطلوب"),
  customerGovernorate: z.string().min(1, "المحافظة مطلوبة"),
  discount: z.number().min(0, "الخصم يجب أن يكون صفر أو أكثر").optional(),
  notes: z.string().optional(),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  platformId?: string;
}

export default function CreateOrderModal({ isOpen, onClose, platformId }: CreateOrderModalProps) {
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number; offer?: string; selectedColorIds?: string[]; selectedShapeIds?: string[]; selectedSizeIds?: string[]; selectedColorId?: string; selectedShapeId?: string; selectedSizeId?: string }>>([
    { productId: "", quantity: 1, offer: "", selectedColorIds: [], selectedShapeIds: [], selectedSizeIds: [], selectedColorId: "", selectedShapeId: "", selectedSizeId: "" }
  ]);
  const [sendWhatsAppMessage, setSendWhatsAppMessage] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: platformId ? [`/api/platforms/${platformId}/products`] : ["/api/products"],
    enabled: !!platformId,
  }) as { data: any[] };

  // جلب الألوان والأشكال والأحجام
  const { data: colors = [] } = useQuery({
    queryKey: [`/api/platforms/${platformId}/colors`],
    enabled: !!platformId,
  }) as { data: any[] };

  const { data: shapes = [] } = useQuery({
    queryKey: [`/api/platforms/${platformId}/shapes`],
    enabled: !!platformId,
  }) as { data: any[] };

  const { data: sizes = [] } = useQuery({
    queryKey: [`/api/platforms/${platformId}/sizes`],
    enabled: !!platformId,
  }) as { data: any[] };

  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      customerGovernorate: "",
      discount: 0,
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("=== ORDER CREATION DEBUG ===");
      console.log("Sending order data:", data);
      
      try {
        let result;
        if (platformId) {
          console.log("Using platform endpoint:", `/api/platforms/${platformId}/orders`);
          result = await apiRequest(`/api/platforms/${platformId}/orders`, "POST", data);
        } else {
          console.log("Using general endpoint:", "/api/orders");
          result = await apiRequest("/api/orders", "POST", data);
        }
        
        console.log("Order creation API response:", result);
        console.log("=== END ORDER CREATION DEBUG ===");
        return result;
      } catch (error) {
        console.log("Order creation error:", error);
        console.log("=== END ORDER CREATION DEBUG ===");
        throw error;
      }
    },
    onSuccess: async (data) => {
      if (platformId) {
        queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/orders`] });
        queryClient.invalidateQueries({ queryKey: [`/api/platforms/${platformId}/stats`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
      
      // إرسال رسالة واتساب إذا تم تحديد الخيار
      console.log("WhatsApp sending check:", { sendWhatsAppMessage, dataId: data?.id, fullData: data });
      
      if (sendWhatsAppMessage && data?.id) {
        console.log("Sending WhatsApp message for order:", data.id);
        try {
          const response = await apiRequest("/api/whatsapp/send-manual-order-confirmation", "POST", { orderId: data.id });
          
          console.log("WhatsApp message sent successfully:", response);
          toast({
            title: "تم الإنشاء",
            description: "تم إنشاء الطلب وإرسال رسالة تأكيد عبر WhatsApp بنجاح",
          });
        } catch (error) {
          console.log("WhatsApp message error:", error);
          toast({
            title: "تم الإنشاء",
            description: "تم إنشاء الطلب بنجاح ولكن فشل إرسال رسالة WhatsApp",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "تم الإنشاء",
          description: "تم إنشاء الطلب بنجاح",
        });
      }
      
      onClose(false);
      form.reset();
      setOrderItems([{ productId: "", quantity: 1, offer: "" }]);
      setSendWhatsAppMessage(true);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الطلب",
        variant: "destructive",
      });
    },
  });

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1, offer: "", selectedColorIds: [], selectedShapeIds: [], selectedSizeIds: [], selectedColorId: "", selectedShapeId: "", selectedSizeId: "" }]);
  };

  const removeOrderItem = (index: number) => {
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  const updateOrderItem = (index: number, field: keyof typeof orderItems[0], value: any) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    console.log(`Updated ${field} for item ${index}:`, value, 'New items:', newItems);
    setOrderItems(newItems);
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((total, item) => {
      if (!item.productId) return total;
      
      const selectedProduct = products?.find((p: any) => p.id === item.productId);
      if (!selectedProduct) return total;
      
      let itemPrice = parseFloat(selectedProduct.price);
      
      // If an offer is selected, use the offer price
      if (item.offer) {
        const selectedOffer = selectedProduct.priceOffers?.find((offer: any) => offer.label === item.offer);
        if (selectedOffer) {
          itemPrice = parseFloat(selectedOffer.price);
        } else {
          itemPrice = parseFloat(selectedProduct.price);
        }
      } else {
        itemPrice = parseFloat(selectedProduct.price);
      }
      
      return total + itemPrice;
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return form.watch('discount') || 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const globalDiscount = form.watch('discount') || 0;
    return Math.max(0, subtotal - globalDiscount);
  };

  const onSubmit = (data: CreateOrderForm) => {
    const validItems = orderItems.filter(item => item.productId && item.quantity > 0).map((item, index) => {
      // Create offer string in format "quantity - price"
      const selectedProduct = products?.find((p: any) => p.id === item.productId);
      let offerString = null;
      
      if (item.offer && selectedProduct) {
        const selectedOffer = selectedProduct.priceOffers?.find((offer: any) => offer.label === item.offer);
        if (selectedOffer) {
          offerString = `${selectedOffer.quantity} قطعة - ${selectedOffer.price}`;
        }
      }
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        offer: offerString,
        selectedColorIds: item.selectedColorIds || [],
        selectedShapeIds: item.selectedShapeIds || [],
        selectedSizeIds: item.selectedSizeIds || [],
        selectedColorId: item.selectedColorId || null,
        selectedShapeId: item.selectedShapeId || null,
        selectedSizeId: item.selectedSizeId || null,
      };
    });
    
    if (validItems.length === 0) {
      toast({
        title: "خطأ",
        description: "يجب إضافة منتج واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      ...data,
      items: validItems,
      discount: data.discount || 0,
    };
    
    createOrderMutation.mutate(orderData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => onClose(open)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black text-right" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl font-bold text-white text-right">إضافة طلب جديد</DialogTitle>
          <DialogDescription className="text-gray-300 text-right">
            قم بإدخال بيانات الطلب الجديد وتحديد المنتجات المطلوبة
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
              <h3 className="text-lg font-medium mb-4 text-white text-right">معلومات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-right">اسم العميل *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم العميل" {...field} className="bg-gray-800 border-gray-600 text-white text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-right">رقم الهاتف *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل رقم الهاتف" {...field} className="bg-gray-800 border-gray-600 text-white text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-right">العنوان *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل العنوان" {...field} className="bg-gray-800 border-gray-600 text-white text-right" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerGovernorate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-right">المحافظة *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-right">
                            <SelectValue placeholder="اختر المحافظة" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="بغداد">بغداد</SelectItem>
                            <SelectItem value="البصرة">البصرة</SelectItem>
                            <SelectItem value="أربيل">أربيل</SelectItem>
                            <SelectItem value="الموصل">الموصل</SelectItem>
                            <SelectItem value="النجف">النجف</SelectItem>
                            <SelectItem value="كربلاء">كربلاء</SelectItem>
                            <SelectItem value="الأنبار">الأنبار</SelectItem>
                            <SelectItem value="ديالى">ديالى</SelectItem>
                            <SelectItem value="بابل">بابل</SelectItem>
                            <SelectItem value="ذي قار">ذي قار</SelectItem>
                            <SelectItem value="واسط">واسط</SelectItem>
                            <SelectItem value="ميسان">ميسان</SelectItem>
                            <SelectItem value="المثنى">المثنى</SelectItem>
                            <SelectItem value="القادسية">القادسية</SelectItem>
                            <SelectItem value="صلاح الدين">صلاح الدين</SelectItem>
                            <SelectItem value="كركوك">كركوك</SelectItem>
                            <SelectItem value="دهوك">دهوك</SelectItem>
                            <SelectItem value="السليمانية">السليمانية</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white text-right">منتجات الطلب</h3>
                <Button type="button" onClick={addOrderItem} variant="outline" size="sm">
                  <i className="fas fa-plus mr-2"></i>
                  إضافة منتج
                </Button>
              </div>
              
              <div className="space-y-3">
                {orderItems.map((item, index) => {
                  console.log('Rendering item', index, 'with productId:', item.productId);
                  return (
                  <div key={index} className="p-3 bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="text-sm font-medium text-white mb-1 block">المنتج</label>
                        <Select
                          value={item.productId || ""}
                          onValueChange={(value) => {
                            console.log('Product selected:', value, 'Current item:', item);
                            // Update all fields at once to avoid multiple state updates
                            const newItems = [...orderItems];
                            newItems[index] = { 
                              ...newItems[index], 
                              productId: value,
                              offer: '', // Reset offer when product changes
                              quantity: 1, // Reset quantity
                              // Keep existing variant selections
                              selectedColorIds: newItems[index].selectedColorIds || [],
                              selectedShapeIds: newItems[index].selectedShapeIds || [],
                              selectedSizeIds: newItems[index].selectedSizeIds || []
                            };
                            console.log('Setting new items:', newItems);
                            setOrderItems(newItems);
                          }}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="اختر المنتج" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {products?.map((product: any) => (
                              <SelectItem key={product.id} value={product.id} className="text-white hover:bg-gray-600">
                                {product.name} - {formatCurrency(product.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white mb-1 block">العرض</label>
                        {item.productId ? (
                          <Select
                            value={item.offer || ""}
                            onValueChange={(value) => {
                              console.log('Offer selected:', value);
                              
                              // Find the selected price offer and update offer + quantity at once
                              const selectedProduct = products?.find((p: any) => p.id === item.productId);
                              const selectedOffer = selectedProduct?.priceOffers?.find((offer: any) => offer.label === value);
                              console.log('Selected offer details:', selectedOffer);
                              
                              // Update both offer and quantity at once
                              const newItems = [...orderItems];
                              newItems[index] = { 
                                ...newItems[index], 
                                offer: value,
                                quantity: selectedOffer ? selectedOffer.quantity : 1,
                                // Keep existing variant selections
                                selectedColorIds: newItems[index].selectedColorIds || [],
                                selectedShapeIds: newItems[index].selectedShapeIds || [],
                                selectedSizeIds: newItems[index].selectedSizeIds || []
                              };
                              setOrderItems(newItems);
                            }}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="اختر العرض" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {(() => {
                                const selectedProduct = products?.find((p: any) => p.id === item.productId);
                                
                                // Get price offers from the product
                                const priceOffers = selectedProduct?.priceOffers || [];
                                
                                if (priceOffers.length === 0) {
                                  return (
                                    <SelectItem value="لا توجد عروض متاحة" disabled>
                                      لا توجد عروض متاحة
                                    </SelectItem>
                                  );
                                }
                                
                                return priceOffers.map((priceOffer: any, offerIndex: number) => (
                                  <SelectItem key={offerIndex} value={priceOffer.label} className="text-white hover:bg-gray-700">
                                    {priceOffer.label} - {formatCurrency(priceOffer.price)} (الكمية: {priceOffer.quantity})
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input placeholder="اختر المنتج أولاً" disabled className="bg-gray-800 border-gray-600 text-white" />
                        )}
                      </div>

                      <div className="w-20">
                        <label className="text-sm font-medium text-white mb-1 block">الكمية</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="الكمية"
                          className="bg-gray-800 border-gray-600 text-white text-right h-9 text-sm"
                        />
                      </div>
                    </div>

                    {/* حقول اختيارية للون والشكل والحجم */}
                    {item.productId && item.productId.trim() !== '' && (() => {
                      const selectedProduct = products?.find((p: any) => p.id === item.productId);
                      if (!selectedProduct) return null;
                      
                      const hasColors = selectedProduct?.colors?.length > 0;
                      const hasShapes = selectedProduct?.shapes?.length > 0;
                      const hasSizes = selectedProduct?.sizes?.length > 0;
                      
                      if (!hasColors && !hasShapes && !hasSizes) return null;
                      
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          {/* الألوان المتعددة */}
                          {hasColors && (
                            <div>
                              <label className="text-sm font-medium text-white mb-1 block">الألوان (اختياري)</label>
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-600 rounded">
                                  {selectedProduct.colors.map((color: any) => (
                                <div key={color.id} className="flex items-center gap-1 mb-1">
                                  <input
                                    type="checkbox"
                                    id={`color-${index}-${color.id}`}
                                    checked={(item.selectedColorIds || []).includes(color.id)}
                                    onChange={(e) => {
                                      console.log('Color checkbox changed:', { colorId: color.id, checked: e.target.checked, index });
                                      const newItems = [...orderItems];
                                      const currentColors = newItems[index].selectedColorIds || [];
                                      console.log('Current colors before update:', currentColors);
                                      
                                      if (e.target.checked) {
                                        newItems[index] = {
                                          ...newItems[index],
                                          selectedColorIds: [...currentColors, color.id]
                                        };
                                      } else {
                                        newItems[index] = {
                                          ...newItems[index],
                                          selectedColorIds: currentColors.filter(id => id !== color.id)
                                        };
                                      }
                                      
                                      console.log('New colors after update:', newItems[index].selectedColorIds);
                                      setOrderItems(newItems);
                                    }}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <label 
                                    htmlFor={`color-${index}-${color.id}`}
                                    className="flex items-center gap-1 text-white text-sm cursor-pointer"
                                  >
                                    <div 
                                      className="w-4 h-4 rounded-full border border-gray-400" 
                                      style={{ backgroundColor: color.colorCode }}
                                    />
                                    {color.colorName}
                                  </label>
                                </div>
                                  ))}
                                </div>
                                {(item.selectedColorIds || []).length > 0 && (
                                  <div className="text-xs text-gray-400">
                                    تم اختيار {(item.selectedColorIds || []).length} لون
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* الأشكال المتعددة */}
                          {hasShapes && (
                            <div>
                              <label className="text-sm font-medium text-white mb-1 block">الأشكال (اختياري)</label>
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-600 rounded">
                                  {selectedProduct.shapes.map((shape: any) => (
                                <div key={shape.id} className="flex items-center gap-1 mb-1">
                                  <input
                                    type="checkbox"
                                    id={`shape-${index}-${shape.id}`}
                                    checked={(item.selectedShapeIds || []).includes(shape.id)}
                                    onChange={(e) => {
                                      const newItems = [...orderItems];
                                      const currentShapes = newItems[index].selectedShapeIds || [];
                                      if (e.target.checked) {
                                        newItems[index] = {
                                          ...newItems[index],
                                          selectedShapeIds: [...currentShapes, shape.id]
                                        };
                                      } else {
                                        newItems[index] = {
                                          ...newItems[index],
                                          selectedShapeIds: currentShapes.filter(id => id !== shape.id)
                                        };
                                      }
                                      setOrderItems(newItems);
                                    }}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <label 
                                    htmlFor={`shape-${index}-${shape.id}`}
                                    className="flex items-center gap-1 text-white text-sm cursor-pointer"
                                  >
                                    {shape.shapeImageUrl && (
                                      <img 
                                        src={shape.shapeImageUrl}
                                        alt={shape.shapeName}
                                        className="w-4 h-4 object-cover rounded border border-gray-400"
                                      />
                                    )}
                                    {shape.shapeName}
                                  </label>
                                </div>
                                  ))}
                                </div>
                                {(item.selectedShapeIds || []).length > 0 && (
                                  <div className="text-xs text-gray-400">
                                    تم اختيار {(item.selectedShapeIds || []).length} شكل
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* الأحجام المتعددة */}
                          {hasSizes && (
                            <div>
                              <label className="text-sm font-medium text-white mb-1 block">الأحجام (اختياري)</label>
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-600 rounded">
                                  {selectedProduct.sizes.map((size: any) => (
                                <div key={size.id} className="flex items-center gap-1 mb-1">
                                  <input
                                    type="checkbox"
                                    id={`size-${index}-${size.id}`}
                                    checked={(item.selectedSizeIds || []).includes(size.id)}
                                    onChange={(e) => {
                                      const newItems = [...orderItems];
                                      const currentSizes = newItems[index].selectedSizeIds || [];
                                      if (e.target.checked) {
                                        newItems[index] = {
                                          ...newItems[index],
                                          selectedSizeIds: [...currentSizes, size.id]
                                        };
                                      } else {
                                        newItems[index] = {
                                          ...newItems[index],
                                          selectedSizeIds: currentSizes.filter(id => id !== size.id)
                                        };
                                      }
                                      setOrderItems(newItems);
                                    }}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <label 
                                    htmlFor={`size-${index}-${size.id}`}
                                    className="flex items-center gap-1 text-white text-sm cursor-pointer"
                                  >
                                    {size.sizeName} ({size.sizeValue})
                                  </label>
                                </div>
                                  ))}
                                </div>
                                {(item.selectedSizeIds || []).length > 0 && (
                                  <div className="text-xs text-gray-400">
                                    تم اختيار {(item.selectedSizeIds || []).length} حجم
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-white mb-1 block">السعر</label>
                        {item.productId && (
                          <span className="font-medium text-lg text-green-400">
                            {(() => {
                              const selectedProduct = products?.find((p: any) => p.id === item.productId);
                              if (!selectedProduct) return formatCurrency(0);
                              
                              // If an offer is selected, use the offer price
                              if (item.offer) {
                                const selectedOffer = selectedProduct.priceOffers?.find((offer: any) => offer.label === item.offer);
                                if (selectedOffer) {
                                  return formatCurrency(selectedOffer.price);
                                }
                              }
                              
                              // Otherwise use product price (without multiplication since quantity is separate)
                              return formatCurrency(selectedProduct.price || 0);
                            })()}
                          </span>
                        )}
                      </div>
                      
                      {orderItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOrderItem(index)}
                          className="text-red-600 hover:text-red-700 self-end"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
              
              <div className="mt-4 space-y-3">

                {/* Global Discount */}
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>خصم إضافي على الطلب</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          className="text-right"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Totals */}
                <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-400">
                      {formatCurrency(calculateTotal())}
                    </span>
                    <span className="font-medium text-white">إجمالي الطلب:</span>
                  </div>
                  {(form.watch('discount') || 0) > 0 && (
                    <div className="text-sm border-t border-gray-600 pt-2 space-y-1">
                      {/* Original subtotal before any discounts */}
                      <div className="flex justify-between">
                        <span className="text-gray-300">
                          {formatCurrency(calculateSubtotal())}
                        </span>
                        <span className="text-gray-300">المجموع الفرعي:</span>
                      </div>
                      
                      {/* Global discount */}
                      <div className="flex justify-between">
                        <span className="text-red-400">
                          -{formatCurrency(form.watch('discount') || 0)}
                        </span>
                        <span className="text-red-400">خصم إضافي:</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* WhatsApp Message Toggle */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    checked={sendWhatsAppMessage}
                    onCheckedChange={setSendWhatsAppMessage}
                  />
                  <label className="text-sm font-medium text-white">
                    إرسال رسالة تأكيد عبر WhatsApp
                  </label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل أي ملاحظات إضافية..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* WhatsApp message option */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="send-whatsapp"
                checked={sendWhatsAppMessage}
                onCheckedChange={(checked) => setSendWhatsAppMessage(!!checked)}
                className="mr-2"
              />
              <label htmlFor="send-whatsapp" className="text-sm font-medium">
                إرسال رسالة تأكيد عبر WhatsApp للعميل
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={createOrderMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"

              >
                {createOrderMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جارٍ الإنشاء...
                  </>
                ) : (
                  "إنشاء الطلب"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}