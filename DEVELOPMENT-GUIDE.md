# دليل التطوير المحلي - منصة سندي برو

## 🚀 البدء السريع

### الطريقة الأسهل
```cmd
# تشغيل الإعداد التلقائي
quick-start.bat
```

### الطريقة اليدوية
```cmd
# 1. تثبيت التبعيات
npm install

# 2. إعداد البيئة
node setup-local-db.js

# 3. تطبيق قاعدة البيانات
npm run db:push

# 4. تشغيل التطبيق
npm run dev
```

## 📁 بنية المشروع

```
sanadw/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # مكونات React
│   │   ├── hooks/          # React Hooks
│   │   └── lib/           # مكتبات مساعدة
│   └── index.html
├── server/                 # Backend (Express + TypeScript)
│   ├── index.ts           # نقطة البداية
│   ├── auth.ts            # نظام المصادقة
│   └── db.ts              # إعدادات قاعدة البيانات
├── shared/                 # مخططات مشتركة
│   └── schema.ts          # مخطط قاعدة البيانات
├── public/                 # ملفات ثابتة
│   └── uploads/           # ملفات المرفوعة
└── migrations/             # تحديثات قاعدة البيانات
```

## 🛠️ أوامر التطوير

### تشغيل التطبيق
```cmd
npm run dev              # تشغيل Frontend + Backend
npm run dev:client       # Frontend فقط (المنفذ 3000)
npm run dev:server       # Backend فقط (المنفذ 3001)
```

### قاعدة البيانات
```cmd
npm run db:push          # تطبيق التغييرات
npm run db:studio        # فتح Drizzle Studio
npm run db:generate      # إنشاء ملفات Migration
```

### البناء والإنتاج
```cmd
npm run build            # بناء للإنتاج
npm run build:production # بناء مع الإعدادات الكاملة
npm run start            # تشغيل الإنتاج
```

### أدوات مساعدة
```cmd
npm run check            # فحص TypeScript
npm run clean            # تنظيف ملفات البناء
npm run reset            # إعادة تثبيت التبعيات
```

## 🔧 إعداد البيئة

### ملف .env
```env
# قاعدة البيانات
DATABASE_URL="file:./dev.db"

# التطبيق
NODE_ENV="development"
PORT=3000
DOMAIN="http://localhost:3000"

# الجلسات
SESSION_SECRET="your-secret-key"

# المدفوعات (وضع التجربة)
ZAINCASH_FORCE_SIMULATION=true
```

### خيارات قاعدة البيانات

#### SQLite (للتطوير السريع)
```env
DATABASE_URL="file:./dev.db"
```

#### PostgreSQL محلي
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/sanadi_dev"
```

#### Neon Database (مجاني)
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/sanadi_dev"
```

## 🌐 الوصول للتطبيق

- **Frontend:** http://localhost:5000
- **Backend API:** http://localhost:5001/api
- **Database Studio:** http://localhost:4983 (بعد تشغيل `npm run db:studio`)

## 🔄 التطوير والتعديل

### Hot Reload
- **Frontend:** تحديث تلقائي عند تعديل ملفات React
- **Backend:** إعادة تشغيل تلقائي عند تعديل ملفات Server
- **Database:** تطبيق يدوي بـ `npm run db:push`

### إضافة ميزات جديدة
1. عدل المخطط في `shared/schema.ts`
2. شغل `npm run db:push`
3. أضف API endpoints في `server/`
4. أضف UI components في `client/src/`

## 🐛 حل المشاكل

### خطأ المنافذ
```cmd
# غير المنفذ في .env
PORT=5001
```

### خطأ قاعدة البيانات
```cmd
# أعد تطبيق المخطط
npm run db:push --force
```

### خطأ التبعيات
```cmd
# أعد تثبيت التبعيات
npm run reset
```

### خطأ TypeScript
```cmd
# فحص الأخطاء
npm run check
```

## 📦 إضافة تبعيات جديدة

### Frontend
```cmd
npm install package-name
```

### Backend
```cmd
npm install package-name
npm install -D @types/package-name
```

## 🚀 النشر للإنتاج

### بناء محلي
```cmd
npm run build:production
```

### نقل للسيرفر
```cmd
# نسخ مجلد dist للسيرفر
scp -r dist/ user@server:/path/to/app/
```

## 📝 ملاحظات مهمة

- استخدم `npm run dev` للتطوير العادي
- استخدم `npm run build:production` للنشر
- تأكد من تحديث `.env` حسب البيئة
- راجع `DEPLOYMENT_GUIDE.md` للنشر على السيرفر

## 🆘 الدعم

إذا واجهت مشاكل:
1. تأكد من تثبيت Node.js 18+
2. تحقق من ملف `.env`
3. شغل `npm run clean && npm install`
4. راجع سجلات الأخطاء في Terminal
