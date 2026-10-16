# 知野 · 评委快速运行指南

> 目标：**10 分钟内**在新机器上把知野跑起来，并看到一次完整的"录音 → AI 初稿 → 教师审核 → 发布"流程。
> 当前形态是**单机演示原型**：数据保存在本机浏览器，角色切换用于演示，不是身份认证。

---

## 0. 你需要准备

| 项 | 要求 | 说明 |
|---|---|---|
| 操作系统 | Windows 10/11（PowerShell） | 脚本为 PowerShell；macOS/Linux 需手动起两个服务 |
| Node.js | 20.19+ 或 22.12+ | `node -v` 查看 |
| pnpm | 10.28.0 | `corepack prepare pnpm@10.28.0 --activate` |
| Python | 3.11–3.12 | 题图 OCR 推荐 3.12 |
| FFmpeg | 在 PATH 中 | 录音转写需要，`ffmpeg -version` 验证 |
| 磁盘与网络 | 预留数 GB | 首次运行要下载本地 ASR/OCR 模型 |
| DeepSeek API Key | **可选** | 不填也能看界面与演示数据，但"生成 AI 初稿"会失败 |
| 浏览器 | Chrome / Edge | 需要麦克风权限才能录真实音频 |

---

## 1. 最快路径（一条命令）

```powershell
git clone https://github.com/PaperY0/Zhiye
cd Zhiye
coreweb enable
corepack prepare pnpm@10.28.0 --activate
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local

# 如需真实 AI 生成：只在本机 .env.local 填 DEEPSEEK_API_KEY，然后：
.\scripts\start-dev.ps1
```

脚本会自动：安装缺失依赖 → 创建 `.env.local` → 同时启动前端（8443）与本地 AI（8787）→ 打开教师端页面。

打开：**http://127.0.0.1:8443/#/teacher/classroom**

---

## 2. 没有 API Key 怎么看演示（推荐评委先走这条）

不填 Key 也能完整体验产品逻辑，演示数据已经内置：

1. 打开 `http://127.0.0.1:8443/#/teacher/workspace`
2. 首页即"待确认"的一节课：**五年级数学《分数的基本性质》**，状态为 **AI 初稿**
3. 点「查看并发布」→ 依次看四个标签页：
   - **课堂转写**：带说话人与时间区间的原话（所有建议的事实来源）
   - **学生复习卡**：AI 草稿，可直接编辑
   - **教师课堂报告**：仅教师可见，含对下一节课的建议
   - **课程进度**：可采纳 AI 建议或自行填写
4. 改一句复习卡 → 点「确认并发布」→ 弹窗会明示"学生将看到复习卡，转写与报告不会公开"
5. 左下角切换「学生端」→ 首页只出现**已发布**的复习卡（未发布前学生看到的是"暂不可查看"）
6. 学生端点「开始复习」→ 自评；点左下角悬浮助手「小野」→ 输入"这道题不会"→「去拍照答疑」→ 选"卡在某一步"→ 先提示后讲解 → 「保存到错题本」
7. 回到教师端「班级洞察」→ 看班级级聚合回流
8. 切换「家长端」只看聚合近况；切换「管理端」看保护性反馈与审计

> 想看清空状态：URL 加 `?data=empty`。想重置演示：教师端「设置 → 重置演示数据」（二次确认）。

---

## 3. 有 API Key：跑一次真实流程

```powershell
# .env.local 中填入（只在本机，不要提交）
DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_MODEL=deepseek-v4-flash
```

重启本地 AI 服务后验证：

```powershell
curl.exe --noproxy '*' http://127.0.0.1:8787/health
# {"ok":true,"asr":"local-funasr","deepseek":true,"inviteRequired":false}
```

`deepseek` 为 `true` 才能生成。然后：

1. 教师端「课堂」→「开始新课堂录音」→ 允许麦克风
2. 朗读或播放一段 1–2 分钟课堂音频（可用 `docs/demo/classroom-script.md` 里的脱敏稿）
3. 课堂标题填写补讲目标，例如"为明天准备 5 分钟补讲"
4. 点「结束并生成 AI 初稿」→ 先本机 FunASR 转写，再 DeepSeek 生成四项成果
5. 按第 2 节第 3–8 步审核、发布、查看学生端

> 首次转写/识题会下载本地模型，耗时较久；请勿中断。

---

## 4. 公网演示站（免安装）

**https://zhiye-demo.vercel.app** —— 只托管静态前端，可看四端界面。

- AI 功能默认关闭（浏览器无法访问你本机的 `127.0.0.1:8787`）
- 每位访客的任务、成绩、消息只保存在自己的浏览器，不跨设备同步
- 请勿在公开演示中输入真实学生资料

---

## 5. 质量门禁（可选，验证工程质量）

```powershell
pnpm test                 # 45 个测试文件 / 181 项通过
pnpm typecheck            # tsc -b 全量类型检查
pnpm build                # 生产构建
python -m pytest services/local-ai -q   # 63 项通过
```

---

## 6. 常见问题

| 现象 | 原因与处理 |
|---|---|
| 「本地 AI 服务未启动」 | 未运行 `start-local-ai.ps1`，或 8787 被占用 |
| 「未设置 DEEPSEEK_API_KEY」 | 在 `.env.local` 填入后重启本地 AI 服务 |
| 「没有识别到清晰的人声」 | 录音太短/太轻/噪音大，靠近音源重录 |
| 换设备看不到数据 | 原型数据只存当前浏览器；正式服务需数据库与账号（见项目文档 6.7） |
| 端口冲突 | 不要同时跑 `pnpm dev` 和 `pnpm preview`（都占 8443） |

---

## 7. 目录导览

```text
src/                    React 前端（教师/学生/家长/管理四端）
services/local-ai/      FastAPI：FunASR 转写、PaddleOCR 识题、DeepSeek 生成、五步编排
packages/domain/        领域状态机、权限、事件、会话 Cookie（含测试）
packages/db/            Prisma schema、迁移、种子（前端暂未连接）
specs/                  SPEC、UI-UX 规范
docs/                   部署与验收、演示讲稿、逐日证据
```

更多细节见仓库根目录 `README.md` 与 `docs/submission/知野-课堂复盘数字员工-项目文档.pdf`。
