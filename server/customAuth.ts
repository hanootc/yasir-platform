import type { Express, RequestHandler } from "express";
import express from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { db } from "./db";
import { adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema للتحقق من بيانات تسجيل الدخول
const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
});

export async function setupCustomAuth(app: Express) {
  // إعداد الجلسة للمصادقة المخصصة
  app.set("trust proxy", 1);
  
  // إضافة إعدادات الجلسة
  const sessionTtl = 1000 * 60 * 60 * 24 * 7; // 7 days
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
    name: 'sanadi.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      maxAge: sessionTtl,
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.sanadi.pro' : undefined // Only set domain in production
    },
  }));
  
  // تسجيل دخول الأدمن الرئيسي
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // البحث عن المستخدم في قاعدة البيانات
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email));
      console.log('ADMIN FROM DB:', admin);
      
      if (!admin) {
        return res.status(401).json({ 
          error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
        });
      }
      
      if (!admin.isActive) {
        return res.status(401).json({ 
          error: "الحساب معطل. تواصل مع الدعم الفني" 
        });
      }
      
      // التحقق من كلمة المرور
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
        });
      }
      
      // تحديث آخر تسجيل دخول
      await db
        .update(adminUsers)
        .set({ 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(adminUsers.id, admin.id));
      
      // حفظ بيانات المستخدم في الجلسة
      (req.session as any).user = {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        isActive: admin.isActive
      };
      
      // حفظ بيانات الإدارة للـ middleware
      (req.session as any).adminId = admin.id;
      (req.session as any).adminEmail = admin.email;
      
      res.json({
        success: true,
        user: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role
        }
      });
      
    } catch (error) {
      console.error("خطأ في تسجيل الدخول:", error);
      if (error && error.stack) {
        console.error('STACK:', error.stack);
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: error.errors[0].message 
        });
      }
      res.status(500).json({ 
        error: "خطأ في الخادم" 
      });
    }
  });
  
  // تسجيل الخروج
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("خطأ في تسجيل الخروج:", err);
        return res.status(500).json({ error: "خطأ في تسجيل الخروج" });
      }
      res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
    });
  });
  
  // الحصول على بيانات المستخدم الحالي
  app.get("/api/admin/user", isAdminAuthenticated, (req, res) => {
    const user = (req.session as any).user;
    res.json(user);
  });
}

// Middleware للتحقق من تسجيل الدخول للأدمن
export const isAdminAuthenticated: RequestHandler = (req, res, next) => {
  const user = (req.session as any).user;
  
  console.log('Admin Auth Check:', {
    hasSession: !!req.session,
    hasUser: !!user,
    userId: user?.id,
    userActive: user?.isActive,
    sessionId: req.sessionID
  });
  
  if (!user || !user.id) {
    return res.status(401).json({ message: "غير مخول للوصول" });
  }
  
  if (!user.isActive) {
    return res.status(401).json({ message: "الحساب معطل" });
  }
  
  next();
};

// Middleware للتحقق من صلاحيات الأدمن العام
export const isSuperAdmin: RequestHandler = (req, res, next) => {
  const user = (req.session as any).user;
  
  if (!user || user.role !== "super_admin") {
    return res.status(403).json({ message: "تحتاج صلاحيات أدمن عام" });
  }
  
  next();
};

// دالة لإنشاء أول مستخدم أدمن (في حالة عدم وجود أي مستخدم)
export async function createDefaultAdmin() {
  try {
    const existingAdmins = await db.select().from(adminUsers);
    
    if (existingAdmins.length === 0) {
      const defaultPassword = "admin123"; // يجب تغييرها فوراً
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await db.insert(adminUsers).values({
        email: "admin@sanadi.pro",
        password: hashedPassword,
        firstName: "مدير",
        lastName: "النظام",
        role: "super_admin"
      });
      
      console.log("🔐 تم إنشاء مستخدم أدمن افتراضي:");
      console.log("البريد الإلكتروني: admin@sanadi.pro");
      console.log("كلمة المرور: admin123");
      console.log("⚠️ تأكد من تغيير كلمة المرور فوراً بعد تسجيل الدخول!");
    }
  } catch (error) {
    console.error("خطأ في إنشاء مستخدم أدمن افتراضي:", error);
  }
}