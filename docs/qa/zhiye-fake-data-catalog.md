# 知野伪造数据测试目录

状态：当前开发、联调和验收环境全部使用伪造数据；未接入真实学校、真实学生或真实家长信息。

## 数据来源与边界

- 唯一入口：`packages/db/prisma/seed-data.ts`
- 写入脚本：`packages/db/prisma/seed.ts`
- 数据库：本地 Docker PostgreSQL，数据库名 `zhiye`
- 数据模式：`DEMO_DATA_MODE=true`
- 所有固定 ID 都带有 `demo` 或 `user-*-01` 语义，禁止替换为真实个人信息
- `protectedBodyEncrypted` 只保留 `<encrypted-demo-payload>` 占位符，不含真实保护反馈正文
- 不写入真实音频、题图、课堂原文、完整对话或真实联系方式

## 当前可用伪造账号

| 角色 | 邮箱 | 数据库 ID | 说明 |
| --- | --- | --- | --- |
| 教师 | `teacher@example.test` | `user-teacher-01` | 演示教师；属于演示学校和演示班级 |
| 学生 | `student@example.test` | `user-student-01` | 演示学生；属于演示班级 |
| 监护人 | `guardian@example.test` | `user-guardian-01` | 已绑定演示学生 |
| 管理员 | `admin@example.test` | `user-admin-01` | 演示学校管理员 |

访问码不写入仓库，由 `DEMO_LOGIN_CODE` 提供。若没有真实数据，使用本地 `.env` 中的访问码即可验收；生产环境会拒绝演示凭据。

## 唯一验收链

当前数据库保留一条最小链：

`school-demo-01` → `class-demo-01` → `lesson-demo-01` → `artifact-demo-01`

同时包含 1 条学生学习事实、1 个草稿任务、1 条未发布家长摘要、1 条保护性反馈和 1 条审计记录。

## 重置与核对

```powershell
$env:DATABASE_URL='postgresql://zhiye:change-me@localhost:5432/zhiye'
pnpm --dir packages/db seed
docker compose ps
```

种子脚本使用 `upsert`，重复执行会恢复这份唯一伪造验收链，不会生成重复记录。测试完成后不要把 `.env`、访问码或任何真实资料提交到仓库。

## 本地 AI 与 fixture 的交界

下表只说明当前 Vite 原型的来源边界；它不把本地调用误表述为生产数据接入。

| 路径 | 初始展示数据 | 用户触发后的数据 | 不可跨越的边界 |
| --- | --- | --- | --- |
| 课堂、学生、任务、消息、保护与审计页面 | `src/app/prototype/fixtures.ts` 或 `?data=acceptance` 的最小 fixture | 原型内存/会话状态 | 不读写真实学校或生产数据库；保护正文仍为占位符。 |
| 教案、测验、补讲、学生问答、复述、家长摘要、学生观察 | 既有 fixture 仅用于页面初始展示 | `127.0.0.1:8787/generate` 返回的 DeepSeek 草稿 | 不得用 fixture 伪装服务成功；所有结果需校验并按页面规则审核/采纳。 |
| 拍题答疑 | 初始页面与验收账号为 fixture | `127.0.0.1:8787/solve-image` 的本地 PaddleOCR，确认文字后才可生成答疑草稿 | 原始题图不发送 DeepSeek；置信度 `< 0.65` 必须补拍。 |
| 课堂录音复盘 | 既有课堂卡片可来自 fixture | 浏览器录音 → `127.0.0.1:8787/analyze` → 本地转写与 DeepSeek 草稿 | 失败维持失败状态；教师审核后才可发布，当前仅保存本次会话。 |
