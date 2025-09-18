import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function usePlatformLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiRequest('/api/platform/logout', {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to login page
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        window.location.href = 'https://sanadi.pro/platform-login';
      }
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login
      window.location.href = 'https://sanadi.pro/platform-login';
    }
  });
}
