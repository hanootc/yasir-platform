import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response, url: string) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // معالجة خاصة لعدم المصادقة - إعادة توجيه لصفحة تسجيل الدخول
    if (res.status === 401) {
      try {
        const errorData = JSON.parse(text);
        if (errorData.redirectUrl) {
          console.log('🔒 Authentication required, redirecting to login');
          window.location.href = errorData.redirectUrl;
          return;
        }
      } catch (e) {
        // Check if this is an admin route
        const isAdminRoute = url.includes('/api/admin/');
        const redirectUrl = isAdminRoute ? 'https://sanadi.pro/system-admin-login' : 'https://sanadi.pro/platform-login';
        console.log(`🔒 Authentication required, redirecting to ${redirectUrl}`);
        window.location.href = redirectUrl;
        return;
      }
    }
    
    // معالجة خاصة لانتهاء الاشتراك
    if (res.status === 402) {
      try {
        const errorData = JSON.parse(text);
        if (errorData.renewalRequired) {
          // إعادة توجيه إلى صفحة تجديد الاشتراك
          window.location.href = '/subscription-expired';
          return;
        }
      } catch (e) {
        // في حالة فشل تحليل JSON، استخدم إعادة التوجيه العادية
        window.location.href = '/subscription-expired';
        return;
      }
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = "GET",
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<any> {
  const requestHeaders: Record<string, string> = {
    ...headers,
  };
  
  if (body && typeof body === 'object') {
    requestHeaders["Content-Type"] = "application/json";
  }
  
  // Add employee session token if available
  const employeeToken = localStorage.getItem("employee_session_token");
  if (employeeToken) {
    requestHeaders.Authorization = `Bearer ${employeeToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body && typeof body === 'object' ? JSON.stringify(body) : body as string | undefined,
    credentials: "include",
  });
  
  console.log(`API Request: ${method} ${url}`, { status: res.status, statusText: res.statusText });

  await throwIfResNotOk(res, url);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add employee session token if available
    const employeeToken = localStorage.getItem("employee_session_token");
    if (employeeToken) {
      headers.Authorization = `Bearer ${employeeToken}`;
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    // معالجة خاصة لعدم المصادقة في queries - أولوية للتوجيه
    if (res.status === 401) {
      try {
        const errorData = await res.json();
        if (errorData.redirectUrl) {
          console.log('🔒 Authentication required in query, redirecting to login');
          window.location.href = errorData.redirectUrl;
          return null;
        }
      } catch (e) {
        // Check if this is an admin route
        const isAdminRoute = queryKey.some(key => typeof key === 'string' && key.includes('/api/admin/'));
        const redirectUrl = isAdminRoute ? 'https://sanadi.pro/system-admin-login' : 'https://sanadi.pro/platform-login';
        console.log(`🔒 Authentication required, redirecting to ${redirectUrl}`);
        window.location.href = redirectUrl;
        return null;
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // معالجة خاصة لانتهاء الاشتراك في queries
    if (res.status === 402) {
      try {
        const errorData = await res.json();
        if (errorData.renewalRequired) {
          // إعادة توجيه إلى صفحة تجديد الاشتراك
          window.location.href = '/subscription-expired';
          return null;
        }
      } catch (e) {
        // في حالة فشل تحليل JSON، استخدم إعادة التوجيه العادية
        window.location.href = '/subscription-expired';
        return null;
      }
    }

    await throwIfResNotOk(res, queryKey.join("/") as string);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
