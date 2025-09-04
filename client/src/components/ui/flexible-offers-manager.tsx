import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Check } from "lucide-react";
import type { PriceOffer } from "@shared/schema";

interface FlexibleOffersManagerProps {
  offers: PriceOffer[];
  onChange: (offers: PriceOffer[]) => void;
  currency?: string;
}

export function FlexibleOffersManager({ 
  offers, 
  onChange, 
  currency = "د.ع" 
}: FlexibleOffersManagerProps) {
  const [newOffer, setNewOffer] = useState<Partial<PriceOffer>>({
    quantity: 1,
    price: 0,
    label: "",
    isDefault: false
  });

  const addOffer = () => {
    if (newOffer.quantity && newOffer.price && newOffer.label) {
      const updatedOffers = [...offers, {
        quantity: newOffer.quantity,
        price: newOffer.price,
        label: newOffer.label,
        isDefault: false
      } as PriceOffer];
      
      onChange(updatedOffers);
      setNewOffer({
        quantity: 1,
        price: 0,
        label: "",
        isDefault: false
      });
    }
  };

  const removeOffer = (index: number) => {
    const updatedOffers = offers.filter((_, i) => i !== index);
    onChange(updatedOffers);
  };

  const setDefaultOffer = (index: number) => {
    const updatedOffers = offers.map((offer, i) => ({
      ...offer,
      isDefault: i === index
    }));
    onChange(updatedOffers);
  };

  const updateOffer = (index: number, field: keyof PriceOffer, value: any) => {
    const updatedOffers = offers.map((offer, i) => 
      i === index ? { ...offer, [field]: value } : offer
    );
    onChange(updatedOffers);
  };

  return (
    <div className="space-y-4">
      {/* العروض الحالية */}
      {offers.length > 0 && (
        <div className="space-y-3">
          {offers.map((offer, index) => (
            <Card key={index} className={`relative ${offer.isDefault ? 'ring-2 ring-theme-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <Label className="text-xs text-gray-600">الكمية</Label>
                    <Input
                      type="number"
                      value={offer.quantity}
                      onChange={(e) => updateOffer(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="text-sm"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-600">السعر ({currency})</Label>
                    <Input
                      type="number"
                      value={offer.price}
                      onChange={(e) => updateOffer(index, 'price', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-600">تسمية العرض</Label>
                    <Input
                      value={offer.label}
                      onChange={(e) => updateOffer(index, 'label', e.target.value)}
                      className="text-sm"
                      placeholder="مثل: 20 حبة، عبوة صغيرة"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={offer.isDefault ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDefaultOffer(index)}
                      className="flex-1"
                    >
                      <Check className="w-3 h-3 ml-1" />
                      {offer.isDefault ? "افتراضي" : "اختيار"}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeOffer(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {offer.isDefault && (
                  <div className="absolute -top-2 -right-2 bg-theme-primary text-white px-2 py-1 rounded-md text-xs font-medium">
                    العرض الافتراضي
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* إضافة عرض جديد */}
      <Card className="border-dashed border-2 border-gray-300 hover:border-theme-primary transition-colors">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs text-gray-600">الكمية</Label>
              <Input
                type="number"
                value={newOffer.quantity || ""}
                onChange={(e) => setNewOffer(prev => ({ 
                  ...prev, 
                  quantity: parseInt(e.target.value) || 0 
                }))}
                className="text-sm"
                placeholder="1"
                min="1"
              />
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">السعر ({currency})</Label>
              <Input
                type="number"
                value={newOffer.price || ""}
                onChange={(e) => setNewOffer(prev => ({ 
                  ...prev, 
                  price: parseFloat(e.target.value) || 0 
                }))}
                className="text-sm"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">تسمية العرض</Label>
              <Input
                value={newOffer.label || ""}
                onChange={(e) => setNewOffer(prev => ({ 
                  ...prev, 
                  label: e.target.value 
                }))}
                className="text-sm"
                placeholder="مثل: 20 حبة، عبوة صغيرة"
              />
            </div>
            
            <Button
              type="button"
              onClick={addOffer}
              disabled={!newOffer.quantity || !newOffer.price || !newOffer.label}
              className="w-full"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة عرض
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نصائح للاستخدام */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-2">نصائح لإنشاء العروض:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• يمكنك إضافة عدد غير محدود من العروض (1 قطعة، 20 حبة، 40 حبة، 100 حبة)</li>
          <li>• اختر العرض الافتراضي الذي سيظهر مختاراً في صفحة المنتج</li>
          <li>• تأكد من ترتيب الأسعار بحيث الكميات الأكبر لها أسعار أفضل</li>
          <li>• استخدم أسماء واضحة مثل "قطعة واحدة" أو "20 حبة" أو "عبوة كبيرة"</li>
        </ul>
      </div>
    </div>
  );
}