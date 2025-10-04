import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Interface for platform session
interface PlatformSession {
  platformId: string;
  platformName: string;
  subdomain: string;
  userType: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
}

// Check if user has valid platform session
export function requirePlatformAuth(req: Request, res: Response, next: NextFunction) {
  const platformSession = (req.session as any)?.platform;
  
  // If no platform session exists, redirect to login
  if (!platformSession || !platformSession.platformId) {
    console.log('🔒 No platform session found, redirecting to login');
    
    // For API requests, return 401 with redirect URL
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirectUrl: 'https://sanadi.pro/platform-login',
        message: 'يجب تسجيل الدخول للوصول إلى هذه الخدمة'
      });
    }
    
    // For page requests, redirect directly
    return res.redirect('https://sanadi.pro/platform-login');
  }
  
  console.log('✅ Platform session validated:', platformSession.platformId);
  next();
}

// Get platform session with fallback mechanisms
export async function getPlatformSession(req: Request): Promise<PlatformSession | null> {
  let platformSession = (req.session as any)?.platform;
  
  // If no session, try to restore from subdomain query parameter
  if (!platformSession) {
    const qSub = (req.query?.subdomain as string | undefined)?.trim();
    if (qSub) {
      const pf = await storage.getPlatformBySubdomain(qSub);
      if (pf) {
        platformSession = {
          platformId: pf.id,
          platformName: (pf as any).platformName || (pf as any).name || "",
          subdomain: pf.subdomain,
          userType: "admin",
          logoUrl: (pf as any).logoUrl || (pf as any).logo || "",
          contactEmail: (pf as any).contactEmail || "",
          contactPhone: (pf as any).contactPhone || (pf as any).phoneNumber || "",
          whatsappNumber: (pf as any).whatsappNumber || ""
        };
        
        // Save session for future requests
        (req.session as any).platform = platformSession;
      }
    }
  }
  
  // Try to extract from referer as fallback
  if (!platformSession) {
    const referer = req.headers.referer;
    if (referer) {
      const match = referer.match(/\/platform\/([^\/]+)/);
      if (match) {
        const subdomain = match[1];
        const pf = await storage.getPlatformBySubdomain(subdomain);
        if (pf) {
          platformSession = {
            platformId: pf.id,
            platformName: (pf as any).platformName || (pf as any).name || "",
            subdomain: pf.subdomain,
            userType: "admin",
            logoUrl: (pf as any).logoUrl || (pf as any).logo || "",
            contactEmail: (pf as any).contactEmail || "",
            contactPhone: (pf as any).contactPhone || (pf as any).phoneNumber || "",
            whatsappNumber: (pf as any).whatsappNumber || ""
          };
          
          // Save session for future requests
          (req.session as any).platform = platformSession;
        }
      }
    }
  }
  
  return platformSession || null;
}

// Middleware for platform API endpoints that allows fallback authentication
export async function requirePlatformAuthWithFallback(req: Request, res: Response, next: NextFunction) {
  const platformSession = await getPlatformSession(req);
  
  if (!platformSession) {
    console.log('🔒 No platform session found after fallback attempts');
    
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirectUrl: 'https://sanadi.pro/platform-login',
        message: 'يجب تسجيل الدخول للوصول إلى هذه الخدمة'
      });
    }
    
    return res.redirect('https://sanadi.pro/platform-login');
  }
  
  console.log('✅ Platform session validated with fallback:', platformSession.platformId);
  next();
}

// Logout function to clear platform session
export function logoutPlatform(req: Request, res: Response) {
  if ((req.session as any)?.platform) {
    delete (req.session as any).platform;
    console.log('🚪 Platform session cleared');
  }
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    
    res.clearCookie('connect.sid');
    res.json({ 
      success: true, 
      message: 'تم تسجيل الخروج بنجاح',
      redirectUrl: 'https://sanadi.pro/platform-login'
    });
  });
}

// List of platform endpoints that require authentication
export const PROTECTED_PLATFORM_ENDPOINTS = [
  '/api/delivery/settings',
  '/api/platforms/',
  '/api/products',
  '/api/categories',
  '/api/landing-pages',
  '/api/orders',
  '/api/employees',
  '/api/whatsapp',
  '/api/inventory',
  '/api/reports',
  '/api/ads',
  '/api/settings',
  '/api/upload',
  '/api/tiktok'
];

// Check if endpoint requires platform authentication
export function requiresPlatformAuth(path: string): boolean {
  return PROTECTED_PLATFORM_ENDPOINTS.some(endpoint => path.startsWith(endpoint));
}
