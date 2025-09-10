@echo off
chcp 65001 >nul
echo ═══════════════════════════════════════════════════
echo فحص Node.js بعد التثبيت
echo ═══════════════════════════════════════════════════
echo.

echo فحص المسارات المحتملة لـ Node.js...
echo.

if exist "C:\Program Files\nodejs\node.exe" (
    echo ✅ تم العثور على Node.js في: C:\Program Files\nodejs\
    echo إصدار Node.js:
    "C:\Program Files\nodejs\node.exe" --version
    echo إصدار npm:
    "C:\Program Files\nodejs\npm.cmd" --version
    echo.
    echo إضافة Node.js إلى PATH...
    set "PATH=%PATH%;C:\Program Files\nodejs"
    echo تم إضافة Node.js إلى PATH مؤقتاً
    echo.
    echo الآن يمكنك تشغيل:
    echo npm install
    echo npm run dev
    echo.
) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo ✅ تم العثور على Node.js في: C:\Program Files (x86)\nodejs\
    echo إصدار Node.js:
    "C:\Program Files (x86)\nodejs\node.exe" --version
    echo إصدار npm:
    "C:\Program Files (x86)\nodejs\npm.cmd" --version
    echo.
    echo إضافة Node.js إلى PATH...
    set "PATH=%PATH%;C:\Program Files (x86)\nodejs"
    echo تم إضافة Node.js إلى PATH مؤقتاً
    echo.
    echo الآن يمكنك تشغيل:
    echo npm install
    echo npm run dev
    echo.
) else (
    echo ❌ لم يتم العثور على Node.js
    echo يرجى التأكد من تثبيت Node.js بشكل صحيح
    echo أو إعادة تشغيل Command Prompt
    echo.
)

pause
