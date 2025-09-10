# 🚀 دليل البدء السريع - منصة سندي برو

## الخطوة الأولى: تثبيت Node.js

### تحميل Node.js
1. اذهب إلى: **https://nodejs.org**
2. اضغط على زر "Download Node.js (LTS)"
3. شغل الملف المحمل واتبع التعليمات
4. أعد تشغيل Command Prompt بعد التثبيت

### التحقق من التثبيت
افتح Command Prompt واكتب:
```cmd
node --version
npm --version
```

## الخطوة الثانية: إعداد المشروع

### تشغيل الإعداد التلقائي
```cmd
# في مجلد المشروع
dev-setup.bat
```

أو يدوياً:
```cmd
# 1. تثبيت التبعيات
npm install

# 2. إعداد قاعدة البيانات
node setup-local-db.js

# 3. تطبيق مخطط قاعدة البيانات
npm run db:push

# 4. تشغيل التطبيق
npm run dev
```

## الخطوة الثالثة: الوصول للتطبيق

افتح المتصفح على: **http://localhost:3000**

## خيارات قاعدة البيانات

### 1. SQLite (الأسهل - للتطوير)
```env
DATABASE_URL="file:./dev.db"
```

### 2. PostgreSQL محلي
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sanadi_pro_dev"
```

### 3. Neon Database (مجاني في السحابة)
```env
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/sanadi_pro_dev"
```

## أوامر مهمة

```cmd
# تشغيل التطوير
npm run dev

# بناء للإنتاج  
npm run build

# تحديث قاعدة البيانات
npm run db:push

# فحص الأخطاء
npm run check
```

## حل المشاكل

### إذا لم يعمل npm
- تأكد من تثبيت Node.js
- أعد تشغيل Command Prompt
- تأكد من وجودك في مجلد المشروع

### إذا لم تعمل قاعدة البيانات
- تحقق من ملف `.env`
- شغل `npm run db:push` مرة أخرى

### إذا كان المنفذ مستخدم
- غير `PORT=3001` في ملف `.env`

## 📞 الدعم

إذا واجهت مشاكل، تأكد من:
1. ✅ تثبيت Node.js
2. ✅ تشغيل `npm install`  
3. ✅ وجود ملف `.env`
4. ✅ تطبيق `npm run db:push`
