@echo off
echo Starting Sanadi Pro Application...

REM Kill any existing node processes
taskkill /f /im node.exe 2>nul

REM Set Node.js path
set "NODEJS_PATH=C:\Program Files\nodejs"
if not exist "%NODEJS_PATH%\node.exe" (
    set "NODEJS_PATH=C:\Program Files (x86)\nodejs"
)

if not exist "%NODEJS_PATH%\node.exe" (
    echo Node.js not found. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Found Node.js at: %NODEJS_PATH%

REM Add Node.js to PATH
set "PATH=%NODEJS_PATH%;%PATH%"

echo Checking Node.js version...
"%NODEJS_PATH%\node.exe" --version

echo Checking npm version...
"%NODEJS_PATH%\npm.cmd" --version

echo Installing dependencies...
"%NODEJS_PATH%\npm.cmd" install
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting application...
echo URL: http://localhost:5000
echo Admin: admin@sanadi.pro / admin123
echo.

"%NODEJS_PATH%\npm.cmd" run dev
