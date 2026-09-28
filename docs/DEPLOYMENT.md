# 知野部署与验收

## 当前可部署的形态

当前版本是**单机演示原型**：前端在同一浏览器内通过本地存储保存任务、学生、家长与教师数据，并在同源标签页之间同步；AI 服务只监听本机。它适合演示、评审和单机验收。不同设备、不同浏览器不会共享业务数据，角色切换也不是身份认证。不要把当前构建当作可存放真实学生资料的公网学校系统。

端口保持不变：前端 `127.0.0.1:8443`，本地 AI `127.0.0.1:8787`。GitHub 仓库保存源码；推送到 GitHub 本身不会启动这两个服务。

## 已发布的公开演示版

地址：[zhiye-demo.vercel.app](https://zhiye-demo.vercel.app)。它只托管静态前端；每位访客的任务、成绩与消息只保存在自己的浏览器中，不跨设备同步。公网演示中的 AI 请求会在访问本机地址前停止，并显示说明；本地 8443/8787 的 AI 流程仍可用。请勿在公开演示中输入真实学生资料。

当前 Vercel 项目由 CLI 发布，尚未连接 GitHub 仓库。提交和推送源码后，在已登录该 Vercel 项目的机器上运行：

```powershell
.\scripts\deploy-demo.ps1
```

脚本构建前端，把 `dist/` 关联到现有的 `zhiye-demo` 项目并发布生产版本。它会移除 Vercel CLI 临时写入构建目录的身份文件。发布后检查生产地址和教师、学生、家长入口；仅推送 GitHub 不会自动更新演示站。

## 从 GitHub 在 Windows 上运行

准备 Node.js `^20.19.0` 或 `>=22.12.0`、pnpm `10.28.0`、Python `3.11–3.12` 与 FFmpeg。课堂录音转写和题图 OCR 首次运行需要下载本地模型，需预留磁盘空间和网络连接。

```powershell
git clone https://github.com/PaperY0/Zhiye.git
Set-Location Zhiye
corepack enable
corepack prepare pnpm@10.28.0 --activate
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

只在本机的 `.env.local` 中填写 `DEEPSEEK_API_KEY`，不要上传该文件、粘贴密钥到聊天或放入截图。其余地址保持示例值即可。分别启动两个窗口：

```powershell
# 窗口一：AI 服务
.\scripts\start-local-ai.ps1
```

```powershell
# 窗口二：前端
pnpm dev
```

打开 `http://127.0.0.1:8443/#/teacher/classroom`。如需运行构建后的前端，先停止 `pnpm dev`，再运行 `pnpm build` 和 `pnpm preview`；预览仍使用 8443。不要同时启动 dev 与 preview，占用同一个端口。

## 上线前本机验收

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
pnpm audit --audit-level moderate
python -m pytest services/local-ai -q
curl.exe --noproxy '*' http://127.0.0.1:8787/health
curl.exe --noproxy '*' -I http://127.0.0.1:8443/
```

`/health` 返回 `deepseek: false` 表示 AI 密钥未配置或服务尚未读取更新后的环境；请检查本机 `.env.local` 并重启 AI 服务。前端与 AI 的实际生成还需要一次人工操作验证，因为自动测试不调用付费模型，也不下载 ASR/OCR 模型。

数据库包 `packages/db` 目前仅提供 schema、迁移和种子契约，前端没有连接它。若要单独验证 schema，请在当前 PowerShell 进程设置自己的 `DATABASE_URL`，然后运行 `pnpm --filter @zhiye/db validate`。不需要数据库也能运行当前演示。

## 公网正式服务需要完成的工程

要让真实教师、学生和家长跨设备使用，必须先接入持久化后端与身份认证，按角色和班级在服务端授权；把本地 AI 改为受认证保护的 HTTPS API，并配置允许的站点来源、调用限额和密钥管理；为课堂音频与题图建立存储、访问和删除规则。完成后再选择前端托管和后端运行平台。仅把 `dist/` 发布为静态网站会显示各访问者各自独立的演示数据，也不能可靠调用其电脑上的 `127.0.0.1:8787`。
