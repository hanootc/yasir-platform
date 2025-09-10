# دليل إعداد منصة سندي برو للتطوير المحلي

## المتطلبات الأساسية

### 1. تثبيت Node.js
- قم بتحميل Node.js من: https://nodejs.org
- اختر النسخة LTS (Long Term Support)
- تأكد من تثبيت npm معه

### 2. قاعدة البيانات
يمكنك استخدام إحدى الخيارات التالية:

#### الخيار الأول: PostgreSQL محلي
```bash
# تحميل PostgreSQL من: https://www.postgresql.org/download/
# إنشاء قاعدة بيانات جديدة
createdb sanadi_pro_dev
```

#### الخيار الثاني: Neon Database (مجاني)
- اذهب إلى: https://neon.tech
- أنشئ حساب مجاني
- أنشئ قاعدة بيانات جديدة
- انسخ رابط الاتصال

#### الخيار الثالث: SQLite (للتطوير السريع)
- لا يحتاج تثبيت إضافي
- سيتم إنشاء ملف قاعدة بيانات محلي

## خطوات الإعداد

### 1. تشغيل سكريبت الإعداد
```cmd
# في مجلد المشروع
dev-setup.bat
```

### 2. تحديث ملف البيئة
افتح ملف `.env` وحدث المعلومات التالية:

```env
# لـ PostgreSQL محلي
DATABASE_URL="postgresql://username:password@localhost:5432/sanadi_pro_dev"

# لـ Neon Database
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/sanadi_pro_dev"

# لـ SQLite
DATABASE_URL="file:./dev.db"
```

### 3. تطبيق مخطط قاعدة البيانات
```cmd
npm run db:push
```

### 4. تشغيل التطبيق
```cmd
npm run dev
```

## الوصول للتطبيق

- **الرابط المحلي:** http://localhost:3000
- **Backend API:** http://localhost:3000/api
- **ملفات الرفع:** http://localhost:3000/uploads

## أوامر مفيدة

```cmd
# تشغيل التطوير
npm run dev

# بناء للإنتاج
npm run build

# تشغيل الإنتاج
npm start

# فحص الأنواع
npm run check

# تحديث قاعدة البيانات
npm run db:push
```

## حل المشاكل الشائعة

### خطأ قاعدة البيانات
```cmd
# تأكد من صحة رابط قاعدة البيانات في .env
# أعد تطبيق المخطط
npm run db:push
```

### خطأ المنافذ
```cmd
# إذا كان المنفذ 3000 مستخدم، غير PORT في .env
PORT=3001
```

### مشاكل التبعيات
```cmd
# احذف node_modules وأعد التثبيت
rmdir /s node_modules
npm install
```

## التطوير والتعديل

### بنية المشروع
```
├── client/          # Frontend (React)
├── server/          # Backend (Express)
├── shared/          # مخططات مشتركة
├── public/          # ملفات ثابتة
└── migrations/      # مخططات قاعدة البيانات
```

### التعديل المباشر
- عند تعديل ملفات Frontend: سيتم إعادة التحميل تلقائياً
- عند تعديل ملفات Backend: سيتم إعادة التشغيل تلقائياً
- عند تعديل ملفات المخططات: شغل `npm run db:push`

## ربط بالسيرفر المحلي

### للتطوير المتقدم
يمكنك ربط التطبيق بسيرفر محلي باستخدام:

1. **Docker** (إذا كان متوفر)
2. **VM مع AlmaLinux**
3. **WSL2 مع Ubuntu**

### مزامنة الملفات
```cmd
# لمزامنة التغييرات مع سيرفر بعيد
rsync -avz ./ user@server:/path/to/app/
```

## الدعم

إذا واجهت أي مشاكل:
1. تأكد من تثبيت Node.js بشكل صحيح
2. تحقق من ملف `.env`
3. راجع سجلات الأخطاء في Terminal
4. تأكد من عمل قاعدة البيانات
