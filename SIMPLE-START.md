# البدء البسيط - منصة سندي برو

## الخطوة الأولى: تثبيت Node.js

1. **تحميل:** https://nodejs.org
2. **تثبيت:** شغل الملف واتبع التعليمات
3. **مهم:** تأكد من تحديد "Add to PATH"
4. **إعادة تشغيل:** أغلق وافتح PowerShell جديد

## الخطوة الثانية: تشغيل الأوامر

```cmd
# اختبار Node.js
node --version
npm --version

# تثبيت التبعيات
npm install

# إعداد البيئة
copy .env.local .env

# إعداد قاعدة البيانات
node setup-local-db.js

# تطبيق قاعدة البيانات
npm run db:push

# تشغيل التطبيق
npm run dev
```

## الخطوة الثالثة: الوصول للتطبيق

افتح المتصفح على: **http://localhost:5000**

---

## إذا واجهت مشاكل:

**Node.js غير معروف:**
- أعد تثبيت Node.js
- تأكد من "Add to PATH"
- أعد تشغيل PowerShell

**خطأ في npm install:**
```cmd
rmdir /s node_modules
npm install
```

**خطأ في قاعدة البيانات:**
```cmd
npm run db:push --force
```
