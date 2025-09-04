import { useQuery } from "@tanstack/react-query";

interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
}

interface EmployeeSession {
  success: boolean;
  employee: {
    id: string;
    platformId: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    department: string;
    position: string;
    salary: string;
    hireDate: string;
    profileImageUrl: string | null;
    username: string;
    lastLoginAt: string;
    permissions: string[];
  };
}

export function useSessionInfo() {
  // Get platform session
  const { data: platformSession, isLoading: platformLoading } = useQuery<PlatformSession>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // Check if this is an employee session - use localStorage token as reliable indicator
  const hasEmployeeToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('employee_session_token');
  const isEmployee = hasEmployeeToken;
  
  // Get employee session if employee
  const { data: employeeSession, isLoading: employeeLoading } = useQuery<EmployeeSession>({
    queryKey: ["/api/employee/session"],
    queryFn: async () => {
      const token = localStorage.getItem('employee_session_token');
      if (!token) throw new Error('No session token');
      
      const response = await fetch('/api/employee/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Session validation failed');
      return response.json();
    },
    retry: false,
    enabled: isEmployee,
  });

  // Get employee permissions
  const employeePermissions = employeeSession?.employee?.permissions || [];


  // Check if user has permission for a specific action
  const hasPermission = (permission: string) => {
    if (!isEmployee) return true; // Admin has all permissions
    return employeePermissions.includes(permission);
  };

  return {
    platformSession,
    employeeSession,
    isEmployee,
    employeePermissions,
    hasPermission,
    isLoading: platformLoading || (isEmployee && employeeLoading),
  };
}

// Hook for PlatformSidebar compatibility
export function useCurrentSession() {
  // Get platform session first
  const { data: platformSession, isLoading: platformLoading } = useQuery<PlatformSession>({
    queryKey: ["/api/platform-session"],
    retry: false,
  });

  // Check if we have employee token first
  const hasEmployeeToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('employee_session_token');
  
  // Only call useQuery if we have employee token
  const { data: employeeSession, isLoading: employeeLoading } = useQuery<EmployeeSession>({
    queryKey: ["/api/employee/session"],
    queryFn: async () => {
      const token = localStorage.getItem('employee_session_token');
      if (!token) throw new Error('No session token');
      
      const response = await fetch('/api/employee/session', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Session validation failed');
      return response.json();
    },
    retry: false,
    enabled: hasEmployeeToken, // Only enabled if we have employee token
  });

  const isEmployee = hasEmployeeToken && !!employeeSession?.success;
  const employeePermissions = employeeSession?.employee?.permissions || [];

  return {
    platformSession,
    isEmployee,
    employeePermissions,
    employeeSession,
    isLoading: platformLoading || (hasEmployeeToken && employeeLoading),
  };
}