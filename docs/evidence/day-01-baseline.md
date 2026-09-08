# Day 01 基线证据（2026-09-08）

## 已完成

- 恢复应用根 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`tsconfig.json`、`vite.config.ts`、`index.html` 和 `.env.example`。
- 增加根 README，记录前端、本地 AI、测试和脱敏演示入口。
- 补齐 Vitest 全局测试与 DOM cleanup 配置。
- 恢复教师端角色切换入口，并为验收数据集补齐发布所需的结构化分析字段。
- 修正 3 处源文件类型收窄问题；测试文件从应用生产类型检查中排除，但仍由 Vitest 执行。

## 验证结果

| 命令 | 结果 |
|---|---|
| `pnpm install --no-frozen-lockfile` | PASS；联网解析并生成锁文件 |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS；41 个文件、170 个用例 |
| `pnpm build` | PASS；Vite 生产构建完成 |
| `python -m pytest services/local-ai -q` | PASS；50 个测试通过，1 个依赖警告 |
| `pnpm install --frozen-lockfile` | PASS；锁文件可复现安装 |
| `pnpm dev` + `Invoke-WebRequest http://127.0.0.1:8443/#/teacher/classroom` | PASS；HTTP 200，页面标题存在 |

## 已知提示

- Vite 报告前端主 chunk 超过 500 kB，这是性能提示，不影响当前构建通过；后续路演前再决定是否拆包。
- Python 测试有 `RequestsDependencyWarning` 和 Starlette multipart 弃用提示；当前不影响测试结果，Task 3 前再评估是否需要处理。
- 根目录此前没有 Git 元数据，因此本次无法创建 commit；文件已直接保存在工作目录。

## 明天唯一目标

- 锁定 `RecapJob`、`RecapStep`、四项可交付物与证据引用的数据契约，并为非法/无证据结果写失败测试。

## 需要你决定

- 暂无。真实课堂录音的授权与脱敏文件在 Day 8 前由你提供。
