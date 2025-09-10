@echo off
chcp 65001 >nul
echo ═══════════════════════════════════════════════════
echo فحص تثبيت Node.js
echo ═══════════════════════════════════════════════════
echo.

echo فحص إصدار Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت أو غير متاح
    echo يرجى تشغيل install-nodejs.bat أولاً
    pause
    exit /b 1
)

echo.
echo فحص إصدار npm...
npm --version
if %errorlevel% neq 0 (
    echo ❌ npm غير متاح
    pause
    exit /b 1
)

echo.
echo ✅ Node.js و npm مثبتان بنجاح!
echo.
echo الآن يمكنك تشغيل التطبيق باستخدام:
echo .\start-app.bat
echo.
echo أو:
echo npm install
echo npm run dev
echo.
pause
