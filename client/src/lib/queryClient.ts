import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
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
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const { method = "GET", body, headers: customHeaders = {} } = options || {};
  
  const headers: Record<string, string> = {
    ...customHeaders,
  };
  
  if (body && typeof body === 'object') {
    headers["Content-Type"] = "application/json";
  }
  
  // Add employee session token if available
  const employeeToken = localStorage.getItem("employee_session_token");
  if (employeeToken) {
    headers.Authorization = `Bearer ${employeeToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: body && typeof body === 'object' ? JSON.stringify(body) : body as string | undefined,
    credentials: "include",
  });
  
  console.log(`API Request: ${method} ${url}`, { status: res.status, statusText: res.statusText });

  await throwIfResNotOk(res);
  return res;
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

    await throwIfResNotOk(res);
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
