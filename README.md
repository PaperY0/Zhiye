# 知野 · 课堂复盘数字员工

知野是面向乡村小学教师的课堂复盘与精准补讲原型。当前参赛主线是：教师提交课堂录音和补讲目标，系统生成可追溯的复习卡、教师报告、补讲教案和练习，教师审核后发布。

当前可运行形态是本地演示原型。安装、验收及公网部署边界见 [部署与验收](docs/DEPLOYMENT.md)。

公开演示：[zhiye-demo.vercel.app](https://zhiye-demo.vercel.app)。各访客数据只保存在自己的浏览器中，公网演示不提供 AI 服务。

## 环境

- Node.js 20.19+ 或 22.12+
- pnpm 10.28.0
- Python 3.11–3.12（本地 AI 服务，题图 OCR 推荐 3.12）
- DeepSeek API Key（课堂转写后的结构化生成需要）

## 安装

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
```

把 DeepSeek Key 只填写在本机环境中。不要把 `.env.local` 提交到 Git 或放入截图、录屏和提交包。

## 启动前端

```powershell
pnpm dev
```

打开 `http://127.0.0.1:8443`。演示入口为教师端课堂：`#/teacher/classroom`。

## 启动本地 AI

在另一个 PowerShell 窗口运行：

```powershell
.\scripts\start-local-ai.ps1
```

服务默认监听 `http://127.0.0.1:8787`。题图 OCR 在本地运行；课堂录音由 FunASR 转写后，再交给 DeepSeek 生成教师可审核草稿。

## 快速启动

以后可以直接运行下面这一条命令，同时启动前端、本地 AI，并打开教师端页面：

```powershell
.\scripts\start-dev.ps1
```

脚本会自动读取 `.env.local` 中的 `DEEPSEEK_API_KEY`。如果系统阻止 PowerShell 脚本执行，可先运行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

## 验证

```powershell
pnpm typecheck
pnpm test
pnpm build
python -m pytest services/local-ai -q
```

完整测试涵盖前端、领域与数据库契约。生产构建产生的 `dist/` 不是提交源码的一部分；当前跨角色数据只在同一浏览器及同源标签页同步，不能作为真实多用户服务。

## 演示数据

- 默认入口使用可重复的脱敏验收数据。
- URL 加 `?data=empty` 可查看空数据状态。
- 真实演示只使用获得许可且脱敏的 1–2 分钟课堂音频。
- 教师发布的课堂内容须经过教师确认；学生主动询问 AI 的即时答复会直接显示，并与教师发布内容区分。课堂证据与 AI 推断在页面上分开显示。

## 当前目录

- `src/`：React 前端与路由
- `services/local-ai/`：FastAPI、FunASR、PaddleOCR、DeepSeek 适配
- `packages/domain/`：领域事件与权限契约
- `packages/db/`：Prisma 数据契约与迁移入口
- `docs/superpowers/`：竞赛设计与逐日实施计划
