import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoriesManager } from "@/components/categories/categories-manager";
import { PlatformSelector } from "@/components/PlatformSelector";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

export default function Categories() {
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  // Get platform session - removed admin API call
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Use platform session instead of admin user
        const response = await fetch('/api/platform-session', {
          credentials: 'include'
        });
        if (response.ok) {
          const sessionData = await response.json();
          if (!sessionData.error) {
            setSession({ user: sessionData, platformId: sessionData.platformId });
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        // Set empty session to continue
        setSession({ user: null, platformId: null });
      }
    };
    fetchSession();
  }, []);

  const { data: categories, isLoading } = useQuery({
    queryKey: selectedPlatform ? ["/api/categories", { platformId: selectedPlatform }] : ["/api/categories"],
    queryFn: async () => {
      if (!selectedPlatform) {
        return [];
      }
      
      const url = `/api/categories?platformId=${selectedPlatform}`;
      
      console.log("🔍 Fetching categories from:", url);
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter out duplicates by grouping by name and taking the most recent one
      if (Array.isArray(data)) {
        const uniqueCategories = data.reduce((acc: any[], category: any) => {
          const existingIndex = acc.findIndex(c => c.name === category.name);
          if (existingIndex === -1) {
            acc.push(category);
          } else {
            // Keep the most recent one (latest createdAt)
            if (new Date(category.createdAt) > new Date(acc[existingIndex].createdAt)) {
              acc[existingIndex] = category;
            }
          }
          return acc;
        }, []);
        return uniqueCategories;
      }
      
      return data;
    },
    enabled: !!selectedPlatform
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
              {selectedPlatform ? (
                <CategoriesManager platformId={selectedPlatform} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <i className="fas fa-tags text-6xl mb-4"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">اختر منصة لعرض التصنيفات</h3>
                  <p className="text-gray-500">يرجى اختيار منصة من القائمة أعلاه لعرض وإدارة التصنيفات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}