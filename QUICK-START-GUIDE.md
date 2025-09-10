# 🚀 دليل التشغيل السريع - Sanadi Pro

## ✅ التطبيق يعمل الآن!

### 🌐 الوصول للتطبيق
- **الواجهة الأمامية**: http://localhost:5173
- **الخادم الخلفي**: http://localhost:5001
- **قاعدة البيانات**: SQLite محلية (local-dev.db)

### 🔧 إدارة التطبيق

#### تشغيل التطبيق:
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH; npm run dev
```

#### إيقاف التطبيق:
- اضغط `Ctrl+C` في Terminal
- أو أغلق نافذة PowerShell

#### إعادة تشغيل التطبيق:
```powershell
# أوقف العمليات الحالية
taskkill /F /IM node.exe

# شغل التطبيق مرة أخرى
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH; npm run dev
```

### 📁 بنية المشروع

```
sanadw/
├── client/          # الواجهة الأمامية (React + Vite)
│   ├── src/         # الكود المصدري
│   └── public/      # الملفات الثابتة
├── server/          # الخادم الخلفي (Express + TypeScript)
├── shared/          # الكود المشترك
├── public/uploads/  # ملفات الرفع
├── .env            # متغيرات البيئة
└── local-dev.db    # قاعدة البيانات المحلية
```

### 🛠️ التطوير

#### تعديل الواجهة الأمامية:
- عدل الملفات في `client/src/`
- التغييرات ستظهر فوراً (Hot Reload)

#### تعديل الخادم الخلفي:
- عدل الملفات في `server/`
- الخادم سيعيد التشغيل تلقائياً

#### إدارة قاعدة البيانات:
```powershell
# عرض قاعدة البيانات
npm run db:studio

# تطبيق تغييرات المخطط
npm run db:push

# إنشاء migration جديد
npm run db:generate
```

### 🔍 استكشاف الأخطاء

#### إذا لم يعمل Node.js:
```powershell
# تحقق من التثبيت
"C:\Program Files\nodejs\node.exe" --version

# أضف للمسار مؤقتاً
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
```

#### إذا كان المنفذ مشغول:
```powershell
# أوقف جميع عمليات Node.js
taskkill /F /IM node.exe

# أو غير المنفذ في .env
```

#### إذا كانت هناك مشاكل في التبعيات:
```powershell
# أعد تثبيت التبعيات
rm -rf node_modules package-lock.json
npm install
```

### 📊 مراقبة التطبيق

#### سجلات التطبيق:
- تظهر في نافذة PowerShell
- الأخطاء تظهر باللون الأحمر
- الرسائل العادية تظهر بألوان مختلفة

#### فحص الحالة:
- Frontend: تحقق من http://localhost:5173
- Backend: تحقق من http://localhost:5001/api/health (إذا كان متوفر)

### 🎯 الخطوات التالية

1. **اختبر الميزات الأساسية** في التطبيق
2. **أضف بيانات تجريبية** لاختبار الوظائف
3. **راجع الكود** وفهم البنية
4. **طور ميزات جديدة** حسب الحاجة

---

## 🆘 الدعم

إذا واجهت أي مشاكل:
1. تحقق من سجلات الأخطاء في Terminal
2. تأكد من أن Node.js مثبت ويعمل
3. تحقق من أن المنافذ غير مشغولة
4. أعد تشغيل التطبيق

**التطبيق جاهز للاستخدام والتطوير! 🎉**
