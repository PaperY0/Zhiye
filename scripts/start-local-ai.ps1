$ErrorActionPreference = "Stop"

if (-not $env:DEEPSEEK_API_KEY) {
  Write-Warning "未设置 DEEPSEEK_API_KEY：本地题图 OCR 可以使用，但课堂 AI 初稿不可用。"
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Warning "未检测到 ffmpeg：题图 OCR 可以使用，但浏览器音频转写需要安装 ffmpeg 并加入 PATH。"
}

$serviceDir = Join-Path $PSScriptRoot "..\services\local-ai"
python -m pip install -r (Join-Path $serviceDir "requirements.txt")
Write-Host "首次题图 OCR 识别会下载 PaddleOCR 本地模型；题图不会上传到 DeepSeek。"
python -m uvicorn server:app --app-dir $serviceDir --host 127.0.0.1 --port 8787
