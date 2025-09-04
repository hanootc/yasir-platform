import { useQuery } from "@tanstack/react-query";

export interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

export function usePlatformSession() {
  const { data: session, isLoading, error } = useQuery<PlatformSession>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  return {
    session,
    isLoading,
    error,
  };
}