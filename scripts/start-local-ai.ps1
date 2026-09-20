$ErrorActionPreference = "Stop"

# Load .env.local because Python does not read Vite env files automatically.
$projectDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = Join-Path $projectDir ".env.local"
if (Test-Path -LiteralPath $envFile) {
  Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$' -and -not $_.TrimStart().StartsWith('#')) {
      $name = $matches[1]
      $value = $matches[2].Trim().Trim('"').Trim("'")
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}

if (-not $env:DEEPSEEK_API_KEY) {
  Write-Warning "DEEPSEEK_API_KEY is not set. Local OCR may work, but lesson AI generation will not."
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Warning "ffmpeg was not found. Browser audio transcription requires ffmpeg in PATH."
}

$serviceDir = Join-Path $PSScriptRoot "..\services\local-ai"
python -m pip install -r (Join-Path $serviceDir "requirements.txt")
Write-Host "The first OCR run downloads a local PaddleOCR model. Images are not uploaded to DeepSeek."
python -m uvicorn server:app --app-dir $serviceDir --host 127.0.0.1 --port 8787
