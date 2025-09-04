import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

// إعداد التخزين المحلي
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // تحديد المجلد بناءً على نوع الملف أو المعامل
    let uploadPath = "./public/uploads/";
    
    if (req.query.category === 'products') {
      uploadPath += "products/";
    } else if (req.query.category === 'profiles') {
      uploadPath += "profiles/";
    } else if (req.query.category === 'logos') {
      uploadPath += "logos/";
    } else if (req.query.category === 'colors') {
      uploadPath += "colors/";
    } else if (req.query.category === 'shapes') {
      uploadPath += "shapes/";
    } else if (req.query.category === 'videos') {
      uploadPath += "videos/";
    } else if (req.query.category === 'tiktok') {
      uploadPath += "tiktok/";
    } else {
      uploadPath += "general/";
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // إنشاء اسم ملف فريد
    const fileExtension = path.extname(file.originalname);
    const uniqueName = `${randomUUID()}${fileExtension}`;
    cb(null, uniqueName);
  }
});

// فلترة أنواع الملفات المسموحة
const fileFilter = (req: any, file: any, cb: any) => {
  // السماح بملفات الصور والفيديوهات
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// إعداد multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 ميجابايت
  }
});

// معالج الأخطاء
export const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  if (error.message === 'Only image and video files are allowed!') {
    return res.status(400).json({ error: 'Only image and video files are allowed' });
  }
  
  next(error);
};