@echo off
chcp 65001 >nul
echo ═══════════════════════════════════════════════════
echo تثبيت Node.js لتطبيق سنادي برو
echo ═══════════════════════════════════════════════════
echo.

echo 1. تحميل Node.js...
echo يرجى اتباع الخطوات التالية:
echo.
echo أ) اذهب إلى الرابط التالي:
echo    https://nodejs.org/en/download/
echo.
echo ب) حمل النسخة LTS (الموصى بها) لنظام Windows
echo    - اختر "Windows Installer (.msi)" للنظام 64-bit
echo.
echo ج) قم بتشغيل الملف المحمل واتبع خطوات التثبيت
echo    - اقبل جميع الإعدادات الافتراضية
echo    - تأكد من تحديد "Add to PATH" أثناء التثبيت
echo.
echo د) بعد انتهاء التثبيت، أعد تشغيل Command Prompt
echo.
echo ═══════════════════════════════════════════════════
echo بعد تثبيت Node.js، قم بتشغيل:
echo .\verify-nodejs.bat
echo ═══════════════════════════════════════════════════
echo.
pause

REM فتح الرابط في المتصفح
start https://nodejs.org/en/download/
