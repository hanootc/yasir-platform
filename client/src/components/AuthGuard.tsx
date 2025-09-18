import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, error, isError } = useQuery<PlatformSession>({
    queryKey: ['/api/platform-session'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // If there's an authentication error or no session, redirect to login
    if (isError || error) {
      console.log('🔒 AuthGuard: No valid session, redirecting to login');
      window.location.href = 'https://sanadi.pro/platform-login';
      return;
    }

    // If session is loaded but platformId is missing, redirect to login
    if (session && !session.platformId) {
      console.log('🔒 AuthGuard: Invalid session (no platformId), redirecting to login');
      window.location.href = 'https://sanadi.pro/platform-login';
      return;
    }
  }, [session, error, isError]);

  // Don't render children if no valid session
  if (!session || !session.platformId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-theme-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
