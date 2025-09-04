import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductColorsManager } from "./ProductColorsManager";
import { ProductShapesManager } from "./ProductShapesManager";
import { ProductSizesManager } from "./ProductSizesManager";
import { ProductVariantsManager } from "./ProductVariantsManager";

interface ProductVariantsTabProps {
  productId: string;
  platformId: string;
}

export function ProductVariantsTab({ productId, platformId }: ProductVariantsTabProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="variants" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="variants">المتغيرات</TabsTrigger>
          <TabsTrigger value="colors">الألوان</TabsTrigger>
          <TabsTrigger value="shapes">الأشكال</TabsTrigger>
          <TabsTrigger value="sizes">الأحجام</TabsTrigger>
        </TabsList>
        
        <TabsContent value="variants" className="space-y-4">
          <ProductVariantsManager productId={productId} platformId={platformId} />
        </TabsContent>
        
        <TabsContent value="colors" className="space-y-4">
          <ProductColorsManager productId={productId} platformId={platformId} />
        </TabsContent>
        
        <TabsContent value="shapes" className="space-y-4">
          <ProductShapesManager productId={productId} platformId={platformId} />
        </TabsContent>
        
        <TabsContent value="sizes" className="space-y-4">
          <ProductSizesManager productId={productId} platformId={platformId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}