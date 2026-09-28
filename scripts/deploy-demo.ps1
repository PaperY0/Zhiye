$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

pnpm build
if ($LASTEXITCODE -ne 0) { throw "前端构建失败，已停止部署。" }

pnpm dlx vercel@60.1.3 link --yes --project zhiye-demo --cwd dist
if ($LASTEXITCODE -ne 0) { throw "Vercel 项目关联失败，已停止部署。" }

# Vercel link 会在构建目录写入临时身份文件；静态站点不需要上传它。
$temporaryEnv = Join-Path $projectRoot "dist\.env.local"
if (Test-Path -LiteralPath $temporaryEnv) {
  Remove-Item -LiteralPath $temporaryEnv
}

pnpm dlx vercel@60.1.3 deploy --prod --yes --cwd dist
if ($LASTEXITCODE -ne 0) { throw "Vercel 发布失败。" }
