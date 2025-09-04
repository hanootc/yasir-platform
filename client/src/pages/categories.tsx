import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoriesManager } from "@/components/categories/categories-manager";
import { PlatformSelector } from "@/components/PlatformSelector";
import { Badge } from "@/components/ui/badge";

export default function Categories() {
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: selectedPlatform ? ["/api/categories", { platformId: selectedPlatform }] : ["/api/categories"],
    queryFn: async () => {
      const url = selectedPlatform 
        ? `/api/categories?platformId=${selectedPlatform}`
        : '/api/categories';
      
      console.log("🔍 Fetching categories from:", url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    }
  });

  const handleCreateCategory = () => {
    setShowCreateCategory(true);
  };

  return (
    <div className="flex h-screen bg-theme-primary-lighter">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="إدارة التصنيفات"
          subtitle="تنظيم وإدارة تصنيفات المنتجات"
          onCreateProduct={() => {}}
          onCreateLandingPage={() => {}}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 space-y-4">
            {/* Platform Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlatformSelector 
                  value={selectedPlatform || undefined}
                  onValueChange={setSelectedPlatform}
                />
                {categories && (
                  <Badge 
                    variant="secondary" 
                    className="bg-theme-primary/10 text-theme-primary border-theme-primary/30 px-3 py-1"
                  >
                    {(categories as any[])?.length} تصنيف
                  </Badge>
                )}
              </div>
              
              <div className="text-right">
                <div className="inline-flex items-center gap-3">
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-900">إدارة التصنيفات</h2>
                    <p className="text-gray-600 mt-1">
                      {selectedPlatform === null ? "جميع المنصات" : 
                       selectedPlatform === 'all' ? "جميع المنصات" : "منصة محددة"}
                    </p>
                  </div>
                  <i className="fas fa-tags text-theme-primary text-2xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Management Component */}
          <Card className="theme-border bg-theme-primary-lighter">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-theme-primary">
                <i className="fas fa-list text-theme-primary"></i>
                قائمة التصنيفات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoriesManager />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}