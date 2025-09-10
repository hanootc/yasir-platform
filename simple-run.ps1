Write-Host "Starting Sanadi Pro Application..." -ForegroundColor Green

# Kill any existing node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Check for Node.js installation
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
)

$nodeExe = $null
$npmCmd = $null

foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodeExe = $path
        $npmCmd = $path.Replace("node.exe", "npm.cmd")
        Write-Host "Found Node.js at: $path" -ForegroundColor Green
        break
    }
}

if (-not $nodeExe) {
    Write-Host "Node.js not found. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check versions
Write-Host "Node.js version:" -ForegroundColor Yellow
& $nodeExe --version

Write-Host "npm version:" -ForegroundColor Yellow
& $npmCmd --version

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
& $npmCmd install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the application
Write-Host ""
Write-Host "Starting application..." -ForegroundColor Green
Write-Host "URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Admin: admin@sanadi.pro / admin123" -ForegroundColor Cyan
Write-Host ""

& $npmCmd run dev
