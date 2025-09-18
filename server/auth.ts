import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import type { SelectAdminUser } from "@shared/schema";

export function getSession() {
  const sessionTtl = 1000 * 60 * 60 * 24 * 7; // 7 days
  return session({
    secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
    name: 'sanadi.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Disable secure for local testing
      maxAge: sessionTtl,
      sameSite: 'lax'
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password authentication
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.getAdminUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }

      if (!user.isActive) {
        return done(null, false, { message: 'تم إيقاف هذا الحساب' });
      }

      // Update last login
      await storage.updateAdminUserLastLogin(user.id);
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // استخدام any لتفادي تعارض الأنواع مع Passport types
  passport.serializeUser((user: any, done) => {
    done(null, (user as any).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getAdminUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: SelectAdminUser | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "خطأ في الخادم" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "فشل تسجيل الدخول" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "خطأ في تسجيل الدخول" });
        }
        return res.json({ 
          message: "تم تسجيل الدخول بنجاح",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    })(req, res, next);
  });

  // Auth login route (alternative endpoint)
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: SelectAdminUser | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "خطأ في الخادم" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "فشل تسجيل الدخول" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "خطأ في تسجيل الدخول" });
        }
        return res.json({ 
          message: "تم تسجيل الدخول بنجاح",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    })(req, res, next);
  });

  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getAdminUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "هذا البريد الإلكتروني مستخدم بالفعل" });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = await storage.createAdminUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "super_admin", // Default role
        isActive: true
      });

      res.status(201).json({ 
        message: "تم إنشاء الحساب بنجاح",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "خطأ في إنشاء الحساب" });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
      }
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  // Get current user - moved to routes.ts to avoid conflicts
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    const user = req.user as SelectAdminUser;
    if (user.isActive) {
      return next();
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export const requireRole = (roles: string[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user as SelectAdminUser;
    const role = (user as any)?.role ?? "";
    if (!roles.includes(role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};