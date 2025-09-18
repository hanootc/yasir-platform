// دالة مساعدة لإنشاء روابط المنتجات باستخدام الـ slug
export function createProductUrl(product: any, subdomain: string, landingPages?: any[]): string {
  if (!product || !subdomain) return '/';
  
  // البحث عن صفحة هبوط نشطة للمنتج
  if (landingPages && landingPages.length > 0) {
    const productLandingPage = landingPages.find(
      (page: any) => page.productId === product.id && page.isActive
    );
    
    if (productLandingPage && productLandingPage.customUrl) {
      return `/${subdomain}/${productLandingPage.customUrl}`;
    }
  }
  
  // استخدام الـ slug إذا كان متوفراً، وإلا استخدام الـ ID
  const identifier = product.slug || product.id;
  
  return `/${subdomain}/${identifier}`;
}

// دالة للتنقل إلى صفحة المنتج مع التحقق من صفحات الهبوط
export function navigateToProduct(product: any, subdomain: string, landingPages?: any[]): void {
  const url = createProductUrl(product, subdomain, landingPages);
  window.location.href = url;
}

// دالة للحصول على الـ slug من المنتج
export function getProductSlug(product: any): string {
  return product.slug || product.id;
}
