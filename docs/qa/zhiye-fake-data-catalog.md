# 知野伪造数据测试目录

状态：当前工作区原型使用伪造数据；未接入真实学校、真实学生或真实家长信息。`PrototypeContext.tsx` 静态依赖未提交的 acceptance/empty fixture，因此干净提交树不能单独启动当前原型，也不能由本文件所在提交保证可用或可复现。

## 提交证据与工作区边界

| 状态 | 范围 | 本次提交能够证明的事实 |
| --- | --- | --- |
| 已提交但不足以独立启动 | `src/app/prototype/fixtures.ts` | 包含伪造课堂、学生、任务、消息、保护与审计初始内容；但 `PrototypeContext.tsx` 的静态导入使它不能单独构成可运行的提交树基线。 |
| 当前工作区未提交且为构建前提 | `src/app/prototype/acceptanceFixtures.ts`、`src/app/prototype/emptyFixtures.ts` | 两文件被 `PrototypeContext.tsx` 静态导入；干净提交树必须先补齐并提交它们，或只能在当前工作区验收。`?data=acceptance` 与 `?data=empty` 都不属于已交付、可复现能力。 |
| 当前工作区未提交 | `packages/db/`、`docker-compose.yml`、`.env.example` 及相关 Next.js/Worker 草案 | 可能描述 PostgreSQL、seed、Compose 或演示凭据，但均不是本次提交保证的能力；不得称为唯一入口、已启动服务或已写入数据库。 |

验收时先以 `git status --short` 核对工作区，再以实际启动命令、服务健康检查与命令输出确认可用状态。只有 acceptance/empty fixture 已补齐并提交后，才可主张提交树能独立启动；否则未提交文件只能作为当前开发上下文，不能替代已提交证据。

## 已提交 fixture 内容边界（非独立可运行基线）

- `src/app/prototype/fixtures.ts` 中的固定 ID 与内容仅用于原型验收，禁止替换为真实个人信息。
- 保护性反馈正文维持演示占位，不记录真实保护反馈正文。
- 已提交原型不写入真实音频、题图、课堂原文、完整对话或真实联系方式。

## 伪造账号说明

| 角色 | 邮箱 | 数据库 ID | 说明 |
| --- | --- | --- | --- |
| 教师 | `teacher@example.test` | `user-teacher-01` | 演示教师；属于演示学校和演示班级 |
| 学生 | `student@example.test` | `user-student-01` | 演示学生；属于演示班级 |
| 监护人 | `guardian@example.test` | `user-guardian-01` | 已绑定演示学生 |
| 管理员 | `admin@example.test` | `user-admin-01` | 演示学校管理员 |

表中账号仅描述伪造原型身份，不构成已提交的登录、访问码或数据库能力。若当前工作区另有 `.env`、`DEMO_LOGIN_CODE` 或生产化登录草案，是否可用必须以实际文件状态和启动结果为准，不能由本目录承诺。

## 原型验收链

提交的 fixture 使用一条最小演示链：

`school-demo-01` → `class-demo-01` → `lesson-demo-01` → `artifact-demo-01`

同时包含 1 条学生学习事实、1 个草稿任务、1 条未发布家长摘要、1 条保护性反馈和 1 条审计记录。

## 未提交生产化草案的核对方式

```powershell
git status --short
docker compose ps
```

若 `packages/db`、`docker-compose.yml`、`.env.example` 或 seed 脚本显示为未提交，以上命令只能检查当前机器的工作区和运行态，不能证明它们被本次提交交付。不要把 `.env`、访问码或任何真实资料提交到仓库。

## 本地 AI 与 fixture 的交界

下表说明当前工作区 Vite 原型的来源边界；实时本地 AI 调用不等于真实生产数据接入。当前构建依赖未提交的 acceptance/empty fixture，所有本地运行、服务、扫描、pytest 与 build 结果均须标注为当前工作区证据，不能虚构为干净提交树可复现性。

| 路径 | 初始展示数据 | 用户触发后的数据 | 不可跨越的边界 |
| --- | --- | --- | --- |
| 课堂、学生、任务、消息、保护与审计页面 | `src/app/prototype/fixtures.ts` 加当前工作区静态 fixture 依赖 | 原型内存/会话状态 | 不读写真实学校或生产数据库；保护正文仍为占位符。`?data=acceptance` 仅适用于当前未提交工作区 fixture。 |
| 教案、测验、补讲、学生问答、复述、家长摘要、学生观察 | 既有 fixture 仅用于页面初始展示 | `127.0.0.1:8787/generate` 返回的 DeepSeek 草稿 | 不得用 fixture 伪装服务成功；所有结果需校验并按页面规则审核/采纳。 |
| 拍题答疑 | 初始页面与验收账号为 fixture | `127.0.0.1:8787/solve-image` 的本地 PaddleOCR，确认文字后才可生成答疑草稿 | 原始题图不发送 DeepSeek；置信度 `< 0.65` 必须补拍。 |
| 课堂录音复盘 | 既有课堂卡片可来自 fixture | 浏览器录音 → `127.0.0.1:8787/analyze` → 本地转写与 DeepSeek 草稿 | 失败维持失败状态；教师审核后才可发布，当前仅保存本次会话。 |
