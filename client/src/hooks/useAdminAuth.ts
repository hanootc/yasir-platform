import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface AdminSession {
  adminId: string;
  email: string;
  loginTime: number;
  lastActivity: number;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const STORAGE_KEY = 'sanadi-admin-session';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [, setLocation] = useLocation();

  // Check if session is expired
  const isSessionExpired = (session: AdminSession): boolean => {
    const now = Date.now();
    return (now - session.lastActivity) > SESSION_TIMEOUT;
  };

  // Update last activity time
  const updateActivity = () => {
    const session = getStoredSession();
    if (session && !isSessionExpired(session)) {
      const updatedSession = {
        ...session,
        lastActivity: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
      setAdminSession(updatedSession);
    }
  };

  // Get session from localStorage
  const getStoredSession = (): AdminSession | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AdminSession;
      }
    } catch (error) {
      console.error('Error parsing admin session:', error);
    }
    return null;
  };

  // Login function
  const login = (adminData: { adminId: string; email: string }) => {
    const session: AdminSession = {
      adminId: adminData.adminId,
      email: adminData.email,
      loginTime: Date.now(),
      lastActivity: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setAdminSession(session);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = (redirectToLogin: boolean = true) => {
    localStorage.removeItem(STORAGE_KEY);
    setAdminSession(null);
    setIsAuthenticated(false);
    
    if (redirectToLogin) {
      setLocation('/system-admin-login');
    }
  };

  // Check authentication status
  const checkAuth = () => {
    setIsLoading(true);
    const session = getStoredSession();
    
    if (session) {
      if (isSessionExpired(session)) {
        // Session expired, logout
        logout(false);
        setIsLoading(false);
        return false;
      } else {
        // Valid session, update activity
        updateActivity();
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      }
    } else {
      // No session found
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  // Force redirect to login if not authenticated
  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/system-admin-login');
    }
  };

  // Initialize auth check on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up activity monitoring
  useEffect(() => {
    if (isAuthenticated) {
      // Update activity on user interactions
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => {
        updateActivity();
      };

      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      // Check session validity every minute
      const interval = setInterval(() => {
        const session = getStoredSession();
        if (session && isSessionExpired(session)) {
          logout(true);
        }
      }, 60000); // Check every minute

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
        clearInterval(interval);
      };
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    adminSession,
    login,
    logout,
    checkAuth,
    requireAuth,
    updateActivity
  };
};
