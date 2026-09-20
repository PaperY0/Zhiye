$ErrorActionPreference = "Stop"
$projectDir = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not (Test-Path -LiteralPath (Join-Path $projectDir "node_modules"))) {
  Write-Host "First run: installing frontend dependencies..." -ForegroundColor Cyan
  pnpm install --frozen-lockfile
}

if (-not (Test-Path -LiteralPath (Join-Path $projectDir ".env.local"))) {
  Copy-Item -LiteralPath (Join-Path $projectDir ".env.example") -Destination (Join-Path $projectDir ".env.local")
  Write-Warning "Created .env.local. Add DEEPSEEK_API_KEY and restart the local AI service."
}

Write-Host "Opening frontend and local AI service windows..." -ForegroundColor Green
Start-Process powershell.exe -WorkingDirectory $projectDir -ArgumentList '-NoExit', '-Command', 'pnpm dev'
Start-Process powershell.exe -WorkingDirectory $projectDir -ArgumentList '-NoExit', '-Command', '.\scripts\start-local-ai.ps1'

Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:8443/#/teacher/classroom"

Write-Host "Frontend: http://127.0.0.1:8443/#/teacher/classroom" -ForegroundColor Green
Write-Host "Both services are running. Close their windows to stop them."
