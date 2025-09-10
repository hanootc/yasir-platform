# تثبيت Node.js - خطوة بخطوة

## 1. تحميل Node.js

اذهب إلى: **https://nodejs.org**

اختر النسخة **LTS** (الموصى بها)

## 2. تثبيت Node.js

1. شغل الملف المحمل
2. اتبع التعليمات
3. **مهم:** تأكد من تحديد "Add to PATH" أثناء التثبيت

## 3. إعادة تشغيل Terminal

بعد التثبيت:
1. أغلق PowerShell/Command Prompt
2. افتح PowerShell جديد
3. اذهب لمجلد المشروع: `cd C:\Users\Yasirna\Desktop\sanadw`

## 4. اختبار التثبيت

```cmd
node --version
npm --version
```

يجب أن ترى أرقام الإصدارات

## 5. تشغيل المشروع

```cmd
# تثبيت التبعيات
npm install

# إعداد قاعدة البيانات
node setup-local-db.js

# تطبيق مخطط قاعدة البيانات
npm run db:push

# تشغيل التطبيق
npm run dev
```

## إذا واجهت مشاكل

### المشكلة: "node is not recognized"
**الحل:** أعد تثبيت Node.js وتأكد من تحديد "Add to PATH"

### المشكلة: خطأ في npm
**الحل:** 
```cmd
# حذف node_modules وإعادة التثبيت
rmdir /s node_modules
npm install
```

### المشكلة: خطأ في قاعدة البيانات
**الحل:**
```cmd
npm run db:push --force
```
