import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { platforms } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Middleware للتحقق من صلاحية الاشتراك
export async function checkSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // البحث عن منصة المستخدم
    const [userPlatform] = await db.select({
      id: platforms.id,
      platformName: platforms.platformName,
      subscriptionPlan: platforms.subscriptionPlan,
      status: platforms.status,
      subscriptionStartDate: platforms.subscriptionStartDate,
      subscriptionEndDate: platforms.subscriptionEndDate,
      createdAt: platforms.createdAt
    }).from(platforms).where(eq(platforms.userId, userId));

    if (!userPlatform) {
      return res.status(404).json({ 
        message: "Platform not found",
        redirectTo: "/register" 
      });
    }

    // التحقق من حالة المنصة
    if (userPlatform.status === 'cancelled') {
      return res.status(403).json({ 
        message: "Platform cancelled",
        redirectTo: "/subscription-cancelled",
        platform: userPlatform
      });
    }

    // التحقق من انتهاء الاشتراك
    const now = new Date();
    let subscriptionEndDate: Date;

    if (userPlatform.subscriptionEndDate) {
      subscriptionEndDate = new Date(userPlatform.subscriptionEndDate);
    } else {
      // حساب تاريخ الانتهاء بناءً على تاريخ الإنشاء (شهر واحد)
      const startDate = userPlatform.subscriptionStartDate 
        ? new Date(userPlatform.subscriptionStartDate)
        : new Date(userPlatform.createdAt);
      subscriptionEndDate = new Date(startDate);
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    // إذا انتهى الاشتراك
    if (now > subscriptionEndDate) {
      // تحديث حالة المنصة إلى "pending_payment"
      await db.update(platforms)
        .set({ 
          status: 'pending_payment',
          updatedAt: new Date()
        })
        .where(eq(platforms.id, userPlatform.id));

      return res.status(402).json({ 
        message: "Subscription expired",
        redirectTo: "/subscription-expired",
        renewalRequired: true,
        platform: {
          ...userPlatform,
          subscriptionEndDate: subscriptionEndDate.toISOString(),
          daysExpired: Math.floor((now.getTime() - subscriptionEndDate.getTime()) / (1000 * 60 * 60 * 24))
        }
      });
    }

    // التحقق من قرب انتهاء الاشتراك (7 أيام)
    const daysRemaining = Math.floor((subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 7 && daysRemaining > 0) {
      // إضافة تحذير للرد
      (req as any).subscriptionWarning = {
        daysRemaining,
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        renewalRequired: true
      };
    }

    // إضافة معلومات المنصة للطلب
    (req as any).userPlatform = {
      ...userPlatform,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
      daysRemaining,
      isExpiringSoon: daysRemaining <= 7
    };

    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware مبسط للتحقق من الحالة فقط (للصفحات العامة)
export async function checkPlatformStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return next();
    }

    const [userPlatform] = await db.select({
      id: platforms.id,
      status: platforms.status,
      subscriptionPlan: platforms.subscriptionPlan
    }).from(platforms).where(eq(platforms.userId, userId));

    if (userPlatform) {
      (req as any).userPlatform = userPlatform;
    }

    next();
  } catch (error) {
    console.error('Error checking platform status:', error);
    next();
  }
}

// دالة للتحقق من صلاحية ميزات الخطة
export function checkPlanFeatures(requiredPlan: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPlatform = (req as any).userPlatform;
    
    if (!userPlatform) {
      return res.status(404).json({ message: "Platform not found" });
    }

    const planHierarchy = {
      'free': 0,
      'basic': 1,
      'premium': 2,
      'enterprise': 3
    };

    const userPlanLevel = planHierarchy[userPlatform.subscriptionPlan as keyof typeof planHierarchy] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan as keyof typeof planHierarchy] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({ 
        message: "Feature not available in your plan",
        currentPlan: userPlatform.subscriptionPlan,
        requiredPlan,
        upgradeRequired: true
      });
    }

    next();
  };
}

// Middleware محدّث للتحقق من انتهاء الاشتراك وإيقاف المنصة تلقائياً
export const requireActiveSubscription = async (req: any, res: any, next: any) => {
  try {
    // إذا كان المستخدم لم يقم بتسجيل الدخول، فتابع بدون التحقق من الاشتراك
    if (!req.user || !req.user.claims || !req.user.claims.sub) {
      return next();
    }

    const userId = req.user.claims.sub;
    
    // البحث عن منصة المستخدم
    const [platform] = await db.select()
      .from(platforms)
      .where(eq(platforms.userId, userId));

    if (!platform) {
      return next(); // إذا لم توجد منصة، فتابع بدون قيود
    }

    // التحقق من حالة الاشتراك
    const now = new Date();
    const subscriptionEndDate = new Date(platform.subscriptionEndDate);

    // إذا انتهت صلاحية الاشتراك، قم بتحديث حالة المنصة إلى غير نشطة
    if (subscriptionEndDate < now && platform.status === 'active') {
      await db.update(platforms)
        .set({ 
          status: 'expired',
          updatedAt: new Date()
        })
        .where(eq(platforms.id, platform.id));
        
      console.log(`⏰ Platform ${platform.platformName} subscription expired, status updated to 'expired'`);
    }

    // منع الوصول للمنصات المنتهية الصلاحية أو غير النشطة
    if (platform.status !== 'active' || subscriptionEndDate < now) {
      return res.status(403).json({
        error: 'Subscription expired or inactive',
        message: 'انتهت صلاحية الاشتراك أو أن الحساب غير نشط. يرجى تجديد الاشتراك للمتابعة.',
        expiredAt: platform.subscriptionEndDate,
        status: platform.status === 'active' ? 'expired' : platform.status,
        platformName: platform.platformName,
        renewalRequired: true
      });
    }

    // إضافة معلومات المنصة إلى الطلب للاستخدام اللاحق
    req.platform = platform;
    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    next(); // في حالة الخطأ، تابع بدون قيود لتجنب كسر التطبيق
  }
};

// Middleware للتحقق من الوصول لمنصة معينة عبر subdomain (للعملاء)
export const checkPlatformAccess = async (req: any, res: any, next: any) => {
  try {
    const subdomain = req.params.subdomain || req.headers['x-subdomain'];
    
    if (!subdomain) {
      return next();
    }

    // البحث عن المنصة بالـ subdomain
    const [platform] = await db.select()
      .from(platforms)
      .where(eq(platforms.subdomain, subdomain));

    if (!platform) {
      return res.status(404).json({
        error: 'Platform not found',
        message: 'المنصة غير موجودة'
      });
    }

    // التحقق من حالة الاشتراك
    const now = new Date();
    const subscriptionEndDate = new Date(platform.subscriptionEndDate);

    // إذا انتهت صلاحية الاشتراك، قم بتحديث حالة المنصة
    if (subscriptionEndDate < now && platform.status === 'active') {
      await db.update(platforms)
        .set({ 
          status: 'expired',
          updatedAt: new Date()
        })
        .where(eq(platforms.id, platform.id));
        
      console.log(`⏰ Platform ${platform.platformName} subscription expired, access denied`);
    }

    // منع الوصول للمنصات المنتهية الصلاحية
    if (platform.status !== 'active' || subscriptionEndDate < now) {
      return res.status(403).json({
        error: 'Platform access denied',
        message: 'انتهت صلاحية اشتراك هذه المنصة. يرجى التواصل مع صاحب المنصة لتجديد الاشتراك.',
        expiredAt: platform.subscriptionEndDate,
        status: platform.status === 'active' ? 'expired' : platform.status,
        platformName: platform.platformName
      });
    }

    // إضافة معلومات المنصة إلى الطلب
    req.targetPlatform = platform;
    next();
  } catch (error) {
    console.error('Platform access check error:', error);
    next();
  }
};