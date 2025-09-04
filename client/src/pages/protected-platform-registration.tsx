import { useState, useEffect } from 'react';
import AdminLogin from './admin-login';
import PlatformRegistration from './platform-registration';

export default function ProtectedPlatformRegistration() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // التحقق من حالة تسجيل الدخول عند تحميل الصفحة
    const adminLoggedIn = localStorage.getItem('admin_logged_in');
    const loginTime = localStorage.getItem('admin_login_time');
    
    if (adminLoggedIn === 'true' && loginTime) {
      const currentTime = Date.now();
      const timeDiff = currentTime - parseInt(loginTime);
      
      // انتهاء صلاحية الجلسة بعد 24 ساعة (24 * 60 * 60 * 1000)
      if (timeDiff < 24 * 60 * 60 * 1000) {
        setIsLoggedIn(true);
      } else {
        // إزالة الجلسة المنتهية الصلاحية
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_login_time');
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_login_time');
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div>
      {/* إضافة زر تسجيل الخروج */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">لوحة إدارة المنصات</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
      
      <PlatformRegistration />
    </div>
  );
}