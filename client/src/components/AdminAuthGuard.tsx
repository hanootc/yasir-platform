import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { data: adminUser, error, isError } = useQuery<AdminUser>({
    queryKey: ['/api/admin/user'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // If there's an authentication error or no admin user, redirect to admin login
    if (isError || error) {
      console.log('🔒 AdminAuthGuard: No valid admin session, redirecting to admin login');
      window.location.href = 'https://sanadi.pro/system-admin-login';
      return;
    }

    // If admin user is loaded but id is missing, redirect to admin login
    if (adminUser && !adminUser.id) {
      console.log('🔒 AdminAuthGuard: Invalid admin session (no id), redirecting to admin login');
      window.location.href = 'https://sanadi.pro/system-admin-login';
      return;
    }
  }, [adminUser, error, isError]);

  // Don't render children if no valid admin session
  if (!adminUser || !adminUser.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-theme-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحقق من جلسة الإدمن...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
