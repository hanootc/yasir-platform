@echo off
chcp 65001 >nul
echo ═══════════════════════════════════════════════════
echo تشغيل تطبيق سنادي برو مع المسار الكامل
echo ═══════════════════════════════════════════════════
echo.

REM إيقاف أي عمليات Node.js قيد التشغيل
taskkill /f /im node.exe 2>nul

REM تعيين مسار Node.js
set "NODEJS_PATH=C:\Program Files\nodejs"
if not exist "%NODEJS_PATH%\node.exe" (
    set "NODEJS_PATH=C:\Program Files (x86)\nodejs"
)

if not exist "%NODEJS_PATH%\node.exe" (
    echo ❌ لم يتم العثور على Node.js
    echo يرجى تثبيت Node.js من https://nodejs.org
    pause
    exit /b 1
)

echo ✅ تم العثور على Node.js في: %NODEJS_PATH%
echo.

REM إضافة Node.js إلى PATH
set "PATH=%NODEJS_PATH%;%PATH%"

echo فحص إصدار Node.js...
"%NODEJS_PATH%\node.exe" --version
echo.

echo فحص إصدار npm...
"%NODEJS_PATH%\npm.cmd" --version
echo.

echo تثبيت التبعيات...
"%NODEJS_PATH%\npm.cmd" install
if %errorlevel% neq 0 (
    echo ❌ فشل في تثبيت التبعيات
    pause
    exit /b 1
)

echo.
echo تشغيل التطبيق...
echo الرابط: http://localhost:5000
echo المدير: admin@sanadi.pro / admin123
echo.

"%NODEJS_PATH%\npm.cmd" run dev
