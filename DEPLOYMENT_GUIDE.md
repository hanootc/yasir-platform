# دليل نشر منصة سندي برو على AlmaLinux 9

## نظرة عامة
هذا الدليل الشامل لنشر منصة سندي برو على خادم AlmaLinux 9 مع CyberPanel. المنصة عبارة عن تطبيق Node.js مدمج مع قاعدة بيانات PostgreSQL.

---

## المتطلبات الأساسية

### خادم AlmaLinux 9
- **نظام التشغيل:** AlmaLinux 9
- **لوحة التحكم:** CyberPanel
- **المعالج:** 2 نواة على الأقل
- **الذاكرة:** 2GB RAM على الأقل
- **التخزين:** 20GB مساحة فارغة
- **الشبكة:** IPv4 عام
- **الدومين:** sanadi.pro (IP: 147.93.59.185)

### البرامج المطلوبة
- **Node.js 18+** (سيتم تثبيته)
- **PM2** (سيتم تثبيته)
- **PostgreSQL** (قاعدة بيانات)
- **Nginx** (Reverse Proxy)

---

## خطوات التحضير

### 1. تسجيل الدخول للخادم
```bash
ssh root@147.93.59.185
```

### 2. تحديث النظام
```bash
dnf update -y
dnf install -y curl wget git
```

### 3. تثبيت Node.js
```bash
# تثبيت NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# تثبيت Node.js
dnf install -y nodejs

# التحقق من التثبيت
node --version
npm --version
```

### 4. تثبيت PM2
```bash
npm install -g pm2
pm2 startup
```

### 5. إعداد PostgreSQL
```bash
# تثبيت PostgreSQL
dnf install -y postgresql postgresql-server

# تهيئة قاعدة البيانات
postgresql-setup --initdb

# تشغيل الخدمة
systemctl enable postgresql
systemctl start postgresql

# إنشاء مستخدم وقاعدة بيانات
sudo -u postgres psql
```

في PostgreSQL:
```sql
CREATE USER "app.sanadi.pro" WITH PASSWORD '@yaserxp1992';
CREATE DATABASE sanadi_pro OWNER "app.sanadi.pro";
GRANT ALL PRIVILEGES ON DATABASE sanadi_pro TO "app.sanadi.pro";
\q
```

---

## نقل الملفات

### 1. من جهازك المحلي
```bash
# نقل مجلد dist كامل للخادم
scp -r ./dist/ root@147.93.59.185:/home/sanadi.pro/public_html/

# أو استخدم rsync للنقل المحسن
rsync -avz ./dist/ root@147.93.59.185:/home/sanadi.pro/public_html/
```

### 2. التحقق من نقل الملفات
```bash
# على الخادم
cd /home/sanadi.pro/public_html/
ls -la

# يجب أن ترى هذه الملفات:
# - index.js (1.1MB)
# - public/ (4.7MB)
# - .env
# - ecosystem.config.cjs
# - package.json
# - start-production.sh
# - create-admin.sh
```

---

## التثبيت والتشغيل

### 1. إعطاء صلاحيات التنفيذ
```bash
cd /home/sanadi.pro/public_html/
chmod +x *.sh
```

### 2. تعديل ملف البيئة (اختياري)
```bash
nano .env
```

تأكد من صحة معلومات قاعدة البيانات:
```env
DATABASE_URL="postgresql://app.sanadi.pro:%40yaserxp1992@localhost:5432/sanadi_pro"
NODE_ENV="production"
PORT=5000
DOMAIN="https://sanadi.pro"
```

### 3. تشغيل التطبيق
```bash
# تشغيل السكريبت التلقائي
./start-production.sh
```

هذا السكريبت سيقوم بـ:
- تثبيت التبعيات (`npm ci --omit=dev`)
- إنشاء مجلدات الـ logs
- إيقاف أي نسخة سابقة
- تشغيل التطبيق باستخدام PM2
- حفظ إعدادات PM2

### 4. إنشاء المستخدم الإداري
```bash
./create-admin.sh
```

---

## إعداد Nginx (Reverse Proxy)

### 1. إنشاء ملف إعداد الموقع
```bash
nano /etc/nginx/conf.d/sanadi.pro.conf
```

### 2. إضافة الإعدادات
```nginx
server {
    listen 80;
    server_name sanadi.pro www.sanadi.pro;
    
    # إعادة توجيه HTTP إلى HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sanadi.pro www.sanadi.pro;
    
    # شهادات SSL (تثبت عبر CyberPanel)
    ssl_certificate /etc/ssl/certs/sanadi.pro.crt;
    ssl_certificate_key /etc/ssl/private/sanadi.pro.key;
    
    # إعدادات SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # إعادة التوجيه للتطبيق
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # ملفات ثابتة
    location /assets/ {
        alias /home/sanadi.pro/public_html/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. اختبار وإعادة تشغيل Nginx
```bash
nginx -t
systemctl reload nginx
```

---

## التحقق من التشغيل

### 1. فحص حالة PM2
```bash
pm2 status
pm2 logs sanadi-pro
```

### 2. فحص الشبكة
```bash
# فحص المنفذ 5000
netstat -tulpn | grep :5000

# فحص الاتصال المحلي
curl -I http://localhost:5000
```

### 3. فحص قاعدة البيانات
```bash
# اتصال بقاعدة البيانات
sudo -u postgres psql -d sanadi_pro

# عرض الجداول
\dt

# الخروج
\q
```

### 4. اختبار الموقع
افتح المتصفح وانتقل إلى:
- **الرابط:** `https://sanadi.pro`
- **تسجيل الدخول:** `admin@sanadi.pro`
- **كلمة المرور:** `admin123`

---

## أوامر المراقبة والصيانة

### PM2 Commands
```bash
# عرض الحالة
pm2 status

# عرض السجلات
pm2 logs sanadi-pro

# إعادة التشغيل
pm2 restart sanadi-pro

# إيقاف التطبيق
pm2 stop sanadi-pro

# بدء التطبيق
pm2 start sanadi-pro

# حذف التطبيق من PM2
pm2 delete sanadi-pro

# مراقبة مستمرة
pm2 monit
```

### System Commands
```bash
# فحص استخدام الذاكرة
free -h

# فحص استخدام القرص
df -h

# فحص العمليات
top

# فحص سجلات النظام
journalctl -u nginx -f
```

---

## حل المشاكل الشائعة

### 1. التطبيق لا يبدأ
```bash
# فحص السجلات
pm2 logs sanadi-pro --err

# فحص ملف البيئة
cat .env

# إعادة تثبيت التبعيات
npm ci --omit=dev
```

### 2. خطأ قاعدة البيانات
```bash
# فحص اتصال قاعدة البيانات
sudo -u postgres psql -d sanadi_pro -c "SELECT version();"

# إعادة إنشاء الجداول
npm run db:push --force
```

### 3. خطأ 502 Bad Gateway
```bash
# فحص حالة التطبيق
pm2 status

# فحص إعدادات Nginx
nginx -t

# إعادة تشغيل Nginx
systemctl restart nginx
```

### 4. بطء في الأداء
```bash
# فحص استخدام الموارد
pm2 monit

# زيادة عدد النسخ
pm2 scale sanadi-pro +2

# إعادة تشغيل مع إعدادات محسنة
pm2 restart sanadi-pro --update-env
```

---

## النسخ الاحتياطي

### 1. نسخة احتياطية من قاعدة البيانات
```bash
# إنشاء نسخة احتياطية
sudo -u postgres pg_dump sanadi_pro > backup_$(date +%Y%m%d).sql

# استعادة النسخة الاحتياطية
sudo -u postgres psql sanadi_pro < backup_20250904.sql
```

### 2. نسخة احتياطية من الملفات
```bash
# نسخ الملفات
tar -czf sanadi_backup_$(date +%Y%m%d).tar.gz /home/sanadi.pro/public_html/

# استعادة الملفات
tar -xzf sanadi_backup_20250904.tar.gz -C /
```

---

## التحديثات

### 1. تحديث التطبيق
```bash
# إيقاف التطبيق
pm2 stop sanadi-pro

# نسخ الملفات الجديدة
scp -r ./dist/ root@147.93.59.185:/home/sanadi.pro/public_html/

# تشغيل التطبيق
pm2 start sanadi-pro
```

### 2. تحديث قاعدة البيانات
```bash
# تطبيق التغييرات
npm run db:push

# أو إجباري
npm run db:push --force
```

---

## الأمان

### 1. إعدادات الجدار الناري
```bash
# فتح المنافذ المطلوبة فقط
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=5000/tcp
firewall-cmd --reload
```

### 2. تحديث كلمات المرور
```bash
# تغيير كلمة مرور قاعدة البيانات
sudo -u postgres psql
ALTER USER "app.sanadi.pro" PASSWORD 'new_password';

# تحديث ملف .env
nano .env
```

### 3. تحديث النظام
```bash
# تحديث دوري للنظام
dnf update -y

# تحديث Node.js
npm install -g npm@latest
```

---

## ملفات الإنتاج الجاهزة

### محتويات مجلد dist/
```
dist/
├── index.js                 # تطبيق Backend مدمج (1.1MB)
├── public/                  # ملفات Frontend (4.7MB)
│   ├── assets/             # ملفات CSS/JS مُحسّنة
│   ├── index.html          # الصفحة الرئيسية
│   └── *.svg, *.png        # الشعارات والأيقونات
├── .env                    # متغيرات البيئة
├── ecosystem.config.cjs    # إعدادات PM2
├── package.json           # التبعيات (145 package)
├── start-production.sh    # سكريبت التشغيل التلقائي
└── create-admin.sh       # إنشاء المستخدم الإداري
```

### مميزات الملفات المُحضرة
- ✅ **مدمجة بالكامل:** كل التبعيات مدمجة في ملف واحد
- ✅ **محسنة للإنتاج:** مضغوطة ومُحسّنة للأداء
- ✅ **سكريبتات تلقائية:** تشغيل وإعداد تلقائي
- ✅ **متغيرات مُعدّة:** جميع الإعدادات جاهزة
- ✅ **مستقلة:** لا تحتاج للملفات المصدر

---

## معلومات الاتصال والدعم

### بيانات المستخدم الافتراضي
- **البريد الإلكتروني:** admin@sanadi.pro
- **كلمة المرور:** admin123
- **الدور:** Super Admin

### ملفات مهمة
- **التطبيق:** `/home/sanadi.pro/public_html/`
- **السجلات:** `/home/sanadi.pro/public_html/logs/`
- **البيئة:** `/home/sanadi.pro/public_html/.env`
- **إعدادات Nginx:** `/etc/nginx/conf.d/sanadi.pro.conf`

### مراجعة الإعداد
بعد اكتمال التثبيت، تأكد من:
- [ ] التطبيق يعمل على المنفذ 5000
- [ ] Nginx يعيد التوجيه بشكل صحيح
- [ ] SSL يعمل بشكل صحيح
- [ ] قاعدة البيانات متصلة
- [ ] تسجيل الدخول يعمل
- [ ] PM2 يحفظ الحالة تلقائياً

---

## خطوات النشر السريع

### للمطورين المتقدمين
```bash
# 1. نقل الملفات
scp -r ./dist/ root@147.93.59.185:/home/sanadi.pro/public_html/

# 2. على السيرفر
cd /home/sanadi.pro/public_html/
chmod +x *.sh && ./start-production.sh && ./create-admin.sh

# 3. اختبار
curl -I http://localhost:5000
```

### للمبتدئين
1. **نقل الملفات** باستخدام FileZilla أو WinSCP
2. **تشغيل السكريبتات** عبر SSH
3. **فتح الموقع** في المتصفح

---

**✅ تم إكمال دليل النشر بنجاح!**

الملفات جاهزة في مجلد `./dist/` ويمكن نقلها مباشرة للخادم بدون أي تعديلات إضافية.