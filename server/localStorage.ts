import { Response } from "express";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export class LocalStorageService {
  private uploadsDir = "./public/uploads";
  private productsDir = path.join(this.uploadsDir, "products");
  private profilesDir = path.join(this.uploadsDir, "profiles");
  private logosDir = path.join(this.uploadsDir, "logos");
  private colorsDir = path.join(this.uploadsDir, "colors");
  private shapesDir = path.join(this.uploadsDir, "shapes");
  private videosDir = path.join(this.uploadsDir, "videos");
  private tiktokDir = path.join(this.uploadsDir, "tiktok");
  private generalDir = path.join(this.uploadsDir, "general");

  constructor() {
    this.ensureDirectoriesExist();
  }

  private async ensureDirectoriesExist() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.productsDir, { recursive: true });
      await fs.mkdir(this.profilesDir, { recursive: true });
      await fs.mkdir(this.logosDir, { recursive: true });
      await fs.mkdir(this.colorsDir, { recursive: true });
      await fs.mkdir(this.shapesDir, { recursive: true });
      await fs.mkdir(this.videosDir, { recursive: true });
      await fs.mkdir(this.tiktokDir, { recursive: true });
      await fs.mkdir(this.generalDir, { recursive: true });
    } catch (error) {
      console.error("Error creating upload directories:", error);
    }
  }

  // حفظ ملف في المجلد المحدد
  async saveFile(file: Buffer, fileName: string, category: 'products' | 'profiles' | 'logos' | 'colors' | 'shapes' | 'videos' | 'tiktok' | 'general'): Promise<string> {
    const fileExtension = path.extname(fileName);
    const uniqueName = `${randomUUID()}${fileExtension}`;
    
    let targetDir: string;
    switch (category) {
      case 'products':
        targetDir = this.productsDir;
        break;
      case 'profiles':
        targetDir = this.profilesDir;
        break;
      case 'logos':
        targetDir = this.logosDir;
        break;
      case 'colors':
        targetDir = this.colorsDir;
        break;
      case 'shapes':
        targetDir = this.shapesDir;
        break;
      case 'videos':
        targetDir = this.videosDir;
        break;
      case 'tiktok':
        targetDir = this.tiktokDir;
        break;
      case 'general':
        targetDir = this.generalDir;
        break;
    }

    const filePath = path.join(targetDir, uniqueName);
    await fs.writeFile(filePath, file);
    
    // إرجاع المسار النسبي للوصول عبر الويب
    return `/uploads/${category}/${uniqueName}`;
  }

  // حذف ملف
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // تحويل المسار النسبي إلى مسار مطلق
      const absolutePath = path.join("./public", filePath);
      await fs.unlink(absolutePath);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  // التحقق من وجود ملف
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = path.join("./public", filePath);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  // الحصول على معلومات الملف
  async getFileInfo(filePath: string) {
    try {
      const absolutePath = path.join("./public", filePath);
      const stats = await fs.stat(absolutePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  // تنظيف الملفات القديمة (اختياري)
  async cleanupOldFiles(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const dirs = [this.productsDir, this.profilesDir, this.logosDir, this.videosDir, this.tiktokDir, this.generalDir];
      
      for (const dir of dirs) {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.birthtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}

export const localStorage = new LocalStorageService();