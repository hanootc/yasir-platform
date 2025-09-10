import React, { useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, requireAuth } = useAdminAuth();

  useEffect(() => {
    if (!isLoading) {
      requireAuth();
    }
  }, [isLoading, isAuthenticated, requireAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login message (requireAuth will handle redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">يجب تسجيل الدخول</h2>
          <p className="text-gray-600 mb-4">انتهت صلاحية جلستك أو لم تسجل دخول. سيتم توجيهك لصفحة تسجيل الدخول...</p>
          <div className="animate-pulse">
            <div className="h-2 bg-blue-200 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};
