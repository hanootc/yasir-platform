# تنظيف جميع آثار Node.js و npm من النظام (للمستخدم Yasirna)

# حذف مجلد التثبيت الرئيسي لـ nodejs
if (Test-Path "C:\Program Files\nodejs") {
    Remove-Item -Recurse -Force "C:\Program Files\nodejs"
}

# حذف مجلد npm و npm-cache من AppData
if (Test-Path "$env:APPDATA\npm") {
    Remove-Item -Recurse -Force "$env:APPDATA\npm"
}
if (Test-Path "$env:APPDATA\npm-cache") {
    Remove-Item -Recurse -Force "$env:APPDATA\npm-cache"
}

# حذف مسار npm من PATH (User)
$oldPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$newPath = $oldPath -replace [regex]::Escape("C:\\Users\\Yasirna\\AppData\\Roaming\\npm;"), ""
$newPath = $newPath -replace [regex]::Escape("C:\\Users\\Yasirna\\AppData\\Roaming\\npm"), ""
[Environment]::SetEnvironmentVariable("PATH", $newPath, "User")

# حذف مسار nodejs من PATH (Machine)
$oldPathM = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$newPathM = $oldPathM -replace [regex]::Escape("C:\\Program Files\\nodejs;"), ""
$newPathM = $newPathM -replace [regex]::Escape("C:\\Program Files\\nodejs"), ""
[Environment]::SetEnvironmentVariable("PATH", $newPathM, "Machine")

Write-Host "تم تنظيف جميع آثار Node.js و npm بنجاح. يُفضل إعادة تشغيل الجهاز قبل تثبيت Node.js من جديد." -ForegroundColor Green
