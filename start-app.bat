@echo off
chcp 65001 >nul
echo Starting Sanadi Pro app on port 5000...

REM Stop any running Node.js processes
taskkill /f /im node.exe 2>nul

echo Starting app...
npm run dev
pause
