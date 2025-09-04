import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// إعداد الملفات الثابتة - خدمة مجلد uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// خدمة ملفات الواجهة الأمامية المبنية
// app.use(express.static(path.join(__dirname, '../dist/client')));

// إضافة دعم رفع الملفات
app.use(fileUpload({
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max file size
  abortOnLimit: true,
  responseOnLimit: "File size limit exceeded",
  useTempFiles: false,
  tempFileDir: undefined
}));

// إضافة CORS headers للصور
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // إضافة headers خاصة للصور
  if (req.path.startsWith('/public-objects/')) {
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('X-Content-Type-Options', 'nosniff');
  }
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// تسجيل طلبات API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // معالجة الأخطاء
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // خدمة الواجهة الأمامية لجميع المسارات الأخرى
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'));
  });

  // تشغيل الخادم
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`🌐 Access your application at: http://sanadi.pro:${port}`);
  });
})();