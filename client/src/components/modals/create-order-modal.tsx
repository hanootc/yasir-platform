import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatNumber } from "@/lib/utils";

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
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number; offer?: string }>>([
    { productId: "", quantity: 1, offer: "" }
  ]);
  const [itemDiscounts, setItemDiscounts] = useState<{ [key: number]: number }>({});
  const [sendWhatsAppMessage, setSendWhatsAppMessage] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: platformId ? [`/api/platforms/${platformId}/products`] : ["/api/products"],
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
      let response;
      if (platformId) {
        response = await apiRequest(`/api/platforms/${platformId}/orders`, "POST", data);
      } else {
        response = await apiRequest("/api/orders", "POST", data);
      }
      const result = await response.json();
      console.log("Order creation API response:", result);
      return result;
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
          const response = await fetch("/api/whatsapp/send-manual-order-confirmation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId: data.id }),
          });
          
          if (response.ok) {
            console.log("WhatsApp message sent successfully");
            toast({
              title: "تم الإنشاء",
              description: "تم إنشاء الطلب وإرسال رسالة تأكيد عبر WhatsApp بنجاح",
            });
          } else {
            console.log("WhatsApp message failed:", response.status, response.statusText);
            const errorData = await response.json().catch(() => ({}));
            console.log("WhatsApp error data:", errorData);
            toast({
              title: "تم الإنشاء",
              description: "تم إنشاء الطلب بنجاح ولكن فشل إرسال رسالة WhatsApp",
              variant: "destructive",
            });
          }
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
      setItemDiscounts({});
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
    setOrderItems([...orderItems, { productId: "", quantity: 1, offer: "" }]);
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
    return orderItems.reduce((total, item, index) => {
      const product = products?.find((p: any) => p.id === item.productId);
      if (product) {
        let itemPrice = 0;
        // If an offer is selected, use the offer price
        if (item.offer) {
          const selectedOffer = product.priceOffers?.find((offer: any) => offer.label === item.offer);
          if (selectedOffer) {
            itemPrice = selectedOffer.price;
          }
        } else {
          // Otherwise use product price
          itemPrice = parseFloat(product.price);
        }
        
        // Apply individual item discount
        const itemDiscount = itemDiscounts[index] || 0;
        return total + Math.max(0, itemPrice - itemDiscount);
      }
      return total;
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return Object.values(itemDiscounts).reduce((sum, discount) => sum + (discount || 0), 0) + (form.watch('discount') || 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const globalDiscount = form.watch('discount') || 0;
    return Math.max(0, subtotal - globalDiscount);
  };

  const onSubmit = (data: CreateOrderForm) => {
    const validItems = orderItems.filter(item => item.productId && item.quantity > 0).map((item, index) => ({
      productId: item.productId,
      quantity: item.quantity,
      offer: item.offer || null,
      discount: itemDiscounts[index] || 0,
    }));
    
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
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-800 rounded-lg items-center">
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
                            quantity: 1 // Reset quantity
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
                              quantity: selectedOffer ? selectedOffer.quantity : 1
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
                              console.log('Selected Product:', selectedProduct);
                              console.log('Product offers:', selectedProduct?.offers);
                              
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
                                  {priceOffer.label} - {formatCurrency(priceOffer.price)}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input placeholder="اختر المنتج أولاً" disabled className="bg-gray-800 border-gray-600 text-white" />
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="w-20">
                        <label className="text-sm font-medium text-white mb-1 block">الخصم</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={itemDiscounts[index] || 0}
                          onChange={(e) => {
                            const discount = Number(e.target.value) || 0;
                            setItemDiscounts(prev => ({ ...prev, [index]: discount }));
                          }}
                          className="bg-gray-800 border-gray-600 text-white text-right h-9 text-sm"
                        />
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

                {/* Totals */}
                <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-400">
                      {formatCurrency(calculateTotal())}
                    </span>
                    <span className="font-medium text-white">إجمالي الطلب:</span>
                  </div>
                  {(Object.keys(itemDiscounts).some(key => itemDiscounts[parseInt(key)] > 0) || form.watch('discount') > 0) && (
                    <div className="text-sm border-t border-gray-600 pt-2 space-y-1">
                      {/* Original subtotal before any discounts */}
                      <div className="flex justify-between">
                        <span className="text-gray-300">
                          {formatCurrency(orderItems.reduce((total, item) => {
                            const product = products?.find((p: any) => p.id === item.productId);
                            if (product) {
                              if (item.offer) {
                                const selectedOffer = product.priceOffers?.find((offer: any) => offer.label === item.offer);
                                if (selectedOffer) return total + selectedOffer.price;
                              }
                              return total + parseFloat(product.price);
                            }
                            return total;
                          }, 0))}
                        </span>
                        <span className="text-gray-300">المجموع قبل الخصم:</span>
                      </div>
                      
                      {/* Item discounts */}
                      {Object.keys(itemDiscounts).some(key => itemDiscounts[parseInt(key)] > 0) && (
                        <div className="flex justify-between">
                          <span className="text-red-400">
                            -{formatCurrency(Object.values(itemDiscounts).reduce((sum, discount) => sum + (discount || 0), 0))}
                          </span>
                          <span className="text-red-400">خصم المنتجات:</span>
                        </div>
                      )}
                      
                      {/* Global discount */}
                      {form.watch('discount') > 0 && (
                        <div className="flex justify-between">
                          <span className="text-red-400">-{formatCurrency(form.watch('discount') || 0)}</span>
                          <span className="text-red-400">خصم إضافي:</span>
                        </div>
                      )}
                    </div>
                  )}
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